import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showSuggestions && textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top - 8,
        left: rect.left,
        width: rect.width
      });
    }
  }, [showSuggestions, suggestions]);

  const fetchUserSuggestions = async (query: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .order('username', { ascending: true })
        .limit(10);

      if (data && data.length > 0) {
        setSuggestions(data.map(u => ({ type: 'user' as const, data: u })));
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else if (query === '') {
        const { data: all } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .order('username', { ascending: true })
          .limit(10);
        if (all && all.length > 0) {
          setSuggestions(all.map(u => ({ type: 'user' as const, data: u })));
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (e) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const fetchGameSuggestions = async (query: string) => {
    try {
      const { data } = await supabase
        .from('games')
        .select('id, title, thumbnail_url')
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setSuggestions(data.map(g => ({ type: 'game' as const, data: g })));
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else if (query === '') {
        const { data: all } = await supabase
          .from('games')
          .select('id, title, thumbnail_url')
          .order('created_at', { ascending: false })
          .limit(10);
        if (all && all.length > 0) {
          setSuggestions(all.map(g => ({ type: 'game' as const, data: g })));
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (e) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || newValue.length;
    onChange(newValue);
    
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const lastPlus = textBeforeCursor.lastIndexOf('+');
    
    if (lastAt !== -1 && lastAt >= lastPlus) {
      const query = textBeforeCursor.substring(lastAt + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        fetchUserSuggestions(query);
        return;
      }
    }
    
    if (lastPlus !== -1 && lastPlus > lastAt) {
      const query = textBeforeCursor.substring(lastPlus + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        fetchGameSuggestions(query);
        return;
      }
    }
    
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const insertMention = (suggestion: Suggestion) => {
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const before = value.substring(0, cursorPos);
    const after = value.substring(cursorPos);
    
    const lastIndex = suggestion.type === 'user' 
      ? before.lastIndexOf('@') 
      : before.lastIndexOf('+');
    
    const mentionText = suggestion.type === 'user'
      ? `@${suggestion.data.username} `
      : `+${(suggestion.data as GameSuggestion).title} `;

    if (lastIndex !== -1) {
      const newValue = value.substring(0, lastIndex) + mentionText + after;
      onChange(newValue);
      setSuggestions([]);
      setShowSuggestions(false);
      setIsHoveringDropdown(false);
      
      setTimeout(() => {
        textareaRef.current?.focus();
        const pos = lastIndex + mentionText.length;
        textareaRef.current?.setSelectionRange(pos, pos);
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
    }
  };

  const handleBlur = () => {
    if (!isHoveringDropdown) {
      setTimeout(() => {
        if (!isHoveringDropdown) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 200);
    }
  };

  const dropdownHeight = Math.min(suggestions.length * 44 + 8, 220);

  const dropdown = showSuggestions && suggestions.length > 0 ? createPortal(
    <div 
      onMouseEnter={() => setIsHoveringDropdown(true)}
      onMouseLeave={() => setIsHoveringDropdown(false)}
      onWheel={(e) => e.stopPropagation()}
      className="fixed bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-2xl"
      style={{ 
        top: dropdownPos.top - dropdownHeight,
        left: dropdownPos.left,
        width: Math.max(dropdownPos.width, 280),
        height: dropdownHeight,
        zIndex: 999999,
        overflow: 'hidden'
      }}
    >
      <div 
        className="h-full overflow-y-auto py-1 px-1"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#888 transparent'
        }}
      >
        {suggestions.map((s, i) => (
          <button
            key={s.data.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              insertMention(s);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-left ${
              i === selectedIndex ? 'bg-gray-100 dark:bg-zinc-800' : ''
            }`}
          >
            {s.type === 'user' ? (
              <>
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarImage src={s.data.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                    {s.data.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium flex-1 text-gray-900 dark:text-white truncate">
                  @{s.data.username}
                </span>
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  {(s.data as GameSuggestion).thumbnail_url ? (
                    <img src={(s.data as GameSuggestion).thumbnail_url!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Gamepad2 className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span className="text-sm font-medium flex-1 truncate text-gray-900 dark:text-white">
                  +{(s.data as GameSuggestion).title}
                </span>
                <Gamepad2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </>
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
        autoComplete="off"
      />
      {dropdown}
    </div>
  );
};
