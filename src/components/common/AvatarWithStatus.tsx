import React from 'react';
import { UserStatus } from '../../types';

interface AvatarWithStatusProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: UserStatus;
  isSpeaking?: boolean;
  className?: string;
}

export const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  src,
  alt,
  size = 'md',
  status,
  isSpeaking = false,
  className = '',
}) => {
  const sizeMap = {
    xs: { container: 'w-6 h-6', dot: 'w-2 h-2 -bottom-0.5 -right-0.5 border', text: 'text-xs' },
    sm: { container: 'w-8 h-8', dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 border-2', text: 'text-xs' },
    md: { container: 'w-10 h-10', dot: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5 border-[2.5px]', text: 'text-sm' },
    lg: { container: 'w-12 h-12', dot: 'w-4 h-4 bottom-0 right-0 border-[3px]', text: 'text-base' },
    xl: { container: 'w-20 h-20', dot: 'w-6 h-6 bottom-0.5 right-0.5 border-[4px]', text: 'text-2xl' },
  };

  const currentSize = sizeMap[size];

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-[#23a559]';
      case 'idle':
        return 'bg-[#f0b232]';
      case 'dnd':
        return 'bg-[#f23f43]';
      case 'offline':
      default:
        return 'bg-[#80848e]';
    }
  };

  return (
    <div
      className={`relative inline-block select-none shrink-0 ${currentSize.container} ${className}`}
    >
      <div
        className={`w-full h-full rounded-full overflow-hidden transition-all duration-200 ${
          isSpeaking
            ? 'ring-2 ring-[#23a559] ring-offset-2 ring-offset-[#1e1f22]'
            : ''
        }`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback for avatar loading issues
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
          }}
        />
      </div>

      {status && (
        <span
          className={`absolute rounded-full border-[#1e1f22] ${getStatusColor()} ${
            currentSize.dot
          } flex items-center justify-center`}
          title={`Status: ${status}`}
        >
          {status === 'dnd' && (
            <span className="w-1.5 h-0.5 bg-[#1e1f22] rounded-full block" />
          )}
          {status === 'idle' && (
            <span className="w-1 h-1 bg-[#1e1f22] rounded-full -translate-x-0.5 -translate-y-0.5 block" />
          )}
        </span>
      )}
    </div>
  );
};
