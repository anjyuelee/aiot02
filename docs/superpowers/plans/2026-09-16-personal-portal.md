# 個人入口網站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把單頁「姓名 + 時鐘」改成含地區與目前天氣的個人入口網站。

**Architecture:** 純靜態三檔（`index.html` / `style.css` / `app.js`），無建置工具。`app.js` 以區段切分 clock / locations / geo / weather / ui / main；所有網路呼叫失敗一律 throw，由 `main` 決定 UI 狀態。主題以 `<html data-theme>` 切換 CSS 變數。

**Tech Stack:** HTML5、CSS3、原生 JavaScript（ES2020）、Open-Meteo Forecast API、BigDataCloud reverse-geocode-client、Geolocation API、localStorage。

**Spec:** `docs/superpowers/specs/2026-09-16-personal-portal-design.md`（所有細節以 spec 為準；本計畫不重複貼程式碼，實作與計畫在同一 session 完成）。

---

### Task 1: `index.html` 結構

**Files:** Modify `index.html`（整檔重寫，移除內嵌 style/script）

- [ ] 建立語意結構與固定 id：
  - `<header>`：`<h1>李安爵</h1>`、`<p class="en">Lee An Jyue</p>`、`<button id="locationBtn" aria-haspopup="dialog" aria-expanded="false">📍 <span id="locationName">—</span> ▾</button>`
  - `<section class="clock">`：`<time id="date">`、`<time id="time">`
  - `<section id="weather" class="card" data-state="loading">`：
    - `.weather-main`：`#wIcon`、`#wTemp`、`#wLabel`、`#wFeels`
    - `.weather-stats`：`#wHumidity`、`#wWind`、`#wRain`
    - `.weather-footer`：`<span id="wUpdated">`、`<button id="refreshBtn" aria-label="重新整理天氣">↻</button>`
    - `.weather-error`：文字 + `<button id="retryBtn">重試</button>`
  - `<p id="hint" class="hint" hidden>`
  - `<div id="locationDialog" role="dialog" aria-modal="true" aria-label="選擇地區" hidden>`：`<button id="useGeoBtn">📍 使用目前位置</button>`、`<p id="geoError" hidden>`、`<div id="cityGrid">`（由 JS 填入）、`<button id="closeDialogBtn" aria-label="關閉">✕</button>`
  - `<div id="backdrop" hidden>`
- [ ] `<html lang="zh-TW" data-theme="night">`，`<link rel="stylesheet" href="style.css">`，`<script src="app.js" defer>`
- [ ] 驗證：`python3 -m http.server 8000` 開啟，靜態文字都在、console 無 404。

### Task 2: `style.css`

**Files:** Create `style.css`

- [ ] `:root` 通用 token（字型、圓角、間距）；`[data-theme="day-clear" | "day-cloudy" | "night" | "rain"]` 各定義 `--bg-a`、`--bg-b`、`--fg`、`--muted`、`--accent`、`--card`
- [ ] `body`：min-height 100vh、漸層背景（`--bg-a` → `--bg-b`）、`transition: background 0.8s`、side padding ≥ 1rem
- [ ] `main`：max-width 32rem 置中；header 為 flex 兩端對齊，手機時換行
- [ ] 時鐘：`clamp()` 字級、`font-variant-numeric: tabular-nums`
- [ ] `.card`：半透明白 + `backdrop-filter: blur(16px)` + 邊框；`[data-state="loading"]` 顯示 skeleton（`.skeleton` 灰塊 + shimmer 動畫）、`[data-state="error"]` 顯示 `.weather-error` 並隱藏主內容、`[data-state="ready"]` 反之
- [ ] `#refreshBtn.spinning` 旋轉動畫
- [ ] 地區面板：`#backdrop` 全螢幕半透明；`#locationDialog` 置中卡片，`#cityGrid` 為 grid（手機 3 欄、≥640px 4 欄），`.city.active` 高亮
- [ ] `@media (prefers-reduced-motion: reduce)`：關閉所有 transition/animation
- [ ] 驗證：DevTools 手動切換 `data-theme` 四組、`data-state` 三組；400px 與 1280px 寬各看一次。

### Task 3: `app.js`

**Files:** Create `app.js`

- [ ] **clock**：`startClock()` — 沿用原本兩個 `Intl.DateTimeFormat`，每秒寫入 `#date` / `#time`，並設 `datetime` 屬性
- [ ] **locations**：`TAIWAN_CITIES = [{ name, lat, lon }, ...]` 22 筆；`DEFAULT_CITY = 臺中市`；`loadLocation()` 讀 `localStorage["portal.location"]`（JSON parse 失敗回 null）；`saveLocation(loc)`
- [ ] **geo**：`locateUser()` → Promise `{lat, lon}`（無 geolocation 直接 reject；timeout 8000、maximumAge 600000）；`reverseGeocode(lat, lon)` → 字串（`city || principalSubdivision`，任何錯誤回「目前位置」）
- [ ] **weather**：`fetchWeather(lat, lon)` → `{ temp, feels, humidity, wind, rain, code, isDay, time }`（`res.ok` 為 false 則 throw）；`describe(code, isDay)` → `{ label, icon, theme }`（對照表依 spec）；`themeByClock()` → 06–17 `day-clear` 否則 `night`
- [ ] **ui**：`setTheme(t)`、`renderLocation(name)`、`renderWeather(w)`（整數溫度、更新時間 HH:MM）、`setCardState('loading'|'ready'|'error', keepData)`、`setFooterNote(text)`、`showHint(text|null)`、`openDialog()` / `closeDialog()`（焦點管理、Esc、backdrop）、`renderCityGrid(activeName, onPick)`
- [ ] **main**：
  - `state = { location: null, weather: null }`
  - `refresh()`：spinning → `fetchWeather` → 成功 `renderWeather` + `setTheme` + `setCardState('ready')`；失敗：有舊資料 → `setFooterNote('更新失敗，顯示上次資料')`，無 → `setCardState('error')`
  - `useLocation(loc, { save })`：設 state、`renderLocation`、可選 `saveLocation`、`refresh()`
  - `init()`：`setTheme(themeByClock())`、`startClock()`、`renderCityGrid`、綁事件；`loadLocation()` 有 → `useLocation(loc, {save:false})`；無 → `locateUser()` → `reverseGeocode` → `useLocation({name,lat,lon},{save:true})`；catch → `useLocation(DEFAULT_CITY,{save:false})` + `showHint('已使用預設地區，可允許定位或手動選擇')`
  - `useGeoBtn`：同定位流程，失敗在 `#geoError` 顯示「無法取得位置」
  - `setInterval(refresh, 600000)`；`visibilitychange` 為 visible 時 `refresh()`
- [ ] 驗證：跑 spec「驗證方式」第 2–7 項；另用 `node --check app.js` 確認語法。

### Task 4: README

**Files:** Modify `README.md`

- [ ] 更新簡介（個人入口網站）、功能（時間／地區／天氣／主題）、資料來源表（兩個 API + 免金鑰說明）、專案結構（三檔）
- [ ] 驗證：通讀一次，與實際行為一致。

### Task 5: 收尾

- [ ] `git status` 確認只有預期檔案異動
- [ ] 依 commit-message skill 格式 commit（含 spec 與 plan）、push（需使用者同意）
- [ ] 部署後開 https://anjyuelee.github.io/aiot02/ 驗證 HTTPS 下定位與 API 皆正常
