import {describe, expect, it} from 'vitest';
import {readQrCode} from '../src/decoder.js';
import fixture from './fixtures/structured-append.json';

class ImageDataLike {
  public readonly colorSpace = 'srgb';
  public constructor(
    public readonly data: Uint8ClampedArray,
    public readonly width: number,
    public readonly height: number
  ) {}
}
(globalThis as {ImageData?: unknown}).ImageData ??= ImageDataLike;

/** A symbol from its module rows, black on white with the quiet zone, as a camera-free image. */
function image(rows: readonly string[], px = 4, quiet = 4): ImageData {
  const size = rows.length;
  const total = (size + quiet * 2) * px;
  const data = new Uint8ClampedArray(total * total * 4).fill(255);
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell !== '1') return;
      for (let dy = 0; dy < px; dy += 1) {
        for (let dx = 0; dx < px; dx += 1) {
          const at = (((y + quiet) * px + dy) * total + (x + quiet) * px + dx) * 4;
          data[at] = 0;
          data[at + 1] = 0;
          data[at + 2] = 0;
        }
      }
    });
  });
  return new ImageDataLike(data, total, total) as unknown as ImageData;
}

describe('reading with zxing-cpp', () => {
  it('reads each Structured Append symbol with its position, count and parity, and the bytes join back', async () => {
    const reads = await Promise.all(fixture.symbols.map((symbol) => readQrCode(image(symbol.rows))));
    const parts: Uint8Array[] = [];
    for (const [position, got] of reads.entries()) {
      expect(got?.structuredAppend).toEqual({
        index: position,
        count: fixture.symbols.length,
        parity: fixture.symbols[0]!.parity
      });
      parts.push(got!.bytes);
    }
    const joined = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
    let offset = 0;
    for (const part of parts) {
      joined.set(part, offset);
      offset += part.length;
    }
    expect(new TextDecoder().decode(joined)).toBe(fixture.message);
  });

  it('reads an ordinary QR code as text with no Structured Append position', async () => {
    const got = await readQrCode(image(fixture.plain.rows));
    expect(got).toMatchObject({text: fixture.plain.text, structuredAppend: null});
  });

  it('reads nothing from an image with no code in it', async () => {
    const blank = new ImageDataLike(new Uint8ClampedArray(64 * 64 * 4).fill(255), 64, 64);
    await expect(readQrCode(blank as unknown as ImageData)).resolves.toBeNull();
  });
});
