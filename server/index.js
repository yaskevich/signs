import express from 'express';
import path, { dirname } from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import session from 'cookie-session';
import passport from 'passport';
import passportLocal from 'passport-local';
import history from 'connect-history-api-fallback';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import db from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const users = [
  {
    id: 1,
    name: 'Саша',
    email: 'user@email.com',
    password: 'password'
  },
  {
    id: 2,
    name: 'Женя',
    email: 'user2@email.com',
    password: 'password2'
  }
];

function getUser(request) {
  return users.find((user) => user.id === request.session.passport.user);
}

const LocalStrategy = passportLocal.Strategy;

const annotationScheme = {
  languages: ['TAG-BE', 'TAG-RU', 'TAG-MIXED', 'TAG-EN', 'TAG-PL', 'TAG-DE', 'TAG-UA', 'TAG-FR', 'TAG-NOTEXT', 'TAG-AMBILANG'].sort(),
  features: ['TAG-COPY', 'TAG-PRINTED', 'TAG-PICT', 'TAG-CAPS', 'TAG-GRAPH', 'TAG-LINE', 'TAG-OBJ', 'TAG-FRAGM', 'TAG-INTERTEXT', 'TAG-SYMB', 'TAG-NOPUNCT', 'TAG-CODESWITCH'].sort(),
  countries: [
    { name: 'Belarus', code: 'by' },
    { name: 'Out of Belarus', code: 'out' },
    { name: 'Poland', code: 'pl' },
    { name: 'Great Britain', code: 'gb' },
    { name: 'Germany', code: 'de' },
    { name: 'France', code: 'fr' },
    { name: 'Russia', code: 'ru' },
    { name: 'USA', code: 'us' },
    { name: 'Ukraine', code: 'ua' },
    { name: 'Lithuania', code: 'lt' },
    { name: 'Latvia', code: 'lv' },
    { name: 'Switzerland', code: 'ch' },
    { name: 'Australia', code: 'au' },
    { name: 'Austria', code: 'at' },
    { name: 'Israel', code: 'il' },
    { name: 'Spain', code: 'es' },
    { name: 'Spain', code: 'es' },
    { name: 'Czechia', code: 'cz' },
    { name: 'Denmark', code: 'dk' },
    { name: 'Ireland', code: 'ie' },
  ],
  orientation: [
    { name: 'Basic', level: 1 },
    { name: 'Pro', level: 2 },
  ],
};

(async () => {
  const app = express();
  const port = process.env.PORT || 8080;

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },

      (username, password, done) => {
        const user = users.find((x) => x.email === username && user.password === password);

        if (user) {
          done(null, user);
        } else {
          done(null, false, { message: 'Incorrect username or password' });
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    const user = users.find((x) => x.id === id);
    done(null, user);
  });

  app.use('/api/media', express.static(path.join(__dirname, 'media')));
  app.use(express.static('public'));

  app.use(compression());
  app.use(session({
    secret: process.env.SESSION_SECRET || Math.random().toString(36).substring(2),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(history({
    // verbose: true,
    rewrites: [
      { from: /\/api\/.*$/, to: (context) => context.parsedUrl.pathname }
    ]
  }));
  // app.use(path.join(__dirname, 'public'), express.static('media'));

  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      // console.log(user, info);
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send([user, 'Cannot log in', info]);
      }

      req.login(user, (err) => {
        // res.send("Logged in");
        res.json({ user: getUser(req) });
        if (err) {
          console.log(err);
        }
      });
    })(req, res, next);
  });

  app.get('/api/logout', (req, res) => {
    console.log('logging out');
    req.logout();
    // res.redirect('/login');
    return res.send();
  });

  // app.get("/api/data/:id", async(req, res) =>  {
  // const id  = parseInt(req.params.id, 10);
  // console.log(`query for ${id}`);
  // const data  = id ? await db.getUnits1(id) : [];
  // return res.json(data);
  // });

  app.get('/api/scheme', async (req, res) => {
    res.json(annotationScheme);
  });

  app.get('/api/features', async (req, res) => {
    res.json(await db.getFeatures());
  });

  app.get('/api/stats', async (req, res) => {
    const [mCount, aCount, pCount, languagesCount, featuresCount, photosCount] = await Promise.all([
      db.getMessagesCount(),
      db.getAnnotationsCount(),
      db.getPhotosCount(),
      Promise.all(annotationScheme.languages.map((x) => db.getTagCount(x))),
      Promise.all(annotationScheme.features.map((x) => db.getTagCount(x))),
      Promise.all([1, 2].map((x) => db.getPhotoStats('orient', x))),
    ]);
    res.json({
      scheme: annotationScheme, messages: mCount, photos: pCount, annotations: aCount, languages: languagesCount, features: featuresCount, orientation: photosCount
    });
  });

  app.get('/api/messages', async (req, res) => {
    // console.log(req.query);
    const count = await db.getMessagesCount();
    const data = await db.getMessages(Number(req.query.off), Number(req.query.batch));
    const usersList = await db.getUsers();
    const usersDict = Object.fromEntries(usersList.map((x) => [x.tg_id, x]));
    return res.json({
      count,
      data,
      users: usersDict,
      // "user": req.isAuthenticated()?getUser(req):{}
    });
  });

  app.get('/api/annotations', async (req, res) => res.json(await db.getAnnotations(req.query)));

  app.post('/api/anno', async (req, res) => res.json(await db.updateMessage(req.body.params)));

  app.get('/api/message', async (req, res) => res.json(await db.getMessage(Number(req.query.id))));

  app.get('/api/next', async (req, res) => res.json(await db.getNext(Number(req.query.id))));

  app.get('/api/prev', async (req, res) => res.json(await db.getPrev(Number(req.query.id))));

  const authMiddleware = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send('You are not authenticated');
    }
    return next();
  };

  app.get('/api/user', authMiddleware, (req, res) => {
    res.send({ user: getUser(req) });
  });

  app.all('/', (req, res) => {
    res.send('hi');
  });

  app.listen(port);
  console.log(`Backend is at port ${port}`);
})();
