import os
import json
from urllib.parse import urlparse
from dotenv import load_dotenv # python-dotenv
import psycopg2 # psycopg2-binary

load_dotenv(verbose=True)

from PIL import Image

# im = Image.open("magick/img.jpg")
# # "xywh=pixel:245,797,322,223"
# # magick -extract 322x223+245+797 img.jpg mini.jpg
# # left, top, right, bottom
# ann = "xywh=pixel:245,797,322,223"
# print(ann)
# arr = ann[11:].split(',')
# res = [int(i) for i in arr]
# print(res)
# region = im.crop((res[0], res[1], res[0]+res[2], res[1]+res[3]))
# # # region.show()
# region.save("crop.jpg")

db_user = os.getenv("DB_USER")
db_name = os.getenv("DB_NAME")
db_pass = os.getenv("DB_PASSWORD")

conn = psycopg2.connect(dbname=db_name, user=db_user, password=db_pass, host='localhost')
cursor = conn.cursor()

cursor.execute("SELECT tg_id, annotations FROM messages WHERE length(annotations::text) > 2")
res = cursor.fetchall()

def get_regions(id, filename, coords):
    # print(id)
    # print(filename)
    # print(coords)
    path_here = os.path.dirname(os.path.realpath(__file__))
    ext = os.path.splitext(filename)[1]
    path_result = os.path.join(path_here, 'cuts', id+ext)
    path_source = os.path.join(path_here, 'media', filename)
    # print (path_source)
    # print(path_result)
    im = Image.open(path_source)
    # print("\n")
    region = im.crop((coords[0], coords[1], coords[0]+coords[2], coords[1]+coords[3]))
    region.save(path_result)
    return

for item in res:
    
    for unit in item[1]:
        file_id = unit["id"][1:]
        # annotation is unit["body"] !!!
        # for segment in unit["body"]:
            # print(segment)
        file_props = unit["target"]
        # print(file_props)
        file_url = file_props["source"]
        a = urlparse(file_url)
        file_name = os.path.basename(a.path)
        xywh = file_props["selector"]["value"]
        arr = xywh[11:].split(',')
        # print(arr)
        cd = [float(i) for i in arr]
        get_regions(file_id, file_name, cd)
        
    # exit()
    
    