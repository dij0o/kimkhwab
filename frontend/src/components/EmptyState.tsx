import React from 'react';

interface EmptyStateProps {
    icon?: string; // e.g., 'fe-users', 'fe-calendar'
    title: string;
    description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'fe-inbox', title, description }) => {
    return (
        <div className="text-center py-5 text-muted">
            <i className={`fe ${icon} fe-32 mb-3`}></i>
            <h5>{title}</h5>
            {description && <p>{description}</p>}
        </div>
    );
};