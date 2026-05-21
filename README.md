# Fuel

執筆中の燃料切れを補う書籍推薦ツール。作家 Film (Asami Suda) 専用。

## 概要

設定とジャンルを指定して「推薦する」を押すだけ。Claude Haiku が執筆者の現在地に合った本を5冊提案する。

## 開発

```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.local に VITE_WORKER_URL と VITE_FUEL_SECRET を記入
npm run dev
```

## デプロイ

master への push で GitHub Actions が自動ビルド・デプロイ。

初回は [Fuel設計.md](../Fuel設計.md) のデプロイ手順を参照。
