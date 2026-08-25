# TurboWarp jsQR

[English](README.md) | **日本語**

TurboWarp jsQRは、共有カメラフレームからQRコード文字列を読み取るTurboWarp拡張capabilityです。カメラを自前で所有せず、`@kubohiroya/turbowarp-camera-source`を優先して使うことで、TurboWarp TMなどのカメラ利用と共存し、`qr`のような名前付き下向きカメラを指定できます。

**[English guide](https://kubohiroya.github.io/turbowarp-jsqr/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-jsqr/ja/)**

## できること

- 名前付きCamera Sourceストリーム上のQRコードを待機します。
- 復号したQR文字列をTurboWarp projectのruntime variableへ保存します。
- 読み取り成功後に任意のmessageをbroadcastできます。
- 他のunsandboxed拡張向けに`waitForQrText()`と`scanFrame()`を公開します。

## 要件と安全性

- TurboWarpの「Run extension without sandbox」
- jsQRより先に読み込まれた`@kubohiroya/turbowarp-camera-source`
- Camera Source経由のブラウザカメラ許可
- runtime variableブロックを使う場合はTemporary Variables (`lmsTempVars2`)
- jsQRはカメラフレームをアップロードしません。

## インストール

Camera Sourceを先に読み込み、その後にjsQRを読み込みます。

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-jsqr@0.2.0/dist/jsqr.js
```

npm hostでは次を使います。

```bash
pnpm add @kubohiroya/turbowarp-jsqr@0.2.0
```

## Quick start

projectが別のカメラ機能も使う場合は、`qr`のような名前付きカメラを使います。

```text
wait for QR code on camera [qr] set runtime var [qrText] to text
last QR text
```

## ブロック一覧

- `wait for QR code on camera [CAMERA_ID] set runtime var [RUNTIME_VAR] to text`: 指定カメラでQRコードが見つかるまで待ち、復号した文字列をruntime variableに保存します。
- `wait for QR code on camera [CAMERA_ID] set runtime var [RUNTIME_VAR] to text and broadcast [MESSAGE]`: 保存後にbroadcastを開始します。
- `last QR text`: 最後に読み取ったQR文字列を返します。

## Runtime API

他のunsandboxed拡張は`Scratch.vm.runtime.ext_kubohiroyajsqr`を参照できます。

```js
const text = await jsqr.waitForQrText({ cameraId: "qr", signal });
const textOrNull = jsqr.scanFrame(frameSource);
```

`waitForQrText()`はCamera Sourceのleaseを取得し、最初に復号できたQR文字列を返したあとleaseを解放します。`cameraId`を指定すると、Camera Source側で割り当てた下向きカメラなどを選べます。

## 互換性

Extension IDは`kubohiroyajsqr`のままです。ブロックopcode、QR decode結果、wait semantics、Camera Source peer rangeは0.2.0でも変更しません。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

GitHub Pages用の静的サイトは`docs/`にあり、英語版は`docs/index.html`、日本語版は`docs/ja/index.html`です。

## ライセンス

SPDX-License-Identifier: MPL-2.0
