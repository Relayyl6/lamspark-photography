from PIL import Image

ref_path = r"C:\Users\USER\.gemini\antigravity\brain\af92461e-9e17-4758-b2f9-c3f825d9629f\.user_uploaded\media_1794746209338_2bbc84f3.jpg"
im = Image.open(ref_path)
print("Reference size:", im.size)
# The image is 1080 x 768 or similar.
# Let's see the dimensions and where the center photographer is located.
w, h = im.size
# Center photographer is roughly in the middle horizontally (x from 0.35*w to 0.65*w)
# and vertically from ~0.45*h to 0.95*h.
box = (int(0.32 * w), int(0.48 * h), int(0.62 * w), int(0.96 * h))
crop = im.crop(box)
crop.save("public/images/photographer_ref_crop.png")
print("Cropped photographer reference box:", box, "size:", crop.size)
