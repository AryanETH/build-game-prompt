import { useNavigate } from "react-router-dom";

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export const LinkifiedText = ({ text, className = "" }: LinkifiedTextProps) => {
  const navigate = useNavigate();

  const linkify = (text: string) => {
    // Regex patterns
    const hashtagPattern = /#(\w+)/g;
    const mentionPattern = /@(\w+)/g;
    
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    
    // Find all hashtags and mentions
    const matches: Array<{ index: number; length: number; type: 'hashtag' | 'mention'; value: string }> = [];
    
    let match;
    while ((match = hashtagPattern.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'hashtag',
        value: match[1]
      });
    }
    
    while ((match = mentionPattern.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'mention',
        value: match[1]
      });
    }
    
    // Sort by index
    matches.sort((a, b) => a.index - b.index);
    
    // Build the result
    matches.forEach((match, i) => {
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the clickable link
      if (match.type === 'hashtag') {
        parts.push(
          <span
            key={`hashtag-${i}`}
            className="text-primary hover:underline cursor-pointer font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/search?q=${encodeURIComponent('#' + match.value)}`);
            }}
          >
            #{match.value}
          </span>
        );
      } else {
        parts.push(
          <span
            key={`mention-${i}`}
            className="text-primary hover:underline cursor-pointer font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/u/${match.value}`);
            }}
          >
            @{match.value}
          </span>
        );
      }
      
      lastIndex = match.index + match.length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  return <span className={className}>{linkify(text)}</span>;
};
