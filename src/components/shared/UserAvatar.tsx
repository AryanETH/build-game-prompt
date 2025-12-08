import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  username?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

/**
 * Reusable user avatar component with gradient fallback
 */
export const UserAvatar = ({ 
  username, 
  avatarUrl, 
  size = 'md',
  className = '' 
}: UserAvatarProps) => {
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={avatarUrl || undefined} alt={username || 'User'}  className="object-cover"/>
      <AvatarFallback className="gradient-primary text-white font-semibold">
        {username?.[0]?.toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  );
};
