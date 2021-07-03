import os
import json
from dotenv import load_dotenv # python-dotenv 
import psycopg2 # psycopg2-binary
from telethon.sync import TelegramClient, events
# from telethon.tl.types import PeerUser, PeerChat, PeerChannel

load_dotenv(verbose=True)

api_id = os.getenv("API_ID")
api_hash = os.getenv("API_HASH")
test_user = os.getenv("USER")
group_id = os.getenv("GROUP_ID")
group_name = os.getenv("GROUP_NAME")

f = open("debug.txt", "w", encoding='utf-8')
# print(api_id, api_hash)

conn = psycopg2.connect(dbname=os.getenv("DB_NAME"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), host='localhost')
cursor = conn.cursor()

with TelegramClient('session_name', api_id, api_hash) as client:
    # for dialog in client.iter_dialogs():
        # if dialog.title == group_name:
            # print(dialog, file=f)
            # break
    # c = client.get_entity(PeerChat(int(group_id)))
    # exit()
    
    counter = 0
    # , min_id = 115027
    # for msg in client.iter_messages(c, limit=1000, reverse=False):
    for message in client.iter_messages(int(group_id), limit=5, reverse=True):
        msg = message.to_dict()
        message_json = json.dumps(msg, ensure_ascii=False, default=str)
        counter +=1
        # if message.photo:
            # print('File Name :' + str(dir(message.media.photo)))
            # print('File Name :' + message.file.ext, message.media.photo.dc_id)
        # print(message_json)
        
        jpg_name = ""
        if "media" in msg and "photo" in msg["media"]:
            jpg_name = str(message.media.photo.id) + message.file.ext
            jpg_path = os.path.join("media", jpg_name) 
            if not os.path.exists(jpg_path):
                saved_path = message.download_media(jpg_path)
            
        cursor.execute("INSERT INTO messages(data, imagepath) VALUES (%s, %s)", (message_json, jpg_name))
        
        print(message.id)
    print(counter)
    conn.commit()
    cursor.execute("SELECT COUNT(*) from messages")
    res = cursor.fetchall()
    print(res)
    cursor.close()
    conn.close()
    