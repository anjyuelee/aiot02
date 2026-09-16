# 個人入口網站設計（天氣 × 地區 × 時間）

日期：2026-09-16
狀態：已與使用者確認

## 目標

把現有的「姓名 + 時鐘」單頁改成個人入口網站，顯示：

1. 現在時間（日期含星期、24 小時制時間，每秒更新）
2. 地區（瀏覽器定位優先，可從台灣 22 縣市清單手動切換，選擇會記住）
3. 目前天氣（溫度、體感、天氣狀況、濕度、風速、降雨機率）

不做：快捷連結區、逐時／多日預報、使用者帳號。

## 限制

- 部署在 GitHub Pages，純靜態、無後端 → API 金鑰無法隱藏，只能用免金鑰服務。
- 不使用建置工具、不引入框架或外部字型／套件。
- 頁面語言為繁體中文（`zh-TW`）。

## 資料來源（已用 curl 驗證）

| 用途 | 服務 | 端點 / 參數 | 備註 |
|---|---|---|---|
| 目前天氣 | Open-Meteo Forecast | `https://api.open-meteo.com/v1/forecast?latitude=&longitude=&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code,is_day&timezone=auto` | 回傳 `current` 物件與 `current_units` |
| 座標 → 地名 | BigDataCloud reverse-geocode-client | `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=&longitude=&localityLanguage=zh-Hant` | 取 `principalSubdivision`（ISO 3166-2 縣市層級），空則取 `city`。`city` 在臺北會誤回「新北市」，故不優先使用 |
| 手動切換 | 程式內常數 | 台灣 22 縣市名稱與代表座標（市政府所在地） | Open-Meteo / Nominatim 地名搜尋對中文輸入不可靠，故不做搜尋框 |

## 檔案結構

```
index.html   # 結構與語意標記，引用 style.css / app.js
style.css    # 版面、主題、動畫
app.js       # 時鐘、地區、天氣、UI 狀態
README.md    # 更新功能與資料來源說明
```

## 版面（手機優先，單欄置中；桌機加大留白，不改欄位）

```
┌──────────────────────────────────────┐
│ 李安爵                    📍 臺中市 ▾ │  ← header：姓名 + 地區膠囊按鈕
│ Lee An Jyue                          │
│                                      │
│        2026年9月16日 星期三           │
│           20:42:15                   │  ← 主視覺：大時鐘（tabular-nums）
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ☀️  25°          大致晴朗         │ │
│ │     體感 27°                     │ │
│ │ ──────────────────────────────── │ │
│ │ 💧 濕度 70%  💨 9 km/h  ☂ 0%     │ │
│ │                    更新於 20:30 ↻│ │
│ └──────────────────────────────────┘ │
│           已使用預設地區（提示，僅定位失敗時顯示）│
└──────────────────────────────────────┘
```

### 地區面板

點地區膠囊開啟覆蓋式面板（`role="dialog"`）：

- 最上方一顆「📍 使用目前位置」按鈕
- 下方 22 縣市按鈕格（手機 3 欄、桌機 4 欄），目前選擇高亮
- Esc、點面板外、點縣市後關閉；開啟時焦點移入面板，關閉時回到膠囊

### 天氣卡狀態

| 狀態 | 顯示 |
|---|---|
| 載入中（無資料） | skeleton 佔位，↻ 旋轉 |
| 載入中（有舊資料） | 舊資料維持顯示，↻ 旋轉 |
| 成功 | 圖示、整數溫度、狀況文字、體感、濕度／風速／降雨機率、更新時間 |
| 失敗（無資料） | 「天氣資料載入失敗」+「重試」按鈕 |
| 失敗（有舊資料） | 舊資料維持，頁尾改為「更新失敗，顯示上次資料」 |

### 主題（背景漸層）

以 `<html data-theme>` 切換，CSS 變數定義四組：

| theme | 條件 |
|---|---|
| `rain` | weather_code 屬於雨／雪／雷雨群（51–67、71–86、95–99） |
| `night` | 非 rain 且 `is_day === 0` |
| `day-clear` | 非 rain、白天、code 0–1 |
| `day-cloudy` | 非 rain、白天、code ≥ 2 |

天氣尚未載入前，依本地時間 06:00–17:59 用 `day-clear`，其餘 `night`，避免閃爍。主題切換以 0.8s transition；`prefers-reduced-motion` 時關閉動畫。

## 行為

### 初始化流程

1. 立即渲染時鐘（不等網路）。
2. 讀 `localStorage["portal.location"]`（`{ name, lat, lon }`）。
   - 有 → 直接用它抓天氣。
   - 無 → 呼叫 `navigator.geolocation.getCurrentPosition`（timeout 8s、maximumAge 10 min）。
     - 成功 → 反查地名（失敗則名稱用「目前位置」）→ 存 localStorage → 抓天氣。
     - 失敗／不支援 → 用預設「臺中市」抓天氣，**不存** localStorage，顯示提示「已使用預設地區」。下次開啟會再嘗試定位。
3. 每 10 分鐘自動重抓天氣；`visibilitychange` 回到前景時也重抓。

### 使用者操作

- 選縣市 → 存 localStorage → 關面板 → 抓天氣。
- 「使用目前位置」→ 同初始化的定位成功／失敗路徑；失敗時面板內顯示「無法取得位置」，不改變目前地區。
- ↻ 或「重試」→ 以目前地區重抓。

### WMO 天氣代碼對照

| code | 文字 | 圖示（日 / 夜） |
|---|---|---|
| 0 | 晴朗 | ☀️ / 🌙 |
| 1 | 大致晴朗 | 🌤️ / 🌙 |
| 2 | 局部多雲 | ⛅ / ☁️ |
| 3 | 陰天 | ☁️ |
| 45, 48 | 霧 | 🌫️ |
| 51, 53, 55 | 毛毛雨 | 🌦️ |
| 56, 57, 66, 67 | 凍雨 | 🌧️ |
| 61, 63, 65 | 小雨 / 中雨 / 大雨 | 🌧️ |
| 71, 73, 75, 77 | 降雪 | 🌨️ |
| 80, 81, 82 | 陣雨 | 🌦️ |
| 85, 86 | 陣雪 | 🌨️ |
| 95 | 雷雨 | ⛈️ |
| 96, 99 | 雷雨伴冰雹 | ⛈️ |
| 其他 | 未知 | ❔ |

## app.js 內部分工（單檔，以區段與函式切分）

| 區段 | 職責 | 依賴 |
|---|---|---|
| `clock` | 每秒更新日期／時間 DOM | `Intl.DateTimeFormat` |
| `locations` | `TAIWAN_CITIES` 常數、`loadLocation()` / `saveLocation()` | localStorage |
| `geo` | `locateUser()` → `{lat, lon}`；`reverseGeocode(lat, lon)` → 地名 | Geolocation API、BigDataCloud |
| `weather` | `fetchWeather(lat, lon)` → 正規化物件；`describe(code, isDay)` → `{label, icon, theme}` | Open-Meteo |
| `ui` | 渲染天氣卡各狀態、地區面板開關、提示文字、主題切換 | DOM |
| `main` | 串接初始化流程、定時更新、事件綁定 | 以上全部 |

每個函式輸入輸出明確，`fetch` 失敗一律 throw，由 `main` 統一決定顯示哪種狀態。

## 驗證方式

無自動化測試框架；以手動驗證為準：

1. `python3 -m http.server` 開啟，桌機與手機寬度（~400px）各檢查版面。
2. 定位允許 → 顯示實際縣市與天氣；重新整理不再詢問定位。
3. 定位拒絕 → 顯示臺中市 + 提示；重新整理後仍會嘗試（瀏覽器記住拒絕則快速失敗）。
4. 面板選高雄市 → 卡片更新、膠囊文字更新、重新整理後保留。
5. 斷網後按 ↻ → 舊資料保留、頁尾顯示更新失敗；清除 localStorage 後斷網 → 顯示錯誤與重試。
6. 鍵盤：Tab 到膠囊、Enter 開面板、Esc 關閉、焦點回到膠囊。
7. 用 DevTools 改系統時間或手動塞不同 weather_code 確認四組主題。
