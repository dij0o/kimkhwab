import React from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';

interface TableCardProps {
    loading: boolean;
    isEmpty: boolean;
    emptyState: React.ReactNode;
    children: React.ReactNode;
    loadingText?: string;
    responsive?: boolean;
    noPadding?: boolean;
    className?: string;
    bodyClassName?: string;
    stateContainerClassName?: string;
    tableContainerClassName?: string;
    style?: React.CSSProperties;
}

export const TableCard: React.FC<TableCardProps> = ({
    loading,
    isEmpty,
    emptyState,
    children,
    loadingText = 'Loading...',
    responsive = false,
    noPadding = false,
    className = '',
    bodyClassName = '',
    stateContainerClassName,
    tableContainerClassName = '',
    style
}) => {
    const resolvedStateContainerClassName = stateContainerClassName ?? (noPadding ? 'p-4' : '');

    return (
        <Card
            className={className}
            bodyClassName={bodyClassName}
            noPadding={noPadding}
            style={style}
        >
            {loading ? (
                <div className={resolvedStateContainerClassName}>
                    <Spinner text={loadingText} />
                </div>
            ) : isEmpty ? (
                <div className={resolvedStateContainerClassName}>
                    {emptyState}
                </div>
            ) : responsive ? (
                <div className={`table-responsive ${tableContainerClassName}`.trim()}>
                    {children}
                </div>
            ) : (
                children
            )}
        </Card>
    );
};
