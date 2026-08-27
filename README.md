# ごまの個人サイト

Astroで作った、ごまの制作物と記録を置くための小さな個人サイトです。

## コマンド

```sh
npm install
npm run dev
npm run build
npm run preview
```

## 記事の追加

`src/content/posts/` にMarkdownファイルを追加します。

```md
---
title: 記事タイトル
description: 記事の短い説明
publishedAt: 2026-08-27
---

ここから本文です。
```

追加した記事はトップページと `/posts/` に自動で表示され、ファイル名を使ったURLで公開されます。
