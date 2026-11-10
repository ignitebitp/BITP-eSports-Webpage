import { PrismaClient } from "@prisma/client";
import { convertPosterToWebp } from "../lib/event-poster";

const prisma = new PrismaClient();

async function compressPosters() {
  console.log("Searching for event posters in database...");
  const posters = await prisma.eventPoster.findMany({
    include: {
      event: { select: { id: true, title: true } },
    },
  });

  if (posters.length === 0) {
    console.log("No posters found in database.");
    return;
  }

  console.log(`Found ${posters.length} poster(s). Checking for compression...`);

  for (const poster of posters) {
    const originalSizeKB = (poster.data.byteLength / 1024).toFixed(1);
    console.log(`\nProcessing poster for event: "${poster.event?.title ?? poster.eventId}"`);
    console.log(`  Current mimeType: ${poster.mimeType}`);
    console.log(`  Current size: ${originalSizeKB} KB (${(poster.data.byteLength / (1024 * 1024)).toFixed(2)} MB)`);

    const compressed = await convertPosterToWebp(poster.data);
    const newSizeKB = (compressed.byteLength / 1024).toFixed(1);
    const savingsPercent = (((poster.data.byteLength - compressed.byteLength) / poster.data.byteLength) * 100).toFixed(1);

    await prisma.eventPoster.update({
      where: { id: poster.id },
      data: {
        data: compressed,
        mimeType: "image/webp",
      },
    });

    console.log(`  Updated to WebP! New size: ${newSizeKB} KB (Saved ${savingsPercent}%)`);
  }

  console.log("\nAll posters compressed and updated successfully.");
}

compressPosters()
  .catch((err) => {
    console.error("Failed to compress posters:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
