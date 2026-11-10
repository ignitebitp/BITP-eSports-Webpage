import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import {
  inputErrorResponse,
  readJsonObject,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request, false, "inbox:read");
  if (authorization) return authorization;
  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ success: true, submissions });
  } catch (error) {
    return safeServerError("Contact inbox fetch failed:", error);
  }
}

export async function PATCH(request: Request) {
  const authorization = await requireAdmin(request, true, "inbox:write");
  if (authorization) return authorization;
  try {
    const body = await readJsonObject(request);
    const id = requiredText(body.id, "Submission ID", 100);
    if (body.status !== "PENDING" && body.status !== "READ") {
      return NextResponse.json({ error: "Status must be PENDING or READ." }, { status: 400 });
    }
    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: { status: body.status },
    });
    await recordAdminActivity({ action: "UPDATE", entity: "Contact submission", entityId: submission.id, itemLabel: `Updated status for ${submission.name}` });
    return NextResponse.json({ success: true, submission });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Contact inbox update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "inbox:write");
  if (authorization) return authorization;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) {
      return NextResponse.json({ error: "A valid submission ID is required." }, { status: 400 });
    }
    const submission = await prisma.contactSubmission.delete({ where: { id } });
    await recordAdminActivity({ action: "DELETE", entity: "Contact submission", entityId: submission.id, itemLabel: `Deleted submission from ${submission.name}` });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Contact inbox deletion failed:", error);
  }
}
