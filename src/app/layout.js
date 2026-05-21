import "./globals.css";

export const metadata = {
  title: "Admin Dashboard - Logistik Kapal",
  description: "Internal dashboard untuk nota maintenance kapal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-gray-50 text-black">
        {children}
      </body>
    </html>
  );
}
