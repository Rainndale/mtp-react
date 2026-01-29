import React from 'react';
import Modal from './Modal';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false, // Deprecated, use variant="danger"
    variant = "info", // 'danger' | 'warning' | 'info' | 'success'
    showCancel = true
}) => {
    // Backward compatibility
    if (isDanger) variant = "danger";

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return (
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-trash-can text-3xl text-rose-500"></i>
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-triangle-exclamation text-3xl text-amber-500"></i>
                    </div>
                );
            case 'success':
                return (
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-check-circle text-3xl text-[#22c55e]"></i>
                    </div>
                );
            case 'info':
            default:
                return (
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-floppy-disk text-3xl text-[var(--accent-blue)]"></i>
                    </div>
                );
        }
    };

    const getButtonClass = () => {
        switch (variant) {
            case 'danger':
                return 'bg-rose-600 hover:bg-rose-700';
            case 'warning':
                return 'bg-amber-500 hover:bg-amber-600';
            case 'success':
                return 'bg-[#22c55e] hover:bg-green-600';
            case 'info':
            default:
                return 'bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)]';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex-1 overflow-y-auto min-h-0 -ml-1 pl-1 -mr-2 pr-2">
                <div className="text-center">
                    {getIcon()}
                    <h2 className="text-2xl font-black text-[var(--text-main)] italic uppercase mb-4 text-center leading-none">{title}</h2>
                    {message && <p className="text-[var(--text-muted)] mb-8 text-sm text-center">{message}</p>}
                </div>
            </div>
            <div className="flex-shrink-0 pt-4 mt-auto">
                <button
                    onClick={onConfirm || onClose}
                    className={`w-full py-4 font-bold rounded-lg text-sm mb-2 shadow-lg text-white ${getButtonClass()}`}
                >
                    {confirmText}
                </button>
                {showCancel && (
                    <button
                        onClick={onClose}
                        className="w-full py-4 text-[var(--text-muted)] font-bold hover:text-[var(--text-main)] transition-all text-sm text-center"
                    >
                        {cancelText}
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
