# Fuel 引き継ぎメモ

最終更新：2026-05-22（フェーズ2 実装完了） / リポジトリ：`TiB-Film251101/Fuel`

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

- `ANTHROPIC_API_KEY`
- `FUEL_SHARED_SECRET`

### GitHub Repository Secrets

- `VITE_WORKER_URL`
- `VITE_FUEL_SECRET`

---

## アプリの現在地（フェーズ2）

### 動いているもの

- **3タブ UI**（探す / 読みたい / 読んだ）
  - タブ選択状態はリロードで「探す」に戻る（localStorage 非保存）
- **探すタブ**
  - 設定BOX（textarea・500ms debounce 自動保存）
  - ジャンルフィルタ（国内文芸 / 翻訳文芸 / 哲学・評論 / 詩・短歌・俳句 / 映画、複数選択可）
  - 「探す」ボタン（右寄せ）→ Sonnet が5冊推薦
  - 各カード：読みたいボタン + Amazon 検索リンク
  - 「もう少し見たい」ボタン（既出書籍を除外して追加5冊）
  - 探すボタン押下時に textarea を blur（スマホのキーボードを閉じる）
  - 推薦完了後に結果エリアへ自動スクロール
  - ローディング：糸が揺蕩う SVG アニメーション
- **読みたいタブ**
  - 注釈表示（件数に応じて「直近10件を参考に探します」／「追加すると参考にします」）
  - 各エントリ：書名・著者・出版社・推薦理由（推薦由来の場合）・Amazon リンク・「読んだ」ボタン・削除ボタン
  - 「読んだ」→ エントリを読んだタブに移動
  - 手動追加フォーム（書名必須・著者任意）
- **読んだタブ**
  - 各エントリ：書名・著者・Amazon リンク・削除ボタン
  - 手動追加フォーム（書名必須・著者任意）
- iOS Safari 自動ズーム防止（font-size: 16px）
- PWA 対応
- トースト通知（1.5秒）

### データ（localStorage・`fuel:` プレフィックス）

| キー | 内容 |
|---|---|
| `fuel:settings` | 設定BOX 本文 |
| `fuel:genres` | 選択中ジャンル |
| `fuel:wantToRead` | 読みたいリスト（旧 fuel:bookmarks） |
| `fuel:readBooks` | 読んだリスト |

廃止：`fuel:signals`（「もっとこういうの」廃止に伴い）

### マイグレーション履歴

**2026-05-22（フェーズ2）**
- `fuel:bookmarks` → `fuel:wantToRead` にリネーム（起動時に自動移行）
- `fuel:signals` の既存データを削除（起動時に自動削除）

---

## ファイル構成

```
Fuel/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          UI本体（3タブ）
│   │   ├── index.css        グローバルCSS（iOS Safari対応）
│   │   ├── main.jsx         エントリーポイント
│   │   └── lib/
│   │       ├── prompt.js    プロンプト定義
│   │       ├── api.js       recommend() / extractJSON()
│   │       └── storage.js   localStorage ラッパー（fuel: プレフィックス）
│   ├── public/
│   │   └── manifest.json    PWA設定
│   ├── index.html
│   ├── vite.config.js       base: "/Fuel/"
│   ├── .env.local.example
│   └── package.json
├── worker/
│   ├── src/index.js         Cloudflare Workers
│   └── wrangler.toml        name: filmfuel-proxy
├── .github/
│   └── workflows/deploy.yml  master push で自動デプロイ
├── HANDOFF.md
└── .gitignore
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

Haiku 4.5 での頻発を受け、2026-05-21 に Sonnet 4.6 に切替え、動作観察中。
Amazon 検索リンクで本人がワンクリックで実在確認できるため、書誌検証 API は当面導入しない。
Sonnet でも頻発する場合は国会図書館サーチ + OpenBD の導入を検討。

---

## 残課題

### 近日対応

- Sonnet でもハルシネーションが残る場合：国立国会図書館サーチAPI + OpenBD で書誌検証を追加
- アイコン・ロゴ画像の差し替え（Asami さんが Futura イタリックで作成予定）

### v2 以降

- Lens / Nuance 履歴連携（統合フェーズで本格対応）
- ブックメモのエクスポート（JSON / CSV）
- 推薦履歴の保存
- 全ツール統合（Tauri による .exe 化）
- Checker → Lens への改名

---

## 連絡事項

- リポジトリは Public（GitHub Pages 無料枠の要件）
- ブランチは `master` 固定
- Lens(Checker) / Nuance リポジトリは別管理
