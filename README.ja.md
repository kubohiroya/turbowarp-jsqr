# TurboWarp ZXing

<img src="assets/block-icon.svg" alt="" width="48" height="48">

[English](README.md) | 日本語

TurboWarp ZXingは、共有カメラフレームからQRコードを読み取るTurboWarp拡張capabilityです。0.4.0からは、jsQRではなくzxing-cpp（`zxing-wasm`）で復号し、連結QR（Structured Append）の中での位置も返します。カメラを自前で所有せず、`@kubohiroya/turbowarp-camera-source`を優先して使うことで、TurboWarp TMなどのカメラ利用と共存し、`qr`のような名前付き下向きカメラを指定できます。

**[English guide](https://kubohiroya.github.io/turbowarp-zxing/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-zxing/ja/)**

## 最小デモ

[TurboWarp Editor](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-zxing%2Fsamples%2Fread-one-qr.sb3) · [SB3](https://kubohiroya.github.io/turbowarp-zxing/samples/read-one-qr.sb3) · [操作・要件・未検証範囲](samples/README.md)

緑旗は状態表示のみです。**Start**を明示クリックするとカメラ許可を要求し、**Stop**でカメラを解放します。カメラ・HTTPS・許可が必要です。実カメラによる取得・認識・校正の成功は未検証です。自動検証は無音で初期状態と停止を確認しています。

## できること

- 名前付きCamera Sourceストリーム上のQRコードを待機します。
- 復号したQR文字列をTurboWarp projectのruntime variableへ保存します。
- 読み取り成功後に任意のmessageをbroadcastできます。
- 他のunsandboxed拡張向けに`waitForQrText()`と`scanFrame()`を公開します。

## 要件と安全性

- TurboWarpの「Run extension without sandbox」
- ZXingより先に読み込まれた`@kubohiroya/turbowarp-camera-source`
- Camera Source経由のブラウザカメラ許可
- runtime variableブロックを使う場合はTemporary Variables (`lmsTempVars2`)
- ZXingはカメラフレームをアップロードしません。

## インストール

Camera Sourceを先に読み込み、その後にZXingを読み込みます。

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-zxing@0.11.2/dist/zxing.js
```

npm hostでは次を使います。

```bash
pnpm add @kubohiroya/turbowarp-zxing@0.11.2
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

他のunsandboxed拡張は`Scratch.vm.runtime.ext_kubohiroyazxing`を参照できます。

`capabilityVersion`は0.4.0から`2`です。

```js
const text = await zxing.waitForQrText({ cameraId: "qr", signal });
const read = await zxing.readFrame(frameSource);
// read: { text, bytes, structuredAppend: { index, count, parity } | null } または null
const textOrNull = await zxing.scanFrame(frameSource);
```

- `readFrame(frameSource)`は1フレームを復号します。連結QRのシンボルなら、`text`と`bytes`はそのシンボルの分だけです。全シンボルの`bytes`を`index`の順に結合し、`count`と`parity`が揃っていることを確かめてください。`@kubohiroya/qrcode-structured-append`がその両方を行います。
- `scanFrame(frameSource)`は、文字列（または`null`）のPromiseを返します。

`waitForQrText()`はCamera Sourceのleaseを取得し、最初に復号できたQR文字列を返したあとleaseを解放します。`cameraId`を指定すると、Camera Source側で割り当てた下向きカメラなどを選べます。

## 互換性

0.11.0で、パッケージ名を`@kubohiroya/turbowarp-jsqr`から`@kubohiroya/turbowarp-zxing`へ、Extension IDを`kubohiroyajsqr`から`kubohiroyazxing`へ変えました。旧名は0.3.0まで復号に使っていたjsQRに由来し、0.4.0からの復号はzxing-cppです。IDに合わせて、ブロックopcode、runtime capability（`Scratch.vm.runtime.ext_kubohiroyazxing`）、バンドルのパス（`dist/zxing.js`）も変わります。0.10.0以前で保存したプロジェクトは`kubohiroyajsqr`を参照しているので、旧バンドルを読み込むか、Extension IDとopcode接頭辞を書き換えます（`sb3-toolchain extensions migrate-id`で書き換えられます）。runtime capabilityを使う拡張は、`ext_kubohiroyajsqr`の代わりに`ext_kubohiroyazxing`を参照します。

0.4.0で変わるのはブロックではなくruntime capabilityです。復号がzxing-cppになり非同期になったため、`scanFrame()`はPromiseを返すようになり、`readFrame()`を追加しました。0.3.0向けに`scanFrame()`の戻り値をそのまま使っていた呼び出し側は`await`が必要です。両者は`capabilityVersion`で見分けられます。zxing-cppは、jsQRでは読めなかったコード（画面の中で小さい、ぼけている、斜めから見ている、センサーの雑音が多い）も読め、1フレームを数十ミリ秒ではなく数ミリ秒で読みます。WebAssemblyを埋め込むため、バンドルは約1.3 MB大きくなります。パッケージしたプロジェクトは1つのファイルで、多くはオフラインで動き、`.wasm`を取りに行く先がないためです。

## 開発

```bash
npm install --global corepack@latest
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

GitHub Pages用の静的サイトは`docs/`にあり、英語版は`docs/index.html`、日本語版は`docs/ja/index.html`です。

## ライセンス

SPDX-License-Identifier: MPL-2.0
