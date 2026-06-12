# Cato AI Security Chat

Cato AISec API (`/fw/v1/analyze`) に接続するシンプルなチャットアプリです。  
Vercel の Serverless Function を CORS プロキシとして使用します。

## 構成

```
├── api/
│   └── analyze.js      # Vercel Serverless Function (CORSプロキシ)
├── public/
│   └── index.html      # フロントエンド
└── vercel.json         # Vercel設定
```

## デプロイ方法

```bash
npm i -g vercel
vercel --prod
```

## 使い方

1. ブラウザでデプロイ先 URL を開く
2. **Guard Key** に Bearer トークンを入力
3. **接続テスト** で疎通確認
4. チャット開始

## API フロー

```
ブラウザ → /api/analyze (Vercel) → https://api.aisec.catonetworks.com/fw/v1/analyze
```

CORSはVercel側で解決するため、ブラウザから直接Catoに接続しません。
