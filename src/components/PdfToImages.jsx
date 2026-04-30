import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const MAX_FILE_SIZE = 100 // 100MB
const MAX_PAGES = 100 // 100 pages

function PdfToImages() {
  const [pages, setPages]         = useState([])
  const [status, setStatus]       = useState("")
  const [statusType, setStatusType] = useState("")
  const [_loading, setLoading]     = useState(false)
  const [dragOver, setDragOver]   = useState(false)

  async function handlePdf(file) {
    if (!file) return
    if (file.type !== "application/pdf") {
      setStatus("Please select a valid PDF file.")
      setStatusType("error")
      return
    }

    if (file.size > MAX_FILE_SIZE * 1024 * 1024) {
      setStatus(`File too large. Please select a PDF under ${MAX_FILE_SIZE} MB.`)
      setStatusType("error")
      return
    }
    
    setPages([])
    setStatus("Loading PDF…")
    setStatusType("loading")
    setLoading(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      if (pdfDoc.numPages > MAX_PAGES) {
        setStatus(`PDF has ${pdfDoc.numPages} pages, which exceeds the limit of ${MAX_PAGES}. Please select a smaller PDF.`)
        setStatusType("error")
        setLoading(false)
        return
      }

      setStatus(`Rendering ${pdfDoc.numPages} page${pdfDoc.numPages !== 1 ? "s" : ""}…`)

      const rendered = []
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page     = await pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale: 2 })
        const canvas   = document.createElement("canvas")
        canvas.width   = viewport.width
        canvas.height  = viewport.height
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise
        rendered.push(canvas.toDataURL("image/png"))
        setStatus(`Rendering page ${i} / ${pdfDoc.numPages}…`)
      }

      setPages(rendered)
      setStatus(`✓ ${rendered.length} page${rendered.length !== 1 ? "s" : ""} extracted`)
      setStatusType("success")
    } catch (err) {
      setStatus("Error: " + err.message)
      setStatusType("error")
    }
    setLoading(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handlePdf(file)
  }

  function downloadPage(src, index) {
    const a    = document.createElement("a")
    a.href     = src
    a.download = `page-${index + 1}.png`
    a.click()
  }

  function downloadAll() {
    pages.forEach((src, i) => downloadPage(src, i))
  }

  return (
    <div>
      <h2 className="section-title">PDF → Images</h2>
      <p className="subtitle">Each page becomes a high-resolution PNG you can download.</p>

      <div
        className={`file-drop-area${dragOver ? " drag-over" : ""}`}
        onClick={() => document.getElementById("pdfInput").click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <span className="drop-icon">📄</span>
        <span className="drop-label">Drop a PDF here</span>
        <span className="drop-hint">or click to browse</span>
        <input
          id="pdfInput"
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => handlePdf(e.target.files[0])}
        />
      </div>

      {status && (
        <p className={`status ${statusType}`} style={{ marginBottom: "16px" }}>
          {statusType === "loading" && <span className="spinner" />}
          {status}
        </p>
      )}

      {pages.length > 0 && (
        <>
          <div className="actions">
            <button className="convert-btn" onClick={downloadAll}>↓ Download all pages</button>
          </div>
          <p className="drag-hint" style={{ marginBottom: "12px" }}>
            Click any page to download it individually
          </p>
          <div className="preview-container">
            {pages.map((src, index) => (
              <div
                key={index}
                className="img-card"
                onClick={() => downloadPage(src, index)}
                style={{ cursor: "pointer" }}
                title={`Download page ${index + 1}`}
              >
                <img src={src} alt={`Page ${index + 1}`} />
                <span className="page-num">{index + 1}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default PdfToImages