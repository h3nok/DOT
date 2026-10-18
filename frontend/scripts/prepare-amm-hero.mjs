/** Derive a silent transparent HD hero from the author's green-screen clip.
 * Run with FFMPEG=/path/to/ffmpeg node scripts/prepare-amm-hero.mjs.
 * Trim the black leader, retain native 1280 × 720 / 24 fps, and preserve the
 * green landscape enclosed by the phone. Only edge-connected screen green is
 * removed there. Spill correction affects the matte edge, not the landscape.
 * This composition-specific conversion leaves the source unchanged. The source
 * lives outside public/ (docs/blueprint/amm) so it is never deployed; CRF 34
 * keeps the published clip near 2.8 MB with no visible loss at hero size.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/amm/media/', import.meta.url));
const source = fileURLToPath(new URL('../../docs/blueprint/amm/amm-hero-source.mp4', import.meta.url));
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const width = 1280, height = 720, pixels = width * height, frameBytes = pixels * 4;
const decoder = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'warning', '-ss', '0.375', '-i', source,
  '-vf', 'chromakey=0x13b629:0.18:0.05', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-an', 'pipe:1'], { stdio: ['ignore', 'pipe', 'inherit'] });
const encoder = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'warning', '-y', '-f', 'rawvideo',
  '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', '24', '-i', 'pipe:0', '-an',
  '-filter_complex', '[0:v]split[color][mask];[mask]alphaextract,erosion,gblur=sigma=0.35[alpha];[color][alpha]alphamerge',
  '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '34',
  '-deadline', 'good', '-cpu-used', '3', '-row-mt', '1', '-threads', '2',
  `${root}host-hero-v1.webm`], { stdio: ['pipe', 'ignore', 'inherit'] });
const decoded = once(decoder, 'close');
const encoded = once(encoder, 'close');
const frame = Buffer.alloc(frameBytes);
const queue = new Uint32Array(pixels);
const background = new Uint8Array(pixels);

function refineMatte(rgba) {
  background.fill(0);
  // The key must not remove the blue sky or the Leech's blue illumination.
  for (let i = 0; i < pixels; i++) {
    const p = i * 4;
    if (rgba[p + 2] > rgba[p + 1] + 5) rgba[p + 3] = 255;
  }
  let read = 0, size = 0;
  const visit = i => {
    if (background[i] || rgba[i * 4 + 3] >= 254) return;
    background[i] = 1; queue[size++] = i;
  };
  for (let x = 0; x < width; x++) { visit(x); visit(pixels - width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (read < size) {
    const i = queue[read++], x = i % width;
    if (x > 0) visit(i - 1);
    if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i < pixels - width) visit(i + width);
  }
  for (let i = 0; i < pixels; i++) {
    const p = i * 4;
    // The phone occupies the left 40% throughout this authored clip. Its
    // unbroken gold rim separates the green landscape from the screen green.
    if (i % width < width * 0.4 && !background[i]) rgba[p + 3] = 255;
    if (rgba[p + 3] < 254 || (i % width > 0 && rgba[p - 1] < 8)
      || (i % width < width - 1 && rgba[p + 7] < 8)
      || (i >= width && rgba[p - width * 4 + 3] < 8)
      || (i < pixels - width && rgba[p + width * 4 + 3] < 8)) {
      // Neutralize green fringe only in partly keyed pixels.
      rgba[p + 1] = Math.min(rgba[p + 1], Math.max(rgba[p], rgba[p + 2]));
    }
  }
  return Buffer.from(rgba);
}

try {
  let filled = 0;
  for await (const chunk of decoder.stdout) {
    let offset = 0;
    while (offset < chunk.length) {
      const size = Math.min(frameBytes - filled, chunk.length - offset);
      chunk.copy(frame, filled, offset, offset + size);
      offset += size; filled += size;
      if (filled === frameBytes) {
        if (!encoder.stdin.write(refineMatte(frame))) await once(encoder.stdin, 'drain');
        filled = 0;
      }
    }
  }
  if (filled) throw new Error('Incomplete source frame');
  encoder.stdin.end();
  const [[decodeStatus], [encodeStatus]] = await Promise.all([decoded, encoded]);
  if (decodeStatus !== 0 || encodeStatus !== 0) throw new Error('Hero video conversion failed');
} finally {
  decoder.kill(); encoder.kill();
}
