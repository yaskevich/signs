CREATE TABLE IF NOT EXISTS messages (
	id SERIAL PRIMARY KEY,	
	data json,	
	created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	imagepath text,
	tg_id integer unique
);

ALTER TABLE messages OWNER TO [user];