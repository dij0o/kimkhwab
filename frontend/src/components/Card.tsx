import React from 'react';

interface CardProps {
    title?: string | React.ReactNode;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    noPadding?: boolean; // Useful for tables that should go edge-to-edge
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ 
    title, 
    children, 
    className = '', 
    bodyClassName = '', 
    noPadding = false,
    style
}) => {
    return (
        <div className={`card shadow mb-4 border-0 ${className}`} style={style}>
            {title && (
                <div className="card-header">
                    <strong>{title}</strong>
                </div>
            )}
            <div className={`card-body ${noPadding ? 'p-0' : ''} ${bodyClassName}`}>
                {children}
            </div>
        </div>
    );
};