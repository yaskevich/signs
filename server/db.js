import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import exif from 'exif-reader';
import bcrypt from 'bcrypt';
import passGen from 'generate-password';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

sharp.cache(false);

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
    id        INT GENERATED ALWAYS AS IDENTITY,
    username  TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname  TEXT NOT NULL,
    email     TEXT NOT NULL,
    sex       INTEGER NOT NULL,
    privs     INTEGER NOT NULL,
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
    tg_id      INTEGER,
    imagepath  TEXT,
    data       JSON,
    features   JSON,
    created    TIMESTAMP WITH TIME ZONE,
    location   POINT`,

  objects: `
    id          INT GENERATED ALWAYS AS IDENTITY,
    tg_id       INTEGER,
    data_id     INTEGER,
    shape       TEXT,
    geometry    TEXT,
    content     TEXT,
    features    JSON,
    renderedvia JSON`,

  chats: `
    id        INT GENERATED ALWAYS AS IDENTITY,
    tg_id     BIGINT unique,
    title     TEXT,
    username  TEXT,
    firstname TEXT,
    lastname  TEXT,
    type      TEXT`,

  settings: `
    registration_open BOOLEAN default true,
    registration_code TEXT,
    telegram_api_id INTEGER,
    telegram_api_hash TEXT,
    telegram_session TEXT,
    telegram_id TEXT,
    telegram_name TEXT`,
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

      if (tableName === 'settings') {
        await pool.query('INSERT INTO settings DEFAULT VALUES');
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
      await Promise.all(Object.entries(databaseScheme).map(async (x) => prepareTable(x)));
      await pool.query('COMMIT');
      tablesResult = await pool.query(databaseQuery);
      console.log('initializing database: done');
    } catch (error) {
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
  async getPhotosCount() {
    const res1 = await pool.query("select COUNT(*) as all,  count(*) FILTER (where imagepath <> '') as images from messages");
    const total = res1.rows[0];
    const res2 = await pool.query("select imagepath from messages where imagepath <> '' group by imagepath having count(*) > 1");
    const dups = res2.rows.length;
    return { ...total, dups };
  },
  async getObjectsCount() {
    // const res = await pool.query('select COUNT(*) from messages where length (annotations::text) > 2');
    const res = await pool.query('select COUNT(*) from objects');
    return res.rows[0].count;
  },
  async getMessagesAnnotatedCount() {
    const res = await pool.query('select count(distinct(tg_id)) from objects where tg_id is not null');
    return res.rows[0].count;
  },
  async getMessages(off, batch) {
    const res = await pool.query(`select messages.id, messages.tg_id, data::jsonb - 'media' as data, messages.imagepath, messages.created, anns.count as annotated from messages LEFT JOIN (SELECT objects.tg_id, count(objects.tg_id) FROM objects GROUP BY objects.tg_id) as anns ON messages.tg_id = anns.tg_id order by messages.id OFFSET ${off} LIMIT ${batch}`);
    return res.rows;
  },
  async getMessage(id) {
    const res = await pool.query('select * from messages where imagepath <> \'\' AND id = $1', [id]);
    const nextMsg = await pool.query('SELECT id as next FROM messages where imagepath <> \'\' AND id > $1 ORDER BY id ASC LIMIT 1', [id]);
    const prevMsg = await pool.query('SELECT id as prev FROM messages where imagepath <> \'\' AND id < $1 ORDER BY id DESC LIMIT 1', [id]);
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
  async setPhotoMeta(datum) {
    let data = {};

    const res = await pool.query('UPDATE messages SET features = $1 WHERE tg_id = $2 RETURNING tg_id', [JSON.stringify(datum.features), datum.tg_id]);
    data = res.rows?.[0];

    return data;
  },
  async updateFeature(params) {
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
  async getNext(id) {
    const res = await pool.query(`SELECT * FROM messages WHERE tg_id > ${id} ORDER BY tg_id ASC LIMIT 1`);
    return res.rows.length ? res.rows[0] : {};
  },
  async getPrev(id) {
    const res = await pool.query(`SELECT * FROM messages WHERE tg_id < ${id} ORDER BY tg_id DESC LIMIT 1`);
    return res.rows.length ? res.rows[0] : {};
  },
  async getChats() {
    const res = await pool.query('select * from chats');
    return res.rows;
  },
  async getObjects(params) {
    const offset = params?.offset || 0;
    const limit = params?.limit || 100;
    const objectFeatures = params?.objects;
    const photoFeatures = params?.photos;
    const sqlJoin = 'INNER JOIN messages ON ann.data_id = messages.id';

    let featuresCondition = '';

    if (objectFeatures?.length) {
      featuresCondition = `${objectFeatures.map((x) => `jsonb_path_exists(ann.features::jsonb, '$.** ? (@.id == ${Number(x)})')`).join(' AND ')}`;
    }

    if (photoFeatures?.length) {
      if (featuresCondition) {
        featuresCondition += ' AND ';
      }
      featuresCondition += `${photoFeatures.map((x) => `jsonb_path_exists(messages.features::jsonb, '$.** ? (@.id == ${Number(x)})')`).join(' AND ')}`;
    }

    if (featuresCondition) {
      featuresCondition = `WHERE ${featuresCondition}`;
    }

    const countQuery = `select count(*) as ttl ${featuresCondition ? `, count(*) filter (${featuresCondition}) as sel` : ''} from objects as ann ${photoFeatures?.length ? sqlJoin : ''}`;
    const count = await pool.query(countQuery);

    const sql = `
      SELECT ann.id, ann.content, ann.tg_id, ann.features, messages.features AS properties
      FROM objects AS ann
      ${sqlJoin}
      ${featuresCondition}
      ORDER BY ann.id, ann.tg_id
      OFFSET $1 LIMIT $2`;

    // console.log(sql);
    const res = await pool.query(sql, [offset, limit]);
    return {
      count: count?.rows?.shift(), selection: res.rows, offset, limit
    };
  },
  async getAttachedObjects(tgId) {
    let data = [];
    const id = Number(tgId);
    if (id) {
      const res = await pool.query('select * from objects where tg_id =$1', [id]);
      data = res.rows;
    }
    return data;
  },
  async getPhotoStats() {
    // let results = [];
    // try {
    //   const result = await Promise.all([pool.query(`select count(*) as num from messages where ${propName} = $1`, [propValue]), pool.query(`select sum(json_array_length(annotations)) as num from messages where ${propName} = $1`, [propValue])]);
    //   results = result.map((x) => x.rows).map((x) => Number(x.shift().num));
    // } catch (error) {
    //   console.error(error);
    // }
    // return results;
    const res = await pool.query("SELECT fid, count(fid) FROM (select cast(json_array_elements(features)->'id' as text) as fid from messages) as unnested group by fid");
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
        const result = await client.query('INSERT INTO objects (content, features, uuid, tg_id, data_id, shape, geometry) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id', [item.content, JSON.stringify(item.features), item.uuid, item.tg_id, item.data_id, item.shape, item.geometry]);
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
  async setObject(params, imageDir, fragmentsDir) {
    let data = {};
    let id = Number(params?.id);
    try {
      if (params.id) {
        const res = await pool.query('UPDATE objects SET features = $2, content =$3, shape =$4, geometry = $5 WHERE id = $1 RETURNING id', [id, JSON.stringify(params.features), params.content, params.shape, params.geometry]);
        data = res.rows?.[0];
      } else {
        const res = await pool.query('INSERT INTO objects (features, content, tg_id, data_id, shape, geometry) VALUES($1, $2, $3, $4, $5, $6) RETURNING id', [JSON.stringify(params.features), params.content, params.tg_id, params.data_id, params.shape, params.geometry]);
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
  async deleteObject(id, fragmentsDir) {
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
  async changeActivationStatus(userId, currentUser, status) {
    console.log('activation request:', userId, 'by', currentUser.id);
    let data = {};
    if (userId && currentUser.privs === 1) {
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
  async elevateUser(userId, currentUser) {
    console.log('privileges elevation request for', userId, 'by', currentUser.id, currentUser.privs === 1);
    let data = {};
    if (userId && currentUser.privs === 1) {
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
  async getUsers(id) {
    let sql = 'SELECT id, username, firstname, lastname, email, privs, activated, requested from users';
    let data = [];
    const values = [];

    if (id) {
      sql += ' WHERE id = $1';
      values.push(id);
    } else {
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
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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
    console.log('create user', formData);

    const data = formData;
    let isActivated = status;
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
      console.log('create admin');
    }

    if (settings?.registration_code?.length && formData?.note?.includes(settings.registration_code)) {
      console.log('activated via pass code');
      isActivated = true;
    }

    const pwd = passGen.generate(passOptions);
    // console.log('make hash');
    const hash = await bcrypt.hash(pwd, saltRounds);
    // console.log('ready');
    // console.log(pwd, hash);
    const result = await pool.query('INSERT INTO users (requested, username, firstname, lastname, email, sex, privs, _passhash, activated) VALUES(NOW(), LOWER($1), INITCAP($2), INITCAP($3), LOWER($4), $5, $6, $7, $8) RETURNING id', [data.username, data.firstname, data.lastname, data.email, data.sex, data.privs, hash, isActivated]);
    if (result.rows.length === 1) {
      return { message: pwd };
    }
    return { error: 'user' };
  },
  async getSettings() {
    let data = [];
    const sql = 'SELECT * FROM settings';

    try {
      const result = await pool.query(sql);
      data = result?.rows?.[0];
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async addImage(userId, filePath, thumbsPath, fileName, fileTitle, fileSize) {
    const toDec = (dms, dir) => dms.map((x, i) => x / (60 ** i)).reduce((x, i) => x + i) * (dir > 'O' ? -1 : 1); // S and W > N and E
    // console.log('here', userId, filePath, fileName, fileTitle, fileSize);
    let id;
    try {
      let loc;
      const meta = await sharp(filePath).metadata();
      const exifBuf = meta.exif;
      const exifData = exifBuf ? exif(exifBuf) : {};
      const data = {
        user: userId, title: fileTitle, meta: exifData, size: fileSize
      };
      // console.log('image meta', data);
      const gps = data?.meta?.gps;
      // console.log('meta', data?.meta);
      if (gps) {
        const lat = toDec(gps.GPSLatitude, gps.GPSLatitudeRef);
        const lng = toDec(gps.GPSLongitude, gps.GPSLongitudeRef);
        console.log(lat, lng);
        loc = `(${lat}, ${lng})`;
        // console.log('loc', loc);
      }
      // https://nominatim.openstreetmap.org/reverse?lat=53.880222&lon=27.599704742&format=json&accept-language=en-us&addressdetails=1
      const result = await pool.query('INSERT INTO messages (imagepath, data, location) VALUES($1, $2, $3) RETURNING id', [fileName, JSON.stringify(data), loc]);
      id = result?.rows?.shift()?.id;

      await sharp(filePath).resize(thumbnailSettings).toFile(thumbsPath);
    } catch (error) {
      console.log(error);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (fs.existsSync(thumbsPath)) {
        fs.unlinkSync(thumbsPath);
      }
    }
    return id;
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
    await pool.query('INSERT INTO chats(type, tg_id, username, firstname, lastname) VALUES ($1, $2, $3, $4, $5) ON CONFLICT ON CONSTRAINT chats_tg_id_key DO NOTHING RETURNING id', [type, tgId, username, firstname, lastname]);
  },
  async updateSettings(params) {
    const columns = databaseScheme.settings.split(',').map((x) => x.trim().split(' ').shift());
    const query = Object.fromEntries(
      Object.entries(params).filter(([key]) => columns.includes(key))
    );
    // console.log('settings', query);
    const sql = `UPDATE settings SET ${Object.keys(query).map((x, i) => `${x} = $${i + 1}`)}`;
    const result = await pool.query(sql, Object.values(query));
    return result?.rowCount;
  },
};
