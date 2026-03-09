import React from 'react';

interface SpinnerProps {
    text?: string;
    fullPage?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ text = "Loading...", fullPage = false }) => {
    const spinnerElement = (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="sr-only">{text}</span>
            </div>
            {/* Optional text below the spinner */}
            {text !== "Loading..." && <p className="mt-2 text-muted small">{text}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="vh-100 d-flex justify-content-center align-items-center">
                {spinnerElement}
            </div>
        );
    }

    return spinnerElement;
};