/**
 * Renders public/resepshn-wordmark.png — plain "Ресепшн" text matching AppShell logo styles
 * (font-semibold, tracking-tight, ~text-2xl). Uses sharp (Next.js transitive dependency).
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const sharp = require("sharp");

const TEXT = "Ресепшн";
/** ~ Tailwind text-2xl (1.5rem) at 2× for sharper PNG */
const FONT_SIZE_PX = 48;
/** Tailwind tracking-tight */
const LETTER_SPACING_EM = -0.025;
/** App light-mode foreground ≈ oklch(0.145 0 0) */
const FILL = "#252525";
/** Matches app intent: Noto Sans (--font-sans) then system UI sans */
const FONT_FAMILY =
  '"Noto Sans", ui-sans-serif, system-ui, sans-serif, "Segoe UI", sans-serif';

async function main() {
  const paddingX = 16;
  const paddingY = 20;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="160">
  <style><![CDATA[
    .wordmark {
      font-family: ${FONT_FAMILY.replace(/"/g, "'")};
      font-size: ${FONT_SIZE_PX}px;
      font-weight: 600;
      letter-spacing: ${LETTER_SPACING_EM}em;
      fill: ${FILL};
    }
  ]]></style>
  <text class="wordmark" x="${paddingX}" y="${paddingY + FONT_SIZE_PX * 0.78}">${TEXT}</text>
</svg>`;

  const out = path.join(__dirname, "..", "public", "resepshn-wordmark.png");
  await sharp(Buffer.from(svg, "utf8")).trim().png({ compressionLevel: 9 }).toFile(out);
  console.log("Wrote", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
