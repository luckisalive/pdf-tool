# PDF4YOU

> **Local · Private · No uploads** — a fully client-side PDF toolkit that runs entirely in your browser.

![100% client-side](https://img.shields.io/badge/processing-100%25%20client--side-e8ff47?style=flat-circle&labelColor=111111)
![No server](https://img.shields.io/badge/server-none-e8ff47?style=flat-circle&labelColor=111111)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-circle&labelColor=111111)
![Vite](https://img.shields.io/badge/Vite-latest-646cff?style=flat-circle&labelColor=111111)

##### [Vist PDF4YOU](https://pdf4you.vercel.app/)

---

## Features

PDF4YOU currently offers three tools, accessible via a tab-based interface:

| Tool | Description |
|------|-------------|
| **Image → PDF** | Combine multiple images (JPG, PNG, WEBP) into a single PDF. Drag to reorder pages before converting. |
| **PDF → Images** | Extract every page of a PDF as a high-resolution PNG. Download individually or all at once in a zip file. |
| **Scan → PDF** | Use your device camera to scan physical documents page by page and export as a PDF. |

All processing happens **in the browser** — your files are never sent to any server.

---

## NOTE-

There is upload limit & file_count limit to prevent crashing of browser or denial of service on the client.
- PdfToImages: 100 MB per PDF limit and 200 pages max.
- ImagesToPdf: 20 MB per image and 100 images max.
- ScanToPdf: 100 max frame count(images).
>You can change limits by running the build locally.

--- 

## Tech Stack

- **[React 18](https://react.dev/)** — UI framework
- **[Vite](https://vitejs.dev/)** — build tooling & dev server
- **[pdf-lib](https://pdf-lib.js.org/)** — PDF creation and manipulation
- **[pdfjs-dist](https://mozilla.github.io/pdf.js/)** — PDF rendering to canvas (loaded on demand)

---

## Steps to run locally

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/luckisalive/pdf-tool.git
cd pdf4you
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

Output will be in the `dist/` directory — ready to deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

---

## Project Structure

```
public/
├── favicon.svg
src/
├── components/
│   ├── ImagesToPdf.jsx
│   ├── PdfToImages.jsx
│   └── ScanToPdf.jsx
├── App.css
├── App.jsx
├── index.css
└── main.jsx
.gitignore
README.md
LICENSE.md
eslint.config.js
index.html
package-lock.json
package.json
vite.config.js
```

---

## Privacy

PDF4YOU is designed with privacy first:

- **No file uploads** — all conversion happens locally via browser APIs
- **No analytics or tracking**
- **No backend** — the app is entirely static
- Files never leave your device

---

## Browser Support

Requires a modern browser with support for:

- [File API](https://caniuse.com/fileapi)
- [Canvas API](https://caniuse.com/canvas)
- [MediaDevices API](https://caniuse.com/stream) *(Scan to PDF only — requires HTTPS)*

Tested on Chrome, Firefox, Edge, and Safari (latest versions).

---

## License

[MIT](LICENSE)
