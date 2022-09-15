import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const resultFeat = await db.getFeatures();

const features = Object.fromEntries(resultFeat.map((x) => [x.code, x]));

// console.log(features);

const processMessage = (itemAnn, tgId, id) => {
  /* eslint-disable no-restricted-syntax */

  // console.log(annos);
  const suggestions = {};
  const tags = [];
  let flag = true;
  let content = '';
  let error = false;
  let noTextError = true;

  let shape; let geometry;

  if (itemAnn.target.selector.type === 'SvgSelector') {
    [shape, geometry] = ['polygon', itemAnn.target.selector.value.split('"')[1]];
  } else if (itemAnn.target.selector.type === 'FragmentSelector') {
    [shape, geometry] = ['rect', itemAnn.target.selector.value.split(':')[1]];
  } else {
    console.error('IMAGE FORMAT ERROR');
  }
  //   console.log(box);

  for (const item of itemAnn.body) {
    if (['commenting', 'replying'].includes(item.purpose)) {
      if (flag) {
        content = item.value.trim();
        flag = false;
      } else {
        const tagContent = item.value.replaceAll('\n', '');
        const matches = tagContent.matchAll(/^(TAG-[A-Z]+)[:]?\s*(.*)$/g);
        const results = Array.from(matches);
        if (results?.[0]?.length) {
          if (!results?.[0][2]) {
            console.warn('note', tgId, results?.[0]?.length, results?.[0]);
            error = true;
          } else {
            const thisTag = results?.[0][1];
            const thisNote = results?.[0][2];
            suggestions[thisTag] = thisNote;
          }
        } else {
          console.warn('note', tgId, item.value);
          error = true;
        }
      }
    }
  }

  for (const item of itemAnn.body) {
    if (item.purpose === 'tagging') {
    //   const obj = { label: item.value.replace('TAG-', ''), tag: item.value };
      const code = item.value.replace('TAG-', '').toLowerCase();
      if (!features?.[code]) {
        console.error('tag', tgId, code, item.value);
      }
      if (code === 'notext') {
        noTextError = false;
      }
      //   const obj = { id: (features?.[code]?.id || '!!!'), label: code, value: true };
      const obj = { id: (features?.[code]?.id || '!!!'), value: true };
      //   features
      const title = suggestions?.[item.value];
      if (title) {
        obj.note = title;
        delete suggestions[item.value];
      }
      tags.push(obj);
    }
  }

  if (!content && noTextError) {
    // error = true;
    console.log(tgId, 'no heading');
  }

  if (Object.keys(suggestions).length !== 0) {
    // console.log(tg_id, suggestions);
    for (const [key, value] of Object.entries(suggestions)) {
    //   console.log(`${key} || ${value}`);
      const code = key.replace('TAG-', '').toLowerCase();
      if (!features?.[code]) {
        console.error('tag', tgId, code, key);
      }
      const obj = { id: (features?.[code]?.id || '!!!'), value: true };
      obj.note = value;
      tags.push(obj);
    }
    // console.log(tags);
    // process.exit();
  }
  if (error) {
    console.log('=========================================');
    console.error(tgId, itemAnn);
    console.log('=========================================');
    process.exit();
  }
  return {
    content, features: tags, uuid: itemAnn.id, tg_id: tgId, data_id: id, shape, geometry
  };
};

const clipShape = async (tgId, imagePath, shape, geometry) => {
  let buf; // base64 = buf.toString('base64');
  const originalFullPath = path.join(__dirname, 'media', 'downloads', imagePath);

  if (fs.existsSync(originalFullPath)) {
    try {
      const image = await sharp(originalFullPath).toFormat('png').flatten({ background: '#ffffff' });
      const metadata = await image.metadata();
      // console.log(shape);
      if (shape === 'rect') {
        const [left, top, width, height] = geometry.split(',').map(Number).map(Math.round);
        buf = await image.extract({
          left, top, width, height
        }).toBuffer(); // .toFile('test.jpg');
      } else {
        const svg = `<svg height="${metadata.height}" width="${metadata.width}"><polygon points="${geometry}"/></svg>`;
        const bufComposited = await image.composite([{ input: Buffer.from(svg), blend: 'dest-in' }]).toBuffer();
        buf = await sharp(bufComposited).trim().toBuffer();
      }
    } catch (error) {
      console.log(tgId, 'Image error!', imagePath);
      console.error(error);
    }
  }
  return buf;
};

const prepareData = async (msgs) => {
  const annotationsArray = [];
  for (const msg of msgs) {
    if (msg?.annotations?.length) {
      for (const item of msg.annotations) {
        /* eslint-disable no-await-in-loop */
        const res = processMessage(item, msg.tg_id, msg.id);
        // console.log(msg.tg_id, msg.imagepath);
        const buffer = await clipShape(msg.tg_id, msg.imagepath, res.shape, res.geometry);
        // console.log(res);
        if (buffer) {
          annotationsArray.push({ ...res, buffer });
        } else {
          console.log('No image fragment for the annotation is available!');
        }
      }
    }
  }
  return annotationsArray;
};

const messages = await db.getMessages(0, 10000);
const data = await prepareData(messages);
const secs = await db.importAnnotations(data);
console.log(`Completed: ${secs ? `${secs}s` : 'FAIL!'}`);
// console.log(result);
// console.log(JSON.stringify(data, null, 2));
// console.log(...data);
process.exit();
