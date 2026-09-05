# ごま部屋

Astroで作った、ごまの制作物と記録を置くための小さな個人サイトです。

## コマンド

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

## Postsの追加

`src/content/posts/` にMarkdownファイルを追加します。

```md
---
title: 記事タイトル
description: 記事ページに表示する短い説明
publishedAt: 2026-08-27
---

ここから本文です。
```

追加した記事はトップページと `/posts/` に自動で表示され、ファイル名を使ったURLで公開されます。

## TILの追加

Postsと同じfrontmatterで、`src/content/tils/` にMarkdownファイルを追加します。
追加したTILはトップページと `/til/` に表示されます。

## Worksの追加

`src/data/works.ts` の配列へ、タイトル・説明・必要ならURLを追加します。
トップページと `/works/` に同じ一覧が表示されます。

## UI

ホームは黒いHeroから始まり、その下に通常の情報ページが続きます。
ヘッダーのテーマボタンはライトテーマを初期値にし、手動選択は `localStorage` に保存します。

## OPEN TERMINAL

全ページ下部のターミナルでは、サイト内移動や簡単なコマンドを実行できます。
履歴、出力、開閉状態、入力途中の文字列は同じタブの `sessionStorage` に保存されます。
ホームではHeroを通過すると入口が表示され、保存済みの開状態がある場合はそちらを優先します。

コマンドは `src/components/Terminal.astro` の `commands` に定義されています。
`hidden: true` を指定したコマンドは `help` の一覧に表示されません。
