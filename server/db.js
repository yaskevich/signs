import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const pool = new Pool();

export default {
  async getTagCount(tag) {
    const res = await pool.query(`
          select count(*) from
            (select regexp_matches(annotations::text, '${tag}"' ,'g') from messages) as foo
          `);
    return res.rows[0].count;
  },
  async getMessagesCount() {
    const res = await pool.query('select COUNT(*) from messages');
    return res.rows[0].count;
  },
  async getPhotosCount() {
    const res1 = await pool.query("select count(*) from messages where imagepath <> ''");
    const total = res1.rows[0].count;
    const res2 = await pool.query("select imagepath from messages where imagepath <> '' group by imagepath having count(*) > 1");
    const dups = res2.rows.length;
    return { total, dups };
  },
  async getAnnotationsCount() {
    // const res = await pool.query('select COUNT(*) from messages where length (annotations::text) > 2');
    const res = await pool.query('select COUNT(*) from annotations');
    return res.rows[0].count;
  },
  async getMessagesAnnotatedCount() {
    const res = await pool.query('select count(distinct(tg_id)) from annotations where tg_id is not null');
    return res.rows[0].count;
  },
  async getMessages(off, batch) {
    const res = await pool.query(`select messages.id, messages.tg_id, data::jsonb - 'media' as data, messages.imagepath, anns.count as annotated from messages LEFT JOIN (SELECT annotations.tg_id, count(annotations.tg_id) FROM annotations GROUP BY annotations.tg_id) as anns ON messages.tg_id = anns.tg_id order by messages.id OFFSET ${off} LIMIT ${batch}`);
    return res.rows;
  },
  async getMessage(id) {
    const res = await pool.query('select * from messages where imagepath <> \'\' AND tg_id = $1', [id]);
    const nextMsg = await pool.query('SELECT tg_id as next FROM messages where imagepath <> \'\' AND tg_id > $1 ORDER BY tg_id ASC LIMIT 1', [id]);
    const prevMsg = await pool.query('SELECT  tg_id as prev FROM messages where imagepath <> \'\' AND tg_id < $1 ORDER BY tg_id DESC LIMIT 1', [id]);
    // console.log('next', nextMsg.rows.shift());
    return { ...res.rows.shift(), ...nextMsg.rows.shift(), ...prevMsg.rows.shift() };
  },
  async updateMessage(params) {
    let data = {};

    if (params.orient && params.country && params.tg_id) {
      // console.log("save to DB");
      const res = await pool.query('UPDATE messages SET orient = $1, country = $2, url = $3, src = $4 WHERE tg_id = $5 RETURNING tg_id', [Number(params.orient), params.country, params.url, params.src, params.tg_id]);
      data = res.rows?.[0];
    }

    return data;
  },
  async getNext(id) {
    const res = await pool.query(`SELECT * FROM messages WHERE tg_id > ${id} ORDER BY tg_id ASC LIMIT 1`);
    return res.rows.length ? res.rows[0] : {};
  },
  async getPrev(id) {
    const res = await pool.query(`SELECT * FROM messages WHERE tg_id < ${id} ORDER BY tg_id DESC LIMIT 1`);
    return res.rows.length ? res.rows[0] : {};
  },
  async getUsers() {
    const res = await pool.query('select * from users');
    return res.rows;
  },
  async getAnnotations(params) {
    const offset = params?.offset || 0;
    const limit = params?.limit || 100;
    // console.log('offset/limit', offset, limit);
    const count = await pool.query('select count(*) from annotations');
    // const res = await pool.query('select tg_id, country, orient, annotations from messages where length (annotations::text) > 2 ORDER by tg_id OFFSET $1 LIMIT $2', [offset, limit]);
    const res = await pool.query('select ann.id, ann.content, ann.tg_id, ann.features, messages.country, messages.orient from annotations as ann left join messages on ann.tg_id = messages.tg_id ORDER by ann.id, ann.tg_id OFFSET $1 LIMIT $2', [offset, limit]);
    return {
      count: count?.rows?.shift().count, selection: res.rows, offset, limit
    };
  },
  async getAttachedAnnotations(tgId) {
    let data = [];
    const id = Number(tgId);
    if (id) {
      const res = await pool.query('select * from annotations where tg_id =$1', [id]);
      data = res.rows;
    }
    return data;
  },
  async getPhotoStats(propName, propValue) {
    let results = [];
    try {
      const result = await Promise.all([pool.query(`select count(*) as num from messages where ${propName} = $1`, [propValue]), pool.query(`select sum(json_array_length(annotations)) as num from messages where ${propName} = $1`, [propValue])]);
      results = result.map((x) => x.rows).map((x) => Number(x.shift().num));
    } catch (error) {
      console.error(error);
    }
    return results;
  },
  async getFeatures() {
    const res = await pool.query('select * from features');
    return res.rows;
  },
  async getAnnotationsStats() {
    const res = await pool.query("SELECT fid, count(fid) FROM (select cast(json_array_elements(features)->'id' as text) as fid from annotations) as unnested group by fid");
    return res.rows;
  },
  async getAllMessages(off, batch) {
    const res = await pool.query(`select id, tg_id, data::jsonb - 'media' as data, imagepath, annotations from messages order by tg_id OFFSET ${off} LIMIT ${batch}`);
    return res.rows;
  },
  async importAnnotations(data) {
    const t0 = performance.now();
    const client = await pool.connect();
    let isError = false;
    const images = [];
    console.log(data.length);
    try {
      await client.query('BEGIN');
      /* eslint-disable no-unreachable-loop */
      /* eslint-disable-next-line no-restricted-syntax */
      for (const item of data) {
        /* eslint-disable no-await-in-loop */
        const result = await client.query('INSERT INTO annotations (content, features, uuid, tg_id, data_id, shape, geometry) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id', [item.content, JSON.stringify(item.features), item.uuid, item.tg_id, item.data_id, item.shape, item.geometry]);
        const id = result?.rows?.shift()?.id;
        if (id) {
          // console.log(id);
          const pathToFragment = path.join(__dirname, 'media', 'fragments', `${id}-original.png`);
          fs.writeFileSync(pathToFragment, item.buffer);
          const constraints = {
            //   width: 650,
            height: 128,
            fit: 'inside',
          };
          const pathToThumbnail = path.join(__dirname, 'media', 'fragments', `${id}.png`);
          await sharp(pathToFragment).resize(constraints).toFile(pathToThumbnail);
          images.push(pathToFragment);
        }
        // break;
      }
      await client.query('COMMIT');
      console.log('commit');
    } catch (error) {
      await client.query('ROLLBACK');
      images.map(fs.unlinkSync);
      isError = true;
      console.error(error);
      console.log('rollback');
    } finally {
      client.release();
    }
    if (isError) {
      return undefined;
    }
    const t1 = performance.now();
    const secs = ((t1 - t0) / 1000).toFixed(2);
    // console.log(`batch: ${secs}s`);
    return secs;
  },
};
