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
    async getUsers() {
      let res = await pool.query('select * from users');
      return res.rows;
	},
};
