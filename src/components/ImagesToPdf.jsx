import { useState } from "react";
import { PDFDocument } from "pdf-lib";

function ImagesToPdf() {
    const [images, setImages] = useState([]);
    const [status, setStatus] = useState("");

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
    
    async function convertToPdf() {
        setStatus("Converting...")
        
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
    }

    function removeImage(index) {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }

    return (
        <div>
            <h2>Images to PDF Converter</h2>
            <p className="subtitle">Upload images to convert them into a single PDF file.</p>

            {/*File Picker*/}
            <div
                className="file-drop-area"
                onClick={() => document.getElementById('fileInput').click()}
            >
                Click to select images (JPG, PNG)
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
            <div className="preview-container">
                {images.map((image, index) => (
                    <div key={index} className="img-card">
                        <img src={image.src} alt={image.name} />
                        <button className="remove-btn" onClick={() => removeImage(index)}>Remove</button>
                        <span className="page-num">{index + 1}</span>
                    </div>
                ))}
            </div>

            {/*Action Button*/}
            {images.length > 0 && (
                <div className="actions">
                    <button className="convert-btn" onClick={convertToPdf}>Convert to PDF</button>
                    <button onClick={() => { setImages([]); setStatus('')}}>
                        Clear All
                    </button>
                </div>
            )}

            {status && <p className="status">{status}</p>}
        </div>
    )
}

export default ImagesToPdf;