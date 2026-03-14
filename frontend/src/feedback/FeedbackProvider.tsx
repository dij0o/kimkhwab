import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';

type FeedbackTone = 'success' | 'danger' | 'warning' | 'primary';

type ToastRequest = {
    id: number;
    title: string;
    message: string;
    type: FeedbackTone;
    duration: number;
};

type ConfirmRequest = {
    id: number;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmTone: FeedbackTone;
    resolve: (result: boolean) => void;
};

type NotifyOptions = {
    title?: string;
    message: string;
    type?: FeedbackTone;
    duration?: number;
};

type ConfirmOptions = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmTone?: FeedbackTone;
};

type FeedbackContextValue = {
    notify: (options: NotifyOptions) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const getDefaultTitle = (type: FeedbackTone): string => {
    if (type === 'success') {
        return 'Success';
    }

    if (type === 'danger') {
        return 'Error';
    }

    if (type === 'warning') {
        return 'Warning';
    }

    return 'Notice';
};

const getConfirmButtonClass = (tone: FeedbackTone): string => {
    if (tone === 'danger') {
        return 'btn btn-danger';
    }

    if (tone === 'success') {
        return 'btn btn-success text-white';
    }

    if (tone === 'warning') {
        return 'btn btn-warning';
    }

    return 'btn btn-primary';
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const idRef = useRef(0);
    const [toasts, setToasts] = useState<ToastRequest[]>([]);
    const [confirmQueue, setConfirmQueue] = useState<ConfirmRequest[]>([]);

    const dismissToast = useCallback((id: number) => {
        setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, []);

    const notify = useCallback((options: NotifyOptions) => {
        const type = options.type ?? 'primary';
        const title = options.title ?? getDefaultTitle(type);
        const duration = options.duration ?? 3000;

        setToasts((previous) => [
            ...previous,
            {
                id: ++idRef.current,
                title,
                message: options.message,
                type,
                duration
            }
        ]);
    }, []);

    const closeCurrentConfirmation = useCallback((result: boolean) => {
        setConfirmQueue((previous) => {
            if (previous.length === 0) {
                return previous;
            }

            const [current, ...rest] = previous;
            current.resolve(result);
            return rest;
        });
    }, []);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setConfirmQueue((previous) => [
                ...previous,
                {
                    id: ++idRef.current,
                    title: options.title,
                    message: options.message,
                    confirmLabel: options.confirmLabel ?? 'Confirm',
                    cancelLabel: options.cancelLabel ?? 'Cancel',
                    confirmTone: options.confirmTone ?? 'primary',
                    resolve
                }
            ]);
        });
    }, []);

    const activeConfirmation = confirmQueue[0] ?? null;

    const value = useMemo(
        () => ({
            notify,
            confirm
        }),
        [confirm, notify]
    );

    return (
        <FeedbackContext.Provider value={value}>
            {children}

            {toasts.length > 0 && (
                <div
                    style={{
                        position: 'fixed',
                        top: '1.5rem',
                        right: '1.5rem',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}
                >
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            show={true}
                            title={toast.title}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            floating={false}
                            onClose={() => dismissToast(toast.id)}
                        />
                    ))}
                </div>
            )}

            {activeConfirmation && (
                <Modal
                    isOpen={true}
                    onClose={() => closeCurrentConfirmation(false)}
                    title={activeConfirmation.title}
                    size="md"
                    footer={(
                        <>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => closeCurrentConfirmation(false)}
                            >
                                {activeConfirmation.cancelLabel}
                            </button>
                            <button
                                type="button"
                                className={getConfirmButtonClass(activeConfirmation.confirmTone)}
                                onClick={() => closeCurrentConfirmation(true)}
                            >
                                {activeConfirmation.confirmLabel}
                            </button>
                        </>
                    )}
                >
                    <p className="mb-0 text-muted">{activeConfirmation.message}</p>
                </Modal>
            )}
        </FeedbackContext.Provider>
    );
};

export const useFeedback = (): FeedbackContextValue => {
    const context = useContext(FeedbackContext);

    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }

    return context;
};
