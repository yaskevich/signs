import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import sharp from 'sharp';
import exif from 'exif-reader';
import bcrypt from 'bcrypt';
import passGen from 'generate-password';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import GeoJSON from 'geojson';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
sharp.cache(false);

const loggerPath = path.join(__dirname, 'logger.js');
const saltRounds = 8;
const passOptions = {
  length: 18,
  numbers: true,
  uppercase: false,
  excludeSimilarCharacters: true,
  strict: true,
  symbols: false,
};

const thumbnailSettings = {
  //   width: 650,
  height: 128,
  fit: 'inside',
};

const { Pool } = pg;
const pool = new Pool();

const databaseQuery = `SELECT table_name FROM information_schema.columns
 WHERE table_schema = 'public' group by table_name`;

const databaseScheme = {
  users: `
    id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username  TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname  TEXT NOT NULL,
    email     TEXT NOT NULL,
    sex       INTEGER NOT NULL,
    privs     INTEGER NOT NULL,
    note      TEXT,
    prefs     JSON,
    _passhash TEXT NOT NULL,
    activated BOOLEAN NOT NULL DEFAULT FALSE,
    requested TIMESTAMP WITH TIME ZONE`,

  features: `
    id      INT GENERATED ALWAYS AS IDENTITY,
    parent  INTEGER,
    code    TEXT,
    title   TEXT,
    type    TEXT,
    comment TEXT`,

  messages: `
    id         INT GENERATED ALWAYS AS IDENTITY,
    eid        INTEGER,
    imagepath  TEXT,
    data       JSON,
    features   JSON,
    created    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location   POINT,
    geonote    TEXT,
    note       TEXT`,

  objects: `
    id          INT GENERATED ALWAYS AS IDENTITY,
    eid         BIGINT,
    data_id     INTEGER,
    shape       TEXT,
    geometry    TEXT,
    content     TEXT,
    features    JSON,
    renderedvia JSON`,

  chats: `
    id        INT GENERATED ALWAYS AS IDENTITY,
    eid       BIGINT unique,
    title     TEXT,
    username  TEXT,
    firstname TEXT,
    lastname  TEXT,
    type      TEXT,
    src       TEXT NOT NULL`,
  // change chats_tg_id_key constraint -> eid and src

  settings: `
    geotag_required BOOLEAN default true,
    registration_open BOOLEAN default true,
    registration_code TEXT,
    telegram_api_id INTEGER,
    telegram_api_hash TEXT,
    telegram_session TEXT,
    telegram_id TEXT,
    telegram_name TEXT,
    map_tile TEXT,
    map_style TEXT,
    map_vector BOOLEAN default false,
    map_mapbox BOOLEAN default false,
    map_mapbox_key TEXT,
    title TEXT`,

  ips: `
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ip TEXT,
    whois JSON`,

  logs: `
    id SERIAL PRIMARY KEY,
    ip_id INT,
    browser JSON,
    ua TEXT,
    saved TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id INT NOT NULL,
    data JSON,
    event TEXT NOT NULL,
    CONSTRAINT fk_logs_ips FOREIGN KEY(ip_id) REFERENCES ips(id),
    CONSTRAINT fk_logs_users FOREIGN KEY(user_id) REFERENCES users(id)`,
};

const initQueries = {
  settings: 'INSERT INTO settings DEFAULT VALUES',
  features: "INSERT INTO features (code, title, parent, type, comment) VALUES ('images', 'Images', 0, 'multi', 'Basic entity'), ('objects', 'Objects', 0, 'multi', 'Basic entity')"
};

let tablesResult;
try {
  tablesResult = await pool.query(databaseQuery);
} catch (error) {
  console.error(error);
  pool.end();
  process.exit(1);
}

const tables = tablesResult.rows.map((x) => x.table_name);

const prepareTable = async (args) => {
  const tableName = args[0];
  if (!tables.includes(tableName)) {
    console.log(`init table '${tableName}'`);
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${args[1]})`);

      if (initQueries?.[tableName]) {
        await pool.query(initQueries[tableName]);
      }
    } catch (createError) {
      console.error(createError);
      console.error(`Issue with table '${tableName}'!`);
      throw createError;
    }
    // console.log("create", createResult);
    // const ownerResult = await pool.query(`ALTER TABLE ${key} OWNER TO ${process.env.PGUSER}`);
    await pool.query(`ALTER TABLE ${tableName} OWNER TO ${process.env.PGUSER}`);
    // console.log("owner", ownerResult);
  }
};

if (tables.length !== Object.keys(databaseScheme).length) {
  console.log('initializing database: started');
  try {
    await pool.query('BEGIN');
    try {
      /* eslint-disable-next-line no-restricted-syntax */
      for (const table of Object.entries(databaseScheme)) {
        /* eslint-disable-next-line no-await-in-loop */
        await await prepareTable(table);
      }
      await pool.query('COMMIT');
      tablesResult = await pool.query(databaseQuery);
      console.log('initializing database: done');
    } catch (error) {
      console.log(error);
      console.log('Rolling back...');
      await pool.query('ROLLBACK');
    }
  } catch (error) {
    console.log('initializing database: error\n', error);
  }
}

const clipShape = async (id, shape, geometry, imageFile, imageDir, fragmentsDir) => {
  const originalFullPath = path.join(imageDir, imageFile);

  if (fs.existsSync(originalFullPath)) {
    let buf; // base64 = buf.toString('base64');

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
      if (buf) {
        const pathToFragment = path.join(fragmentsDir, `${id}-original.png`);
        fs.writeFileSync(pathToFragment, buf);
        const pathToThumbnail = path.join(fragmentsDir, `${id}.png`);
        await sharp(pathToFragment).resize(thumbnailSettings).toFile(pathToThumbnail);
      }
    } catch (error) {
      console.log(id, 'Image error!', imageFile);
      console.error(error);
    }
  }
};

export default {
  // async getTagCount(tag) {
  //   const res = await pool.query(`
  //         select count(*) from
  //           (select regexp_matches(annotations::text, '${tag}"' ,'g') from messages) as foo
  //         `);
  //   return res.rows[0].count;
  // },
  async getMessagesCount() {
    const res = await pool.query('select COUNT(*) from messages');
    return res.rows[0].count;
  },
  async getItemsCount() {
    const res1 = await pool.query("select COUNT(*)::int as all, (COUNT(*) FILTER (where imagepath <> ''))::int as images from messages");
    const total = res1.rows[0];
    const res2 = await pool.query("select imagepath from messages where imagepath <> '' group by imagepath having count(*) > 1");
    const dups = res2.rows.length;
    return { ...total, dups };
  },
  async getObjectsCount() {
    // const res = await pool.query('select COUNT(*) from messages where length (annotations::text) > 2');
    const res = await pool.query('select COUNT(*)::int from objects');
    return res.rows[0].count;
  },
  async getMessagesAnnotatedCount() {
    const res = await pool.query('select count(distinct(data_id))::int from objects where data_id is not null');
    return res.rows[0].count;
  },
  async getMessages(user, off, batch) {
    const res = await pool.query(`
    SELECT messages.id, messages.eid, data::jsonb - 'media' as data, messages.imagepath, messages.created, messages.geonote, anns.count as annotated
    FROM messages
    LEFT JOIN
     (SELECT objects.data_id, count(objects.data_id)
        FROM objects
        GROUP BY objects.data_id) as anns
    ON messages.id = anns.data_id 
    ${user.privs === 1 ? '' : (`WHERE (messages.data->>'user')::int = ${user.id}`)}
    ORDER by messages.id
    OFFSET ${off} LIMIT ${batch}`);
    return res.rows;
  },
  async getMessage(user, id) {
    const res = await pool.query('select * from messages where imagepath <> \'\' AND id = $1', [id]);
    const nextMsg = await pool.query('SELECT id as next FROM messages where imagepath <> \'\' AND id > $1 ORDER BY id ASC LIMIT 1', [id]);
    const prevMsg = await pool.query('SELECT id as prev FROM messages where imagepath <> \'\' AND id < $1 ORDER BY id DESC LIMIT 1', [id]);
    // console.log('next', nextMsg.rows.shift());
    return { ...res.rows.shift(), ...nextMsg.rows.shift(), ...prevMsg.rows.shift() };
  },
  // async updateMessage(params) {
  //   let data = {};

  //   if (params.orient && params.country && params.eid) {
  //     // console.log("save to DB");
  //     const res = await pool.query('UPDATE messages SET orient = $1, country = $2, url = $3, src = $4 WHERE eid = $5 RETURNING eid', [Number(params.orient), params.country, params.url, params.src, params.eid]);
  //     data = res.rows?.[0];
  //   }

  //   return data;
  // },
  async setItemMeta(user, datum) {
    let data = {};
    // console.log(datum);
    const res = await pool.query('UPDATE messages SET features = $2, geonote = $3, note = $4 WHERE id = $1 RETURNING id', [datum.id, JSON.stringify(datum.features), datum?.geonote, datum?.note]);
    data = res.rows?.[0];
    return data;
  },
  async deleteFeature(user, params) {
    if (user?.privs !== 1) {
      return {};
    }
    let data = {};
    if (params?.id) {
      console.log('delete feature', params.id);
      const res = await pool.query('DELETE FROM features WHERE id = $1 RETURNING id', [Number(params.id)]);
      data = res.rows?.[0];
    }
    return data;
  },
  async updateFeature(user, params) {
    if (user?.privs !== 1) {
      return {};
    }

    let data = {};
    // console.log(params);
    if (params.code) {
      const { code } = params;
      const title = params.title || params.code;
      const comment = params.comment || '';
      const type = params.type || null;
      const { parent } = params;

      if (params.id) {
        // console.log("save to DB");
        const res = await pool.query('UPDATE features SET code = $1, title = $2, comment = $3, parent = $4 WHERE id = $5 RETURNING id', [code, title, comment, parent, Number(params.id)]);
        data = res.rows?.[0];
      } else {
        const res = await pool.query('INSERT INTO features (code, title, comment, type, parent) VALUES($1, $2, $3, $4, $5) RETURNING id', [code, title, comment, type, parent]);
        data = res.rows?.[0];
      }
    }

    return data;
  },
  // async getNext(id) {
  //   const res = await pool.query(`SELECT * FROM messages WHERE eid > ${id} ORDER BY eid ASC LIMIT 1`);
  //   return res.rows.length ? res.rows[0] : {};
  // },
  // async getPrev(id) {
  //   const res = await pool.query(`SELECT * FROM messages WHERE eid < ${id} ORDER BY eid DESC LIMIT 1`);
  //   return res.rows.length ? res.rows[0] : {};
  // },
  async getChats(user) {
    if (user?.privs !== 1) {
      return [];
    }
    const res = await pool.query('select * from chats');
    return res.rows;
  },
  async getObjects(user, params) {
    const offset = params?.offset || 0;
    const limit = params?.limit || 100;
    const objectFeatures = params?.objects;
    const imageFeatures = params?.images;
    // console.log(imageFeatures, objectFeatures);

    const sqlJoin = 'INNER JOIN messages ON ann.data_id = messages.id';

    const buildCondition = (arr, table) => (arr.length ? `${arr.map((x) => `jsonb_path_exists(${table}.features::jsonb, '$.** ? (@.id == ${Number(x.id)} && @.value ${typeof x.value === 'string' ? `like_regex "${x.value}" flag "i"` : `== ${x.value}`})')`).join(' AND ')}` : '');

    let featuresCondition = '';

    if (objectFeatures?.length) {
      featuresCondition = buildCondition(objectFeatures, 'ann');
    }

    if (imageFeatures?.length) {
      if (featuresCondition) {
        featuresCondition += ' AND ';
      }
      featuresCondition += buildCondition(imageFeatures, 'messages');
    }

    if (featuresCondition) {
      featuresCondition = `WHERE ${featuresCondition}`;
    }

    const countQuery = `select count(*) as ttl ${featuresCondition ? `, count(*) filter (${featuresCondition}) as sel` : ''} from objects as ann ${imageFeatures?.length ? sqlJoin : ''}`;

    console.log(countQuery);
    const count = await pool.query(countQuery);

    const sql = `
      SELECT ann.id, ann.data_id, ann.content, ann.eid, ann.features, messages.features AS properties
      FROM objects AS ann
      ${sqlJoin}
      ${featuresCondition}
      ${user.privs === 1 ? '' : (`WHERE (messages.data->>'user')::int = ${user.id}`)}
      ORDER BY ann.id, ann.eid
      OFFSET $1 LIMIT $2`;

    const res = await pool.query(sql, [offset, limit]);

    return {
      count: count?.rows?.shift(), selection: res.rows, offset, limit
    };
  },
  async getAttachedObjects(user, id) {
    let data = [];
    const dataId = Number(id);
    if (id) {
      const res = await pool.query('select * from objects where data_id = $1', [dataId]);
      data = res.rows;
    }
    return data;
  },
  async getItemsStats() {
    // let results = [];
    // try {
    //   const result = await Promise.all([pool.query(`select count(*) as num from messages where ${propName} = $1`, [propValue]), pool.query(`select sum(json_array_length(annotations)) as num from messages where ${propName} = $1`, [propValue])]);
    //   results = result.map((x) => x.rows).map((x) => Number(x.shift().num));
    // } catch (error) {
    //   console.error(error);
    // }
    // return results;
    // const res = await pool.query("SELECT fid, count(fid) FROM (select cast(json_array_elements(features)->'id' as text) as fid from messages) as unnested group by fid");
    const res = await pool.query("SELECT cast(feature->'id'as text) as fid, count(feature) FROM (SELECT json_array_elements(features) as feature from messages) as unnested WHERE (json_typeof(feature->'value') = 'boolean' AND (feature->>'value')::boolean = True) OR json_typeof(feature->'value') = 'string' group by fid");
    return res.rows;
  },
  async getFeatures() {
    const res = await pool.query('select * from features ORDER BY id');
    return res.rows;
  },
  async getObjectsStats() {
    const res = await pool.query("SELECT fid, count(fid) FROM (select cast(json_array_elements(features)->'id' as text) as fid from objects) as unnested group by fid");
    return res.rows;
  },
  async getAllMessages(off, batch) {
    const res = await pool.query(`select id, eid, data::jsonb - 'media' as data, imagepath, annotations from messages order by id OFFSET ${off} LIMIT ${batch}`);
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
        const result = await client.query('INSERT INTO objects (content, features, uuid, eid, data_id, shape, geometry) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id', [item.content, JSON.stringify(item.features), item.uuid, item.eid, item.data_id, item.shape, item.geometry]);
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
  async setObject(user, params, imageDir, fragmentsDir) {
    let data = {};
    let id = Number(params?.id);
    try {
      if (params.id) {
        const res = await pool.query('UPDATE objects SET features = $2, content =$3, shape =$4, geometry = $5 WHERE id = $1 RETURNING id', [id, JSON.stringify(params.features), params.content, params.shape, params.geometry]);
        data = res.rows?.[0];
      } else {
        const res = await pool.query('INSERT INTO objects (features, content, eid, data_id, shape, geometry) VALUES($1, $2, $3, $4, $5, $6) RETURNING id', [JSON.stringify(params.features), params.content, params.eid, params.data_id, params.shape, params.geometry]);
        data = res.rows?.[0];
        id = data?.id;
      }
      if (id && params.image) {
        console.log('clip shape for', id);
        await clipShape(id, params.shape, params.geometry, params.image, imageDir, fragmentsDir);
      }
    } catch (error) {
      console.error(error);
    }
    return data;
  },
  async deleteObject(user, id, fragmentsDir) {
    console.log('DELETE request for', id);
    let data = {};
    try {
      await pool.query('DELETE FROM objects WHERE id = $1', [id]);
      // console.log(res);
      const pathToFragment = path.join(fragmentsDir, `${id}-original.png`);
      const pathToThumbnail = path.join(fragmentsDir, `${id}.png`);

      if (fs.existsSync(pathToFragment)) {
        fs.unlinkSync(pathToFragment);
      }
      if (fs.existsSync(pathToThumbnail)) {
        fs.unlinkSync(pathToThumbnail);
      }
    } catch (error) {
      data = { error };
      console.error(error);
    }
    return data;
  },
  async changeActivationStatus(user, userId, status) {
    console.log('activation request:', userId, 'by', user.id);
    let data = {};
    if (userId && user.privs === 1) {
      try {
        const sql = 'UPDATE users SET activated = $2 WHERE id = $1 RETURNING id';
        const result = await pool.query(sql, [userId, status]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async elevateUser(user, userId) {
    console.log('privileges elevation request for', userId, 'by', user.id, user.privs === 1);
    let data = {};
    if (userId && user.privs === 1) {
      try {
        const sql = 'UPDATE users SET privs = 1 WHERE id = $1 RETURNING id';
        const result = await pool.query(sql, [userId]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async resetPassword(currentUser, id) {
    if (currentUser.privs === 1) {
      try {
        const pwd = passGen.generate(passOptions);
        const hash = await bcrypt.hash(pwd, saltRounds);
        await pool.query('UPDATE users SET _passhash = $2 WHERE id = $1', [id, hash]);
        return { message: pwd, id };
      } catch (error) {
        console.error(error);
      }
    }
    return { error: 'Operation is allowed only for administrators' };
  },
  async updateUser(currentUser, props) {
    let data = {};
    const userId = Number(props?.id);
    if (userId && (currentUser.privs < 3 || currentUser.id === userId)) {
      const sql = 'UPDATE users SET username = LOWER($2), firstname = INITCAP($3), lastname = INITCAP($4), email = LOWER($5) WHERE id = $1 RETURNING id';
      const values = [userId, props.username, props.firstname, props.lastname, props.email];
      try {
        const usersData = await pool.query('SELECT * FROM users where id <> $1', [userId]);
        if (usersData.rows.filter((x) => x.email === props.email).length) {
          data = { error: 'email not unique' };
        } else if (usersData.rows.filter((x) => x.username === props.username).length) {
          console.log('username');
          data = { error: 'username not unique' };
        } else {
          const result = await pool.query(sql, values);
          data = result?.rows?.[0];
        }
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getUsers(user, id) {
    let sql = `SELECT id, username, firstname, lastname, email, privs, activated ${user.privs === 1 ? ', requested, note' : ''} from users`;
    // console.log(sql);
    let data = [];
    const values = [];

    if (id) {
      sql += ' WHERE id = $1';
      values.push(id);
    } else if (user.privs === 1) {
      sql += ' ORDER BY requested DESC';
    }

    try {
      const result = await pool.query(sql, values);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }

    return data;
  },
  async getUserDataByID(id) {
    const sql = 'UPDATE users SET requested = NOW() WHERE id = $1'; // to log activity
    await pool.query(sql, [id]);
    const result = await pool.query('SELECT * from users WHERE id = $1 AND activated = TRUE', [id]);
    return result?.rows?.[0];
  },
  async getUserData(email, pwd) {
    if (!email) { return { error: 'email' }; }
    if (!pwd) { return { error: 'password' }; }

    // console.log("email/pwd", email, pwd);
    const res = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [email]);
    if (res.rows.length) {
      const data = res.rows[0];
      // console.log("userdata", data);
      // console.log("pass/hash", pwd, data._passhash);
      if (data.activated) {
        const result = await bcrypt.compare(pwd, data._passhash);
        Reflect.deleteProperty(data, '_passhash');
        // console.log("pass/hash result", result);
        return result ? data : { error: 'password' };
      }
      return { error: 'user status' };
    }
    return { error: 'email' };
  },
  async createUser(formData, status = false) {
    // console.log('create user', formData);
    const data = formData;
    let isActivated = status;
    let setup = false;
    const settingsResult = await pool.query('SELECT * FROM settings');
    const settings = settingsResult.rows.shift();

    if (!settings?.registration_open) {
      return { error: 'registration is closed' };
    }

    const usersData = await pool.query('SELECT * FROM users');
    if (usersData.rows.length) {
      if (usersData.rows.filter((x) => x.email === data.email).length) {
        return { error: 'email not unique' };
      }
      if (usersData.rows.filter((x) => x.username === data.username).length) {
        return { error: 'username not unique' };
      }
    } else {
      // if users table is empty it means it is first run and we have to create admin user
      // make later regular set up UI
      data.privs = 1;
      isActivated = true;
      setup = true;
      console.log('create admin');
    }
    const note = formData?.note || '';

    if (settings?.registration_code?.length && note.includes(settings.registration_code)) {
      console.log('activated via pass code');
      isActivated = true;
    }

    const pwd = passGen.generate(passOptions);
    // console.log('make hash');
    const hash = await bcrypt.hash(pwd, saltRounds);
    // console.log('ready');
    // console.log(pwd, hash);
    const result = await pool.query('INSERT INTO users (requested, username, firstname, lastname, email, sex, privs, _passhash, activated, note) VALUES(NOW(), LOWER($1), INITCAP($2), INITCAP($3), LOWER($4), $5, $6, $7, $8, $9) RETURNING id', [data.username, data.firstname, data.lastname, data.email, data.sex, data.privs, hash, isActivated, note]);
    if (result.rows.length === 1) {
      return { message: pwd, status: isActivated, setup };
    }
    return { error: 'user' };
  },
  async getSettings(user) {
    let data = {};
    // eslint-disable-next-line no-nested-ternary
    const cols = user?.privs ? user?.privs === 1 ? '*' : 'title' : 'registration_open';

    const sql = `SELECT ${cols} FROM settings`;
    try {
      const result = await pool.query(sql);
      data = result?.rows?.[0];
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async addImage(user, filePath, thumbsPath, fileName, fileTitle, fileSize, props) {
    const toDec = (dms, dir) => dms.map((x, i) => x / (60 ** i)).reduce((x, i) => x + i) * (dir > 'O' ? -1 : 1); // S and W > N and E
    // console.log('here', userId, filePath, fileName, fileTitle, fileSize);
    let id;
    let errorMessage;
    try {
      let loc;
      let geonote = null;
      const meta = await sharp(filePath).metadata();
      const exifBuf = meta.exif;
      const exifData = exifBuf ? exif(exifBuf) : {};
      const data = {
        user: user?.id, title: fileTitle, meta: exifData, size: fileSize
      };
      // console.log('image meta', data);
      const gps = data?.meta?.gps || data?.meta?.GPSInfo;
      // console.log('meta', data?.meta);
      const settingsResult = await pool.query('SELECT * FROM settings');
      const settings = settingsResult.rows.shift();

      if (gps) {
        const lat = toDec(gps.GPSLatitude, gps.GPSLatitudeRef);
        const lng = toDec(gps.GPSLongitude, gps.GPSLongitudeRef);
        // console.log(lat, lng);
        loc = `(${lat}, ${lng})`;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en-us&addressdetails=1`);
        const geo = await response.json();
        // console.log('loc', loc);
        if (geo?.place_id) {
          data.geo = geo;
          geonote = geo.display_name;
        }
      } else {
        errorMessage = 'Image does not have coordinates';
      }

      if (settings?.geotag_required && !gps?.GPSProcessingMethod) {
        errorMessage = 'The image does not have required geotag!';
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        const result = await pool.query('INSERT INTO messages (imagepath, data, location, geonote, features) VALUES($1, $2, $3, $4, $5) RETURNING id', [fileName, JSON.stringify(data), loc, geonote, props || null]);
        id = result?.rows?.shift()?.id;
        await sharp(filePath).resize(thumbnailSettings).toFile(thumbsPath);
      }
    } catch (error) {
      console.log(error);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (fs.existsSync(thumbsPath)) {
        fs.unlinkSync(thumbsPath);
      }
    }
    return [id, errorMessage];
  },
  async removeImage(user, params, imagesDir, thumbsDir) {
    let data = {};
    try {
      const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING imagepath', [params.id]);
      const img = result?.rows?.[0]?.imagepath;
      const imagePath = path.join(imagesDir, img);
      const thumbPath = path.join(thumbsDir, img);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }

      data = { img };
    } catch (error) {
      console.log(error);
      data = { msg: `Error removing file (ID ${params?.id})` };
    }
    return data;
  },
  async addTelegramChat(type, tgId, username, firstname, lastname) {
    await pool.query('INSERT INTO chats(type, eid, username, firstname, lastname) VALUES ($1, $2, $3, $4, $5) ON CONFLICT ON CONSTRAINT chats_tg_id_key DO NOTHING RETURNING id', [type, tgId, username, firstname, lastname]);
  },
  async updateSettings(user, params) {
    if (user.privs === 1) {
      const columns = databaseScheme.settings.split(',').map((x) => x.trim().split(' ').shift());
      const query = Object.fromEntries(
        Object.entries(params).filter(([key]) => columns.includes(key))
      );
      // console.log('settings', query);
      const sql = `UPDATE settings SET ${Object.keys(query).map((x, i) => `${x} = $${i + 1}`)}`;
      const result = await pool.query(sql, Object.values(query));
      return result?.rowCount;
    }
    return 0;
  },
  async getMap(user) {
    const res = await pool.query(`select objects.content, objects.id, objects.features, location from objects left join messages on objects.data_id = messages.id ${user.privs === 1 ? '' : (`WHERE (messages.data->>'user')::int = ${user.id}`)}`);
    const data = res.rows;
    return GeoJSON.parse(data, { Point: ['location.x', 'location.y'] });
  },
  async sendToLog(req, userId, event, data) {
    const now = new Date().toISOString();
    (() => new Worker(loggerPath, {
      workerData: {
        now,
        id: userId,
        ua: req.headers['user-agent'],
        ip: req.header('x-forwarded-for') || req.socket.remoteAddress,
        event,
        data
      }
    }))();
    // const worker = new Worker('./worker.js', { workerData: 'hello' });
    // worker.on('message', (res) => {
    //   console.log('worker get ok', res);
    // });
    // worker.on('error', (msg) => {
    //   console.log('worker get fail', msg);
    // });
    // console.log(`'${event}' sent to logs`);
  },
  async writeToLog(params) {
    await pool.query('INSERT INTO logs(created, user_id, ip_id, ua, browser, event, data) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', params);
  },
  async getIpData(ip) {
    const res = await pool.query('SELECT id FROM ips WHERE ip = $1', [ip]);
    return res?.rows?.[0];
  },
  async addIpData(ip, whois) {
    const res = await pool.query('INSERT INTO ips(ip, whois) VALUES ($1, $2) RETURNING id', [ip, whois]);
    return res?.rows?.[0];
  },
  async getLogs(user) {
    if (user?.privs !== 1) {
      return [];
    }
    let data = [];
    const sql = "select created, user_id, event, whois->'country' as country, case when whois->'organisation'->'address' is not null then whois->'organisation'->'address' else whois->'descr' end as address from logs LEFT join ips on logs.ip_id = ips.id ORDER BY created DESC";
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
};
