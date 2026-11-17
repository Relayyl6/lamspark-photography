const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Ensure public directory exists
const publicDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate a 400x400 transparent PNG with an arched editorial gold badge & lens cutout
const width = 400;
const height = 400;
const rawData = Buffer.alloc(height * (1 + width * 4));

const cx = width / 2;
const cy = height / 2;
const radius = 170;

for (let y = 0; y < height; y++) {
  // Row filter type 0
  const rowStart = y * (1 + width * 4);
  rawData[rowStart] = 0;

  for (let x = 0; x < width; x++) {
    const pxOffset = rowStart + 1 + x * 4;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Circular badge with gold ring and warm dark interior
    if (dist <= radius) {
      // Outer ring
      if (dist >= radius - 8) {
        // Gold (#C29958)
        rawData[pxOffset] = 194; // R
        rawData[pxOffset + 1] = 153; // G
        rawData[pxOffset + 2] = 88; // B
        rawData[pxOffset + 3] = 255; // Alpha
      } else if (dist >= radius - 16 && dist <= radius - 14) {
        // Thin inner gold ring
        rawData[pxOffset] = 194;
        rawData[pxOffset + 1] = 153;
        rawData[pxOffset + 2] = 88;
        rawData[pxOffset + 3] = 200;
      } else {
        // Deep background (#1A1715 with opacity)
        const innerGrad = Math.min(1, dist / (radius - 16));
        rawData[pxOffset] = Math.round(26 + innerGrad * 10);
        rawData[pxOffset + 1] = Math.round(23 + innerGrad * 10);
        rawData[pxOffset + 2] = Math.round(21 + innerGrad * 10);
        rawData[pxOffset + 3] = 245;

        // Aperture blade accents in center
        if (dist > 30 && dist < 70) {
          const angle = Math.atan2(dy, dx);
          const blade = Math.sin(angle * 6);
          if (blade > 0.7) {
            rawData[pxOffset] = 194;
            rawData[pxOffset + 1] = 153;
            rawData[pxOffset + 2] = 88;
            rawData[pxOffset + 3] = 220;
          }
        } else if (dist <= 30) {
          // Center lens
          rawData[pxOffset] = 245;
          rawData[pxOffset + 1] = 242;
          rawData[pxOffset + 2] = 236;
          rawData[pxOffset + 3] = 250;
        }
      }
    } else {
      // Transparent outside circle
      rawData[pxOffset] = 0;
      rawData[pxOffset + 1] = 0;
      rawData[pxOffset + 2] = 0;
      rawData[pxOffset + 3] = 0;
    }
  }
}

// Compress data for IDAT
const compressed = zlib.deflateSync(rawData);

// CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Build PNG
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; // 8 bits per channel
ihdr[9] = 6; // RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace
const ihdrChunk = createChunk("IHDR", ihdr);

// IDAT
const idatChunk = createChunk("IDAT", compressed);

// IEND
const iendChunk = createChunk("IEND", Buffer.alloc(0));

const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);

const targetPath = path.join(publicDir, "hero-cutout.png");
fs.writeFileSync(targetPath, png);
console.log(`Generated PNG at ${targetPath} (${png.length} bytes)`);
