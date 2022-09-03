import pg from 'pg';

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
    const res = await pool.query("select count(*) from messages where imagepath <> ''");
    return res.rows[0].count;
  },
  async getAnnotationsCount() {
    const res = await pool.query('select COUNT(*) from messages where length (annotations::text) > 2');
    return res.rows[0].count;
  },
  async getMessages(off, batch) {
    const res = await pool.query(`select tg_id, data::jsonb - 'media' as data, imagepath, annotations from messages order by tg_id OFFSET ${off} LIMIT ${batch}`);
    return res.rows;
  },
  async getMessage(id) {
    const res = await pool.query(`select * from messages where tg_id = ${id} LIMIT 1`);
    return res.rows.length ? res.rows[0] : {};
  },
  async updateMessage(params) {
    let data = {};

    if (params.orient && params.src && params.country && params.tg_id) {
      // console.log("save to DB");
      const res = await pool.query('UPDATE messages SET orient = $1, country = $2, url = $3, src = $4, annotations = $5 WHERE tg_id = $6 RETURNING tg_id', [Number(params.orient), params.country, params.url, params.src, JSON.stringify(params.annotations), params.tg_id]);
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
    const count = await pool.query('select count(*) from messages where length (annotations::text) > 2');
    const res = await pool.query('select annotations from messages where length (annotations::text) > 2 OFFSET $1 LIMIT $2', [offset, limit]);
    return {
      count: count?.rows?.shift().count, selection: res.rows, offset, limit
    };
  },
};
