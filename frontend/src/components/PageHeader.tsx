import React from 'react';

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode; // This allows us to pass buttons into the right side
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
    return (
        <div className="card shadow mb-4 border-0">
            <div className="card-body">
                <div className="row align-items-center">
                    <div className="col">
                        <h2 className="h3 mb-0 page-title">{title}</h2>
                    </div>
                    {children && (
                        <div className="col-auto text-right">
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};