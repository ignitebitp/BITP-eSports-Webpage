'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ModalType = 
  | null 
  | 'register' 
  | 'bracket' 
  | 'rules' 
  | 'stream' 
  | 'roster' 
  | 'proposal' 
  | 'roster-proposal'
  | 'ticket'
  | 'login';

export type ModalData = {
  title?: string;
};

interface ModalContextType {
  activeModal: ModalType;
  modalData: ModalData | null;
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  toastMessage: string | null;
  toastType: 'success' | 'info' | 'error';
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  playTacticalSound: (type?: 'click' | 'success' | 'beep') => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const playTacticalSound = (_type?: 'click' | 'success' | 'beep') => {};

  const openModal = (type: ModalType, data?: ModalData) => {
    playTacticalSound('click');
    setModalData(data ?? null);
    setActiveModal(type);
  };

  const closeModal = () => {
    playTacticalSound('click');
    setActiveModal(null);
    setModalData(null);
  };

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    playTacticalSound(type === 'success' ? 'success' : 'beep');
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <ModalContext.Provider
      value={{
        activeModal,
        modalData,
        openModal,
        closeModal,
        toastMessage,
        toastType,
        showToast,
        playTacticalSound,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useEsportsModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useEsportsModal must be used within a ModalProvider');
  }
  return context;
}
