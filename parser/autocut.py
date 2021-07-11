from PIL import Image

im = Image.open("magick/img.jpg")
# "xywh=pixel:245,797,322,223"
# magick -extract 322x223+245+797 img.jpg mini.jpg
# left, top, right, bottom
ann = "xywh=pixel:245,797,322,223"
print(ann)
arr = ann[11:].split(',')
res = [int(i) for i in arr]
print(res)
region = im.crop((res[0], res[1], res[0]+res[2], res[1]+res[3]))
# # region.show()
region.save("crop.jpg")
