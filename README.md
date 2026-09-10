# TurboWarp jsQR

**English** | [日本語](README.ja.md)

TurboWarp jsQR is a TurboWarp extension capability for reading QR code text from a shared
camera frame source. It prefers `@kubohiroya/turbowarp-camera-source` instead of
owning camera startup itself, so QR scanning can coexist with TurboWarp TM and can
select a dedicated named camera such as a downward-facing `qr` camera.

**[Open the user guide](https://kubohiroya.github.io/turbowarp-jsqr/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-jsqr/ja/)**

## What it does

- Waits for a QR code on a named Camera Source stream.
- Stores decoded QR text in a runtime variable for TurboWarp projects.
- Optionally broadcasts a message after a successful scan.
- Exposes `waitForQrText()` and `scanFrame()` for other unsandboxed extensions.

## Requirements and Safety

- TurboWarp custom extensions loaded with **Run extension without sandbox**.
- `@kubohiroya/turbowarp-camera-source` loaded before jsQR.
- Browser camera permission through Camera Source.
- Temporary Variables (`lmsTempVars2`) when using runtime-variable blocks.
- Camera frames stay in the browser. jsQR does not upload frames.

## Installation

Load Camera Source first, then load jsQR:

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-jsqr@0.2.0/dist/jsqr.js
```

For npm hosts:

```bash
pnpm add @kubohiroya/turbowarp-jsqr@0.2.0
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
Use `waitForQrText({cameraId, signal})` to wait for the next decoded QR value, or
`scanFrame(frameSource)` to decode one camera frame.

```js
const text = await jsqr.waitForQrText({ cameraId: "qr", signal });
```

## Compatibility

The extension ID remains `kubohiroyajsqr`, and the block opcodes are unchanged. QR decode results, wait semantics, and the Camera Source peer range are unchanged in 0.2.0.

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
