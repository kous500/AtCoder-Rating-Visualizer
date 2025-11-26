# AtCoder Rating Visualizer

AtCoder Heuristic レーティングを視覚化します

### ページURL

https://kous500.github.io/AtCoder-Rating-Visualizer/

### ディレクトリ構造

project-root/
- index.html: HTML構造
- css/
  - style.css: スタイル定義
- js/
  - main.js:  アプリケーションの初期化・イベント制御（エントリーポイント）
  - api.js:  AtCoderデータの取得ロジック
  - logic.js:  レーティング計算・データ加工ロジック
  - renderer.js:  Canvas描画ロジック
  - utils.js:  ユーティリティ関数