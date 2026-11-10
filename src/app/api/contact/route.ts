import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  inputErrorResponse,
  isCrossOriginRequest,
  optionalText,
  readJsonObject,
  requestIdentifier,
  requiredText,
  safeServerError,
} from "@/lib/api";
import { checkRateLimit } from "@/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendContactNotification(input: {
  name: string;
  email: string;
  topic: string | null;
  game: string | null;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.email,
      subject: `New club contact message${input.topic ? `: ${input.topic}` : ""}`,
      text: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Topic: ${input.topic ?? "Not provided"}`,
        `Game: ${input.game ?? "Not provided"}`,
        "",
        input.message,
      ].join("\n"),
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error("Contact notification provider returned an error.");
  return true;
}

export async function POST(request: Request) {
  if (isCrossOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = requestIdentifier(request);
  const ipLimit = checkRateLimit(`contact-ip:${ip}`, 5, 10 * 60_000);
  if (!ipLimit.success) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }

  try {
    const body = await readJsonObject(request, 8_192);
    const name = requiredText(body.name, "Name", 100);
    const email = requiredText(body.email, "Email", 254).toLowerCase();
    const topic = optionalText(body.topic, "Topic", 100);
    const game = optionalText(body.game, "Game", 100);
    const message = requiredText(body.message, "Message", 4_000);

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const fingerprint = createHash("sha256")
      .update(`${email}\n${message}`)
      .digest("hex");
    const duplicateLimit = checkRateLimit(`contact-duplicate:${fingerprint}`, 1, 10 * 60_000);
    if (!duplicateLimit.success) {
      return NextResponse.json(
        { error: "This message was already received. Please wait before sending it again." },
        { status: 409 }
      );
    }

    const duplicateSubmission = await prisma.contactSubmission.findFirst({
      where: {
        email,
        message,
        createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
      },
      select: { id: true },
    });
    if (duplicateSubmission) {
      return NextResponse.json(
        { error: "This message was already received. Please wait before sending it again." },
        { status: 409 }
      );
    }

    const submission = await prisma.contactSubmission.create({
      data: { name, email, topic, game, message },
      select: { id: true, createdAt: true },
    });

    let notificationSent = false;
    try {
      notificationSent = await sendContactNotification({ name, email, topic, game, message });
    } catch (error) {
      console.error("Contact notification failed:", error instanceof Error ? error.name : "Unknown error");
    }

    return NextResponse.json({
      success: true,
      message: notificationSent
        ? "Your message was received and the club has been notified."
        : "Your message was received and is available to club administrators.",
      dispatchId: submission.id,
      timestamp: submission.createdAt.toISOString(),
      notificationSent,
    }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Contact submission failed:", error);
  }
}
