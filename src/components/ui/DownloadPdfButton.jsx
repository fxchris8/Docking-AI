"use client";
import { useEffect, useState } from "react";

export default function AutoDownloadHandler({ fileName }) {
  const [status, setStatus] = useState("Menyiapkan dokumen...");

  useEffect(() => {
    const generatePdf = async () => {
      try {
        // 1. Beri jeda 800ms agar logo dan font termuat sempurna
        await new Promise((resolve) => setTimeout(resolve, 800));

        setStatus("Mengunduh PDF...");
        
        // 2. Import html2pdf secara dinamis
        const html2pdf = (await import("html2pdf.js")).default;
        const element = document.getElementById("print-container");

        const opt = {
          margin:       0.5,
          filename:     fileName || "Laporan_Docking.pdf",
          image:        { type: "jpeg", quality: 1 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: "in", format: "a4", orientation: "portrait" },
        };

        // 3. Eksekusi PDF dan TUNGGU sampai selesai
        await html2pdf().set(opt).from(element).save();

        setStatus("Selesai! Menutup tab...");
        
        // 4. Tutup tab otomatis setelah jeda singkat
        setTimeout(() => {
          window.close();
        }, 500);

      } catch (error) {
        setStatus("Gagal mengunduh PDF. Silakan tutup tab ini manual.");
        console.error("PDF Error:", error);
      }
    };

    generatePdf();
  }, [fileName]);

  return (
    <div className="fixed inset-0 bg-[#130b24] z-[999] flex flex-col items-center justify-center text-white">
      {/* Loading Spinner */}
      <svg className="animate-spin h-12 w-12 text-[#6f16ae] mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h2 className="text-xl font-bold tracking-wide">{status}</h2>
      <p className="text-gray-400 mt-2 text-sm">Mohon jangan tutup halaman ini.</p>
    </div>
  );
}

// "use client";

// export default function DownloadPdfButton({ fileName }) {
//   const handleDownload = async () => {
//     // Import secara dinamis HANYA saat tombol diklik (Bypass SSR)
//     const html2pdf = (await import("html2pdf.js")).default;

//     const element = document.getElementById("print-container");

//     const opt = {
//       margin:       0.5,
//       filename:     fileName || "Laporan_Docking.pdf",
//       image:        { type: "jpeg", quality: 1 },
//       html2canvas:  { scale: 2, useCORS: true }, 
//       jsPDF:        { unit: "in", format: "a4", orientation: "portrait" },
//     };

//     html2pdf().set(opt).from(element).save();
//   };

//   return (
//     <button
//       onClick={handleDownload}
//       className="mt-8 p-10 bg-[#6f16ae] hover:bg-[#5a118c] text-white font-bold rounded-xl shadow-lg transition-all print:hidden"
//     >
//       Download PDF
//     </button>
//   );
// }