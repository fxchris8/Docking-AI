"use client";
import { useState } from "react";

const isImage = (url) => /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
const isPDF = (url) => /\.pdf(\?.*)?$/i.test(url);

export default function LampiranViewer({ urls }) {
  const [selectedUrl, setSelectedUrl] = useState(null);
  const closePreview = () => setSelectedUrl(null);

  // Fungsi untuk mendapatkan nama file dari URL
  const getFileName = (url) => {
    const parts = url.split("/");
    return parts[parts.length - 1] || "file";
  };

  return (
    <>
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-lg font-bold text-[#1a113c]">Lampiran Dokumen</h2>
        <span className="text-xs text-gray-500">{urls.length} file</span>
      </div>
      {urls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {urls.map((url, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedUrl(url)}
              className="cursor-pointer bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-[#2e004f] hover:shadow-md transition-all group"
            >
              <div className="h-24 bg-gray-100 flex items-center justify-center text-gray-400">
                {isImage(url) ? (
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,88v96a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h96Z" fill="none" stroke="currentColor" strokeWidth="16"/>
                    <polyline points="152 32 152 88 208 88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  </svg>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-gray-700 truncate">
                  Dokumen {idx + 1}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {getFileName(url)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          Tidak ada lampiran dokumen.
        </p>
      )}

      {/* Popup Preview + Download */}
      {selectedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </button>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <p className="text-lg font-bold text-[#1a113c]">
                  {getFileName(selectedUrl)}
                </p>
                <a
                  href={selectedUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#2e004f] text-white rounded-lg text-sm font-medium hover:bg-[#1a0035] flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"/>
                  </svg>
                  Download
                </a>
              </div>
              {isImage(selectedUrl) ? (
                <img
                  src={selectedUrl}
                  alt="Preview"
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
              ) : isPDF(selectedUrl) ? (
                <iframe
                  src={selectedUrl}
                  className="w-full h-[70vh] rounded-lg border"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Format file tidak didukung untuk preview.</p>
                  <a
                    href={selectedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block px-4 py-2 bg-[#2e004f] text-white rounded-lg text-sm font-medium hover:bg-[#1a0035]"
                  >
                    Unduh / Buka File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}