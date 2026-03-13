import React, { useEffect } from 'react';

interface ToastProps {
    show: boolean;
    title: string;
    message: string;
    type?: 'success' | 'danger' | 'warning' | 'primary'; // Defines the header color
    duration?: number; // How long before it auto-closes (default 3 seconds)
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
    show,
    title,
    message,
    type = 'primary',
    duration = 3000,
    onClose
}) => {

    // Auto-close timer
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer); // Cleanup if closed manually
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    return (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999 }}>
            <div className="toast show shadow-lg border-0" role="alert" style={{ minWidth: '250px' }}>
                <div className={`toast-header bg-${type} text-white border-0`}>
                    <strong className="mr-auto">{title}</strong>
                    <button type="button" className="ml-2 mb-1 close text-white" onClick={onClose} style={{ outline: 'none' }}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="toast-body bg-white text-dark rounded-bottom">
                    {message}
                </div>
            </div>
        </div>
    );
};