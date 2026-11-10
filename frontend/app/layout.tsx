import type { Metadata } from "next";
import "./globals.css";
import { ModalProvider } from "@/context/ModalContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EsportsModals from "@/components/EsportsModals";
import Toast from "@/components/Toast";

export const metadata: Metadata = {
  title: "BITPeSports | Campus Gaming & Collegiate Esports",
  description: "Official student-led gaming and esports club. Competitive varsity qualifiers, weekly local meetups, 18 tournament PC rigs in Student Union Room 204.",
  keywords: ["BITPeSports", "Collegiate Esports", "Campus Gaming", "Student Union", "Valorant", "Rocket League", "Smash Bros", "NACE Starleague", "ECAC"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Hanken+Grotesk:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0b0e] text-[#e2e2ea] antialiased min-h-screen flex flex-col font-body-md selection:bg-[#cdf200] selection:text-[#0c0e14]">
        <ModalProvider>
          <Navbar />
          <div className="flex-grow flex flex-col">
            {children}
          </div>
          <Footer />
          <EsportsModals />
          <Toast />
        </ModalProvider>
      </body>
    </html>
  );
}
