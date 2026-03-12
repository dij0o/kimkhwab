import React from 'react';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Avatar', size = 'sm', className = '' }) => {
    // If the image is a local blob preview or already has http, don't prepend the backend URL
    const isAbsolute = src?.startsWith('http') || src?.startsWith('blob:');

    const imageUrl = src
        ? (isAbsolute ? src : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${src}`)
        : '/assets/avatars/placeholder.svg';

    const sizeMap = {
        sm: '32px',
        md: '48px',
        lg: '80px',
        xl: '120px',
        xxl: '230px' // Added for the large upload previews!
    };

    const pixelSize = sizeMap[size];

    return (
        <div className={`avatar avatar-${size} ${className}`} style={{ width: pixelSize, height: pixelSize, minWidth: pixelSize }}>
            <img
                src={imageUrl}
                alt={alt}
                className="avatar-img rounded-circle shadow-sm"
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
        </div>
    );
};