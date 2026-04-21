import { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    show: false,
    title: 'Modal title',
    body: 'Modal body',
    onConfirm: null,
  });

  const openModal = (title = 'Modal title', body = 'Modal body', onConfirm = null) => {
    setModalState({
      show: true,
      title,
      body,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      show: false,
    }));
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    closeModal();
  };

  return (
    <ModalContext.Provider value={{ modalState, openModal, closeModal, handleConfirm }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal debe ser usado dentro de ModalProvider');
  }
  return context;
};
