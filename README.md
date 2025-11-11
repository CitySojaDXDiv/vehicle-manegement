# 車両予約運行管理システム

総社市デジタル推進課向けの車両予約＆運行記録管理システムです。

## 概要

GitHub Pages + Google Sheets + Google Apps Script で構築された、
コストゼロで運用可能な車両管理システムです。

## 主な機能

### ✅ 実装済み機能（プロトタイプ版）

* **ダッシュボード**
  - 車両稼働状況の可視化
  - 本日の予約一覧
  - 走行距離・燃費の統計表示
  - 車検・点検期限アラート

* **予約管理**
  - カレンダー形式での予約
  - 空き車両の自動検索
  - 重複予約の防止
  - 予約の編集・削除

* **運行記録**
  - 出発時入力（酒気帯び確認含む）
  - 帰着時入力（給油記録・燃料残量）
  - 走行距離の自動計算
  - 運転前後の酒気帯び確認記録

* **車両マスタ**
  - 車両情報の一覧表示
  - 車検・点検期限の管理

### 🔜 今後実装予定

* メール通知機能
* 詳細レポート出力
* 部署別権限管理
* データエクスポート
* 予約承認フロー

## 技術スタック

* **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
* **UIフレームワーク**: Bootstrap 5
* **グラフ**: Chart.js
* **アイコン**: Font Awesome
* **バックエンド**: Google Apps Script
* **データベース**: Google Sheets
* **ホスティング**: GitHub Pages

## セットアップ

### 1. Google Sheetsの準備

1. [こちら](https://docs.google.com/spreadsheets/d/1iy_tbzG8W-Som6DL1E8OXm4ZFop6jbU9jTGSefgcQq0/edit)のスプレッドシートをコピー
2. 「車両マスタ」「予約データ」「運行記録」「統計」の4シートを確認

### 2. Google Apps Scriptの設定

1. スプレッドシートで「拡張機能」→「Apps Script」
2. Code.gsのコードを貼り付け
3. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」
4. アクセス権限を「全員」に設定
5. WebアプリのURLをコピー

### 3. GitHubリポジトリの設定

1. このリポジトリをクローン
2. `js/config.js`のGAS_API_URLを更新
3. GitHub Pagesを有効化（Settings → Pages → main branch）

### 4. アクセス

`https://citysojadxdiv.github.io/vehicle-manegement/`

## ディレクトリ構成

vehicle-management/
├── index.html # ダッシュボード
├── reservation.html # 予約管理
├── driving-record.html # 運行記録
├── vehicle-master.html # 車両マスタ
├── css/
│ └── style.css # カスタムスタイル
├── js/
│ ├── config.js # API設定
│ ├── common.js # 共通関数
│ ├── dashboard.js # ダッシュボード機能
│ ├── reservation.js # 予約機能
│ ├── driving-record.js # 運行記録機能
│ └── vehicle-master.js # 車両マスタ機能
└── README.md # このファイル


## 使い方

### 予約の流れ

1. 「予約管理」画面で日付・時間を選択
2. 利用可能な車両から選択
3. 使用者情報・行先・用務を入力
4. 「予約登録」をクリック

### 運行記録の流れ

1. **出発時**: 「運行記録」→「出発時入力」
   - 車両選択、天気、車両状況を入力
   - 運転前の酒気帯び確認を実施
   - 「出発記録を登録」をクリック

2. **帰着時**: 「運行記録」→「帰着時入力」
   - 終業時メーター、給油情報を入力
   - 運転後の酒気帯び確認を実施
   - 特記事項があれば記入
   - 「帰着記録を登録」をクリック

## セキュリティ

* Google Apps ScriptのWeb App認証
* スプレッドシートの共有設定で制限
* 編集履歴の自動保存

## ライセンス

MIT License

## 開発者

総社市デジタル推進課

## サポート

質問・要望は Issue でお願いします。