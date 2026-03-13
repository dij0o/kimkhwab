import React from 'react';

// Change title from 'string' to 'React.ReactNode'
interface PageHeaderProps {
    title: React.ReactNode;
    children?: React.ReactNode;
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
                        <div className="col-auto d-flex align-items-center">
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};