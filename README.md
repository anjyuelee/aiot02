# aiot02 — AIoT 第二堂課作業

一個純 HTML / CSS / JavaScript 的個人頁面，顯示姓名與即時時鐘。
本專案為 AIoT 課程第二堂課的練習，透過 GitHub Pages 部署。

🔗 線上預覽：<https://anjyuelee.github.io/aiot02/>

## 功能

- 顯示中文姓名與英文姓名
- 即時時鐘：每秒更新，顯示日期（含星期）與 24 小時制時間
- 使用 `Intl.DateTimeFormat` 以 `zh-TW` 地區格式呈現
- 響應式設計，字級隨視窗寬度自動縮放（`clamp()`）
- 深色主題，無任何外部相依套件

## 技術

- HTML5
- CSS3（CSS 變數、Flexbox、`clamp()`）
- 原生 JavaScript（`Intl.DateTimeFormat`、`setInterval`）
- GitHub Pages

## 本機執行

不需要安裝任何東西，直接用瀏覽器開啟 `index.html` 即可：

```bash
open index.html
```

或用任一靜態伺服器：

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

## 專案結構

```
.
├── index.html   # 頁面本體（含樣式與時鐘腳本）
└── README.md
```

## 作者

李安爵 Lee An Jyue
