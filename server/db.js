'use strict';

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool();

export default {
    async getMessagesCount() {
      let res = await pool.query('select COUNT(*) from messages');
      return res.rows[0];
	},
    async getMessages(off, batch) {
      let res = await pool.query('select * from messages order by tg_id OFFSET '+ off + ' LIMIT ' + batch);
      return res.rows;
	},
    async getMessage(id) {
      let res = await pool.query('select * from messages where tg_id = '+ id + ' LIMIT 1');
      return res.rows.length?res.rows[0]:{};
	},
    async updateMessage(params) {
      let res = await pool.query('UPDATE messages SET orient = $1, country = $2, url = $3, src = $4, annotations = $5 WHERE tg_id = $6 RETURNING tg_id', [Number(params.orient), params.country, params.url, params.src, JSON.stringify(params.annotations), params.tg_id]);
      return res.rows;
	},
    async getNext(id) {
      let res = await pool.query('SELECT * FROM messages WHERE tg_id > '+ id + ' ORDER BY tg_id ASC LIMIT 1');
      return res.rows.length?res.rows[0]:{};
	},
    async getPrev(id) {
      let res = await pool.query('SELECT * FROM messages WHERE tg_id < '+ id + ' ORDER BY tg_id DESC LIMIT 1');
      return res.rows.length?res.rows[0]:{};
	},
    async getUsers() {
      let res = await pool.query('select * from users');
      return res.rows;
	},
};
