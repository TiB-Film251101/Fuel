# Fuel 引き継ぎメモ

最終更新：2026-05-21（MVP デプロイ完了） / リポジトリ：`TiB-Film251101/Fuel`

## このドキュメントの目的

新規セッションで作業を引き継ぐための、決定事項・現状・残課題のまとめ。

---

## プロジェクト概要

執筆中の「燃料切れ」を補う書籍推薦ツール。作家 Film(Asami Suda) 専用。
設定とジャンルを指定して「推薦する」を押すだけで、Claude Haiku が執筆者の現在地に合った本を5冊提案する。

詳細仕様は `Fuel設計.md` が最終仕様。`Lens_Nuance_Fuel_概略.md` は世界観参照用で実装判断には使わない。

---

## インフラ構成

| 項目 | 内容 |
|---|---|
| フロントエンド | GitHub Pages（`https://tib-film251101.github.io/Fuel/`） |
| APIプロキシ | Cloudflare Workers（`https://filmfuel-proxy.tib-film251101.workers.dev`） |
| AIモデル | `claude-haiku-4-5-20251001`（temperature: 0.5） |
| デプロイ | master push → GitHub Actions 自動ビルド → GitHub Pages |

### Cloudflare Worker のシークレット

`wrangler secret put` で設定済み：
- `ANTHROPIC_API_KEY`
- `FUEL_SHARED_SECRET`

### GitHub Repository Secrets

- `VITE_WORKER_URL`
- `VITE_FUEL_SECRET`

---

## アプリの現在地

### 動いているもの（MVP）

- 設定BOX（textarea・500ms debounce で localStorage 自動保存）
- ジャンルフィルタ（国内文芸 / 翻訳文芸 / 哲学・評論 / 詩・短歌・俳句 / 映画、複数選択可）
- 「推薦する」ボタン → Haiku が5冊推薦
- 「もう少し見たい」ボタン → 既出書籍を除外して追加5冊
- 「読みたい」ボタン → ブックメモ（localStorage）に追加
- 「もっとこういうの」ボタン → シグナル（genre + theme）を localStorage に蓄積、次回推薦に反映
- ブックメモ（折りたたみ・削除ボタン・件数表示）
- ローディング：Checker/Nuance と同じ糸が揺蕩う SVG アニメーション
- トースト通知（1.5秒）
- iOS Safari 自動ズーム防止（font-size: 16px）
- PWA 対応

### データ（localStorage・`fuel:` プレフィックス）

| キー | 内容 |
|---|---|
| `fuel:settings` | 設定BOXの本文 |
| `fuel:genres` | 選択中のジャンル配列 |
| `fuel:bookmarks` | ブックメモ配列（最新が先頭） |
| `fuel:signals` | 「もっとこういうの」の蓄積（最大10件） |

---

## ファイル構成

```
Fuel/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          UI本体
│   │   ├── index.css        グローバルCSS（iOS Safari対応）
│   │   ├── main.jsx         エントリーポイント
│   │   └── lib/
│   │       ├── prompt.js    プロンプト定義（{{...}} プレースホルダ置換）
│   │       ├── api.js       recommend() / extractJSON()
│   │       └── storage.js   localStorage ラッパー（fuel: プレフィックス）
│   ├── public/
│   │   └── manifest.json    PWA設定
│   ├── index.html
│   ├── vite.config.js       base: "/Fuel/"
│   ├── .env.local.example
│   └── package.json
├── worker/
│   ├── src/index.js         Cloudflare Workers（CORS + shared secret 認証）
│   └── wrangler.toml        name: filmfuel-proxy
├── .github/
│   └── workflows/deploy.yml  master push で自動デプロイ
├── .gitignore
├── HANDOFF.md               このファイル
└── README.md
```

---

## ローカル開発

```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.local に VITE_WORKER_URL と VITE_FUEL_SECRET を記入
npm run dev
# → http://localhost:5173/Fuel/
```

---

## 既知の問題・検討中の改善

### ハルシネーション問題（要検討）

書名は実在するが著者・出版社が違う出力が発生している。MVP では意図的に書誌検証を省いたが、実用上問題あり。

**検討中の対策：**
- 国立国会図書館サーチAPI（無料・APIキー不要・日本語書籍に強い）
- OpenBD API（`https://api.openbd.jp/`・ISBN で書誌情報を取得・日本語書籍特化）
- 両者を組み合わせて：Haiku に書名・著者だけ生成 → API で実在確認・正確な書誌情報を取得 → 表示

Amazon スクレイピングは利用規約違反のため採用しない。

現状は Opus と相談中。

---

## 残課題

### 近日対応

- **書誌検証の追加**（上記ハルシネーション問題の解決後）
- **アイコン・ロゴ画像の差し替え**：Asami さんが Futura イタリックで作成予定
  - `frontend/public/icon-192.png` / `icon-512.png` / `manifest.json` の icons
  - ヘッダーのテキスト `Fuel` を画像ロゴに差し替え

### v2 以降

- Lens / Nuance 履歴連携（統合フェーズで本格対応）
- ブックメモのエクスポート（JSON / CSV）
- ブックメモから Amazon 検索リンクをクリックで開く
- 推薦履歴の保存（同じ条件で何度も推薦したときの傾向把握）

---

## 連絡事項

- リポジトリは Public（GitHub Pages 無料枠の要件）
- ブランチは `master` 固定
- Lens(Checker) / Nuance リポジトリは別管理
- Checker → Lens への改名は Fuel 安定後に対応予定
