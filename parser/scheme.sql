CREATE TABLE IF NOT EXISTS messages (
	id SERIAL PRIMARY KEY,	
	data json,	
	created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	imagepath text,
	tg_id integer unique,
	annotations json,
	orient integer,
	country text,
	url text,
	src text
);

CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,	
	username text,	
	firstname text,
	lastname text,
	tg_id integer unique
);

ALTER TABLE messages OWNER TO [user];

ALTER TABLE users OWNER TO [user];
