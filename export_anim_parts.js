const fs = require('fs');
const path = require('path');

const partsDir = path.join('public', 'models', 'falcon-camera', 'parts');
const outDir = path.join('public', 'models', 'falcon-camera', 'anim');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const lensDx = -400.38;
const lensDz = -1.40;
const dy_outer = 69.90;
const dy_mid = 96.89;
const dy_inner = 125.62;
const dy_cap = 145.68;

const fbDx = -398.88;
const fbDy = -14.53;
const fbDz = 0;

const originX = -1524.38;
const originY = -325.10;
const originZ = 25.50;

const partsConfig = [
  { file: 'body_prototype.stl', out: 'part_body.stl', dx: 0, dy: 0, dz: 0 },
  { file: 'film_back_front.stl', out: 'part_film_back_front.stl', dx: fbDx, dy: fbDy, dz: fbDz },
  { file: 'film_back_body.stl', out: 'part_film_back_body.stl', dx: fbDx, dy: fbDy, dz: fbDz },
  { file: 'film_back_slide.stl', out: 'part_film_back_slide.stl', dx: fbDx, dy: fbDy, dz: fbDz },
  { file: 'lens_outer.stl', out: 'part_lens_outer.stl', dx: lensDx, dy: dy_outer, dz: lensDz },
  { file: 'lens_mid.stl', out: 'part_lens_mid.stl', dx: lensDx, dy: dy_mid, dz: lensDz },
  { file: 'lens_inner.stl', out: 'part_lens_inner.stl', dx: lensDx, dy: dy_inner, dz: lensDz },
  { file: 'lens_front_cap.stl', out: 'part_lens_cap.stl', dx: lensDx, dy: dy_cap, dz: lensDz },
];

function exportPart(p) {
  const buf = fs.readFileSync(path.join(partsDir, p.file));
  const count = buf.readUInt32LE(80);

  const outBuf = Buffer.alloc(84 + count * 50);
  outBuf.write('Falcon P-35 Prealigned ' + p.out, 0, 80, 'ascii');
  outBuf.writeUInt32LE(count, 80);

  let writeOffset = 84;
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];

  for (let i = 0; i < count; i++) {
    const srcOff = 84 + i * 50;
    const nx = buf.readFloatLE(srcOff);
    const ny = buf.readFloatLE(srcOff + 4);
    const nz = buf.readFloatLE(srcOff + 8);

    outBuf.writeFloatLE(nx, writeOffset);
    outBuf.writeFloatLE(nz, writeOffset + 4);
    outBuf.writeFloatLE(-ny, writeOffset + 8);

    for (let v = 0; v < 3; v++) {
      const vOff = srcOff + 12 + v * 12;
      const rawX = buf.readFloatLE(vOff) + p.dx;
      const rawY = buf.readFloatLE(vOff + 4) + p.dy;
      const rawZ = buf.readFloatLE(vOff + 8) + p.dz;

      const threeX = rawX - originX;
      const threeY = rawZ - originZ;
      const threeZ = -(rawY - originY);

      min[0] = Math.min(min[0], threeX); max[0] = Math.max(max[0], threeX);
      min[1] = Math.min(min[1], threeY); max[1] = Math.max(max[1], threeY);
      min[2] = Math.min(min[2], threeZ); max[2] = Math.max(max[2], threeZ);

      const dstVOff = writeOffset + 12 + v * 12;
      outBuf.writeFloatLE(threeX, dstVOff);
      outBuf.writeFloatLE(threeY, dstVOff + 4);
      outBuf.writeFloatLE(threeZ, dstVOff + 8);
    }
    outBuf.writeUInt16LE(0, writeOffset + 48);
    writeOffset += 50;
  }

  const outPath = path.join(outDir, p.out);
  fs.writeFileSync(outPath, outBuf);
  console.log(`Saved ${p.out}: ${count} triangles, ${(outBuf.length / 1024).toFixed(1)} KB`);
  console.log(`  Z range: [${min[2].toFixed(2)}, ${max[2].toFixed(2)}]`);
}

console.log('=== EXPORTING PREALIGNED ANIMATION PARTS ===');
partsConfig.forEach(exportPart);
