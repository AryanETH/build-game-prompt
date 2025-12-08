import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, Gamepad2 } from 'lucide-react';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  id?: string;
}

interface UserSuggestion {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface GameSuggestion {
  id: string;
  title: string;
  thumbnail_url: string | null;
}

type Suggestion = 
  | { type: 'user'; data: UserSuggestion }
  | { type: 'game'; data: GameSuggestion };

export const MentionTextarea = ({ value, onChange, placeholder, className, maxLength, id }: MentionTextareaProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionType, setMentionType] = useState<'user' | 'game' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect @ (user) and + (game) mentions and fetch suggestions
  useEffect(() => {
    const detectMention = () => {
      const cursorPos = textareaRef.current?.selectionStart || 0;
      const textBeforeCursor = value.substring(0, cursorPos);
      
      // Check for @ (user mention)
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      const lastPlusIndex = textBeforeCursor.lastIndexOf('+');
      
      // Determine which mention type is more recent
      if (lastAtIndex > lastPlusIndex && lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (!textAfterAt.includes(' ') && !textAfterAt.includes('+')) {
          setMentionQuery(textAfterAt);
          setMentionType('user');
          fetchUserSuggestions(textAfterAt);
          return;
        }
      } else if (lastPlusIndex > lastAtIndex && lastPlusIndex !== -1) {
        const textAfterPlus = textBeforeCursor.substring(lastPlusIndex + 1);
        if (!textAfterPlus.includes(' ') && !textAfterPlus.includes('@')) {
          setMentionQuery(textAfterPlus);
          setMentionType('game');
          fetchGameSuggestions(textAfterPlus);
          return;
        }
      }
      
      setShowSuggestions(false);
      setSuggestions([]);
      setMentionType(null);
    };

    detectMention();
  }, [value]);

  const fetchUserSuggestions = async (query: string) => {
    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('id, username, avatar_url');
      
      if (query.trim()) {
        queryBuilder = queryBuilder.ilike('username', `${query}%`);
      }
      
      const { data, error } = await queryBuilder
        .order('username', { ascending: true })
        .limit(8);

      if (!error && data) {
        const userSuggestions: Suggestion[] = data.map(user => ({
          type: 'user' as const,
          data: user as UserSuggestion
        }));
        setSuggestions(userSuggestions);
        setShowSuggestions(userSuggestions.length > 0);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
    }
  };

  const fetchGameSuggestions = async (query: string) => {
    try {
      let queryBuilder = supabase
        .from('games')
        .select('id, title, thumbnail_url');
      
      if (query.trim()) {
        queryBuilder = queryBuilder.ilike('title', `${query}%`);
      }
      
      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(8);

      if (!error && data) {
        const gameSuggestions: Suggestion[] = data.map(game => ({
          type: 'game' as const,
          data: game as GameSuggestion
        }));
        setSuggestions(gameSuggestions);
        setShowSuggestions(gameSuggestions.length > 0);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error fetching game suggestions:', error);
    }
  };

  const insertMention = (suggestion: Suggestion) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    
    let mentionText = '';
    let lastIndex = -1;
    
    if (suggestion.type === 'user') {
      lastIndex = textBeforeCursor.lastIndexOf('@');
      mentionText = `@${suggestion.data.username} `;
    } else {
      lastIndex = textBeforeCursor.lastIndexOf('+');
      // Use brackets for multi-word game titles to make parsing easier
      mentionText = `+[${suggestion.data.title}] `;
    }

    if (lastIndex !== -1) {
      const newValue = 
        value.substring(0, lastIndex) + 
        mentionText + 
        textAfterCursor;
      
      onChange(newValue);
      setShowSuggestions(false);
      setSuggestions([]);
      setMentionType(null);
      
      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursorPos = lastIndex + mentionText.length;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.data.id}
              onClick={() => insertMention(suggestion)}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors ${
                index === selectedIndex ? 'bg-muted' : ''
              }`}
            >
              {suggestion.type === 'user' ? (
                <>
                  <Avatar className="w-6 h-6">
                    <AvatarImage className="object-cover" src={suggestion.data.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {suggestion.data.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">@{suggestion.data.username}</span>
                  <User className="w-3 h-3 ml-auto text-muted-foreground" />
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded overflow-hidden bg-muted flex items-center justify-center">
                    {suggestion.data.thumbnail_url ? (
                      <img src={suggestion.data.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Gamepad2 className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium">+{suggestion.data.title}</span>
                  <Gamepad2 className="w-3 h-3 ml-auto text-muted-foreground" />
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
