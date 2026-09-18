# TurboWarp jsQR

**English** | [日本語](README.ja.md)

TurboWarp jsQR is a TurboWarp extension capability for reading QR codes from a shared
camera frame source. Since 0.4.0 it decodes with zxing-cpp (`zxing-wasm`) rather than jsQR, and
reports where a code sits in a Structured Append message. It prefers `@kubohiroya/turbowarp-camera-source` instead of
owning camera startup itself, so QR scanning can coexist with TurboWarp TM and can
select a dedicated named camera such as a downward-facing `qr` camera.

**[Open the user guide](https://kubohiroya.github.io/turbowarp-jsqr/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-jsqr/ja/)**

## What it does

- Waits for a QR code on a named Camera Source stream.
- Stores decoded QR text in a runtime variable for TurboWarp projects.
- Optionally broadcasts a message after a successful scan.
- Exposes `waitForQrText()`, `readFrame()` and `scanFrame()` for other unsandboxed extensions.
- Reads QR Code Structured Append (ISO/IEC 18004) symbols: `readFrame()` returns each symbol's
  position, count and parity with its bytes, so a caller can join a message split across several codes.

## Requirements and Safety

- TurboWarp custom extensions loaded with **Run extension without sandbox**.
- `@kubohiroya/turbowarp-camera-source` loaded before jsQR.
- Browser camera permission through Camera Source.
- Temporary Variables (`lmsTempVars2`) when using runtime-variable blocks.
- Camera frames stay in the browser. jsQR does not upload frames.

## Installation

Load Camera Source first, then load jsQR:

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-jsqr@0.4.0/dist/jsqr.js
```

For npm hosts:

```bash
pnpm add @kubohiroya/turbowarp-jsqr@0.4.0
```

## Quick Start

Use a named camera such as `qr` when the project also uses another camera feature.

```text
wait for QR code on camera [qr] set runtime var [qrText] to text
last QR text
```

## Block Reference

<!-- BEGIN GENERATED BLOCKS -->

### `wait for QR code on camera [CAMERA_ID] set runtime var [RUNTIME_VAR] to text`

Waits until a QR code is detected on the named camera and stores its text in a runtime variable.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `waitForQrTextSetRuntimeVar` |
| `CAMERA_ID` | String, default: `default` |
| `RUNTIME_VAR` | String, default: `qrText` |

### `wait for QR code on camera [CAMERA_ID] set runtime var [RUNTIME_VAR] to text and broadcast [MESSAGE]`

Waits until a QR code is detected on the named camera, stores its text, and broadcasts a message.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `waitForQrTextSetRuntimeVarAndBroadcast` |
| `CAMERA_ID` | String, default: `default` |
| `RUNTIME_VAR` | String, default: `qrText` |
| `MESSAGE` | String, default: `qrScanned` |

### `last QR text`

Returns the most recent QR text detected by this extension.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `lastQrTextReporter` |

<!-- END GENERATED BLOCKS -->

## Runtime API

Other unsandboxed extensions can access `Scratch.vm.runtime.ext_kubohiroyajsqr`.
`capabilityVersion` is `2` since 0.4.0.

```js
const text = await jsqr.waitForQrText({ cameraId: "qr", signal });
const read = await jsqr.readFrame(frameSource);
// read: { text, bytes, structuredAppend: { index, count, parity } | null } or null
const textOrNull = await jsqr.scanFrame(frameSource);
```

- `readFrame(frameSource)` decodes one camera frame. For a Structured Append symbol, `text` and
  `bytes` are that symbol's share; join the `bytes` of all symbols in `index` order, and check that
  they share `count` and `parity`. `@kubohiroya/qrcode-structured-append` does both.
- `scanFrame(frameSource)` returns a promise of the text, or `null`.

## Compatibility

The extension ID remains `kubohiroyajsqr`, and the block opcodes are unchanged.

0.4.0 changes the runtime capability, not the blocks: decoding is zxing-cpp and asynchronous, so
`scanFrame()` now returns a promise, and `readFrame()` is new. A caller written for 0.3.0 that used
`scanFrame()`'s return value directly has to `await` it; check `capabilityVersion` to tell the two
apart. zxing-cpp reads codes that jsQR could not — smaller in the frame, blurred, seen at an angle,
or on a noisy sensor — and reads a frame in a few milliseconds instead of tens. The bundle grows by
about 1.3 MB, because the WebAssembly is inlined: a packaged project runs from one file, often
offline, with nothing beside it to fetch a `.wasm` from.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

For continuous rebuilding during development:

```bash
pnpm run dev
```

## Build Workflow

```text
TypeScript source
  -> Vite
  -> vite-plugin-turbowarp-extension
  -> dist/jsqr.js

Extension config + block definitions
  -> extension manifest plugin
  -> dist/extension-manifest.json
```

The generated JavaScript is a single, non-minified TurboWarp extension file with Extension Gallery metadata and the standard `(function (Scratch) { ... })(Scratch);` wrapper.

## Project structure

- `src/config.ts`: extension metadata
- `src/block-definitions.json`: canonical block metadata used by both the extension and README generator
- `src/extension.ts`: extension implementation
- `src/extension-manifest.ts`: canonical manifest generator and Vite output plugin
- `src/index.ts`: extension registration entry point
- `src/globals.d.ts`: Scratch API declarations used by the project
- `schemas/extension-manifest.schema.json`: JSON Schema for the generated API contract
- `scripts/generate-readme.ts`: updates the generated README block section
- `tests/`: unit tests
- `vite.config.ts`: TurboWarp-compatible Vite build configuration
- `dist/`: tracked TurboWarp JavaScript and extension API manifest

## Extension API manifest

Each build emits `dist/extension-manifest.json` with `formatVersion: 1`. It records the extension ID,
block opcodes and types, argument IDs and types, and menu references in a deterministic order. Tools
such as `sb3-toolchain` can compare this contract before updating an embedded extension or migrating
its ID. See [the architecture document](docs/architecture.md) and the
[JSON Schema](schemas/extension-manifest.schema.json) for the v1 contract.

After changing runtime or block metadata, regenerate and verify the tracked release artifacts:

```bash
pnpm run check:dist
```

## Generated documentation

Regenerate block documentation with:

```bash
pnpm run docs
```

`pnpm run check` also runs `docs:check`, which fails if `README.md` is out of date with `src/block-definitions.json`.

## License

SPDX-License-Identifier: MPL-2.0
