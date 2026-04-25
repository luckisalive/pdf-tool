import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";

function ImagesToPdf() {
    const [images, setImages] = useState([]);
    const [status, setStatus] = useState("");
    const [statusType, setStatusType] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const dragItem = useRef(null);
    const dragTarget = useRef(null);

    function handleFiles(files) {
        Array.from(files).forEach((file) => {
            if (!file.type.startsWith("image/")) return
            const reader = new FileReader()
            reader.onload = (e) => {
                setImages((prev) => [...prev, { name: file.name, src: e.target.result }])
            }
            reader.readAsDataURL(file);
        })
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
        try {
            const pdfDoc = await PDFDocument.create()
            for (const image of images) {
                const isJpeg = image.src.includes("data:image/jpeg")

                const base64 = image.src.split(",")[1]

                const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

                const embedded = isJpeg
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
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "converted.pdf"
            a.click()
            URL.revokeObjectURL(url)

            setStatus(`Conversion complete! ${images.length} images converted.`)
            setStatusType("success")
        } catch (err) {
            setStatus("Error: " + err.message)
            setStatusType("error")
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
 
                {status && (
                    <p className={`status ${statusType}`}>
                        {statusType === "loading" && <span className="spinner" />}
                        {status}
                    </p>
                )}
                </>
            )}
        </div>
    );
}

export default ImagesToPdf;