import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, 'media', 'downloaded');
const thumbsDir = path.join(__dirname, 'media', 'thumbs');

const constraints = {
  //   width: 650,
  height: 128,
  fit: 'inside',
};

const promises = fs.readdirSync(imagesDir)
  .filter((x) => path.extname(x) === '.jpg' && !fs.existsSync(path.join(thumbsDir, x)))
  .map((x) => sharp(path.join(imagesDir, x)).resize(constraints).toFormat('jpg').toFile(path.join(thumbsDir, x)));

await Promise.all(promises);
