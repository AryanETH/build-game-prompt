import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export const LinkifiedText = ({ text, className = "" }: LinkifiedTextProps) => {
  const navigate = useNavigate();
  const [gameMap, setGameMap] = useState<Map<string, string>>(new Map());

  // Extract game titles from text and fetch their IDs
  useEffect(() => {
    // Match +gamename format (simple, like usernames)
    const gameMentionPattern = /\+([a-zA-Z0-9._\s]+)(?![a-zA-Z0-9._])/g;
    const gameTitles: string[] = [];
    let match;
    
    while ((match = gameMentionPattern.exec(text)) !== null) {
      gameTitles.push(match[1].trim());
    }

    if (gameTitles.length > 0) {
      fetchGameIds(gameTitles);
    }
  }, [text]);

  const fetchGameIds = async (titles: string[]) => {
    try {
      // Try exact match first
      const { data, error } = await supabase
        .from('games')
        .select('id, title')
        .in('title', titles);

      if (!error && data && data.length > 0) {
        const map = new Map<string, string>();
        data.forEach(game => {
          map.set(game.title, game.id);
          // Also map lowercase version for case-insensitive matching
          map.set(game.title.toLowerCase(), game.id);
        });
        setGameMap(map);
        console.log('Game mentions found:', data);
      } else {
        // Try case-insensitive search if exact match fails
        const promises = titles.map(async (title) => {
          const { data: games } = await supabase
            .from('games')
            .select('id, title')
            .ilike('title', title)
            .limit(1);
          return games?.[0];
        });
        
        const results = await Promise.all(promises);
        const map = new Map<string, string>();
        results.forEach((game, idx) => {
          if (game) {
            map.set(titles[idx], game.id);
            map.set(titles[idx].toLowerCase(), game.id);
            map.set(game.title, game.id);
            map.set(game.title.toLowerCase(), game.id);
          }
        });
        setGameMap(map);
        console.log('Game mentions found (case-insensitive):', results.filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching game IDs:', error);
    }
  };

  const linkify = (text: string) => {
    
    // Regex patterns - made more specific to avoid conflicts
    const hashtagPattern = /#([a-zA-Z0-9_]+)(?![a-zA-Z0-9._])/g;
    // Updated mention pattern to support dots, underscores, and alphanumeric characters
    // Added negative lookahead to ensure we capture the complete username
    const mentionPattern = /@([a-zA-Z0-9._]+)(?![a-zA-Z0-9._])/g;
    // Match +gamename format (simple, like usernames)
    const gameMentionPattern = /\+([a-zA-Z0-9._\s]+)(?![a-zA-Z0-9._])/g;
    
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    
    // Find all hashtags, mentions, and game mentions
    const matches: Array<{ index: number; length: number; type: 'hashtag' | 'mention' | 'game'; value: string }> = [];
    
    // Reset regex lastIndex to ensure clean matching
    hashtagPattern.lastIndex = 0;
    mentionPattern.lastIndex = 0;
    gameMentionPattern.lastIndex = 0;
    
    let match;
    
    // Find hashtags
    while ((match = hashtagPattern.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'hashtag',
        value: match[1]
      });
    }
    
    // Find mentions
    while ((match = mentionPattern.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'mention',
        value: match[1]
      });
    }
    
    // Find game mentions
    while ((match = gameMentionPattern.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'game',
        value: match[1].trim()
      });
    }
    
    // Sort by index
    matches.sort((a, b) => a.index - b.index);
    
    // Remove overlapping matches (keep the first one found)
    const filteredMatches = matches.filter((match, i) => {
      if (i === 0) return true;
      const prevMatch = matches[i - 1];
      const prevEnd = prevMatch.index + prevMatch.length;
      return match.index >= prevEnd;
    });
    

    
    // Build the result
    filteredMatches.forEach((match, i) => {
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the clickable link
      if (match.type === 'hashtag') {
        parts.push(
          <span
            key={`hashtag-${i}`}
            className="text-gray-300 hover:underline cursor-pointer font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/search?q=${encodeURIComponent('#' + match.value)}`);
            }}
          >
            #{match.value}
          </span>
        );
      } else if (match.type === 'mention') {
        parts.push(
          <span
            key={`mention-${i}`}
            className="text-gray-300 hover:underline cursor-pointer font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/u/${match.value}`);
            }}
          >
            @{match.value}
          </span>
        );
      } else if (match.type === 'game') {
        // Try exact match first, then lowercase
        const gameId = gameMap.get(match.value) || gameMap.get(match.value.toLowerCase());
        parts.push(
          <span
            key={`game-${i}`}
            className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Game mention clicked:', match.value, 'ID:', gameId);
              if (gameId) {
                navigate(`/feed?game=${gameId}`);
              } else {
                console.warn('Game ID not found for:', match.value);
              }
            }}
          >
            +{match.value}
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
