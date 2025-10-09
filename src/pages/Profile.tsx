import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, Heart, Play, Loader2, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [userGames, setUserGames] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [formUsername, setFormUsername] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchUserGames();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
      if (data?.username) setFormUsername(data.username);
      if (data?.avatar_url) setPreviewUrl(data.avatar_url);
    }
  };

  const fetchUserGames = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      setUserGames(data || []);
    }
  };

  const handleOpenEdit = async () => {
    if (!profile) {
      await fetchProfile();
    }
    setFormUsername(profile?.username || "");
    setPreviewUrl(profile?.avatar_url || null);
    setSelectedFile(null);
    setEditOpen(true);
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(profile?.avatar_url || null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadAvatarAndGetUrl = async (userId: string, file: File): Promise<string> => {
    const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.') + 1) : 'png';
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const path = `${userId}/${Date.now()}.${safeExt}`;
    const { error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/png',
      });
    if (uploadError) {
      // Common case: bucket not found or not public
      if (uploadError.message?.toLowerCase().includes('not found') || uploadError.message?.toLowerCase().includes('bucket')) {
        toast.error("Avatar storage bucket 'avatars' is missing or not accessible. Make sure it's public.");
      }
      throw uploadError;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to update your profile');
        return;
      }

      let avatarUrl = profile?.avatar_url || null;
      if (selectedFile) {
        avatarUrl = await uploadAvatarAndGetUrl(user.id, selectedFile);
      }

      const newUsername = formUsername.trim();
      if (!newUsername) {
        toast.error('Username cannot be empty');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername, avatar_url: avatarUrl })
        .eq('id', user.id);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('duplicate') || msg.includes('unique')) {
          toast.error('That username is taken. Please choose another.');
        } else {
          toast.error('Failed to update profile');
        }
        throw error;
      }

      toast.success('Profile updated');
      setEditOpen(false);
      await fetchProfile();
    } catch (e) {
      // no-op: toast already shown
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 md:pt-16">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="gradient-card border-border/50 p-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full overflow-hidden border border-border/60">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'avatar'} />
                  <AvatarFallback className="bg-muted">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {profile?.username || 'Loading...'}
                    </h1>
                    <div className="flex gap-6 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        <span>{profile?.total_plays || 0} plays</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span>{profile?.total_likes || 0} likes</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button variant="secondary" onClick={handleOpenEdit} className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Edit Profile Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border border-border/60">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={previewUrl || undefined} alt="preview" />
                      <AvatarFallback className="bg-muted">
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <Label htmlFor="avatar">Profile image</Label>
                    <Input id="avatar" type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Your username"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* User Games */}
          <div>
            <h2 className="text-2xl font-bold mb-4">My Games</h2>
            {userGames.length === 0 ? (
              <Card className="gradient-card border-border/50 p-8 text-center">
                <p className="text-muted-foreground">
                  You haven't created any games yet.
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {userGames.map((game) => (
                  <Card key={game.id} className="gradient-card border-border/50 p-4">
                    <h3 className="font-semibold mb-2">{game.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {game.description}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{game.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        <span>{game.plays_count}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}