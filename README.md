# PGA-K メール受信テスト（表示はCloudflare / 送信&ログはGAS）

このZIPは **Cloudflare Pages** に「表示ページ（①フォーム / ②案内）」を置き、送信は **Cloudflare Pages Functions** から **GAS Webアプリ**へ中継する構成です。

## 構成
- `public/receiving_test/index.html` … ①テスト送信フォーム
- `public/receiving_test/after/index.html` … ②送信後の案内（各社公式リンク）
- `functions/api/receiving-test.js` … Cloudflare中継API（POST）

## 1) Cloudflare 側の設定（必須）
Cloudflare Pages の「Settings → Environment variables」で以下を設定してください。

- `GAS_WEBAPP_URL` : GAS WebアプリのURL（末尾が `/exec` のもの）
  - 例: `https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxx/exec`
- （任意）`RECEIVING_TEST_API_KEY` : APIキー（GAS側にも同じ値を入れると簡易保護になります）

## 2) GAS 側（必要）
Cloudflare からは JSON で POST します。GAS Webアプリ側に `doPost(e)` が必要です。
別ZIP「GASパッチ」を同梱しています（この返信のリンク参照）。

## 3) デプロイ
このZIPの内容を Pages プロジェクトに配置してデプロイしてください。

- ①フォーム: `/receiving_test/`
- ②案内: `/receiving_test/after/`
- API: `/api/receiving-test`

## 4) 動作確認
①でメール入力 → 送信 → ②へ遷移。
ログは GAS 側のスプレッドシートに残る想定です。
