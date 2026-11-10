'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#262a36] bg-[#0c0e14] py-8 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto mt-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Brand */}
        <div className="space-y-1">
          <Link href="/" className="font-headline-sm uppercase text-white font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#88c425]"></span>
            <span className="normal-case">BITPeSports</span>
          </Link>
          <p className="font-body-sm text-[#94a3b8]">
            Official Student Esports & Gaming Community
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-label-caps">
          <Link href="/" className="text-[#94a3b8] hover:text-[#88c425] transition-colors">
            Home
          </Link>
          <Link href="/events" className="text-[#94a3b8] hover:text-[#88c425] transition-colors">
            Events
          </Link>
          <Link href="/about" className="text-[#94a3b8] hover:text-[#88c425] transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="text-[#94a3b8] hover:text-[#88c425] transition-colors">
            Contact
          </Link>
          <a
            href="https://discord.gg/rXHBTSDkcf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#94a3b8] hover:text-[#88c425] transition-colors"
          >
            Discord
          </a>
          <a
            href="https://www.instagram.com/bitpesports.gg/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#94a3b8] hover:text-[#88c425] transition-colors"
          >
            Instagram
          </a>
        </div>
      </div>

      <div className="border-t border-[#1e222b] mt-6 pt-4 text-xs font-body-sm text-[#64748b] flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>© 2025 <span className="normal-case">BITPeSports</span>. All rights reserved.</div>
        <div className="font-label-mono-sm text-[11px] text-[#64748b]">
          EA FC • VALORANT • FREE FIRE • BGMI
        </div>
      </div>
    </footer>
  );
}
