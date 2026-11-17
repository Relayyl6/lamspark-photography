/**
 * Cloudinary asset optimization and delivery utility.
 * Safe for client and server usage.
 * Reads environment variables strictly from process.env.
 */

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  "drgwnkllv";

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
  crop?: "fill" | "scale" | "fit" | "thumb";
}

/**
 * Returns an ultra-fast, optimized Cloudinary delivery URL with automatic format and compression.
 */
export function getOptimizedImageUrl(
  source: string,
  options: CloudinaryOptions = {}
): string {
  if (!source) return "";

  // If already an optimized local path, return as is
  if (source.startsWith("/images/")) {
    return source;
  }

  // If already a full Cloudinary URL, insert transformations
  if (source.includes("res.cloudinary.com")) {
    const { width = 1200, quality = "auto", format = "auto", crop = "fill" } = options;
    const transformStr = `f_${format},q_${quality},w_${width},c_${crop}`;
    if (!source.includes("/upload/f_") && source.includes("/upload/")) {
      return source.replace("/upload/", `/upload/${transformStr}/`);
    }
    return source;
  }

  // If a Cloudinary public ID is provided
  const { width = 1200, quality = "auto", format = "auto", crop = "fill" } = options;
  const transformStr = `f_${format},q_${quality},w_${width},c_${crop}`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformStr}/${source}`;
}
