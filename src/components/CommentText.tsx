import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CommentTextProps {
  text: string;
}

export const CommentText = ({ text }: CommentTextProps) => {
  const navigate = useNavigate();
  const [gameMap, setGameMap] = useState<Map<string, string>>(new Map());

  // Extract game titles from text and fetch their IDs
  useEffect(() => {
    // Match +[Game Title] format (with brackets)
    const gameMentionPattern = /\+\[([^\]]+)\]/g;
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

  // Parse text and make @mentions and +game mentions clickable
  const parseText = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    // Match +[Game Title] format (with brackets)
    const gameMentionRegex = /\+\[([^\]]+)\]/g;
    
    const matches: Array<{ index: number; length: number; type: 'user' | 'game'; value: string }> = [];
    let match;

    // Find all @mentions
    while ((match = mentionRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'user',
        value: match[1]
      });
    }

    // Find all +game mentions
    while ((match = gameMentionRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'game',
        value: match[1].trim()
      });
    }

    // Sort by index
    matches.sort((a, b) => a.index - b.index);

    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    matches.forEach((m, i) => {
      // Add text before this match
      if (m.index > lastIndex) {
        parts.push(content.substring(lastIndex, m.index));
      }

      // Add clickable link
      if (m.type === 'user') {
        parts.push(
          <span
            key={`user-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/u/${m.value}`);
            }}
            className="text-primary font-semibold cursor-pointer hover:underline"
          >
            @{m.value}
          </span>
        );
      } else {
        // Try exact match first, then lowercase
        const gameId = gameMap.get(m.value) || gameMap.get(m.value.toLowerCase());
        parts.push(
          <span
            key={`game-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Game mention clicked:', m.value, 'ID:', gameId);
              if (gameId) {
                navigate(`/feed?game=${gameId}`);
              } else {
                console.warn('Game ID not found for:', m.value);
              }
            }}
            className="text-purple-600 dark:text-purple-400 font-semibold cursor-pointer hover:underline"
          >
            +[{m.value}]
          </span>
        );
      }

      lastIndex = m.index + m.length;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return <span>{parseText(text)}</span>;
};
