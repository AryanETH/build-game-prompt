import { Crown } from "lucide-react";

interface PlusBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PlusBadge = ({ size = 'md', className = '' }: PlusBadgeProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 ${sizeClasses[size]} ${className}`}
      title="Plus Member"
    >
      <Crown className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-white`} />
    </div>
  );
};
