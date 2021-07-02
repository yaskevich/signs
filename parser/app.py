from dotenv import load_dotenv # python-dotenv 
load_dotenv(verbose=True)
import os
from telethon.tl.functions.messages import GetHistoryRequest
from datetime import date, datetime
import json
from telethon.sync import TelegramClient, events

# pip install psycopg2-binary
import psycopg2

# from pathlib import Path
# basepath = Path()
# basedir = str(basepath.cwd())
# # Load the environment variables
# envars = basepath.cwd() / '.env'
# load_dotenv(envars)

# from telethon import TelegramClient, events, sync

api_id = os.getenv("API_ID")
api_hash = os.getenv("API_HASH")
test_user = os.getenv("USER")
channel_username = os.getenv("CHANNEL")


print(api_id, api_hash)
# client = TelegramClient('session_name', api_id, api_hash)
# client.start()

# exit()

# print(client.get_me().stringify())

# client.send_message(test_user, 'Hello! Talking to you from Telethon')
# # client.send_file(test_user, '/home/myself/Pictures/holidays.jpg')

# client.download_profile_photo('me')
# messages = client.get_messages(test_user)
# messages[0].download_media()

# @client.on(events.NewMessage(pattern='(?i)hi|hello'))
# async def handler(event):
    # await event.respond('Hey!')



# with TelegramClient('session_name', api_id, api_hash) as client:
   # # client.send_message('me', 'Hello, myself!')
   # # print(client.download_profile_photo('me'))

    # # @client.on(events.NewMessage(pattern='(?i).*Hello'))
    # # async def handler(event):
        # # await event.reply('Hey!')
    # # client.run_until_disconnected()
        
    # channel_entity=client.get_entity(channel_username)
    # posts = client(GetHistoryRequest(
        # peer=channel_entity,
        # limit=5,
        # offset_date=None,
        # offset_id=0,
        # max_id=0,
        # min_id=0,
        # add_offset=0,
        # hash=0))        
    # channel_history = []
    # for message in reversed(posts.messages):
        # msg = message.to_dict()
        # print("•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••")
        # print(msg["message"])
        # print('■'+str(msg["views"]))
        
    # await dump_all_messages(channel_username)

f = open("data.txt", "w", encoding='utf-8')
client = TelegramClient('session_name', api_id, api_hash)

client.start()

# for dialog in client.iter_dialogs():
    # print(dialog.title, file=f)
    
# for dialog in client.iter_dialogs():
    # if dialog.title == "test":
        # print(dialog, file=f)
        

# from this article: https://proglib.io/p/pishem-prostoy-grabber-dlya-telegram-chatov-na-python-2019-11-06
class DateTimeEncoder(json.JSONEncoder):
    '''Class for date serialization for JSON'''
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        if isinstance(o, bytes):
            return list(o)
        return json.JSONEncoder.default(self, o)
        
async def dump_all_messages(channel, lim = 0):
    """Writes json with all the channel messages"""
    offset_msg = 0    # bunber to start
    limit_msg = 100   # max amount of batch

    all_messages = []   # all messages
    total_messages = 0
    total_count_limit = lim  # limit to download not all

    while True:
        history = await client(GetHistoryRequest(
            peer=channel,
            offset_id=offset_msg,
            offset_date=None, add_offset=0,
            limit=limit_msg, max_id=0, min_id=0,
            hash=0))
        if not history.messages:
            break
        messages = history.messages
        for message in messages:
            all_messages.append(message.to_dict())
        offset_msg = messages[len(messages) - 1].id
        total_messages = len(all_messages)
        if total_count_limit != 0 and total_messages >= total_count_limit:
            break

    with open('channel_messages.json', 'w', encoding='utf8') as outfile:
        for message in messages:
            # saved_path = await event.download_media(optional_path)
            saved_path  = await client.download_media(message.media,"media")
            print(saved_path)
        json.dump(all_messages, outfile, ensure_ascii=False, cls=DateTimeEncoder)    
        
async def getMessages(cur):
    async for msg in client.iter_messages(int(channel_username), limit=4, reverse=False):
        msg_json = json.dumps(msg.to_dict(), ensure_ascii=False, cls=DateTimeEncoder)
        # if msg.photo:
            # print('File Name :' + str(dir(msg.file)))
            # print('File Name :' + msg.file.ext, msg.file.repr())
        # print(msg_json)
        # saved_path = await event.download_media(optional_path)
        saved_path  = await client.download_media(msg.media,"media")
        # cursor.execute('SELECT * FROM airport LIMIT 10')
        cur.execute("INSERT INTO messages(data, imagepath) VALUES (%s, %s)", (msg_json, saved_path))
        print(saved_path)
        
         
async def main():
    # await dump_all_messages(channel_username, 2)
    conn = psycopg2.connect(dbname=os.getenv("DB_NAME"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), host='localhost')
    cursor = conn.cursor()
    await getMessages(cursor)
    conn.commit()
    cursor.close()
    conn.close()
    

with client:
    client.loop.run_until_complete(main())    
         