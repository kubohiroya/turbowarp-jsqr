import {prepareZXingModule, readBarcodes} from 'zxing-wasm/reader';
import wasmDataUri from 'zxing-wasm/reader/zxing_reader.wasm?inline';

/**
 * Where a symbol sits in a Structured Append message (ISO/IEC 18004): its 0-based position, how many
 * symbols the message has, and the parity byte they share.
 */
export interface StructuredAppendInfo {
  readonly index: number;
  readonly count: number;
  readonly parity: number;
}

/** One QR code read from a frame. */
export interface QrRead {
  /** The symbol's content as text. For a Structured Append symbol, only this symbol's share. */
  readonly text: string;
  /** The symbol's content as bytes, exactly as encoded. Join Structured Append symbols by these. */
  readonly bytes: Uint8Array;
  /** Present when the symbol is part of a Structured Append message. */
  readonly structuredAppend: StructuredAppendInfo | null;
}

let prepared: Promise<unknown> | undefined;

/**
 * Loads zxing-cpp once, from the WebAssembly this bundle carries.
 *
 * The module is inlined rather than fetched: a packaged TurboWarp project runs from a single file,
 * often offline, and has no server beside it to fetch a `.wasm` from.
 */
function ready(): Promise<unknown> {
  prepared ??= Promise.resolve(
    prepareZXingModule({
      overrides: {wasmBinary: bytesOfDataUri(wasmDataUri).buffer as ArrayBuffer},
      fireImmediately: true
    })
  );
  return prepared;
}

/**
 * Reads the first QR code in an image with zxing-cpp, or nothing.
 *
 * `tryHarder` is on: a code on a projection or a phone held up to a camera is small, blurred and seen
 * at an angle, and a frame that reads slowly is better than one that does not read.
 */
export async function readQrCode(image: ImageData): Promise<QrRead | null> {
  await ready();
  const [result] = await readBarcodes(image, {
    formats: ['QRCode'],
    tryHarder: true,
    maxNumberOfSymbols: 1
  });
  if (!result || !result.isValid) return null;
  const parity = Number.parseInt(result.sequenceId, 10);
  return {
    text: result.text,
    bytes: result.bytes,
    structuredAppend:
      result.sequenceSize > 0 && result.sequenceIndex >= 0 && Number.isInteger(parity)
        ? {index: result.sequenceIndex, count: result.sequenceSize, parity}
        : null
  };
}

function bytesOfDataUri(uri: string): Uint8Array {
  const base64 = uri.slice(uri.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
