# Fuel 引き継ぎメモ

最終更新：2026-05-21（フェーズ1 実装完了） / リポジトリ：`TiB-Film251101/Fuel`

## このドキュメントの目的

新規セッションで作業を引き継ぐための、決定事項・現状・残課題のまとめ。

詳細仕様は `Fuel設計.md` が最終仕様。`Lens_Nuance_Fuel_概略.md` は世界観参照用で実装判断には使わない。

---

## プロジェクト概要

執筆中の「燃料切れ」を補う書籍推薦ツール。作家 Film(Asami Suda) 専用。
設定とジャンルを指定して「探す」を押すだけで、Claude Sonnet が執筆者の現在地に合った本を5冊提案する。

---

## インフラ構成

| 項目 | 内容 |
|---|---|
| フロントエンド | GitHub Pages（`https://tib-film251101.github.io/Fuel/`） |
| APIプロキシ | Cloudflare Workers（`https://filmfuel-proxy.tib-film251101.workers.dev`） |
| AIモデル | `claude-sonnet-4-6`（temperature: 0.5） |
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

### 動いているもの（フェーズ1）

- 設定BOX（textarea・500ms debounce で localStorage 自動保存）
- ジャンルフィルタ（国内文芸 / 翻訳文芸 / 哲学・評論 / 詩・短歌・俳句 / 映画、複数選択可）
- 「探す」ボタン → Sonnet が5冊推薦
- 各カード下部に Amazon 検索リンク（書名＋著者でフロント側組み立て）
- 「もう少し見たい」ボタン → 既出書籍を除外して追加5冊
- 「読みたい」ボタン → ブックメモ（localStorage）に追加
- 「もっとこういうの」ボタン → シグナル（genre + theme）を localStorage に蓄積、次回推薦に反映
- ブックメモ（折りたたみ・削除ボタン・件数表示・各エントリに Amazon 検索リンク）
- 「探す」ボタン押下時に textarea を blur（スマホのキーボードを閉じる）
- 推薦完了後に結果エリアへ自動スクロール
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

### ハルシネーション問題

MVP の Haiku 4.5 では書名と著者の組み合わせ違い・完全架空の本が頻発した。
2026-05-21 に Sonnet 4.6 に切替え、動作観察中。
Amazon 検索リンクで本人がワンクリックで実在確認できるため、書誌検証 API は当面導入しない。
Sonnet でも頻発する場合は国会図書館サーチ + OpenBD の導入を検討。

---

## 残課題

### 近日対応

- Sonnet でもハルシネーションが残る場合：国立国会図書館サーチAPI + OpenBD で書誌検証を追加
- アイコン・ロゴ画像の差し替え（Asami さんが Futura イタリックで作成予定）
  - `frontend/public/icon-192.png` / `icon-512.png` / `manifest.json` の icons
  - ヘッダーのテキスト `Fuel` を画像ロゴに差し替え

### フェーズ2 予定

フェーズ1 の動作確認後に着手：

1. UI を「探す」「お気に入り」の2タブ構造に変更
2. お気に入り直近10件を推薦プロンプトに含める
3. お気に入りタブ内に「直近10件を参考に探します」の注釈を表示

フェーズ2 の仕様詳細は別途依頼する。

### v2 以降

- Lens / Nuance 履歴連携（統合フェーズで本格対応）
- ブックメモのエクスポート（JSON / CSV）
- 推薦履歴の保存

---

## 連絡事項

- リポジトリは Public（GitHub Pages 無料枠の要件）
- ブランチは `master` 固定
- Lens(Checker) / Nuance リポジトリは別管理
- Checker → Lens への改名は Fuel 安定後に対応予定
