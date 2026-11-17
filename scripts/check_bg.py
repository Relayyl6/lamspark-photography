from PIL import Image
import numpy as np

img = Image.open(r"C:\Users\USER\.gemini\antigravity\brain\af92461e-9e17-4758-b2f9-c3f825d9629f\.user_uploaded\media_1794738829872_e188da52.jpg")
arr = np.array(img)
print("Top-left pixel:", arr[0, 0])
print("Max background at border 0:", np.max(arr[0, :]))
print("Max background at border h-1:", np.max(arr[-1, :]))
print("Max background at left col 0:", np.max(arr[:, 0]))
print("Max background at right col -1:", np.max(arr[:, -1]))

# Check how many pixels outside the camera are exactly (0,0,0)
print("Unique values in 10x10 corner:", np.unique(arr[:10, :10]))
