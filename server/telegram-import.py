import os
import traceback
import json
from dotenv import load_dotenv # python-dotenv
import psycopg2 # psycopg2-binary
from telethon.sync import TelegramClient
# from telethon.sync import TelegramClient, events
# from telethon.tl.types import PeerUser, PeerChat, PeerChannel

load_dotenv(verbose=True)

api_id = os.getenv("API_ID")
api_hash = os.getenv("API_HASH")
# test_user = os.getenv("USER")
group_id = os.getenv("GROUP_ID")
group_name = os.getenv("GROUP_NAME")
db_user = os.getenv("PGUSER")
db_name = os.getenv("PGDATABASE")
db_pass = os.getenv("PGPASSWORD")
counter = 0
# f = open("debug.txt", "w", encoding='utf-8')
# print(api_id, api_hash)

database_dict = {
    "messages":
        """CREATE TABLE IF NOT EXISTS messages (
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
        )""",
    "users":
        """CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,	
                username text,	
                firstname text,
                lastname text,
                tg_id BIGINT unique
        )""",
    "channels":
        """CREATE TABLE IF NOT EXISTS channels (
                id SERIAL PRIMARY KEY,	
                name text,        
                tg_id integer unique
        )""",
}

conn = psycopg2.connect(dbname=db_name, user=db_user, password=db_pass, host='localhost')
cursor = conn.cursor()

cursor.execute("SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' GROUP BY table_name")
res = cursor.fetchall()
if res:
    tables = [x[0] for x in res]
    diff = set(database_dict.keys()).difference(set(tables))
    if(len(diff)):
        for table in diff:
            print("init table:", table)
            # cursor.execute(database_dict[table])
            # cursor.execute("ALTER TABLE %s OWNER TO %s", (table, db_user))
            # conn.commit()
            

with TelegramClient('session_name', api_id, api_hash) as client:
    # for dialog in client.iter_dialogs():
        # if dialog.title == group_name:
            # print(dialog, file=f)
            # break
    # c = client.get_entity(PeerChat(int(group_id)))
    # , min_id = 115027, limit=2

    for person in client.get_participants(int(group_id)):
        who = person.to_dict()
        # print(who["id"], who["first_name"], who["last_name"], who["username"])
        cursor.execute("INSERT INTO users(username, firstname, lastname, tg_id) VALUES (%s, %s, %s, %s) ON CONFLICT ON CONSTRAINT users_tg_id_key DO NOTHING",
        (who["username"], who["first_name"], who["last_name"], who["id"]))
    conn.commit()

    for message in client.iter_messages(int(group_id), reverse=True):
        print(message.id)
        message_json = json.dumps(message.to_dict(), ensure_ascii=False, default=str)
        counter +=1
        jpg_name = ""

        try:
            if hasattr(message, "media") and hasattr(message.media, "photo"):
                # print('File Name :' + str(dir(message.media.photo)))
                # print('File Name :' + message.file.ext, message.media.photo.dc_id)
                jpg_name = str(message.media.photo.id) + message.file.ext
                jpg_path = os.path.join("media", jpg_name)
                if not os.path.exists(jpg_path):
                    saved_path = message.download_media(jpg_path)
            cursor.execute("INSERT INTO messages(tg_id, data, imagepath) VALUES (%s, %s, %s) ON CONFLICT ON CONSTRAINT messages_tg_id_key DO NOTHING", (message.id, message_json, jpg_name))

        except:
            print("=====================================")
            print(traceback.format_exc())
            print(message_json)
            print("=====================================")
            exit()

    print(counter)
    conn.commit()
    cursor.execute("SELECT COUNT(*) from messages")
    # select count(*) from messages where length(imagepath) > 0;
    res = cursor.fetchall()
    print(f"DB count: {res[0][0]}")
    cursor.close()
    conn.close()
