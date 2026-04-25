import { useState } from "react";
import './index.css';
import ImagesToPdf from './components/ImagesToPdf'
import PdfToImages from './components/PdfToImages'
import ScanToPdf from './components/ScanToPdf'

function App() {
  const [activeTab, setActiveTab] = useState("imageTOpdf");

  return (
    <div className="app">

      <header className="app-header">
        <div className="brand">
          <div className="logo">PDF<span>4</span>YOU</div>
          <div className="tagline">Local · Private · No uploads</div>
        </div>
        <div className="header-badge">100% client-side</div>
      </header>

      {/* Tab Buttons */}
      <div className="tabs">
        <button
          className={activeTab === 'imageTOpdf' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab("imageTOpdf")}
        >
          Image to PDF
        </button>
        <button
          className={activeTab === 'pdfTOimage' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab("pdfTOimage")}
        >
          PDF to Image
        </button>
         <button
          className={activeTab === 'scanTOpdf' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('scanTOpdf')}
        >
          Scan to PDF
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "imageTOpdf" && <ImagesToPdf />}
        {activeTab === "pdfTOimage" && <PdfToImages />}
        {activeTab === "scanTOpdf" && <ScanToPdf />}
      </div>
    </div>
  );
}

export default App