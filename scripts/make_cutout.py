from PIL import Image
import numpy as np

def make_transparent(input_path, output_path, tolerance=240):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # Red, Green, Blue, Alpha
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    
    # Identify background (pixels where R, G, B are all >= tolerance)
    white_mask = (r >= tolerance) & (g >= tolerance) & (b >= tolerance)
    
    # Smooth edge alpha falloff between tolerance and 255
    fade_mask = (r >= tolerance - 20) & (g >= tolerance - 20) & (b >= tolerance - 20)
    
    # Set pure white to 0 alpha
    data[white_mask, 3] = 0
    
    # Soft edges for near white
    near_white = fade_mask & (~white_mask)
    for y, x in zip(*np.where(near_white)):
        avg_bright = (int(r[y, x]) + int(g[y, x]) + int(b[y, x])) / 3.0
        # Scale alpha down
        alpha_factor = 1.0 - (avg_bright - (tolerance - 20)) / 20.0
        data[y, x, 3] = int(data[y, x, 3] * max(0.0, min(1.0, alpha_factor)))
    
    out_img = Image.fromarray(data)
    out_img.save(output_path, "PNG")
    print(f"Saved transparent cutout to {output_path} (size: {out_img.size})")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        make_transparent(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python make_cutout.py <input> <output>")
