import os
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

input_path = r"C:\Users\USER\.gemini\antigravity\brain\af92461e-9e17-4758-b2f9-c3f825d9629f\.user_uploaded\media_1794738829872_e188da52.jpg"
output_dir = r"public\images\cameras"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "vintage-canon-rangefinder.png")

img = Image.open(input_path).convert("RGBA")
w, h = img.size
print(f"Loaded image size: {w}x{h}")

# Convert to numpy array
arr = np.array(img)
rgb = arr[:, :, :3]
r = rgb[:, :, 0].astype(int)
g = rgb[:, :, 1].astype(int)
b = rgb[:, :, 2].astype(int)

# Black threshold for background
# The background is virtually pure black (r < 10, g < 10, b < 10)
brightness = np.maximum(np.maximum(r, g), b)

# Flood fill mask from the edges
mask_bg = np.zeros((h, w), dtype=bool)
visited = np.zeros((h, w), dtype=bool)
queue = deque()

# Add all perimeter pixels that are dark
for x in range(w):
    if brightness[0, x] < 20 and not visited[0, x]:
        visited[0, x] = True
        queue.append((0, x))
    if brightness[h-1, x] < 20 and not visited[h-1, x]:
        visited[h-1, x] = True
        queue.append((h-1, x))

for y in range(h):
    if brightness[y, 0] < 20 and not visited[y, 0]:
        visited[y, 0] = True
        queue.append((y, 0))
    if brightness[y, w-1] < 20 and not visited[y, w-1]:
        visited[y, w-1] = True
        queue.append((y, w-1))

# Also check inside the strap lugs if dark
# Strap lugs are roughly at:
# Left: x in [60, 110], y in [270, 440]
# Right: x in [w-110, w-60], y in [270, 440]
# Flood fill from edge
while queue:
    cy, cx = queue.popleft()
    mask_bg[cy, cx] = True
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        ny, nx = cy + dy, cx + dx
        if 0 <= ny < h and 0 <= nx < w:
            if not visited[ny, nx] and brightness[ny, nx] < 25:
                visited[ny, nx] = True
                queue.append((ny, nx))

# Also find enclosed black holes inside the strap ring triangles
# Left strap triangle center: ~ x=90, y=365
# Right strap triangle center: ~ x=w-90, y=365
for seed_x, seed_y in [(88, 360), (w - 88, 360)]:
    if 0 <= seed_y < h and 0 <= seed_x < w and not visited[seed_y, seed_x] and brightness[seed_y, seed_x] < 20:
        visited[seed_y, seed_x] = True
        lug_queue = deque([(seed_y, seed_x)])
        while lug_queue:
            cy, cx = lug_queue.popleft()
            mask_bg[cy, cx] = True
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w:
                    if not visited[ny, nx] and brightness[ny, nx] < 25:
                        visited[ny, nx] = True
                        lug_queue.append((ny, nx))

# Alpha mask
alpha = np.ones((h, w), dtype=np.uint8) * 255
alpha[mask_bg] = 0

# Soften the boundary slightly with feathering for silky edges
mask_img = Image.fromarray(alpha, mode="L")
# Feather edges 1px
mask_feather = mask_img.filter(ImageFilter.GaussianBlur(radius=0.7))

# Set alpha channel
img.putalpha(mask_feather)

# Crop transparent borders slightly but keep padding
bbox = img.getbbox()
if bbox:
    # Add 20px padding around bbox
    pad = 30
    x0 = max(0, bbox[0] - pad)
    y0 = max(0, bbox[1] - pad)
    x1 = min(w, bbox[2] + pad)
    y1 = min(h, bbox[3] + pad)
    img_cropped = img.crop((x0, y0, x1, y1))
else:
    img_cropped = img

img_cropped.save(output_path, "PNG")
print(f"Successfully saved cutout camera to {output_path} ({img_cropped.size[0]}x{img_cropped.size[1]})")
