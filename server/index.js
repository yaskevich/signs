import express from 'express';
import path, { dirname } from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import history from 'connect-history-api-fallback';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import db from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __package = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

const port = process.env.PORT || 8080;
const secret = process.env.SECRET;
const appName = __package?.name || String(port);
const commit = process.env.COMMIT;
const unix = process.env.COMMITUNIX;

const mediaDir = path.join(__dirname, 'media');
const imagesDir = path.join(mediaDir, 'downloads');
const fragmentsDir = path.join(mediaDir, 'fragments');

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
      passportJWT.ExtractJwt.fromUrlQueryParameter('jwt')
    ]),
    secretOrKey: secret,
  },
  (jwtPayload, done) => db.getUserDataByID(jwtPayload.sub)
    .then((user) => done(null, user))
    .catch((err) => done(err)),
);

const issueToken = (user) => jwt.sign({
  iss: appName,
  sub: user.id,
  iat: new Date().getTime(),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 1)
  // iat: Math.floor(Date.now() / 1000),
  // exp: new Date().setDate(new Date().getDate() + 1),
}, secret);

passport.use(strategy);
const auth = passport.authenticate('jwt', { session: false });
const app = express();

app.use('/api/media', [auth, express.static(mediaDir)]);
app.use(express.static('public'));

app.use(compression());
app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(history());
// app.use(history({
//   // verbose: true,
//   rewrites: [
//     { from: /\/api\/.*$/, to: (context) => context.parsedUrl.pathname }
//   ]
// }));

app.get('/api/settings', async (req, res) => res.json(await db.getSettings()));

app.post('/api/user/login', async (req, res) => {
  const userData = await db.getUserData(req.body.email, req.body.password);
  if (userData && Object.keys(userData).length && !userData?.error) {
    console.log(req.body.email, '<SUCCESS>');
    res.json({
      ...userData, token: issueToken(userData), server: __package.version, commit, unix
    });
  } else {
    console.log(`login attempt as [${req.body.email}]•[${req.body.password}]►${userData.error}◄`);
    res.json(userData);
  }
});

app.post('/api/user/reg', async (req, res) => {
  const userdata = req.body;
  userdata.privs = 5; // default privileges
  const result = await db.createUser(userdata, false);
  res.json(result);
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
  res.json({
    ...req.user, server: __package.version, commit, unix, token: issueToken(req.user),
  });
});

app.get('/api/features', auth, async (req, res) => {
  res.json(await db.getFeatures());
});

app.get('/api/stats', auth, async (req, res) => {
  const [photos, messages, features, objects, astat, pstat] = await Promise.all([
    db.getMessagesAnnotatedCount(),
    db.getPhotosCount(),
    db.getFeatures(),
    db.getObjectsCount(),
    db.getObjectsStats(),
    db.getPhotoStats(),
  ]);
  const stats = Object.fromEntries(astat.concat(pstat).map((x) => [x.fid, Number(x.count)]));
  const tree = nest(features.map((x) => ({ ...x, num: stats[x.id] })));
  res.json({
    messages, objects, photos, tree
  });
});

app.get('/api/messages', auth, async (req, res) => {
  // console.log(req.query);
  const count = await db.getMessagesCount();
  const data = await db.getMessages(Number(req.query.off), Number(req.query.batch));
  const usersList = await db.getChats();
  const usersDict = Object.fromEntries(usersList.map((x) => [x.tg_id, x]));
  return res.json({
    count,
    data,
    users: usersDict,
    // "user": req.isAuthenticated()?getUser(req):{}
  });
});

app.get('/api/objects', auth, async (req, res) => res.json(await db.getObjects(req.query)));

app.get('/api/attached', auth, async (req, res) => res.json(await db.getAttachedObjects(req.query.id)));

app.post('/api/meta', auth, async (req, res) => res.json(await db.setPhotoMeta(req.body.params)));

app.post('/api/feature', auth, async (req, res) => res.json(await db.updateFeature(req.body.params)));

app.post('/api/object', auth, async (req, res) => res.json(await db.setObject(req.body.params, imagesDir, fragmentsDir)));

app.delete('/api/object/:id', auth, async (req, res) => res.json(await db.deleteObject(req.params.id, fragmentsDir)));

app.get('/api/message', auth, async (req, res) => res.json(await db.getMessage(Number(req.query.id))));

app.get('/api/next', auth, async (req, res) => res.json(await db.getNext(Number(req.query.id))));

app.get('/api/prev', auth, async (req, res) => res.json(await db.getPrev(Number(req.query.id))));

app.listen(port);
console.log(`Backend is at port ${port}`);
