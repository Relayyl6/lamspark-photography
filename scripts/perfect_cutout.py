import cv2
import numpy as np
import os

source_path = r'C:/Users/USER/.gemini/antigravity/brain/af92461e-9e17-4758-b2f9-c3f825d9629f/.user_uploaded/media_1794738829872_e188da52.jpg'
dest_path = r'public/images/cameras/vintage-canon-rangefinder.png'

os.makedirs(os.path.dirname(dest_path), exist_ok=True)
img = cv2.imread(source_path)
h, w = img.shape[:2]

mask = np.zeros((h + 2, w + 2), np.uint8)
flags = 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8) | cv2.FLOODFILL_FIXED_RANGE
lo_hi = (6, 6, 6)

# Flood fill outer background from all 4 corners
cv2.floodFill(img, mask, (0, 0), 0, lo_hi, lo_hi, flags)
cv2.floodFill(img, mask, (w - 1, 0), 0, lo_hi, lo_hi, flags)
cv2.floodFill(img, mask, (0, h - 1), 0, lo_hi, lo_hi, flags)
cv2.floodFill(img, mask, (w - 1, h - 1), 0, lo_hi, lo_hi, flags)

# Flood fill hollow negative space inside strap lugs
cv2.floodFill(img, mask, (85, 260), 0, lo_hi, lo_hi, flags)
cv2.floodFill(img, mask, (940, 260), 0, lo_hi, lo_hi, flags)

bg = (mask[1:h+1, 1:w+1] == 255)
alpha = np.where(bg, 0, 255).astype(np.uint8)
alpha_smooth = cv2.GaussianBlur(alpha, (3, 3), 0.7)

b, g, r = cv2.split(img)
rgba = cv2.merge([b, g, r, alpha_smooth])

# Crop transparent margins with 25px breathing room
non_empty = np.where(alpha > 0)
y_min, y_max = np.min(non_empty[0]), np.max(non_empty[0])
x_min, x_max = np.min(non_empty[1]), np.max(non_empty[1])

pad = 20
y0 = max(0, y_min - pad)
y1 = min(h, y_max + pad)
x0 = max(0, x_min - pad)
x1 = min(w, x_max + pad)

cropped = rgba[y0:y1, x0:x1]
cv2.imwrite(dest_path, cropped)
print(f"Extracted transparent camera saved to {dest_path} ({cropped.shape[1]}x{cropped.shape[0]})")
