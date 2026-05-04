import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";

const MAX_FILE_SIZE = 20 // 20MB
const MAX_IMAGES = 100 // 100 images

const validTypes = ["image/jpeg", "image/png", "image/webp"]

async function validateImageMagicBytes(file) {
  const header = await file.slice(0, 12).arrayBuffer()
  const bytes  = new Uint8Array(header)
 
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
  const isPng  = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
  const isWebp =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
 
  return isJpeg || isPng || isWebp
}

function ImagesToPdf() {
    const [images, setImages]       = useState([]);
    const [status, setStatus]       = useState("");
    const [statusType, setStatusType] = useState("");
    const [dragOver, setDragOver]   = useState(false);
    const dragItem   = useRef(null);
    const dragTarget = useRef(null);
 
    async function handleFiles(files) {
        const incoming = Array.from(files)
        const remaining = MAX_IMAGES - images.length 
 
        if (remaining <= 0) {
            setStatus(`Maximum of ${MAX_IMAGES} images reached.`)
            setStatusType("error")
            return
        }
 
        const toProcess = incoming.slice(0, remaining)
        if (toProcess.length < incoming.length) {
            setStatus(`Only ${remaining} image slot${remaining !== 1 ? "s" : ""} remaining. Extra files were ignored.`)
            setStatusType("error")
        }
 
        for (const file of toProcess) {
            if (!validTypes.includes(file.type)) {
                setStatus(`"${file.name}" is not an accepted format. Use JPG, PNG, or WebP.`)
                setStatusType("error")
                continue
            }
 
            if (file.size > MAX_FILE_SIZE * 1024 * 1024) {
                setStatus(`"${file.name}" exceeds the ${MAX_FILE_SIZE} MB limit.`)
                setStatusType("error")
                continue
            }
 
            const valid = await validateImageMagicBytes(file)
            if (!valid) {
                setStatus(`"${file.name}" does not appear to be a valid image file.`)
                setStatusType("error")
                continue
            }
 
            const reader = new FileReader()
            reader.onload = (e) => {
                setImages((prev) => [...prev, { name: file.name, src: e.target.result }])
            }
            reader.readAsDataURL(file)
        }
    }
 
    function onDropZoneDrop(e) {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
    }

    function onCardDragStart(e, index) {
        dragItem.current = index
    }
    function onDragEnter(index) {
        dragTarget.current = index
    }

    function onCardDragEnd() {
        const from = dragItem.current
        const to = dragTarget.current
        if (from === null || to === null || from === to) return;
        setImages((prev) => {
            const arr = [...prev]
            const [moved] = arr.splice(from, 1)
            arr.splice(to, 0, moved)
            return arr
        })
        dragItem.current = null
        dragTarget.current = null
    }

    async function convertToPdf() {
        setStatus("Converting...")
        setStatusType("loading")
        let url = null
        try {
            const pdfDoc = await PDFDocument.create()
            for (const image of images) {
                const isJpeg = image.src.includes("data:image/jpeg")
                const isPng  = image.src.includes("data:image/png")

                let bytes
                if (isJpeg || isPng) {
                    const base64 = image.src.split(",")[1]
                    bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
                } else {
                    const img = new Image()
                    await new Promise((res) => {
                        img.onload = () => res()
                        img.src = image.src
                    })
                    const canvas = document.createElement("canvas")
                    canvas.width = img.width
                    canvas.height = img.height
                    const ctx = canvas.getContext("2d")
                    ctx.drawImage(img, 0, 0)
                    const pngDataUrl = canvas.toDataURL("image/png")
                    const base64 = pngDataUrl.split(",")[1]
                    bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
                }

                const embedded = (isJpeg)
                    ? await pdfDoc.embedJpg(bytes)
                    : await pdfDoc.embedPng(bytes)

                const page = pdfDoc.addPage([595, 842])
                const scale = Math.min(555 / embedded.width, 802 / embedded.height)
                const width = embedded.width * scale
                const height = embedded.height * scale

                page.drawImage(embedded, {
                    x: (595 - width) / 2,
                    y: (842 - height) / 2,
                    width: width,
                    height: height,
                })
            }

            const pdfBytes = await pdfDoc.save()
            const blob = new Blob([pdfBytes], { type: "application/pdf" })
            url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "converted.pdf"
            a.click()
            
            setStatus(`Conversion complete! ${images.length} images converted.`)
            setStatusType("success")
        } catch (err) {
            setStatus("Error: " + err.message)
            setStatusType("error")
        } finally {
            if (url) URL.revokeObjectURL(url)
        }
    }

    function removeImage(index) {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }
    function clearAll() {
        setImages([])
        setStatus("")
        setStatusType("")
    }

    return (
        <div>
            <h2 className="section-title">Images → PDF</h2>
            <p className="subtitle">Upload images to convert them into a single PDF. Drag images to reorder them.</p>

            {/*File Drop Zone*/}
            <div
                className={`file-drop-area ${dragOver ? "drag-over" : ""}`}
                onClick={() => document.getElementById("fileInput").click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDropZoneDrop}
            >
                <span className="drop-icon">📁</span>
                <span className="drop-label">Drop images here</span>
                <span className="drop-hint">or click to browse | JPG, PNG, WEBP</span>
                <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    style={{ display: "none" }}
                />
            </div>
            
            {status && (
                <p className={`status ${statusType}`}>
                    {statusType === "loading" && <span className="spinner" />}
                    {status}
                </p>
            )}

            {/*Image Previews*/}
            {images.length > 0 && (
                <>
                <p className="drag-hint">Drag images to reorder them.</p>
                <div className="preview-container">
                    {images.map((image, index) => (
                        <div 
                            key={index} 
                            className="img-card"
                            draggable
                            onDragStart={() => onCardDragStart(index)}
                            onDragEnter={() => onDragEnter(index)}
                            onDragEnd={onCardDragEnd}
                        >
                            <img src={image.src} alt={image.name} />
                            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeImage(index)}}>X</button>
                            <span className="page-num">{index + 1}</span>
                        </div>
                    ))}
                </div>
            
                <div className="actions">
                    <button className="convert-btn" onClick={convertToPdf}>↓ Convert to PDF</button>
                    <button className="ghost-btn" onClick={clearAll}>Clear all</button>
                </div>
                </>
            )}
        </div>
    );
}

export default ImagesToPdf;