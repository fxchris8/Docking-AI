import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "Admin Dashboard - Logistik Kapal",
  description: "Internal dashboard untuk nota maintenance kapal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="font-sans bg-[#130b24] text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
