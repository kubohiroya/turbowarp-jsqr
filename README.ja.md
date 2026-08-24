# jsQR

[English](README.md)

jsQRは、共有カメラフレームからQRコード文字列を読み取るTurboWarp拡張capabilityです。カメラを自前で所有せず、`@kubohiroya/turbowarp-camera-source`を優先して使うことで、TMPoseなどのカメラ利用と共存します。

**[English guide](https://kubohiroya.github.io/turbowarp-jsqr/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-jsqr/ja/)**

## ブロック

- `wait for QR code set runtime var [RUNTIME_VAR] to text`: QRコードが見つかるまで待ち、復号した文字列をruntime variableに保存します。
- `wait for QR code set runtime var [RUNTIME_VAR] to text and broadcast [MESSAGE]`: 保存後にbroadcastを開始します。
- `last QR text`: 最後に読み取ったQR文字列を返します。

runtime variableを書き込むブロックにはTemporary Variables (`lmsTempVars2`) が必要です。

## Runtime API

他のunsandboxed拡張は`Scratch.vm.runtime.ext_kubohiroyajsqr`を参照できます。

```js
const text = await jsqr.waitForQrText({signal});
const textOrNull = jsqr.scanFrame(frameSource);
```

`waitForQrText()`はCamera Sourceのleaseを取得し、最初に復号できたQR文字列を返したあとleaseを解放します。

## 要件

- TurboWarpの「Run extension without sandbox」
- `@kubohiroya/turbowarp-camera-source`
- カメラ許可
- runtime variableブロックを使う場合はTemporary Variables

jsQRはカメラフレームをアップロードしません。

## 開発

```bash
pnpm install
pnpm check
```

GitHub Pages用の静的サイトは`docs/`にあり、英語版は`docs/index.html`、日本語版は`docs/ja/index.html`です。

## ライセンス

MPL-2.0
