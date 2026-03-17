// src/utils/gifEncoder.ts
// Lightweight GIF89a encoder — no external dependencies.
// Supports animated GIFs from raw canvas ImageData frames.

// ─── LZW compression ────────────────────────────────────────────────────────

function lzwEncode(pixels: Uint8Array, colorDepth: number): Uint8Array {
  const minCodeSize = Math.max(2, colorDepth);
  const clearCode = 1 << minCodeSize;
  const eofCode = clearCode + 1;

  const out: number[] = [];
  let bitBuf = 0;
  let bitLen = 0;

  function writeBits(code: number, len: number) {
    bitBuf |= code << bitLen;
    bitLen += len;
    while (bitLen >= 8) {
      out.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitLen -= 8;
    }
  }

  function flush() {
    if (bitLen > 0) {
      out.push(bitBuf & 0xff);
      bitBuf = 0;
      bitLen = 0;
    }
  }

  let codeSize = minCodeSize + 1;
  let nextCode = eofCode + 1;
  const table = new Map<string, number>();

  function resetTable() {
    table.clear();
    for (let i = 0; i < clearCode; i++) table.set(String.fromCharCode(i), i);
    codeSize = minCodeSize + 1;
    nextCode = eofCode + 1;
  }

  resetTable();
  writeBits(clearCode, codeSize);

  let str = String.fromCharCode(pixels[0]);

  for (let i = 1; i < pixels.length; i++) {
    const c = String.fromCharCode(pixels[i]);
    const candidate = str + c;
    if (table.has(candidate)) {
      str = candidate;
    } else {
      writeBits(table.get(str)!, codeSize);
      table.set(candidate, nextCode++);
      if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
      if (nextCode >= 4096) {
        writeBits(clearCode, codeSize);
        resetTable();
      }
      str = c;
    }
  }

  writeBits(table.get(str)!, codeSize);
  writeBits(eofCode, codeSize);
  flush();

  // Pack into sub-blocks of max 255 bytes
  const packed: number[] = [minCodeSize];
  for (let i = 0; i < out.length; i += 255) {
    const chunk = out.slice(i, i + 255);
    packed.push(chunk.length, ...chunk);
  }
  packed.push(0); // block terminator

  return new Uint8Array(packed);
}

// ─── Palette quantisation (median-cut, 256 colours max) ─────────────────────

function buildPalette(frames: ImageData[], maxColors = 256): Uint8Array {
  // Sample pixels uniformly across all frames
  const samples: [number, number, number][] = [];
  const step = Math.max(1, Math.floor((frames[0].width * frames[0].height) / 2000));

  for (const frame of frames) {
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4 * step) {
      samples.push([d[i], d[i + 1], d[i + 2]]);
    }
  }

  // Median-cut: start with one bucket, split until maxColors
  type Bucket = [number, number, number][];
  let buckets: Bucket[] = [samples];

  while (buckets.length < maxColors) {
    // Find bucket with largest range
    let maxRange = -1;
    let splitIdx = 0;
    let splitChannel = 0;

    for (let b = 0; b < buckets.length; b++) {
      const bucket = buckets[b];
      for (let ch = 0; ch < 3; ch++) {
        const vals = bucket.map(p => p[ch]);
        const range = Math.max(...vals) - Math.min(...vals);
        if (range > maxRange) { maxRange = range; splitIdx = b; splitChannel = ch; }
      }
    }

    if (maxRange === 0) break;

    const bucket = buckets[splitIdx];
    bucket.sort((a, b) => a[splitChannel] - b[splitChannel]);
    const mid = bucket.length >> 1;
    buckets.splice(splitIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }

  // Palette: average of each bucket
  const palette = new Uint8Array(maxColors * 3);
  for (let b = 0; b < buckets.length; b++) {
    const bucket = buckets[b];
    const avg = bucket.reduce(
      (acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]],
      [0, 0, 0]
    ).map(v => Math.round(v / bucket.length));
    palette[b * 3] = avg[0];
    palette[b * 3 + 1] = avg[1];
    palette[b * 3 + 2] = avg[2];
  }

  return palette;
}

function quantizeFrame(frame: ImageData, palette: Uint8Array): Uint8Array {
  const count = palette.length / 3;
  const pixels = new Uint8Array(frame.width * frame.height);
  const d = frame.data;

  for (let i = 0; i < pixels.length; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    let best = 0;
    let bestDist = Infinity;
    for (let c = 0; c < count; c++) {
      const dr = r - palette[c * 3];
      const dg = g - palette[c * 3 + 1];
      const db = b - palette[c * 3 + 2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) { bestDist = dist; best = c; }
    }
    pixels[i] = best;
  }

  return pixels;
}

// ─── GIF byte writer ─────────────────────────────────────────────────────────

function writeUint16LE(buf: number[], v: number) {
  buf.push(v & 0xff, (v >> 8) & 0xff);
}

export function encodeGif(
  frames: ImageData[],
  delayMs: number = 100
): Uint8Array {
  if (frames.length === 0) throw new Error('No frames');

  const { width, height } = frames[0];
  const colorDepth = 8; // always 256-color palette
  const palette = buildPalette(frames, 256);

  const out: number[] = [];

  // ── Header ──
  for (const c of 'GIF89a') out.push(c.charCodeAt(0));

  // ── Logical Screen Descriptor ──
  writeUint16LE(out, width);
  writeUint16LE(out, height);
  // Packed: Global Color Table Flag=1, Color Resolution=7, Sort=0, GCT Size=7 (256 colors)
  out.push(0xf7, 0, 0); // packed, bg color index, pixel aspect ratio

  // ── Global Color Table (256 × 3 bytes) ──
  for (let i = 0; i < 256 * 3; i++) out.push(palette[i] ?? 0);

  // ── Netscape Application Extension (looping) ──
  out.push(
    0x21, 0xff, 0x0b,
    ...Array.from('NETSCAPE2.0').map(c => c.charCodeAt(0)),
    0x03, 0x01, 0x00, 0x00, 0x00
  );

  const delayHundredths = Math.round(delayMs / 10);

  for (const frame of frames) {
    const quantized = quantizeFrame(frame, palette);

    // Graphic Control Extension
    out.push(
      0x21, 0xf9, 0x04,
      0x04, // dispose: do not dispose
    );
    writeUint16LE(out, delayHundredths);
    out.push(0x00, 0x00); // transparent color index, terminator

    // Image Descriptor
    out.push(0x2c);
    writeUint16LE(out, 0); // left
    writeUint16LE(out, 0); // top
    writeUint16LE(out, width);
    writeUint16LE(out, height);
    out.push(0x00); // packed: no local color table

    // Image Data
    const compressed = lzwEncode(quantized, colorDepth);
    for (const b of compressed) out.push(b);
  }

  // Trailer
  out.push(0x3b);

  return new Uint8Array(out);
}

export function gifToDataUrl(gif: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < gif.length; i++) binary += String.fromCharCode(gif[i]);
  return 'data:image/gif;base64,' + btoa(binary);
}
