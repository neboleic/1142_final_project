import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");

const targets = [
  { input: "lamp.png", output: "lamp-clear.png", removeBg: "light" },
  { input: "desk-lamp.png", output: "desk-lamp-clear.png", removeBg: "dark" },
];

const WHITE_THRESHOLD = 235;
const BLACK_THRESHOLD = 28;
const FEATHER = 25;
const ALPHA_TRIM_THRESHOLD = 12;

async function process({ input, output, removeBg }) {
  const inputPath = path.join(publicDir, input);
  const outputPath = path.join(publicDir, output);

  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  const { width, height, channels } = info;

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (removeBg === "light") {
      const minChannel = Math.min(r, g, b);
      if (minChannel >= WHITE_THRESHOLD) {
        pixels[i + 3] = 0;
      } else if (minChannel >= WHITE_THRESHOLD - FEATHER) {
        const ratio = (minChannel - (WHITE_THRESHOLD - FEATHER)) / FEATHER;
        pixels[i + 3] = Math.round(pixels[i + 3] * (1 - ratio));
      }
    } else if (removeBg === "dark") {
      const maxChannel = Math.max(r, g, b);
      if (maxChannel <= BLACK_THRESHOLD) {
        pixels[i + 3] = 0;
      } else if (maxChannel <= BLACK_THRESHOLD + FEATHER) {
        const ratio = (BLACK_THRESHOLD + FEATHER - maxChannel) / FEATHER;
        pixels[i + 3] = Math.round(pixels[i + 3] * (1 - ratio));
      }
    }
  }

  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * channels + 3];
      if (alpha > ALPHA_TRIM_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  let pipeline = sharp(pixels, { raw: { width, height, channels } });

  if (maxX >= minX && maxY >= minY) {
    pipeline = pipeline.extract({
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    });
  }

  await pipeline.png().toFile(outputPath);
  console.log(
    `Wrote ${outputPath} (${maxX - minX + 1} x ${maxY - minY + 1})`,
  );
}

for (const target of targets) {
  await process(target);
}
