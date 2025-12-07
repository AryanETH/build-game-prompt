import { useNavigate } from 'react-router-dom';

interface CommentTextProps {
  text: string;
}

export const CommentText = ({ text }: CommentTextProps) => {
  const navigate = useNavigate();

  // Parse text and make @mentions clickable
  const parseText = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add clickable mention
      const username = match[1];
      parts.push(
        <span
          key={match.index}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/u/${username}`);
          }}
          className="text-primary font-semibold cursor-pointer hover:underline"
        >
          @{username}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return <span>{parseText(text)}</span>;
};
