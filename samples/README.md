# 最小デモ / Minimal sample

[TurboWarp Editor](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-jsqr%2Fsamples%2Fread-one-qr.sb3) / [SB3](https://kubohiroya.github.io/turbowarp-jsqr/samples/read-one-qr.sb3)

## このデモ / This sample

Camera Source 0.21.0と公式Temporary Variables (`lmsTempVars2`) を読み込みます。Start後、`waitForQrTextSetRuntimeVar`で読み取った内容をruntime変数`sampleQrText`へ保存し、`lastQrTextReporter`から`QR text`へ表示します。読み取り成功時はカメラを解放します。

- [印刷用QR SVG](read-one-qr/hello-qr.svg) は固定文字列 **`Hello TurboWarp QR`** を符号化した自作素材です（qrcode 1.5.4、M、quiet zone 4）。URL遷移などの外部サービスはありません。紙に印刷するか別画面に表示し、カメラへ見せてください。
- 未読の初期値は空文字です。成功値の固定代入はしていません。実カメラでの復号とruntime変数保存は未検証です。
- **既存QR待機ブロックには中断入力がありません。** Stop/Editor停止はカメラを解放しますが、既に始まったQR待機のPromise/timerまで完全に中断するにはタブを再読み込みしてください。停止後すぐにStartを繰り返して複数の待機を作らないでください。

The supplied QR encodes exactly `Hello TurboWarp QR` (qrcode 1.5.4, error correction M, four-module quiet zone). It does not call an external service. Start uses the real QR wait block and Temporary Variables; successful reading displays the actual last text and releases the camera. Physical decoding and runtime-variable storage remain unverified. The existing wait block has no abort input: Stop releases the camera, but reload the tab to fully cancel an already pending scan before restarting it.

## 操作 / Operation

1. Editorで同梱拡張それぞれの **Run without sandbox** を選び **Allow** します。緑旗ではカメラも音声も起動しません。
2. **Start** をクリックするとカメラ許可を求めます。許可後は共有カメラのプレビューと実際の幅・高さを表示します。エラーならCamera errorを確認します。
3. **Stop** でプレビューとカメラleaseを解放します。Editorの停止ボタンでもCamera Sourceはカメラを解放します。拒否した場合はブラウザのサイト設定を確認し、再読み込みしてください。

Allow each embedded extension to run without sandbox. Green flag reads status only. **Start** deliberately requests a camera; **Stop** releases it. A rejected permission is shown in Camera error. The Editor stop button also releases Camera Source's camera. No audio blocks are included.

## 要件と未検証範囲 / Requirements and unverified scope

- HTTPS対応ブラウザ、物理カメラ、カメラ許可、TurboWarpのunsandboxed実行が必要です。
- 自動検証は無音で、実カメラを起動せず、公開ファイル・通常の許可画面・初期のfalse/0/空エラー・未起動での停止・停止後の再実行だけを確認します。
- **実機での取得、プレビューの向き・解像度、USB機器の相性、権限拒否後のOS/browserごとの復旧、認識・校正の成功は未検証です。** 観測していない値を成功値として表示しません。

A physical camera, permission, HTTPS and unsandboxed execution are required. Silent automated checks cover delivery, consent, idle reporters, stopping before acquisition and rerunning. Physical capture, preview orientation/resolution, device compatibility, OS permission recovery, recognition and calibration success are unverified.

## 再生成 / Maintenance

`manifest.json` に配信先、拡張ID、依存bundleのSHA256、期待値を記録します。`project.json` と自作SVGを編集し、`.nvmrc` のNode.jsで以下を実行してください。

```bash
node scripts/build-samples.mjs
node scripts/build-samples.mjs --check
node --test scripts/verify-samples.mjs
node scripts/prepare-pages.mjs
```

SB3は追加依存なしで決定的に生成しコミットします。unsandboxed bundleはSB3へ同梱します。Pagesは既存docs、dist、SB3、印刷素材を`_site`へまとめます。本体の既定フラグは変更しません。切戻しはPRをrevertしPagesを再配信します。
