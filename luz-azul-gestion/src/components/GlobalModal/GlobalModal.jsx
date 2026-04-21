import { useModal } from '../../contexts/ModalContext';
import ModalPrompt from '../ModalPrompt/ModalPrompt';

const GlobalModal = () => {
  const { modalState, closeModal, handleConfirm } = useModal();

  return (
    <ModalPrompt
      show={modalState.show}
      onHide={closeModal}
      title={modalState.title}
      body={modalState.body}
      onConfirm={handleConfirm}
    />
  );
};

export default GlobalModal;
