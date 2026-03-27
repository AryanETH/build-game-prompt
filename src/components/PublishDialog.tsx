// Publish Dialog - Sekai-style game publishing interface

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '@/lib/activityLogger';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameCode: string;
  initialTitle?: string;
  initialDescription?: string;
  attachments?: Array<{ type: string; file: File; url: string; name: string }>;
}

export const PublishDialog = ({ 
  open, 
  onOpenChange, 
  gameCode, 
  initialTitle = '', 
  initialDescription = '',
  attachments = []
}: PublishDialogProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsPublishing(true);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) {
        toast.error('Please sign in to publish');
        return;
      }

      // Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      if (thumbnail) {
        const path = `public/${userId}/${Date.now()}.${thumbnail.name.split('.').pop() || 'png'}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, thumbnail);

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          thumbnailUrl = urlData.publicUrl;
        }
      }

      // Upload media attachments and get URLs
      const mediaUrls: Record<string, string> = {};
      for (const att of attachments) {
        const path = `public/${userId}/media/${Date.now()}-${att.name}`;
        const bucket = att.type === 'music' || att.type === 'video' ? 'avatars' : 'avatars';
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, att.file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
          mediaUrls[att.name] = urlData.publicUrl;
        }
      }

      // Inject media URLs into game code if it's JSON schema
      let finalGameCode = gameCode;
      if (gameCode.startsWith('__JSON_SCHEMA__') && Object.keys(mediaUrls).length > 0) {
        const jsonStr = gameCode.replace('__JSON_SCHEMA__', '');
        const spec = JSON.parse(jsonStr);
        
        // Add media URLs to state
        spec.state.__media_urls__ = mediaUrls;
        
        finalGameCode = `__JSON_SCHEMA__${JSON.stringify(spec)}`;
      } else if (!gameCode.startsWith('__JSON_SCHEMA__') && Object.keys(mediaUrls).length > 0) {
        // For HTML games, inject as before
        let s = "<script>window.__OPLUS_ASSETS__={";
        const musicUrls = attachments.filter(a => a.type === 'music').map(a => ({ name: a.name, url: mediaUrls[a.name] }));
        const imageUrls = attachments.filter(a => a.type === 'image').map(a => ({ name: a.name, url: mediaUrls[a.name] }));
        if (musicUrls.length) s += `music:${JSON.stringify(musicUrls)},`;
        if (imageUrls.length) s += `images:${JSON.stringify(imageUrls)},`;
        finalGameCode = finalGameCode.replace("</head>", `${s}};</script>\n</head>`);
      }

      // Insert game into database
      const { data: game, error } = await supabase.from('games').insert({
        title: title.trim(),
        description: description.trim().slice(0, 500),
        game_code: finalGameCode,
        creator_id: userId,
        thumbnail_url: thumbnailUrl,
        // Store tags as array
        // Note: You may need to add a tags column to the games table
      }).select().single();

      if (error) throw error;

      await logActivity({ 
        type: 'game_published', 
        gameId: game.id, 
        metadata: { title: game.title } 
      });

      toast.success('Published successfully!');
      onOpenChange(false);
      navigate('/feed');
    } catch (err: any) {
      console.error('Publish error:', err);
      toast.error(err.message || 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Your Sekai is Live!</DialogTitle>
          <p className="text-sm text-muted-foreground">You can customize these details if you'd like.</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Thumbnail */}
          <div className="flex flex-col items-center gap-3">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-32 h-48 rounded-2xl bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailSelect}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <p className="text-xs text-muted-foreground">Edit the title if you'd like.</p>
            <div className="relative">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={2000}
                placeholder="Enter game title"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {title.length}/2000
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your game..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags"># Add tag</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., puzzle, arcade, fun"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <p className="text-xs text-muted-foreground">Control who can view your project.</p>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as 'public' | 'private')}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="public" id="public" />
                <div className="flex-1">
                  <Label htmlFor="public" className="cursor-pointer font-semibold">Public & Remixable</Label>
                  <p className="text-xs text-muted-foreground">Anyone can view and remix.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="private" id="private" />
                <div className="flex-1">
                  <Label htmlFor="private" className="cursor-pointer font-semibold">Public & View Only</Label>
                  <p className="text-xs text-muted-foreground">Anyone can view, no remix.</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isPublishing}
          >
            Skip
          </Button>
          <Button
            onClick={handlePublish}
            className="flex-1"
            disabled={isPublishing || !title.trim()}
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
