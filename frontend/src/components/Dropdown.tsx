import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownProps {
    trigger?: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1080,
        display: 'block',
        visibility: 'hidden'
    });

    const updateMenuPosition = () => {
        if (!dropdownRef.current || !menuRef.current) {
            return;
        }

        const triggerRect = dropdownRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const viewportPadding = 8;
        const offset = 4;

        let left = align === 'right'
            ? triggerRect.right - menuRect.width
            : triggerRect.left;

        left = Math.min(
            Math.max(viewportPadding, left),
            viewportWidth - menuRect.width - viewportPadding
        );

        const shouldOpenUpward =
            triggerRect.bottom + menuRect.height + offset > viewportHeight - viewportPadding &&
            triggerRect.top - menuRect.height - offset >= viewportPadding;

        const top = shouldOpenUpward
            ? triggerRect.top - menuRect.height - offset
            : triggerRect.bottom + offset;

        setMenuStyle({
            position: 'fixed',
            top,
            left,
            zIndex: 1080,
            display: 'block',
            visibility: 'visible'
        });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (dropdownRef.current?.contains(target) || menuRef.current?.contains(target)) {
                return;
            }

            setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        updateMenuPosition();

        const handleViewportChange = () => updateMenuPosition();
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);
        document.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [align, isOpen]);

    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="dropdown" ref={dropdownRef}>
            {trigger ? (
                <div onClick={toggleDropdown} style={{ cursor: 'pointer' }}>
                    {trigger}
                </div>
            ) : (
                <button
                    className="btn btn-sm dropdown-toggle more-vertical"
                    type="button"
                    onClick={toggleDropdown}
                    aria-expanded={isOpen}
                >
                    <span className="text-muted sr-only">Action</span>
                </button>
            )}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    className={`dropdown-menu dropdown-menu-${align} show`}
                    style={menuStyle}
                >
                    <div onClick={() => setIsOpen(false)}>
                        {children}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
