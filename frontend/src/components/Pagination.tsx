import React from 'react';

// We share this interface across the app
export interface PaginationMeta {
    total_records: number;
    total_pages: number;
    current_page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
}

interface PaginationProps {
    meta: PaginationMeta | null;
    onPageChange: (skip: number, limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange }) => {
    if (!meta || meta.total_pages <= 1) return null;

    return (
        <nav aria-label="Table Paging" className="my-3">
            <ul className="pagination justify-content-end mb-0">
                <li className={`page-item ${!meta.has_prev ? 'disabled' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => onPageChange((meta.current_page - 2) * meta.limit, meta.limit)}
                        disabled={!meta.has_prev}
                    >
                        Previous
                    </button>
                </li>

                {[...Array(meta.total_pages)].map((_, i) => (
                    <li key={i} className={`page-item ${meta.current_page === i + 1 ? 'active' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(i * meta.limit, meta.limit)}
                        >
                            {i + 1}
                        </button>
                    </li>
                ))}

                <li className={`page-item ${!meta.has_next ? 'disabled' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => onPageChange(meta.current_page * meta.limit, meta.limit)}
                        disabled={!meta.has_next}
                    >
                        Next
                    </button>
                </li>
            </ul>
        </nav>
    );
};