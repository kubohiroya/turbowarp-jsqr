# jsQR

[日本語](README.ja.md)

jsQR is a TurboWarp extension capability for reading QR code text from a shared
camera frame source. It prefers `@kubohiroya/turbowarp-camera-source` instead of
owning camera startup itself, so QR scanning can coexist with TMPose and can
select a dedicated named camera such as a downward-facing `qr` camera.

**[Open the user guide](https://kubohiroya.github.io/turbowarp-jsqr/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-jsqr/ja/)**

## Build workflow

```text
TypeScript source
  -> Vite
  -> vite-plugin-turbowarp-extension
  -> dist/<extension-name>.js

Extension config + block definitions
  -> extension manifest plugin
  -> dist/extension-manifest.json
```

The generated JavaScript is a single, non-minified TurboWarp extension file with Extension Gallery metadata and the standard `(function (Scratch) { ... })(Scratch);` wrapper.

## Blocks

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

## Development

```bash
npm install
npm run check
```

## Runtime API

Other unsandboxed extensions can access `Scratch.vm.runtime.ext_kubohiroyajsqr`.
Use `waitForQrText({cameraId, signal})` to wait for the next decoded QR value, or
`scanFrame(frameSource)` to decode one camera frame.

```js
const text = await jsqr.waitForQrText({cameraId: 'qr', signal});
```

For continuous rebuilding during development:

```bash
npm run dev
```

## Project structure

- `src/config.ts`: extension metadata
- `src/block-definitions.json`: canonical block metadata used by both the extension and README generator
- `src/extension.ts`: extension implementation
- `src/extension-manifest.ts`: canonical manifest generator and Vite output plugin
- `src/index.ts`: extension registration entry point
- `src/globals.d.ts`: Scratch API declarations used by the project
- `schemas/extension-manifest.schema.json`: JSON Schema for the generated API contract
- `scripts/generate-readme.mjs`: updates the generated README block section
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
npm run check:dist
```

## Generated documentation

Regenerate block documentation with:

```bash
npm run docs
```

`npm run check` also runs `docs:check`, which fails if `README.md` is out of date with `src/block-definitions.json`.

## License

MPL-2.0
