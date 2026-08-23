// 生成 PWA 图标：手写 PNG 编码器（纯 Node 内置 zlib）
// 图标 = 蓝色渐变圆角方块 + 白色医疗十字
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

/* ---------- PNG 编码工具 ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- 绘制 ---------- */
const TOP = [0x25, 0x63, 0xEB];   // #2563EB
const BOT = [0x1D, 0x4E, 0xD8];   // #1D4ED8
const WHITE = [255, 255, 255];

function inRoundRect(x, y, size) {
  const r = size * 0.2;
  const min = r, max = size - r;
  if (x >= min && x <= max && y >= min && y <= max) return true;
  let cx = x < min ? min : (x > max ? max : x);
  let cy = y < min ? min : (y > max ? max : y);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function draw(size, maskable) {
  const buf = Buffer.alloc(size * size * 4);
  // maskable 安全区：图形放在中心 80% 区域
  const zone = maskable ? size * 0.8 : size;
  const z0 = (size - zone) / 2;
  const cx = size / 2, cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let px = x + 0.5, py = y + 0.5;
      if (!inRoundRect(px, py, size)) {
        buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 0;
        continue;
      }
      // 背景渐变
      let r = (TOP[0] + (BOT[0] - TOP[0]) * (y / size)) | 0;
      let g = (TOP[1] + (BOT[1] - TOP[1]) * (y / size)) | 0;
      let b = (TOP[2] + (BOT[2] - TOP[2]) * (y / size)) | 0;

      // 仅在安全区内绘制白色图形
      if (px >= z0 && px < size - z0 && py >= z0 && py < size - z0) {
        const ux = Math.abs(px - cx), uy = Math.abs(py - cy);
        const bar = zone * 0.12;      // 十字臂宽度
        const arm = zone * 0.30;      // 十字臂长度
        const crossV = ux < bar / 2 && uy < arm;
        const crossH = uy < bar / 2 && ux < arm;
        if (crossV || crossH) { r = 255; g = 255; b = 255; }
      }
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  }
  return buf;
}

fs.writeFileSync(path.join(OUT, 'icon-192.png'), encodePNG(192, 192, draw(192, false)));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), encodePNG(512, 512, draw(512, false)));
fs.writeFileSync(path.join(OUT, 'icon-512-maskable.png'), encodePNG(512, 512, draw(512, true)));
console.log('Icons generated:', fs.readdirSync(OUT));