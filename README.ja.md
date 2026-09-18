# TurboWarp jsQR

[English](README.md) | **日本語**

TurboWarp jsQRは、共有カメラフレームからQRコードを読み取るTurboWarp拡張capabilityです。0.4.0からは、jsQRではなくzxing-cpp（`zxing-wasm`）で復号し、連結QR（Structured Append）の中での位置も返します。カメラを自前で所有せず、`@kubohiroya/turbowarp-camera-source`を優先して使うことで、TurboWarp TMなどのカメラ利用と共存し、`qr`のような名前付き下向きカメラを指定できます。

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
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-jsqr@0.4.0/dist/jsqr.js
```

npm hostでは次を使います。

```bash
pnpm add @kubohiroya/turbowarp-jsqr@0.4.0
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

`capabilityVersion`は0.4.0から`2`です。

```js
const text = await jsqr.waitForQrText({ cameraId: "qr", signal });
const read = await jsqr.readFrame(frameSource);
// read: { text, bytes, structuredAppend: { index, count, parity } | null } または null
const textOrNull = await jsqr.scanFrame(frameSource);
```

- `readFrame(frameSource)`は1フレームを復号します。連結QRのシンボルなら、`text`と`bytes`はそのシンボルの分だけです。全シンボルの`bytes`を`index`の順に結合し、`count`と`parity`が揃っていることを確かめてください。`@kubohiroya/qrcode-structured-append`がその両方を行います。
- `scanFrame(frameSource)`は、文字列（または`null`）のPromiseを返します。

`waitForQrText()`はCamera Sourceのleaseを取得し、最初に復号できたQR文字列を返したあとleaseを解放します。`cameraId`を指定すると、Camera Source側で割り当てた下向きカメラなどを選べます。

## 互換性

Extension IDは`kubohiroyajsqr`のままで、ブロックopcodeも変わりません。

0.4.0で変わるのはブロックではなくruntime capabilityです。復号がzxing-cppになり非同期になったため、`scanFrame()`はPromiseを返すようになり、`readFrame()`を追加しました。0.3.0向けに`scanFrame()`の戻り値をそのまま使っていた呼び出し側は`await`が必要です。両者は`capabilityVersion`で見分けられます。zxing-cppは、jsQRでは読めなかったコード（画面の中で小さい、ぼけている、斜めから見ている、センサーの雑音が多い）も読め、1フレームを数十ミリ秒ではなく数ミリ秒で読みます。WebAssemblyを埋め込むため、バンドルは約1.3 MB大きくなります。パッケージしたプロジェクトは1つのファイルで、多くはオフラインで動き、`.wasm`を取りに行く先がないためです。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

GitHub Pages用の静的サイトは`docs/`にあり、英語版は`docs/index.html`、日本語版は`docs/ja/index.html`です。

## ライセンス

SPDX-License-Identifier: MPL-2.0
