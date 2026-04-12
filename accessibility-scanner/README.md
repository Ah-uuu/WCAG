# Accessibility Scanner API

WCAG 2.1 Level AA 無障礙合規掃描後端，搭配 Lovable 前端使用。

## 技術架構

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Scanner**: axe-core + Puppeteer (headless Chrome)
- **PDF**: PDFKit（ACR 格式報告）
- **部署**: Render.com

---

## 本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env，填入你的 Chrome 路徑
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

---

## API 端點

### `GET /health`
健康檢查（Render 用）

**Response:**
```json
{ "status": "ok", "timestamp": "2026-04-12T10:00:00.000Z" }
```

---

### `POST /api/scan`
掃描網站，回傳 JSON 結果

**Request:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{
  "scanId": "uuid",
  "url": "https://example.com",
  "pageTitle": "Example Domain",
  "scannedAt": "2026-04-12T10:00:00.000Z",
  "wcagVersion": "WCAG 2.1 Level AA",
  "complianceScore": 72,
  "status": "WARNING",
  "summary": {
    "total": 5,
    "critical": 1,
    "serious": 2,
    "moderate": 1,
    "minor": 1,
    "passed": 13,
    "incomplete": 2
  },
  "violations": [
    {
      "id": "image-alt",
      "wcagCriteria": "1.1.1",
      "level": "A",
      "impact": "critical",
      "description": "...",
      "affectedElements": 3,
      "howToFix": "Add alt attribute...",
      "helpUrl": "https://dequeuniversity.com/..."
    }
  ]
}
```

---

### `POST /api/report/pdf`
掃描並回傳 PDF 報告（ACR 格式）

**Request:**
```json
{ "url": "https://example.com" }
```

**Response:** PDF 檔案下載（`Content-Type: application/pdf`）

---

### `POST /api/report/json`
同 `/api/scan`，專為前端顯示設計

---

## 部署到 Render

1. 把這個 repo 推上 GitHub
2. 在 Render 建立新的 **Web Service**
3. 選擇你的 repo
4. 設定：
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18
5. 在 Environment Variables 加入：
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGINS` = 你的 Lovable 網址
6. Deploy 🚀

> Render 使用 `@sparticuz/chromium`，不需要另外安裝 Chrome。

---

## Lovable 前端串接

在 Lovable 呼叫後端時，base URL 設定為你的 Render 網址：

```javascript
const BASE_URL = 'https://your-app.onrender.com';

// 掃描
const scan = await fetch(`${BASE_URL}/api/scan`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: inputUrl }),
});
const result = await scan.json();

// 下載 PDF
const pdf = await fetch(`${BASE_URL}/api/report/pdf`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: inputUrl }),
});
const blob = await pdf.blob();
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = 'accessibility-report.pdf';
link.click();
```

---

## Rate Limiting

免費版：每個 IP 每小時最多 **10 次**掃描請求。
可在 `src/index.js` 調整 `max` 值。
