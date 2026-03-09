import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isSlide?: boolean; // <-- NEW PROP FOR OFF-PAGE MODALS
}

export const Modal: React.FC<ModalProps> = ({
    isOpen, onClose, title, children, footer, size = 'md', isSlide = false
}) => {
    useEffect(() => {
        if (isOpen) document.body.classList.add('modal-open');
        else document.body.classList.remove('modal-open');
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose}></div>
            <div
                // If isSlide is true, we add the prototype's sliding classes
                className={`modal fade show ${isSlide ? 'modal-shortcut modal-slide right' : ''}`}
                style={{ display: 'block', zIndex: 1050 }}
                tabIndex={-1}
                role="dialog"
            >
                {/* If sliding, it doesn't use modal-dialog-centered */}
                <div className={`modal-dialog ${!isSlide ? 'modal-dialog-centered' : ''} modal-${size}`} role="document">
                    <div className="modal-content shadow-lg border-0">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="close" onClick={onClose}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        {/* The prototype uses p-4 padding for sliding calendar modals */}
                        <div className={`modal-body ${isSlide ? 'p-4' : ''}`}>
                            {children}
                        </div>
                        {footer && (
                            <div className="modal-footer d-flex justify-content-between">
                                {footer}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};