import React, { useState } from 'react';
import AddProductWizard from './components/AddProductWizard';
import ProductExplorer from './components/ProductExplorer';
import { 
  PackagePlus, 
  Grid, 
  Settings, 
  Server, 
  Layers, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('add');
  const [apiBaseUrl, setApiBaseUrl] = useState(
    process.env.REACT_APP_API_URL || 'https://jaytraders-5.onrender.com'
  );
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(apiBaseUrl);

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    setApiBaseUrl(tempApiUrl);
    setShowSettingsModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Utility Header */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Utility Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-red-600 to-pink-600 rounded-2xl text-white shadow-md">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Jay Traders Utility
                </h1>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  Product Management Tool
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/60">
              <button
                onClick={() => setActiveTab('add')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'add'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PackagePlus className="h-4 w-4" />
                <span>Add Product</span>
              </button>

              <button
                onClick={() => setActiveTab('explorer')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'explorer'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="h-4 w-4" />
                <span>Catalog Explorer</span>
              </button>
            </div>

            {/* Server Settings Button */}
            <button
              onClick={() => {
                setTempApiUrl(apiBaseUrl);
                setShowSettingsModal(true);
              }}
              className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 transition-colors"
            >
              <Server className="h-4 w-4 text-red-600" />
              <span className="hidden sm:inline">Server Config</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'add' ? (
          <AddProductWizard 
            apiBaseUrl={apiBaseUrl} 
            onProductAdded={() => setActiveTab('explorer')} 
          />
        ) : (
          <ProductExplorer apiBaseUrl={apiBaseUrl} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Jay Traders Product Management Utility</p>
          <div className="flex items-center space-x-2 text-gray-500 font-medium">
            <span>Target API:</span>
            <span className="font-mono bg-gray-100 text-red-600 px-2 py-0.5 rounded text-[11px]">
              {apiBaseUrl}
            </span>
          </div>
        </div>
      </footer>

      {/* SERVER SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">Backend Server Config</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveApiUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Backend API Base URL
                </label>
                <input
                  type="text"
                  value={tempApiUrl}
                  onChange={(e) => setTempApiUrl(e.target.value)}
                  placeholder="http://localhost:5000 or https://jaytraders-5.onrender.com"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-red-500 focus:bg-white"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-gray-400 block">Quick Presets:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTempApiUrl('http://localhost:5000')}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-mono font-medium"
                  >
                    Local (5000)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempApiUrl('https://jaytraders-5.onrender.com')}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-mono font-medium"
                  >
                    Render Production
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
                >
                  Save URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
