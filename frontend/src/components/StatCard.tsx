import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: string; // e.g. "+5.5%"
    trendColor?: 'success' | 'danger';
    icon: string; // e.g. "fe-download"
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendColor = 'success', icon }) => {
    return (
        <div className="card shadow border-0 h-100">
            <div className="card-body">
                <div className="row align-items-center">
                    <div className="col-3 text-center">
                        <span className="circle circle-sm bg-primary">
                            <i className={`fe fe-16 ${icon} text-white mb-0`}></i>
                        </span>
                    </div>
                    <div className="col pr-0">
                        <p className="small text-muted mb-0">{title}</p>
                        <span className="h3 mb-0">{value}</span>
                        {trend && <span className={`small text-${trendColor} ml-2`}>{trend}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};