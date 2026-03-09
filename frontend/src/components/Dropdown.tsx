import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
    trigger?: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                >
                    <span className="text-muted sr-only">Action</span>
                </button>
            )}
            <div 
                className={`dropdown-menu dropdown-menu-${align} ${isOpen ? 'show' : ''}`}
                style={isOpen ? { 
                    position: 'absolute', 
                    right: align === 'right' ? 0 : 'auto', 
                    left: align === 'left' ? 0 : 'auto',
                    top: '100%', 
                    zIndex: 1000,
                    display: 'block' // Ensure it's visible when 'show' is present
                } : {
                    display: 'none'
                }}
            >
                {/* Clicking an item inside should probably close the dropdown */}
                <div onClick={() => setIsOpen(false)}>
                    {children}
                </div>
            </div>
        </div>
    );
};
