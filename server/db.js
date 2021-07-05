'use strict';

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool();

export default {
    async getMessages() {
      let res = await pool.query('select * from messages order by tg_id limit 100');
      return res.rows;
	},
    async getUsers() {
      let res = await pool.query('select * from users');
      return res.rows;
	},
};
