import { useState } from "react";
import './index.css';
import ImagesToPdf from './components/ImagesToPdf'

function App() {
  const [activeTab, setActiveTab] = useState("imageTOpdf");

  return (
    <div className="app">

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
        {activeTab === "pdfTOimage" && (
          <div className="tab-page">
            <h2>PDF to Image</h2>
            <p>Convert your PDFs to image format.</p>
          </div>
        )}
        {activeTab === "scanTOpdf" && (
          <div className="tab-page">
            <h2>Scan to PDF</h2>
            <p>Convert your scanned documents to PDF format.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;