# aiot02 — AIoT 第二堂課作業

一個純 HTML / CSS / JavaScript 的個人入口網站，顯示姓名、現在時間、所在地區與目前天氣。
本專案為 AIoT 課程第二堂課的練習，透過 GitHub Pages 部署。

🔗 線上預覽：<https://anjyuelee.github.io/aiot02/>

## 功能

- **現在時間**：每秒更新，顯示日期（含星期）與 24 小時制時間，以 `zh-TW` 格式呈現
- **地區**：首次開啟會詢問瀏覽器定位並自動辨識所在縣市；也可從台灣 22 縣市清單手動切換，選擇會記在 `localStorage`。拒絕定位時退回預設的臺中市
- **目前天氣**：溫度、體感溫度、天氣狀況、濕度、風速、降雨機率；每 10 分鐘自動更新，分頁切回前景時也會更新，可手動重新整理
- **動態主題**：背景漸層依「白天晴 / 白天多雲 / 夜晚 / 雨」自動切換
- 響應式設計、鍵盤可操作（Esc 關閉面板、焦點管理）、尊重 `prefers-reduced-motion`
- 無任何外部相依套件、不需建置工具

## 資料來源

| 用途 | 服務 | 備註 |
|---|---|---|
| 目前天氣 | [Open-Meteo](https://open-meteo.com/) Forecast API | 免金鑰，支援 CORS |
| 座標 → 縣市名稱 | [BigDataCloud](https://www.bigdatacloud.com/) reverse-geocode-client | 免金鑰，僅在允許定位時呼叫 |

因為部署在 GitHub Pages（純靜態、無後端），API 金鑰無法隱藏，所以只使用免金鑰的服務。

## 技術

- HTML5
- CSS3（CSS 變數、`@property` 漸層過渡、`backdrop-filter`、Grid / Flexbox、`clamp()`）
- 原生 JavaScript（Geolocation API、`fetch`、`Intl.DateTimeFormat`、`localStorage`）
- GitHub Pages

## 本機執行

不需要安裝任何東西。因為會呼叫外部 API 與定位，建議用靜態伺服器開啟（而非直接雙擊檔案）：

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

## 專案結構

```
.
├── index.html   # 頁面結構
├── style.css    # 版面、主題、動畫
├── app.js       # 時鐘、地區、天氣、UI 狀態
└── README.md
```

## 作者

李安爵 Lee An Jyue
