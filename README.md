# 檸檬手繪家 Lemon — 品牌官網

依 Figma「網站」頁（檸檬手繪家／桌機版 1440）製作的靜態網站，桌機與手機 RWD 都適用。不需要安裝任何套件。

## 本機預覽
在這個資料夾裡執行：
```bash
python3 -m http.server 5174
```
然後打開 http://localhost:5174

## 檔案
- `index.html`：頁面結構與文案
- `styles.css`：樣式與 RWD（斷點 1180 / 960 / 560px）
- `main.js`：互動（跑馬燈、主視覺輪播、滾動進場、FAQ 篩選、作品燈箱）
- `assets/`：從 Figma 匯出並壓縮過的 WebP 圖檔與網站圖示
- `favicon.ico`：瀏覽器頁籤圖示

## 聯絡連結
`main.js` 最上方的 `LINKS`：LINE 與 IG／FB 連結，改這裡即可全站生效。
