import "./globals.css";

export const metadata = {
  title: "Omzetra Management Dashboard",
  description: "Sistem Analisis Penjualan Harian dan Insight Otomatis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
        {children}
      </body>
    </html>
  );
}
