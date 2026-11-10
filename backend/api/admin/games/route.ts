import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import {
  ApiInputError,
  inputErrorResponse,
  optionalUrl,
  readJsonObject,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";

const CATEGORIES = ["CONSOLE", "PC", "MOBILE"] as const;
const STATUSES = ["open", "scrims", "active", "recruiting"] as const;

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization) return authorization;
  try {
    const games = await prisma.gameTitle.findMany({ orderBy: { name: "asc" }, take: 100 });
    return NextResponse.json({ success: true, games: games.map((game) => ({ ...game, id: game.slug })) });
  } catch (error) {
    return safeServerError("Game roster fetch failed:", error);
  }
}

function gameData(body: Record<string, unknown>, partial = false) {
  const data: Record<string, unknown> = {};
  const fields = [
    ["slug", 80],
    ["name", 100],
    ["tag", 80],
    ["divisionBadge", 100],
    ["description", 1_000],
    ["captain", 100],
    ["practiceSchedule", 120],
    ["status", 80],
    ["league", 100],
    ["tagline", 120],
  ] as const;
  for (const [field, maxLength] of fields) {
    if (body[field] !== undefined || !partial) data[field] = requiredText(body[field], field, maxLength);
  }
  if (body.gameArt !== undefined || !partial) {
    const imageUrl = optionalUrl(body.gameArt, "Game art URL");
    if (!imageUrl) throw new ApiInputError("Game art URL is required.");
    data.gameArt = imageUrl;
  }
  if (body.slug !== undefined || !partial) {
    const slug = String(data.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new ApiInputError("Slug must use lowercase letters, numbers, and hyphens.");
    }
  }
  if (body.category !== undefined || !partial) {
    const category = requiredText(body.category, "Category", 20);
    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      throw new ApiInputError("Category must be CONSOLE, PC, or MOBILE.");
    }
    data.category = category;
  }
  if (body.statusType !== undefined || !partial) {
    const statusType = body.statusType === undefined ? "active" : requiredText(body.statusType, "Status type", 20);
    if (!STATUSES.includes(statusType as (typeof STATUSES)[number])) {
      throw new ApiInputError("Status type must be open, scrims, active, or recruiting.");
    }
    data.statusType = statusType;
  }
  if (body.accentColor !== undefined || !partial) {
    const color = body.accentColor === undefined || body.accentColor === null || body.accentColor === ""
      ? "#88c425"
      : requiredText(body.accentColor, "Accent color", 20);
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new ApiInputError("Accent color must be a six-digit hex color.");
    data.accentColor = color;
  }
  if (body.badgeBg !== undefined || !partial) {
    const color = body.badgeBg === undefined || body.badgeBg === null || body.badgeBg === ""
      ? "rgba(136, 196, 37, 0.15)"
      : requiredText(body.badgeBg, "Badge color", 40);
    if (!/^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|0?\.\d+|1)\s*\)$/.test(color)) {
      throw new ApiInputError("Badge color must use rgba(r, g, b, a) format.");
    }
    data.badgeBg = color;
  }
  return data;
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const data = gameData(await readJsonObject(request));
    const game = await prisma.gameTitle.create({ data: data as Parameters<typeof prisma.gameTitle.create>[0]["data"] });
    await recordAdminActivity({ action: "CREATE", entity: "Game", entityId: game.slug, itemLabel: game.name });
    return NextResponse.json({ success: true, game: { ...game, id: game.slug } }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Game roster creation failed:", error);
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const body = await readJsonObject(request);
    const id = requiredText(body.id, "Game ID", 100);
    const data = gameData(body, true);
    const game = await prisma.gameTitle.update({ where: { slug: id }, data });
    await recordAdminActivity({ action: "UPDATE", entity: "Game", entityId: game.slug, itemLabel: game.name });
    return NextResponse.json({ success: true, game: { ...game, id: game.slug } });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Game roster update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:delete");
  if (authorization) return authorization;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) return NextResponse.json({ error: "A valid game ID is required." }, { status: 400 });
    const game = await prisma.gameTitle.delete({ where: { slug: id } });
    await recordAdminActivity({ action: "DELETE", entity: "Game", entityId: game.slug, itemLabel: game.name });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Game roster deletion failed:", error);
  }
}
