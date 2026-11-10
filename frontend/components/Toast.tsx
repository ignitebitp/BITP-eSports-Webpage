'use client';

import React from 'react';
import { useEsportsModal } from '@/context/ModalContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toastMessage, toastType, showToast } = useEsportsModal();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-200">
      <div className={`p-4 border bg-[#0c0e14] shadow-2xl flex items-start gap-3 ${
        toastType === 'success' 
          ? 'border-[#cdf200] text-white' 
          : toastType === 'error'
          ? 'border-[#ff3344] text-white'
          : 'border-[#33343b] text-white'
      }`}>
        {toastType === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-[#cdf200] shrink-0 mt-0.5" />
        ) : toastType === 'error' ? (
          <AlertCircle className="w-5 h-5 text-[#ff3344] shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 text-[#cdf200] shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="font-label-mono-sm text-[#cdf200] uppercase tracking-wider text-[11px] mb-0.5">
            TERMINAL // NOTIFICATION
          </div>
          <p className="font-body-sm text-[#e2e2ea] leading-snug">
            {toastMessage}
          </p>
        </div>
        <button
          onClick={() => showToast('', 'info')}
          className="text-[#8f96a3] hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
