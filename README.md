# Bitwig X-TOUCH MINI

BEHRINGER X-TOUCH MINI から Bitwig Studio を操作するための JavaScript コントローラースクリプトです。

現在の実装は **MC（Mackie Control）モード専用**です。X-TOUCH MINI の 8 個のエンコーダーで選択中デバイスの Remote Controls を操作し、ボタンとフェーダーでトランスポート、トラック、デバイスを操作できます。

## 必要なもの

- BEHRINGER X-TOUCH MINI
- Bitwig Studio（Controller API 21 を使用できるバージョン）
- X-TOUCH MINI とコンピューターを接続する USB ケーブル
- 固定割り当てから挿入する場合は、対応するプラグインが指定形式でインストール済みであること

## インストール

1. このリポジトリをダウンロードまたは clone します。
2. `script/XToutchMini.control.js` を、Bitwig Studio の `Controller Scripts` フォルダー内の任意のサブフォルダーへコピーします。例:

   ```text
   Controller Scripts/
   └── Bitwig_X-TOUCH-MINI/
       └── XToutchMini.control.js
   ```

   OS ごとの標準の `Controller Scripts` フォルダーは次のとおりです。

   | OS | 保存先 |
   | --- | --- |
   | macOS | `~/Documents/Bitwig Studio/Controller Scripts` |
   | Windows | `%USERPROFILE%\Documents\Bitwig Studio\Controller Scripts` |
   | Linux | `~/Bitwig Studio/Controller Scripts` |

3. X-TOUCH MINI を MC モードにします。
   1. X-TOUCH MINI を USB ポートから外します。
   2. 本体の `MC` ボタンを押したまま、通電しているコンピューターの USB ポートへ接続します。
   3. `MC MODE` LED が点灯し続けたら `MC` ボタンを離します。

   選択したモードは本体に記憶されます。Standard モードへ戻す場合も同じ操作を行います。

4. Bitwig Studio を起動します。起動済みの場合は、スクリプトを認識させるため再起動します。
5. Bitwig Studio のダッシュボードから `Settings` → `Controllers` を開き、コントローラーを追加します。
6. ベンダーに `Behringer`、製品に `X-Touch mini` を選択します。
7. MIDI 入力と MIDI 出力の両方に X-TOUCH MINI のポートを設定します。

## 操作一覧

### エンコーダーとフェーダー

| 操作 | 機能 |
| --- | --- |
| エンコーダー 1〜8を回す | 選択中デバイスの Remote Controls 1〜8を相対操作 |
| エンコーダー 1〜8を押す | 現在のトラック、デバイス、Remote Controls ページへ切り替えた直後の値に戻す |
| `SHIFT` + エンコーダー 1〜7を回す | Remote Controls 1〜7を相対操作し、Bitwig Studio 上の Remote Controls セクションを隠す |
| `SHIFT` + エンコーダー 8を回す | Remote Controls の前後のページへ移動 |
| `ALT` + エンコーダー 6を回す | テンポを1段につき1 BPM増減 |
| `ALT` + エンコーダー 7を回す | 青い再生開始マーカーの位置を基準にズームイン／ズームアウト |
| `ALT` + エンコーダー 8を回す | 再生開始時間を現在のグリッドで1ステップ前／先へ移動 |
| フェーダー | 選択中トラックの音量を操作 |

通常どおりエンコーダーを回すと、Bitwig Studio 上の Remote Controls セクションを表示します。Remote Controls の値はエンコーダーの LED リングへ反映され、LED リングは FAN 表示になります。`SHIFT` + エンコーダー 8でページを移動すると、ページ番号とページ名を Bitwig Studio に表示します。

エンコーダー押し込みで戻る値は、スクリプトがそのトラック、デバイス、ページを認識した時点の値です。プラグイン本来のデフォルト値ではありません。値はメモリー上に最大 256 コンテキスト分保持され、Bitwig Studio またはスクリプトを再起動すると消去されます。

### 上段ボタン

MC モードにおける上段 8 ボタンの割り当てです。表は本体左から右の順です。

| 位置 | 機能 |
| --- | --- |
| 1 | 選択中デバイスのプラグインウィンドウを開く／閉じる |
| 2 | 選択中デバイスを置き換えるポップアップブラウザを開く／閉じる |
| 3 | Undo |
| 4 | Redo |
| 5 | 選択中トラックの Solo を切り替える |
| 6 | 選択中トラックの Mute を切り替える |
| 7 | Arranger の再生ヘッド追従を切り替える |
| 8 | 選択中トラックの音量を約 0 dB に戻す |

プラグインウィンドウ、Solo、Mute、再生ヘッド追従の状態は対応するボタン LED に反映されます。Solo、Mute、再生ヘッド追従、0 dB リセット時は Bitwig Studio に通知を表示します。

### 下段ボタン

MC モードにおける下段 8 ボタンの割り当てです。表は本体左から右の順です。

| 位置 | 機能 |
| --- | --- |
| 1 | `SHIFT`（押している間だけ有効） |
| 2 | `ALT`（押している間だけ有効） |
| 3 | 巻き戻し。`SHIFT` と同時押しで前のキューマーカーへ移動 |
| 4 | 早送り。`SHIFT` と同時押しで次のキューマーカーへ移動 |
| 5 | Arranger Loop のオン／オフ |
| 6 | 停止 |
| 7 | 再生／停止 |
| 8 | Arranger 録音 |

Loop、再生、録音の状態は対応するボタン LED に反映されます。前後のキューマーカーへ移動した場合は、移動先に最も近い直前のキューマーカー名を Bitwig Studio に表示します。参照するキューマーカーは先頭から最大 64 個です。

### LAYER ボタン

| 操作 | 通常時 | ポップアップブラウザ表示中 |
| --- | --- | --- |
| `LAYER A` | 前のトラックを選択 | 前の候補を選択 |
| `LAYER B` | 次のトラックを選択 | 次の候補を選択 |
| `SHIFT` + `LAYER A` | 前のデバイスを選択 | 前の候補を選択 |
| `SHIFT` + `LAYER B` | 次のデバイスを選択 | 次の候補を選択 |
| `ALT` + `LAYER A` | 親デバイスを選択 | 前の候補を選択 |
| `ALT` + `LAYER B` | 先頭の子スロット内の最初のデバイスを選択 | 次の候補を選択 |

通常時にトラックを切り替えると、選択したトラック名とデバイス名を Bitwig Studio に表示します。
`ALT` + `LAYER B` は現在のデバイスが持つ先頭スロットだけを対象とし、複数のスロットを自動巡回しません。子スロットがない場合は何も行いません。

### ポップアップブラウザ表示中

| 操作 | 機能 |
| --- | --- |
| `LAYER A` / `LAYER B` | 前／次の候補を選択 |
| エンコーダー 8を右／左へ回す | 前／次の候補を選択 |
| 上段ボタン 8 | 選択中の候補を確定 |
| 上段ボタン 2 | ブラウザをキャンセルして閉じる |

### 固定デバイス挿入

`SHIFT` または `ALT` を押しながらエンコーダーを押すと、スクリプト内に登録されたデバイスを挿入します。ポップアップブラウザ表示中は、この操作を行いません。

#### `SHIFT` + エンコーダー押し込み

| エンコーダー | デバイス | 形式 | 挿入位置 |
| --- | --- | --- | --- |
| 1 | Sylenth1 | VST3 | デバイスチェーン末尾 |
| 2 | Hive2 | CLAP | デバイスチェーン末尾 |
| 3 | Spire | VST3 | デバイスチェーン末尾 |
| 4 | Serum2 | VST3 | デバイスチェーン末尾 |
| 5 | XPand!2 | VST3 | デバイスチェーン末尾 |
| 6 | Synthesizer V Studio 2 | VST3 | デバイスチェーン末尾 |
| 7 | Melodyne | VST3 | デバイスチェーン末尾 |
| 8 | Note Transpose | Bitwig デバイス | デバイスチェーン先頭 |

#### `ALT` + エンコーダー押し込み

| エンコーダー | デバイス | 形式 | 挿入位置 |
| --- | --- | --- | --- |
| 1 | VPS Avenger 2 | VST3 | デバイスチェーン末尾 |
| 2 | Vital | VST3 | デバイスチェーン末尾 |
| 3 | Tyrell-N6 | CLAP | デバイスチェーン末尾 |
| 4 | 未割り当て | — | — |
| 5 | Scaler 3 | VST3 | デバイスチェーン末尾 |
| 6 | NeuralNote | VST3 | デバイスチェーン末尾 |
| 7 | Glitch2 | VST2 | デバイスチェーン末尾 |
| 8 | Arpeggiator | Bitwig デバイス | デバイスチェーン先頭 |

`ALT` + エンコーダー 4は予約枠で、有効なデバイスは割り当てられていません。

外部プラグインは、スクリプトに記録されたプラグイン ID とインストール済みプラグインが一致する場合だけ挿入できます。別形式や別バージョンを使用する場合は、`script/XToutchMini.control.js` 内の割り当てと ID を環境に合わせて変更してください。

## 現在の制約

- Standard モードには対応していません。
- MIDI 入出力は各 1 ポートを使用します。
- 操作対象は、Bitwig Studio で現在選択されているトラックと、その選択に追従するデバイスです。
- クリップランチャー操作は実装されていません。
- 外部プラグインの固定挿入割り当ては、作成者の環境に依存します。

## 参考資料

- [Bitwig Studio: How do I add a controller extension or script?](https://www.bitwig.com/support/technical_support/how-do-i-add-a-controller-extension-or-script-17/)
- [BEHRINGER X-TOUCH MINI Quick Start Guide](https://mediadl.musictribe.com/media/PLM/data/docs/P0B3M/QSG_BE_0808-AAF_X-TOUCH-MINI_WW.pdf)
