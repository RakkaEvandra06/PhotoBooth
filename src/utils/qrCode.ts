// src/utils/qrCode.ts
// Minimal QR code encoder — Version 1–10, ECC Level M, byte mode only.
// Generates a boolean matrix (true = dark module) that can be rendered as SVG/Canvas.

// ─── Reed–Solomon GF(256) ───────────────────────────────────────────────────

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

function gfMul(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const alpha = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], alpha);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const msg = new Uint8Array(data.length + ecCount);
  msg.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef === 0) continue;
    for (let j = 1; j < gen.length; j++) {
      msg[i + j] ^= gfMul(gen[j], coef);
    }
  }
  return msg.slice(data.length);
}

// ─── QR version / capacity tables (ECC Level M) ────────────────────────────

const VERSION_INFO: Array<{ cap: number; ecBlocks: Array<{ count: number; dataWords: number; ecWords: number }> }> = [
  { cap: 16,  ecBlocks: [{ count: 1, dataWords: 13, ecWords: 13 }] },
  { cap: 28,  ecBlocks: [{ count: 1, dataWords: 22, ecWords: 22 }] },
  { cap: 44,  ecBlocks: [{ count: 1, dataWords: 34, ecWords: 34 }] },
  { cap: 64,  ecBlocks: [{ count: 2, dataWords: 24, ecWords: 24 }] },
  { cap: 86,  ecBlocks: [{ count: 2, dataWords: 33, ecWords: 33 }] },
  { cap: 108, ecBlocks: [{ count: 4, dataWords: 24, ecWords: 24 }] },
  { cap: 124, ecBlocks: [{ count: 4, dataWords: 24, ecWords: 24 }] },
  { cap: 154, ecBlocks: [{ count: 4, dataWords: 24, ecWords: 24 }] },
  { cap: 182, ecBlocks: [{ count: 5, dataWords: 24, ecWords: 24 }] },
  { cap: 216, ecBlocks: [{ count: 6, dataWords: 24, ecWords: 24 }] },
];

// ─── Bit stream helper ───────────────────────────────────────────────────────

class BitStream {
  private bits: number[] = [];

  append(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) this.bits.push((val >> i) & 1);
  }

  pad(totalBits: number) {
    while (this.bits.length % 8 !== 0) this.bits.push(0);
    let pad = 0;
    while (this.bits.length < totalBits) {
      this.append(pad === 0 ? 0xec : 0x11, 8);
      pad ^= 1;
    }
  }

  toBytes(): Uint8Array {
    const out = new Uint8Array(this.bits.length / 8);
    for (let i = 0; i < out.length; i++) {
      for (let b = 0; b < 8; b++) out[i] = (out[i] << 1) | this.bits[i * 8 + b];
    }
    return out;
  }
}

// ─── Matrix builder ──────────────────────────────────────────────────────────

function makeMatrix(size: number) {
  return Array.from({ length: size }, () => new Int8Array(size).fill(-1));
}

function placeFinder(mat: Int8Array[], r: number, c: number) {
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= mat.length || nc < 0 || nc >= mat.length) continue;
      const inPat = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
      const border = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      const inner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      mat[nr][nc] = inPat ? (border || inner ? 1 : 0) : 0;
    }
  }
}

function placeTiming(mat: Int8Array[]) {
  const size = mat.length;
  for (let i = 8; i < size - 8; i++) {
    const v = i % 2 === 0 ? 1 : 0;
    if (mat[6][i] === -1) mat[6][i] = v;
    if (mat[i][6] === -1) mat[i][6] = v;
  }
}

function placeAlignment(mat: Int8Array[], version: number) {
  if (version < 2) return;
  const pos = [6, 18 + (version - 2) * 4];
  for (const r of pos) {
    for (const c of pos) {
      if (mat[r][c] !== -1) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const v = (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) ? 1 : 0;
          mat[r + dr][c + dc] = v;
        }
      }
    }
  }
}

function placeFormatInfo(mat: Int8Array[], mask: number) {
  // ECC Level M = 0b00, mask pattern
  const data = (0b00 << 3) | mask;
  // Format string (15 bits) with BCH error correction
  let format = data << 10;
  const gen = 0x537;
  for (let i = 14; i >= 10; i--) {
    if ((format >> i) & 1) format ^= gen << (i - 10);
  }
  format = ((data << 10) | format) ^ 0x5412;

  const positions = [0,1,2,3,4,5,7,8,8,8,8,8,8,7,5,4,3,2,1,0];
  const side = mat.length - 1;
  for (let i = 0; i < 15; i++) {
    const bit = (format >> (14 - i)) & 1;
    // Horizontal
    const hr = i < 6 ? i : i < 8 ? i + 1 : side - (14 - i);
    mat[hr][8] = bit;
    // Vertical
    const vc = i < 8 ? side - i : i < 9 ? 7 : 14 - i;
    mat[8][vc] = bit;
  }
  mat[side - 7][8] = 1; // dark module
}

type Matrix = Int8Array[];

function placeData(mat: Matrix, data: Uint8Array) {
  const size = mat.length;
  let bitIdx = 0;
  let goingUp = true;
  let col = size - 1;

  while (col > 0) {
    if (col === 6) col--;
    for (let row = goingUp ? size - 1 : 0; goingUp ? row >= 0 : row < size; goingUp ? row-- : row++) {
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (mat[row][c] !== -1) continue;
        const byteIdx = bitIdx >> 3;
        const bit = byteIdx < data.length ? (data[byteIdx] >> (7 - (bitIdx & 7))) & 1 : 0;
        mat[row][c] = bit;
        bitIdx++;
      }
    }
    col -= 2;
    goingUp = !goingUp;
  }
}

function applyMask(mat: Matrix, mask: number): Matrix {
  const size = mat.length;
  const maskFn = [
    (r: number, c: number) => (r + c) % 2 === 0,
    (r: number) => r % 2 === 0,
    (_r: number, c: number) => c % 3 === 0,
    (r: number, c: number) => (r + c) % 3 === 0,
    (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r: number, c: number) => ((r * c) % 2 + (r * c) % 3) === 0,
    (r: number, c: number) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
    (r: number, c: number) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
  ][mask];

  const copy: Matrix = mat.map(row => new Int8Array(row));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (copy[r][c] >= 0 && mat[r][c] !== -1) {
        // only flip data modules (original mat had -1 = reserved)
      }
      // We flip data modules only
    }
  }

  // Rebuild: if module was a "placed data" module, XOR with mask
  return copy.map((row, r) =>
    row.map((v, c) => {
      if (v === -1) return 0; // reserved (shouldn't happen after place)
      return v ^ (maskFn(r, c) ? 1 : 0);
    }) as unknown as Int8Array
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generateQR(text: string): boolean[][] | null {
  const bytes = new TextEncoder().encode(text);
  const len = bytes.length;

  const versionIdx = VERSION_INFO.findIndex(v => v.cap >= len);
  if (versionIdx === -1) return null; // too long

  const version = versionIdx + 1;
  const { ecBlocks } = VERSION_INFO[versionIdx];
  const size = version * 4 + 17;

  // Build data codewords
  const stream = new BitStream();
  stream.append(0b0100, 4); // byte mode
  stream.append(len, 8);
  for (const b of bytes) stream.append(b, 8);
  const totalDataWords = ecBlocks.reduce((s, b) => s + b.count * b.dataWords, 0);
  stream.pad(totalDataWords * 8);
  const dataBytes = stream.toBytes();

  // Interleave blocks + EC
  const blocks: Uint8Array[] = [];
  const ecList: Uint8Array[] = [];
  let offset = 0;
  for (const { count, dataWords, ecWords } of ecBlocks) {
    for (let i = 0; i < count; i++) {
      const block = dataBytes.slice(offset, offset + dataWords);
      blocks.push(block);
      ecList.push(rsEncode(block, ecWords));
      offset += dataWords;
    }
  }

  const maxData = Math.max(...blocks.map(b => b.length));
  const maxEC = Math.max(...ecList.map(b => b.length));
  const interleaved: number[] = [];
  for (let i = 0; i < maxData; i++) for (const b of blocks) if (i < b.length) interleaved.push(b[i]);
  for (let i = 0; i < maxEC; i++) for (const e of ecList) if (i < e.length) interleaved.push(e[i]);

  const finalData = new Uint8Array(interleaved);

  // Build matrix
  const mat = makeMatrix(size);
  placeFinder(mat, 0, 0);
  placeFinder(mat, 0, size - 7);
  placeFinder(mat, size - 7, 0);
  placeTiming(mat);
  placeAlignment(mat, version);
  mat[size - 8][8] = 1; // dark module

  // Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    if (mat[i][8] === -1) mat[i][8] = 0;
    if (mat[8][i] === -1) mat[8][i] = 0;
    if (mat[size - 1 - i] && mat[size - 1 - i][8] === -1) mat[size - 1 - i][8] = 0;
    if (mat[8][size - 1 - i] === -1) mat[8][size - 1 - i] = 0;
  }

  // Copy before data placement to track reserved modules
  const reserved: boolean[][] = mat.map(row => Array.from(row).map(v => v !== -1));

  placeData(mat, finalData);

  // Apply mask 2 (column % 3 == 0) — simple, decent
  const masked = mat.map((row, r) =>
    Array.from(row).map((v, c) => {
      if (reserved[r][c]) return v === 1;
      return (v ^ (c % 3 === 0 ? 1 : 0)) === 1;
    })
  );

  placeFormatInfo(mat, 2);

  // Re-apply format info to masked output
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (reserved[i][j]) masked[i][j] = mat[i][j] === 1;
    }
  }

  return masked;
}

export function qrToSvg(matrix: boolean[][], size = 200, fg = '#000', bg = '#fff'): string {
  const n = matrix.length;
  const cell = size / n;
  const modules: string[] = [];

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        modules.push(`<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="${fg}"/>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<rect width="${size}" height="${size}" fill="${bg}"/>
${modules.join('\n')}
</svg>`;
}
