import express from 'express';
import path, { dirname } from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import history from 'connect-history-api-fallback';
import fileUpload from 'express-fileupload';
import mime from 'mime';
import { createHash } from 'crypto';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import db from './db.js';
import tg from './connectors/telegram.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __package = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const imageExtensions = { 'image/jpeg': 'jpg', 'image/png': 'png' };

// environment variables
const port = process.env.PORT || 8080;
const secret = process.env.SECRET;
const appName = __package?.name || String(port);
const commit = process.env.COMMIT;
const unix = process.env.COMMITUNIX;
const imageFileLimit = Number(process.env.IMGLIMIT) || 1024 * 1024; // 1 MB

const mediaDir = path.join(__dirname, 'media');
const imagesDir = path.join(mediaDir, 'downloads');
const fragmentsDir = path.join(mediaDir, 'fragments');
const thumbsDir = path.join(mediaDir, 'thumbnails');
const importDir = path.join(__dirname, 'import');
const exportDir = path.join(mediaDir, 'export');

const info = {
  server: __package.version,
  commit,
  unix,
  dir: path.basename(__dirname),
};

const nest = (items, id = 0) => items
  .filter((x) => x.parent === id)
  .map((x) => {
    const children = nest(items, x.id);
    return { ...x, ...(children?.length && { children }) };
  });

const strategy = new passportJWT.Strategy(
  {
    // jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
    jwtFromRequest: passportJWT.ExtractJwt.fromExtractors([
      passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      passportJWT.ExtractJwt.fromUrlQueryParameter('jwt'),
    ]),
    secretOrKey: secret,
  },
  (jwtPayload, done) => db
    .getUserDataByID(jwtPayload.sub)
    .then((user) => done(null, user))
    .catch((err) => done(err))
);

const issueToken = (user) => jwt.sign(
  {
    iss: appName,
    sub: user.id,
    iat: new Date().getTime(),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 1,
    // iat: Math.floor(Date.now() / 1000),
    // exp: new Date().setDate(new Date().getDate() + 1),
  },
  secret
);

// Telegram sync job → START
// await tg.sync();
// Telegram sync job → END

// Directory sync start
if (fs.existsSync(importDir)) {
  const files = fs.readdirSync(importDir);
  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    const importFilePath = path.join(importDir, file);
    const buff = fs.readFileSync(importFilePath);
    const md5 = createHash('md5').update(buff).digest('hex');
    const mimeType = mime.getType(importFilePath);
    if (mimeType in imageExtensions) {
      const ext = imageExtensions[mimeType];
      const fileName = `${md5}.${ext}`;
      const filePath = path.join(imagesDir, fileName);
      const thumbsPath = path.join(thumbsDir, fileName);
      const fileTitle = path.parse(importFilePath).name;
      const stats = fs.statSync(importFilePath);
      const fileSize = stats.size;

      console.log(fileTitle, fileName);

      if (fs.existsSync(filePath)) {
        console.log('File to be imported already exists');
      } else {
        try {
          fs.renameSync(importFilePath, filePath);
          // eslint-disable-next-line no-await-in-loop
          const results = await db.addImage({ id: 1 }, filePath, thumbsPath, fileName, fileTitle, fileSize, null);
          const [id, errorMessage] = results;
          if (id) {
            console.log(`OK: ${file}`);
          } else {
            console.log(errorMessage || 'Database error');
          }
        } catch (error) {
          console.log(error);
        }
      }
      // break;
    }
  }
}
// Directory sync end
passport.use(strategy);
const auth = passport.authenticate('jwt', { session: false });
const app = express();

app.use(fileUpload({ limits: { fileSize: imageFileLimit }, abortOnLimit: true, defParamCharset: 'utf8' }));

app.use(compression());
app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(history());
app.use('/api/media', [auth, express.static(mediaDir)]);
app.use(express.static('public'));

app.post('/api/user/login', async (req, res) => {
  const userData = await db.getUserData(req.body.email, req.body.password);
  if (userData && Object.keys(userData).length && !userData?.error) {
    console.log(req.body.email, '<SUCCESS>');
    await db.sendToLog(req, userData.id, 'login');
    const settings = await db.getSettings(userData);
    res.json({
      ...userData,
      ...info,
      token: issueToken(userData),
      settings,
    });
  } else {
    console.log(`login attempt as [${req.body.email}]•[${req.body.password}]►${userData.error}◄`);
    res.json(userData);
  }
});

app.post('/api/user/reg', async (req, res) => {
  const userdata = req.body;
  userdata.privs = 5; // default privileges
  res.json(await db.createUser(userdata, false));
});

// app.get('/api/logout', (req, res) => {
//   console.log('logging out');
//   req.logout();
//   // res.redirect('/login');
//   return res.send();
// });

app.get('/api/user/info', auth, async (req, res) => {
  // let exp;
  // const header = req?.headers?.authorization;
  // if (header) {
  //   const [code, token] = header.trim().split(' ');
  //   if (code === 'Bearer' && token) {
  //     const decoded = jwt.verify(token, secret);
  //     exp = decoded.exp;
  //   }
  // }
  const settings = await db.getSettings(req.user);
  res.json({
    ...req.user,
    ...info,
    token: issueToken(req.user),
    settings,
  });
});

app.post('/api/user/activate', auth, async (req, res) => {
  res.json(await db.changeActivationStatus(req.user, req.body?.id, Boolean(req.body?.status)));
});

app.post('/api/user/elevate', auth, async (req, res) => {
  res.json(await db.elevateUser(req.user, req.body?.id));
});

app.post('/api/user/update', auth, async (req, res) => {
  res.json(await db.updateUser(req.user, req.body));
});

app.post('/api/user/reset', auth, async (req, res) => {
  res.json(await db.resetPassword(req.user, req.body?.id));
});

app.get('/api/features', auth, async (req, res) => {
  res.json(await db.getFeatures());
});

app.get('/api/stats', auth, async (req, res) => {
  const [images, messages, features, objects, astat, pstat] = await Promise.all([
    db.getMessagesAnnotatedCount(),
    db.getItemsCount(),
    db.getFeatures(),
    db.getObjectsCount(),
    db.getObjectsStats(),
    db.getItemsStats(),
  ]);
  const stats = Object.fromEntries(astat.concat(pstat).map((x) => [x.fid, Number(x.count)]));
  const tree = nest(features.map((x) => ({ ...x, num: stats[x.id] })));
  res.json({
    messages,
    objects,
    images,
    tree,
  });
});

app.get('/api/messages', auth, async (req, res) => {
  // console.log(req.query);
  const count = await db.getMessagesCount();
  const data = await db.getMessages(req.user, Number(req.query.off), Number(req.query.batch), Number(req.query.order));
  const usersList = await db.getChats(req.user);
  const usersDict = Object.fromEntries(usersList.map((x) => [x.eid, x]));
  return res.json({
    count,
    data,
    users: usersDict,
    // "user": req.isAuthenticated()?getUser(req):{}
  });
});

app.post('/api/objects', auth, async (req, res) => res.json(await db.getObjects(req.user, req.body)));

app.get('/api/attached', auth, async (req, res) => res.json(await db.getAttachedObjects(req.user, req.query.id)));

app.post('/api/meta', auth, async (req, res) => res.json(await db.setItemMeta(req.user, req.body.params)));

app.post('/api/object', auth, async (req, res) => res.json(await db.setObject(req.user, req.body.params, imagesDir, fragmentsDir)));

app.delete('/api/object/:id', auth, async (req, res) => res.json(await db.deleteObject(req.user, req.params.id, fragmentsDir)));

app.delete('/api/feature/:id', auth, async (req, res) => res.json(await db.deleteFeature(req.user, req.params)));

app.get('/api/message', auth, async (req, res) => res.json(await db.getMessage(req.user, Number(req.query.id))));

app.get('/api/sets', auth, async (req, res) => res.json(await db.getSets(req.user)));

app.post('/api/sets', auth, async (req, res) => res.json(await db.setSet(req.user, req.body)));

app.post('/api/set/publish', auth, async (req, res) => res.json(await db.publishSet(req.user, req.body, fragmentsDir, exportDir)));

app.delete('/api/sets/:id', auth, async (req, res) => res.json(await db.deleteSet(req.user, req.params.id, exportDir)));

// app.get('/api/next', auth, async (req, res) => res.json(await db.getNext(Number(req.query.id))));

// app.get('/api/prev', auth, async (req, res) => res.json(await db.getPrev(Number(req.query.id))));

app.post('/api/upload', auth, async (req, res) => {
  let status = 200;
  let fileName = '';
  let id;
  let errorMessage;
  const { features } = req.body;
  // console.log('body features', features);
  if (Object.keys(req.files).length) {
    // console.log(Object.keys(req.files.file));
    // console.log(req.files.file.data);
    const img = req.files.file;
    const fileTitle = path.parse(img.name).name;
    const fileSize = img.size;

    if (['image/jpeg', 'image/png'].includes(img.mimetype)) {
      const ext = imageExtensions[img.mimetype];
      // console.log("img:", img.md5, title, ext);
      // fs.mkdirSync(currentDir, { recursive: true });
      fileName = `${img.md5}.${ext}`;
      const filePath = path.join(imagesDir, fileName);
      const thumbsPath = path.join(thumbsDir, fileName);

      if (fs.existsSync(filePath)) {
        errorMessage = 'Uploaded file already exists';
        console.log(errorMessage, fileName);
        status = 409;
      } else {
        try {
          await img.mv(filePath);
        } catch (error) {
          console.log(error);
          errorMessage = 'File copy error';
          status = 500;
        }
        const results = await db.addImage(req.user, filePath, thumbsPath, fileName, fileTitle, fileSize, features);
        [id, errorMessage] = results;
        if (!id) {
          errorMessage = errorMessage || 'Database error';
          status = 500;
        }
      }
    } else {
      errorMessage = 'Wrong file type';
      console.log(errorMessage);
      status = 415;
    }
  } else {
    errorMessage = 'No files were uploaded';
    console.log(errorMessage);
    status = 400;
  }

  res.status(status).json({ id, file: fileName, ...(errorMessage && { error: errorMessage }) });
});

app.post('/api/unload', auth, async (req, res) => {
  res.json(await db.removeImage(req.user, req.body, imagesDir, thumbsDir));
});

app.post('/api/settings', auth, async (req, res) => {
  res.json(await db.updateSettings(req.user, req.body));
});

app.get('/api/registration', async (req, res) => {
  const result = await db.getSettings();
  res.json({ status: result.registration_open });
});

app.get('/api/users', auth, async (req, res) => {
  const users = await db.getUsers(req.user, req.query?.id);
  res.json(users);
});

app.get('/api/settings', auth, async (req, res) => res.json(await db.getSettings(req.user)));

app.get('/api/chats', auth, async (req, res) => res.json(await db.getChats(req.user)));

app.post('/api/feature', auth, async (req, res) => res.json(await db.updateFeature(req.user, req.body.params)));

app.get('/api/map', auth, async (req, res) => res.json(await db.getMap(req.user)));

app.get('/api/logs', auth, async (req, res) => res.json(await db.getLogs(req.user)));

app.listen(port);
console.log(`Backend is at port ${port}`);
