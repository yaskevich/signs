'use strict';

// import path from 'path';
import express from 'express';
import path from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import session from 'cookie-session';
import passport from 'passport';
import passportLocal from 'passport-local';
import history from 'connect-history-api-fallback';

import dotenv from 'dotenv';
dotenv.config();
import db from './db.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getUser(request) {
	return users.find(user => {
		// console.log([user, req.session]);
		return user.id === request.session.passport.user;
  });
}

const LocalStrategy = passportLocal.Strategy;

let users = [
  {
    id: 1,
    name: "Саша",
    email: "user@email.com",
    password: "password"
  },
  {
    id: 2,
    name: "Женя",
    email: "user2@email.com",
    password: "password2"
  }
];


(async () => {
	const app = express();
	const port = process.env.PORT || 5000;

	passport.use(
	  new LocalStrategy(
		{
		  usernameField: "email",
		  passwordField: "password"
		},

		(username, password, done) => {
		  let user = users.find((user) => {
			return user.email === username && user.password === password;
		  });

		  if (user) {
			done(null, user);
		  } else {
			done(null, false, { message: 'Incorrect username or password'});
		  }
		}
	  )
	);

	passport.serializeUser((user, done) => {
	  done(null, user.id);
	});

	passport.deserializeUser((id, done) => {
	  let user = users.find((user) => {
		return user.id === id;
	  });
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
			{ from: /\/api\/.*$/, to: context => context.parsedUrl.pathname }
		  ]
		}));
	// app.use(path.join(__dirname, 'public'), express.static('media'));


	app.post('/api/login', function(req, res, next) {
	  passport.authenticate("local", (err, user, info) => {
		  // console.log(user, info);
		if (err) {
		  return next(err);
		}

		if (!user) {
		  return res.status(400).send([user, "Cannot log in", info]);
		}

		req.login(user, err => {
		  // res.send("Logged in");
		  res.json({ user: getUser(req) });
		  if (err) {
			console.log(err);
		  }
		});
	  })(req, res, next);
});

	app.get('/api/logout', (req, res) => {
		console.log("logging out");
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

	app.get("/api/messages", async(req, res) =>  {
	  const data = await db.getMessages();
	  const users = await db.getUsers();
		const usersDict = users.reduce((obj, item) => ((obj[[item['tg_id']]] = item), obj), {});

	  return res.json({
			"data": data,
			"users": usersDict,
			// "user": req.isAuthenticated()?getUser(req):{}
		});
	});

	const authMiddleware = (req, res, next) => {
	  if (!req.isAuthenticated()) {
		res.status(401).send('You are not authenticated');
	  } else {
		return next();
	  }
	};

	app.get("/api/user", authMiddleware, (req, res) => {
	  res.send({ user: getUser(req) });
	});

	app.all("/", (req,res) => {
		res.send("hi");
	});

	app.listen(port);
	console.log("Backend is at port "+ port);
})();
