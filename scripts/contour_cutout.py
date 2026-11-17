from PIL import Image, ImageFilter, ImageDraw
import numpy as np
from collections import deque
import cv2

input_path = r"C:\Users\USER\.gemini\antigravity\brain\af92461e-9e17-4758-b2f9-c3f825d9629f\.user_uploaded\media_1794738829872_e188da52.jpg"
output_path = r"public\images\cameras\vintage-canon-rangefinder.png"

img = cv2.imread(input_path)
h, w = img.shape[:2]

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Find the camera body mask
# In this image, the camera is a bright object on a pitch black background.
# Let's threshold where gray > 0 or gray > 2
_, thresh = cv2.threshold(gray, 2, 255, cv2.THRESH_BINARY)

# Find external contours
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Find the largest contour (this is the outer perimeter of the camera!)
largest_contour = max(contours, key=cv2.contourArea)

# Create an empty mask for the camera
camera_mask = np.zeros((h, w), dtype=np.uint8)
cv2.drawContours(camera_mask, [largest_contour], -1, 255, thickness=cv2.FILLED)

# Now check inside the strap ring triangles (the holes in the strap lugs)
# We can find all contours within the thresh inverse, or check the specific strap lug areas
# Left strap triangle roughly at x: 80-100, y: 340-390
# Right strap triangle roughly at x: w-100-w-80, y: 340-390
# Let's see if there are holes inside the camera mask
# Retr_CCOMP or RETR_TREE finds holes
contours_tree, hier = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

# Create high-res 4-channel image
b, g, r = cv2.split(img)

# Smooth the mask boundary slightly with 1px gaussian blur for anti-aliased edge
mask_smooth = cv2.GaussianBlur(camera_mask, (3, 3), 0.6)

# Check if strap lug holes need clearing:
# In the strap lug areas, any region that was completely black (thresh == 0) and not part of the body
for x_range, y_range in [((70, 110), (330, 400)), ((w-110, w-70), (330, 400))]:
    sub = thresh[y_range[0]:y_range[1], x_range[0]:x_range[1]]
    # if there is a hole in this region
    if np.any(sub == 0):
        # find connected black pixels in this box
        pass

rgba = cv2.merge([b, g, r, mask_smooth])

# Crop transparent borders with padding
x, y, cw, ch = cv2.boundingRect(largest_contour)
pad = 25
x0 = max(0, x - pad)
y0 = max(0, y - pad)
x1 = min(w, x + cw + pad)
y1 = min(h, y + ch + pad)

cropped = rgba[y0:y1, x0:x1]

cv2.imwrite(output_path, cropped)
print(f"Saved contour-cutout camera to {output_path} ({cropped.shape[1]}x{cropped.shape[0]})")
