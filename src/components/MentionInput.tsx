import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

interface UserSuggestion {
  id: string;
  username: string;
  avatar_url: string | null;
}

export const MentionInput = ({ value, onChange, onKeyDown, placeholder, className }: MentionInputProps) => {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect @ mentions and fetch suggestions
  useEffect(() => {
    const detectMention = () => {
      const cursorPos = inputRef.current?.selectionStart || 0;
      const textBeforeCursor = value.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        // Check if there's no space after @ (still typing username)
        if (!textAfterAt.includes(' ') && textAfterAt.length >= 3) {
          setMentionQuery(textAfterAt);
          fetchUserSuggestions(textAfterAt);
          return;
        }
      }
      
      setShowSuggestions(false);
      setSuggestions([]);
    };

    detectMention();
  }, [value]);

  const fetchUserSuggestions = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setSuggestions(data as UserSuggestion[]);
        setShowSuggestions(data.length > 0);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
    }
  };

  const insertMention = (username: string) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const newValue = 
        value.substring(0, lastAtIndex) + 
        `@${username} ` + 
        textAfterCursor;
      
      onChange(newValue);
      setShowSuggestions(false);
      setSuggestions([]);
      
      // Focus back on input
      setTimeout(() => {
        inputRef.current?.focus();
        const newCursorPos = lastAtIndex + username.length + 2;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        insertMention(suggestions[selectedIndex].username);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    onKeyDown?.(e);
  };

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user.username)}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors ${
                index === selectedIndex ? 'bg-muted' : ''
              }`}
            >
              <Avatar className="w-6 h-6">
                <AvatarImage className="object-cover" src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {user.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">@{user.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
