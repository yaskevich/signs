import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, 'media', 'downloads');
const thumbsDir = path.join(__dirname, 'media', 'thumbnails');

const constraints = {
  //   width: 650,
  height: 128,
  fit: 'inside',
};

const makeThumbnail = async (file) => {
  try {
    const promise = await sharp(path.join(imagesDir, file)).resize(constraints).toFormat('jpg').toFile(path.join(thumbsDir, file));
    return promise;
  } catch (error) {
    console.log('Image error!', file);
    return Promise.reject(error);
  }
};

const promises = fs.readdirSync(imagesDir)
  .filter((x) => path.extname(x) === '.jpg' && !fs.existsSync(path.join(thumbsDir, x)))
  .map((x) => makeThumbnail(x));

await Promise.allSettled(promises);
