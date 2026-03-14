import React from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';

interface DataTableCardProps {
    loading: boolean;
    isEmpty: boolean;
    emptyState: React.ReactNode;
    children: React.ReactNode;
    totalRecords: number;
    filteredRecords: number;
    currentPage: number;
    pageSize: number;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onPageSizeChange: (pageSize: number) => void;
    loadingText?: string;
    searchPlaceholder?: string;
    pageSizeOptions?: number[];
    pagination?: React.ReactNode;
    className?: string;
}

export const DataTableCard: React.FC<DataTableCardProps> = ({
    loading,
    isEmpty,
    emptyState,
    children,
    totalRecords,
    filteredRecords,
    currentPage,
    pageSize,
    searchValue,
    onSearchChange,
    onPageSizeChange,
    loadingText = 'Loading...',
    searchPlaceholder = 'Search...',
    pageSizeOptions = [10, 25, 50, 100],
    pagination,
    className = ''
}) => {
    const showingFrom = filteredRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const showingTo = filteredRecords === 0 ? 0 : Math.min(currentPage * pageSize, filteredRecords);
    const isFiltered = filteredRecords !== totalRecords;

    return (
        <Card className={className}>
            <div className="row align-items-center mb-3">
                <div className="col-sm-12 col-md-6 mb-2 mb-md-0">
                    <div className="d-flex align-items-center text-muted small">
                        <span className="mr-2">Show</span>
                        <select
                            className="custom-select custom-select-sm w-auto"
                            value={pageSize}
                            onChange={(event) => onPageSizeChange(Number(event.target.value))}
                            disabled={loading}
                            aria-label="Rows per page"
                        >
                            {pageSizeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <span className="ml-2">entries</span>
                    </div>
                </div>
                <div className="col-sm-12 col-md-6">
                    <div className="d-flex justify-content-md-end">
                        <input
                            type="search"
                            className="form-control form-control-sm"
                            style={{ maxWidth: '280px' }}
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(event) => onSearchChange(event.target.value)}
                            disabled={loading && totalRecords === 0}
                            aria-label={searchPlaceholder}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-5">
                    <Spinner text={loadingText} />
                </div>
            ) : isEmpty ? (
                emptyState
            ) : (
                <div className="table-responsive">
                    {children}
                </div>
            )}

            {!loading && (
                <div className="row align-items-center mt-3">
                    <div className="col-sm-12 col-md-5 mb-2 mb-md-0">
                        <small className="text-muted">
                            Showing {showingFrom} to {showingTo} of {filteredRecords} entries
                            {isFiltered ? ` (filtered from ${totalRecords} total entries)` : ''}
                        </small>
                    </div>
                    <div className="col-sm-12 col-md-7">
                        {pagination}
                    </div>
                </div>
            )}
        </Card>
    );
};
