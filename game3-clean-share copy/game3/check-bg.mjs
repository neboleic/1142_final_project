import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");

const file = path.join(publicDir, "desk-lamp-cut.png");
const { data, info } = await sharp(file)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
console.log(`Cut image size: ${width} x ${height}`);

const samples = [
  [5, 5],
  [width - 5, 5],
  [5, height - 5],
  [width - 5, height - 5],
  [Math.floor(width / 2), Math.floor(height / 2)],
];

for (const [x, y] of samples) {
  const i = (y * width + x) * channels;
  console.log(
    `(${x},${y}) R=${data[i]} G=${data[i + 1]} B=${data[i + 2]} A=${data[i + 3]}`,
  );
}

let transparent = 0;
let opaque = 0;
for (let i = 3; i < data.length; i += channels) {
  if (data[i] < 10) transparent += 1;
  else if (data[i] > 245) opaque += 1;
}
console.log(`Fully transparent pixels: ${transparent}`);
console.log(`Fully opaque pixels: ${opaque}`);
console.log(`Total pixels: ${width * height}`);
