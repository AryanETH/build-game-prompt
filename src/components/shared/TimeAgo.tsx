import { formatTimeAgo } from '@/hooks/useTimeAgo';

interface TimeAgoProps {
  date: string;
  className?: string;
}

/**
 * Component to display relative time
 */
export const TimeAgo = ({ date, className = '' }: TimeAgoProps) => {
  return (
    <span className={`text-muted-foreground ${className}`}>
      {formatTimeAgo(date)}
    </span>
  );
};
