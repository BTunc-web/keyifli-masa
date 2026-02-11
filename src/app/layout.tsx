import React from "react";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keyifli Masa",
  description: "Ev yapımı lezzetler, online sipariş",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontSize: "16px",
              borderRadius: "16px",
              padding: "12px 20px",
              fontFamily: "Quicksand, sans-serif",
            },
            success: {
              style: { background: "#e8f5e9", color: "#2e7d32" },
            },
            error: {
              style: { background: "#ffebee", color: "#c62828" },
            },
          }}
        />
      </body>
    </html>
  );
}