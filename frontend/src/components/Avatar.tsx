import React from 'react';
import { resolveBackendUrl } from '../config/backend';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Avatar', size = 'sm', className = '' }) => {
    const imageUrl = src
        ? resolveBackendUrl(src)
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
