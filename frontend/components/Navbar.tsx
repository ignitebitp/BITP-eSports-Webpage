'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEsportsModal } from '@/context/ModalContext';
import { LogOut, Menu, User, X } from 'lucide-react';
import { CONTACT_INFO } from '@/data/esportsData';

type AdminSessionUser = {
  id: string;
  email: string;
  username: string | null;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR';
};

const AUTH_CHANGED_EVENT = 'admin-auth-changed';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminSessionUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { showToast } = useEsportsModal();

  useEffect(() => {
    const syncFromLogin = (event: Event) => {
      const { detail } = event as CustomEvent<AdminSessionUser | null>;
      setAdminUser(detail);
      setProfileOpen(false);
    };

    const refreshAdminSession = () => {
      void fetch('/api/admin/logout', { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) {
            setAdminUser(null);
            return;
          }
          const data = await response.json();
          setAdminUser(data.authenticated ? data.user : null);
        })
        .catch(() => setAdminUser(null));
    };

    refreshAdminSession();
    window.addEventListener(AUTH_CHANGED_EVENT, syncFromLogin);
    window.addEventListener('focus', refreshAdminSession);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncFromLogin);
      window.removeEventListener('focus', refreshAdminSession);
    };
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Could not sign out.');
      setAdminUser(null);
      window.dispatchEvent(new CustomEvent<AdminSessionUser | null>(AUTH_CHANGED_EVENT, { detail: null }));
      showToast('Signed out successfully.');
    } catch {
      showToast('Could not sign out. Please try again.', 'error');
    } finally {
      setLoggingOut(false);
      setProfileOpen(false);
      setMobileMenuOpen(false);
    }
  }

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Events', href: '/events' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
  ];

  return (
    <header className="w-full border-b border-[#33343b] bg-[#111319] sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between h-16">
        {/* Brand / Logo */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-headline-md tracking-wider uppercase text-[#e2e2ea] font-bold flex items-center gap-2 group hover:text-white transition-colors"
          >
            <Image
              src="/resources/brand/BITPeSports-logo.jpg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-cover transition-transform group-hover:scale-110"
            />
            <span className="normal-case">BITPeSports</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 xl:gap-10">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-link px-1 py-2 transition-colors duration-150 ${
                  isActive
                    ? 'border-b-2 border-[#cdf200] text-[#cdf200] font-bold'
                    : 'text-[#8f96a3] hover:text-[#e2e2ea]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Trailing Actions */}
        <div className="flex items-center gap-3">
          <a
            href={CONTACT_INFO.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#cdf200] text-[#0c0e14] font-label-caps uppercase px-4 py-2 hover:bg-white transition-colors duration-150 font-bold tracking-wider text-[13px]"
          >
            JOIN DISCORD
          </a>

          {adminUser && (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label={`Profile menu for ${adminUser.name}`}
                className="flex items-center gap-2 border border-[#33343b] bg-[#1d1f26] px-3.5 py-2 text-[#e2e2ea] transition-colors hover:border-[#cdf200] hover:text-white"
              >
                <User className="h-4 w-4 text-[#cdf200]" />
                <span className="max-w-32 truncate font-label-caps text-[13px] font-bold uppercase tracking-wider">
                  {adminUser.username ? `@${adminUser.username}` : adminUser.name}
                </span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-[#33343b] bg-[#111319] p-2 shadow-xl">
                  <div className="border-b border-[#33343b] px-3 py-2">
                    <p className="truncate text-sm font-bold text-[#e2e2ea]">{adminUser.username ? `@${adminUser.username}` : adminUser.name}</p>
                    <p className="truncate text-xs text-[#8f96a3]">{adminUser.email}</p>
                    <p className="mt-1 text-xs font-bold tracking-wider text-[#cdf200]">{adminUser.role}</p>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setProfileOpen(false)}
                    className="block px-3 py-2 text-sm text-[#e2e2ea] hover:bg-[#1d1f26]"
                  >
                    Admin panel
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#e2e2ea] hover:bg-[#1d1f26] disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4 text-[#cdf200]" />
                    {loggingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#8f96a3] hover:text-[#e2e2ea] border border-[#33343b] bg-[#1d1f26]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#33343b] bg-[#0c0e14] px-4 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="font-label-mono-sm text-[#8f96a3] uppercase tracking-wider pb-2 border-b border-[#262a36] flex justify-between">
            <span>TERMINAL NAVIGATION</span>
            <span className="text-[#cdf200]">CAMPUS DIVISION</span>
          </div>
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 font-headline-sm uppercase tracking-wide border flex items-center justify-between ${
                    isActive
                      ? 'border-[#cdf200] bg-[#1d1f26] text-[#cdf200]'
                      : 'border-[#262a36] bg-[#12141a] text-[#8f96a3] hover:text-[#e2e2ea]'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-2 h-2 bg-[#cdf200]"></span>}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#262a36] flex flex-col gap-2">
            <a
              href={CONTACT_INFO.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-[#cdf200] text-[#0c0e14] py-2.5 font-label-caps font-bold uppercase tracking-wider"
            >
              JOIN DISCORD
            </a>
            {adminUser && (
              <>
                <div className="border border-[#33343b] bg-[#1d1f26] px-3 py-2 text-center">
                  <p className="font-bold text-[#e2e2ea]">{adminUser.name}</p>
                  <p className="text-xs text-[#8f96a3]">{adminUser.role}</p>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full border border-[#33343b] bg-[#1d1f26] py-2.5 text-center font-label-caps font-bold uppercase tracking-wider text-[#e2e2ea]"
                >
                  Admin panel
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  disabled={loggingOut}
                  className="flex w-full items-center justify-center gap-2 border border-[#33343b] bg-[#1d1f26] py-2.5 font-label-caps font-bold uppercase tracking-wider text-[#e2e2ea] disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4 text-[#cdf200]" />
                  {loggingOut ? 'SIGNING OUT…' : 'SIGN OUT'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
