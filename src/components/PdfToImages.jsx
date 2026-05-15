import { useState, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import JSZip from "jszip"

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const MAX_FILE_SIZE = 100 // 100MB per file
const MAX_PAGES = 200 // 200 pages
const MAX_PAGES_WARNING = 150

function PdfToImages() {
  const [pages, setPages]         = useState([])
  const [status, setStatus]       = useState("")
  const [statusType, setStatusType] = useState("")
  const [_loading, setLoading]     = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const [zipping, setZipping]     = useState(false)
  const abortRef = useRef(false)

  async function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
      if (file.type !== "application/pdf") {
        setStatus(`"${file.name}" is not a PDF. skipped.`)
        setStatusType("error")
        return false
      }
      
      if (file.size > MAX_FILE_SIZE * 1024 * 1024) {
        setStatus(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Max size is ${MAX_FILE_SIZE} MB. skipped.`)
        setStatusType("error")
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    abortRef.current = false
    setLoading(true)
    setStatus("")
    setStatusType("")

    let runningTotal = pages.length
    const newPages = []

    for(let fi = 0; fi < validFiles.length; fi++) {
      if (abortRef.current) break
      const file = validFiles[fi]
      setStatus(`Processing "${file.name}" (${fi + 1} of ${validFiles.length})…`)
      setStatusType("loading")
      
      try {
        let arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        arrayBuffer = null // free memory

        const availableSlots = MAX_PAGES - runningTotal
        if (availableSlots <= 0) {
          setStatus(`Reached maximum page limit of ${MAX_PAGES}. Some pages were not processed.`)
          setStatusType("error")
          break
        }

        const pagesToProcess = Math.min(pdfDoc.numPages, availableSlots)
        const truncated = pagesToProcess < pdfDoc.numPages

        for(let pi = 1; pi <= pagesToProcess; pi++) {
          if (abortRef.current) break
          const page = await pdfDoc.getPage(pi)
          const viewport = page.getViewport({ scale: 2 }) // 2x for better quality
          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise
          newPages.push({ 
            src: canvas.toDataURL("image/png"), 
            docName: file.name, 
            pageNum: pi 
          })
          runningTotal++
          setStatus(`Processing "${file.name}" (${pi} of ${pagesToProcess}...`)
        }

        if (truncated) {
          setStatus(`"${file.name}" has ${pdfDoc.numPages} pages, but only ${pagesToProcess} were processed to stay within the ${MAX_PAGES} page limit.`)
          setStatusType("error")
          break
        }
      } catch (err) {
        setStatus(`Error processing "${file.name}": ${err.message}`)
        setStatusType("error")
      }
    }

    if (newPages.length > 0) {
      setPages(prev => {
        const combined = [...prev, ...newPages]
        if (!abortRef.current) {
          setStatus(`Successfully processed ${combined.length} page${combined.length > 1 ? "s" : ""}.`)
          setStatusType("success")
        }
        return combined
      })
    }
    setLoading(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (!_loading) handleFiles(e.dataTransfer.files)
  }

  function downloadPage(page) {
    const safeName = page.docName.replace(/\.pdf$/i, "")
    const a    = document.createElement("a")
    a.href     = page.src
    a.download = `${safeName}_page${page.pageNum}.png`
    a.click()
  }

  async function downloadAll() {
    if (pages.length === 0 || zipping) return
    setZipping(true)
    setStatus("Building ZIP…")
    setStatusType("loading")
    let url = null
    try {
      const zip = new JSZip()
      for (const page of pages) {
        const safeName = page.docName.replace(/\.pdf$/i, "")
        const filename = `${safeName}_page-${page.pageNum}.png`
        const base64 = page.src.split(",")[1]
        zip.file(filename, base64, { base64: true })
      }
      const blob = await zip.generateAsync({ type: "blob" })
      url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "pages.zip"
      a.click()
      setStatus(`✓ ${pages.length} page${pages.length !== 1 ? "s" : ""} downloaded as ZIP`)
      setStatusType("success")
    } catch (err) {
      setStatus("ZIP error: " + err.message)
      setStatusType("error")
    } finally {
      if (url) URL.revokeObjectURL(url)
      setZipping(false)
    }
  }
 


  function clearAll() {
    abortRef.current = true
    setPages([])
    setStatus("")
    setStatusType("")
    setLoading(false)
  }

  return (
    <div>
      <h2 className="section-title">PDF → Images</h2>
      <p className="subtitle">Each page becomes a high-resolution PNG you can download.</p>

      {pages.length >= MAX_PAGES_WARNING && (
        <div className="warn-banner">
          <span>⚠</span>
          <span>
            <strong>{pages.length} pages loaded.</strong> You're approaching the {MAX_PAGES}-page limit.
            Large volumes of rendered PNGs can strain browser memory.
          </span>
        </div>
      )}
 

      <div
        className={`file-drop-area${dragOver ? " drag-over" : ""}`}
        onClick={() => !_loading && document.getElementById("pdfInput").click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{ cursor: _loading ? "not-allowed" : "pointer", opacity: _loading ? 0.6 : 1 }}
      >
        <span className="drop-icon">📄</span>
        <span className="drop-label">{_loading ? "Processing..." : "Drop a PDF here"}</span>
        <span className="drop-hint">or click to browse</span>
        <input
          id="pdfInput"
          type="file"
          accept="application/pdf"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
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
            <button className="convert-btn" onClick={downloadAll} disabled={_loading}>
              ↓ Download all pages ({pages.length})
            </button>
            <button className="ghost-btn" onClick={clearAll}>
              Clear all
            </button>
          </div>
          <p className="drag-hint" style={{ marginBottom: "12px" }}>
            Click any page to download it individually
          </p>
          <div className="preview-container">
            {pages.map((page, index) => (
              <div
                key={index}
                className="img-card"
                onClick={() => downloadPage(page)}
                style={{ cursor: "pointer" }}
                title={`Download page ${index + 1}`}
              >
                <img src={page.src} alt={`Page ${index + 1}`} />
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