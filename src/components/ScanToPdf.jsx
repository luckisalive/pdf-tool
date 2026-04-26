import { useState, useEffect, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'

function ScanToPdf() {
  const [frames, setFrames]         = useState([])
  const [status, setStatus]         = useState('')
  const [statusType, setStatusType] = useState('')
  const [cameraActive, setCameraActive] = useState(false)

  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => () => stopCamera(), [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current       = stream
      videoRef.current.srcObject = stream
      setCameraActive(true)
      setStatus('')
      setStatusType('')
    } catch (err) {
      setStatus('Camera error: ' + err.message)
      setStatusType('error')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  function captureFrame() {
    const video  = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setFrames(prev => {
      const next = [...prev, dataUrl]
      setStatus(`${next.length} page${next.length !== 1 ? 's' : ''} captured`)
      setStatusType('')
      return next
    })
  }

  function removeFrame(index) {
    setFrames(prev => prev.filter((_, i) => i !== index))
  }

  async function convertToPdf() {
    setStatus('Building PDF…')
    setStatusType('loading')
    try {
      const pdfDoc = await PDFDocument.create()
      for (const dataUrl of frames) {
        const base64  = dataUrl.split(',')[1]
        const bytes   = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
        const embedded = await pdfDoc.embedJpg(bytes)
        const page    = pdfDoc.addPage([embedded.width, embedded.height])
        page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height })
      }
      const pdfBytes = await pdfDoc.save()
      const blob     = new Blob([pdfBytes], { type: 'application/pdf' })
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = 'scan.pdf'
      a.click()
      URL.revokeObjectURL(url)
      setStatus(`✓ ${frames.length} page${frames.length !== 1 ? 's' : ''} saved as PDF`)
      setStatusType('success')
    } catch (err) {
      setStatus('Error: ' + err.message)
      setStatusType('error')
    }
  }

  return (
    <div>
      <h2 className="section-title">Scan → PDF</h2>
      <p className="subtitle">Use your camera to scan documents page by page, then export as PDF.</p>

      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: cameraActive ? 'block' : 'none' }}
      />

      {/* Controls */}
      <div className="actions">
        {!cameraActive ? (
          <button className="primary-btn" onClick={startCamera}>
            ⊙ Start Camera
          </button>
        ) : (
          <>
            <button className="convert-btn" onClick={captureFrame}>
              ● Capture Page
            </button>
            <button className="ghost-btn" onClick={stopCamera}>Stop</button>
          </>
        )}
        {frames.length > 0 && (
          <button className="primary-btn" onClick={convertToPdf}>
            ↓ Save PDF ({frames.length})
          </button>
        )}
      </div>

      {status && (
        <p className={`status ${statusType}`} style={{ marginTop: '12px' }}>
          {statusType === 'loading' && <span className="spinner" />}
          {status}
        </p>
      )}

      {/* Captured frames */}
      {frames.length > 0 && (
        <>
          <hr className="divider" />
          <div className="preview-container">
            {frames.map((src, i) => (
              <div key={i} className="img-card">
                <img src={src} alt={`Scan ${i + 1}`} />
                <button className="remove-btn" onClick={() => removeFrame(i)}>✕</button>
                <span className="page-num">{i + 1}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ScanToPdf