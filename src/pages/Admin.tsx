import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, LogOut, Trash2, Edit, Users, GamepadIcon, BarChart3, Search, Eye, Download, RefreshCw, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  
  // Games list
  const [games, setGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Users list
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalGames: 0,
    totalUsers: 0,
    totalLikes: 0,
    totalPlays: 0,
    totalComments: 0,
  });

  useEffect(() => {
    checkAdminAccess();
    // Load theme preference
    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('adminTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Unauthorized access");
        navigate("/auth");
        return;
      }

      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@oplus.ai";
      
      if (user.email === adminEmail) {
        setIsAdmin(true);
        loadGames();
        loadUsers();
        loadStats();
      } else {
        toast.error("Admin access only");
        navigate("/feed");
      }
    } catch (error) {
      console.error("Admin check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [gamesRes, usersRes] = await Promise.all([
        supabase.from('games').select('likes_count, plays_count, comments_count'),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ]);

      const totalLikes = gamesRes.data?.reduce((sum, g) => sum + (g.likes_count || 0), 0) || 0;
      const totalPlays = gamesRes.data?.reduce((sum, g) => sum + (g.plays_count || 0), 0) || 0;
      const totalComments = gamesRes.data?.reduce((sum, g) => sum + (g.comments_count || 0), 0) || 0;

      setStats({
        totalGames: gamesRes.data?.length || 0,
        totalUsers: usersRes.count || 0,
        totalLikes,
        totalPlays,
        totalComments,
      });
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  const loadGames = async () => {
    setLoadingGames(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*, creator:profiles!games_creator_id_fkey(username, avatar_url)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error("Load games error:", error);
      toast.error("Failed to load games");
    } finally {
      setLoadingGames(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Load users error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const generateGameImage = (gameTitle: string) => {
    // Gaming-related Unsplash image IDs for variety
    const gamingImages = [
      'photo-1511512578047-dfb367046420', // Gaming setup
      'photo-1542751371-adc38448a05e', // Racing game
      'photo-1550745165-9bc0b252726f', // Retro gaming
      'photo-1538481199705-c710c4e965fc', // Fantasy game
      'photo-1552820728-8b83bb6b773f', // Strategy game
      'photo-1509198397868-475647b2a1e5', // Action game
      'photo-1606503153255-59d8b8b82176', // Card game
      'photo-1511882150382-421056c89033', // Platform game
      'photo-1614732414444-096e5f1122d5', // Space game
      'photo-1493711662062-fa541adb3fc8', // Gaming controller
    ];
    
    // Use title to generate consistent but varied image selection
    const index = gameTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gamingImages.length;
    const selectedImage = gamingImages[index];
    
    return {
      thumbnail: `https://images.unsplash.com/${selectedImage}?w=400&h=800&fit=crop&q=80`,
      cover: `https://images.unsplash.com/${selectedImage}?w=800&h=1200&fit=crop&q=80`
    };
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingThumbnail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      setThumbnailUrl(data.publicUrl);
      toast.success('Thumbnail uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleUploadGame = async () => {
    if (!title || !gameCode) {
      toast.error("Title and game code are required");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      // Generate images based on title if not provided
      const images = generateGameImage(title);
      const finalThumbnail = thumbnailUrl || images.thumbnail;
      const finalCover = coverUrl || thumbnailUrl || images.cover;

      if (editingGameId) {
        const { error } = await supabase
          .from('games')
          .update({
            title,
            description,
            game_code: gameCode,
            thumbnail_url: finalThumbnail,
            cover_url: finalCover,
          })
          .eq('id', editingGameId);

        if (error) throw error;
        toast.success("Game updated successfully");
      } else {
        const { error } = await supabase.from('games').insert({
          title,
          description,
          game_code: gameCode,
          creator_id: user.id,
          thumbnail_url: finalThumbnail,
          cover_url: finalCover,
          likes_count: 0,
          plays_count: 0,
          comments_count: 0,
        });

        if (error) throw error;
        toast.success("Game uploaded successfully");
      }
      
      setTitle("");
      setDescription("");
      setGameCode("");
      setThumbnailUrl("");
      setCoverUrl("");
      setEditingGameId(null);
      
      loadGames();
      loadStats();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload game");
    } finally {
      setUploading(false);
    }
  };

  const handleEditGame = (game: any) => {
    setTitle(game.title);
    setDescription(game.description || "");
    setGameCode(game.game_code);
    setThumbnailUrl(game.thumbnail_url || "");
    setCoverUrl(game.cover_url || "");
    setEditingGameId(game.id);
    
    // Switch to upload tab
    const uploadTab = document.querySelector('[value="upload"]') as HTMLButtonElement;
    if (uploadTab) {
      uploadTab.click();
    }
    
    // Scroll to top after a short delay to ensure tab switch completes
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    
    toast.info("Editing game - form populated");
  };

  const handleCancelEdit = () => {
    setTitle("");
    setDescription("");
    setGameCode("");
    setThumbnailUrl("");
    setCoverUrl("");
    setEditingGameId(null);
    toast.info("Edit cancelled");
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm("Are you sure you want to delete this game?")) return;

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) throw error;

      toast.success("Game deleted");
      loadGames();
      loadStats();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete game");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their games.")) return;

    try {
      await supabase.from('games').delete().eq('creator_id', userId);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success("User deleted");
      loadUsers();
      loadGames();
      loadStats();
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleViewGame = (gameCode: string) => {
    const blob = new Blob([gameCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadGame = (game: any) => {
    const blob = new Blob([game.game_code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Game downloaded");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredGames = games.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-white' : 'text-black'}`} />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 shadow-sm transition-colors ${
        isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
      }`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="horizontal" size="md" forceWhite={isDarkMode} />
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
            }`}>
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              variant="outline" 
              size="sm"
              className={isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm" className={isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10'}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className={`p-6 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-black/5 border-black/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black/60'}`}>Total Games</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalGames}</p>
              </div>
              <GamepadIcon className={`h-10 w-10 ${isDarkMode ? 'text-white/40' : 'text-black/20'}`} />
            </div>
          </Card>

          <Card className={`p-6 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-black/5 border-black/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black/60'}`}>Total Users</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalUsers}</p>
              </div>
              <Users className={`h-10 w-10 ${isDarkMode ? 'text-white/40' : 'text-black/20'}`} />
            </div>
          </Card>

          <Card className={`p-6 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-black/5 border-black/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black/60'}`}>Total Likes</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalLikes}</p>
              </div>
              <BarChart3 className={`h-10 w-10 ${isDarkMode ? 'text-white/40' : 'text-black/20'}`} />
            </div>
          </Card>

          <Card className={`p-6 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-black/5 border-black/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black/60'}`}>Total Plays</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalPlays}</p>
              </div>
              <GamepadIcon className={`h-10 w-10 ${isDarkMode ? 'text-white/40' : 'text-black/20'}`} />
            </div>
          </Card>

          <Card className={`p-6 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-black/5 border-black/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black/60'}`}>Comments</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.totalComments}</p>
              </div>
              <BarChart3 className={`h-10 w-10 ${isDarkMode ? 'text-white/40' : 'text-black/20'}`} />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className={`grid w-full grid-cols-3 max-w-md ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-black/5 border-black/10'}`}>
            <TabsTrigger value="games" className={isDarkMode ? 'data-[state=active]:bg-white data-[state=active]:text-black text-white' : ''}>Games</TabsTrigger>
            <TabsTrigger value="users" className={isDarkMode ? 'data-[state=active]:bg-white data-[state=active]:text-black text-white' : ''}>Users</TabsTrigger>
            <TabsTrigger value="upload" className={isDarkMode ? 'data-[state=active]:bg-white data-[state=active]:text-black text-white' : ''}>Upload</TabsTrigger>
          </TabsList>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-4">
            <Card className={`p-6 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-white border-black/10'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Manage Games</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                    <Input
                      placeholder="Search games..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-10 w-64 ${isDarkMode ? 'bg-white/20 border-white/40 text-white placeholder:text-white/50' : ''}`}
                    />
                  </div>
                  <Button onClick={loadGames} variant="outline" size="sm" className={isDarkMode ? 'border-white/20 hover:bg-white/10' : ''}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {loadingGames ? (
                <div className="flex justify-center py-12">
                  <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredGames.map((game) => (
                    <div
                      key={game.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isDarkMode ? 'border-white/30 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={game.thumbnail_url}
                          alt={game.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>{game.title}</h3>
                          <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-white/80' : 'text-black/70'}`}>{game.description}</p>
                          <div className={`flex gap-4 mt-2 text-xs ${isDarkMode ? 'text-white/70' : 'text-black/50'}`}>
                            <span>Likes: {game.likes_count || 0}</span>
                            <span>Plays: {game.plays_count || 0}</span>
                            <span>Comments: {game.comments_count || 0}</span>
                            <span>By: {game.creator?.username || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewGame(game.game_code)}
                            variant="ghost"
                            size="sm"
                            title="Preview"
                            className={isDarkMode ? 'text-white hover:bg-white/20 hover:text-white' : ''}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDownloadGame(game)}
                            variant="ghost"
                            size="sm"
                            title="Download"
                            className={isDarkMode ? 'text-white hover:bg-white/20 hover:text-white' : ''}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleEditGame(game)}
                            variant="ghost"
                            size="sm"
                            title="Edit"
                            className={isDarkMode ? 'text-white hover:bg-white/20 hover:text-white' : ''}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteGame(game.id)}
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            className={isDarkMode ? 'text-white hover:bg-white/20 hover:text-white' : ''}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredGames.length === 0 && (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                      {searchQuery ? 'No games found matching your search' : 'No games yet'}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className={`p-6 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-white border-black/10'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Manage Users</h2>
                <Button onClick={loadUsers} variant="outline" size="sm" className={isDarkMode ? 'border-white/20 hover:bg-white/10' : ''}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {loadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isDarkMode ? 'border-white/30 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                            isDarkMode ? 'bg-white/20 text-white' : 'bg-black/10 text-black'
                          }`}>
                            {user.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>{user.username || 'Unknown'}</h3>
                            <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-black/50'}`}>
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteUser(user.id)}
                          variant="ghost"
                          size="sm"
                          className={isDarkMode ? 'text-white hover:bg-white/20 hover:text-white' : ''}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {users.length === 0 && (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                      No users found
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className={`p-6 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-white border-black/10'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {editingGameId ? (
                      <>
                        <Edit className="h-6 w-6" />
                        Edit Game
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6" />
                        Upload New Game
                      </>
                    )}
                  </h2>
                  {editingGameId && (
                    <Button onClick={handleCancelEdit} variant="outline" size="sm" className={isDarkMode ? 'border-white/20 hover:bg-white/10' : ''}>
                      Cancel
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Title *</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="My Awesome Game"
                      className={isDarkMode ? 'bg-white/20 border-white/40 text-white placeholder:text-white/50' : ''}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Description</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A fun game about..."
                      rows={3}
                      className={isDarkMode ? 'bg-white/20 border-white/40 text-white placeholder:text-white/50' : ''}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Game Code (HTML) *</label>
                    <Textarea
                      value={gameCode}
                      onChange={(e) => setGameCode(e.target.value)}
                      placeholder="<!DOCTYPE html><html>...</html>"
                      rows={10}
                      className={`font-mono text-xs ${isDarkMode ? 'bg-white/20 border-white/40 text-white placeholder:text-white/50' : ''}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Thumbnail</label>
                    
                    {/* File Upload Button */}
                    <div className="flex gap-2 mb-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                          disabled={uploadingThumbnail}
                        />
                        <div className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          isDarkMode 
                            ? 'border-white/40 hover:border-white/60 bg-white/10 hover:bg-white/20' 
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                        } ${uploadingThumbnail ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {uploadingThumbnail ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">Upload from Device</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    
                    {/* URL Input */}
                    <Input
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="Or paste URL (optional - auto-generated)"
                      className={isDarkMode ? 'bg-white/20 border-white/40 text-white placeholder:text-white/50' : ''}
                    />
                    
                    {/* Preview */}
                    {thumbnailUrl && (
                      <div className="mt-2">
                        <img 
                          src={thumbnailUrl} 
                          alt="Thumbnail preview" 
                          className="w-32 h-32 object-cover rounded-lg border-2 border-white/20"
                        />
                      </div>
                    )}
                    
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                      Upload image, paste URL, or leave empty to auto-generate
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Cover URL</label>
                    <Input
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... (optional - auto-generated)"
                      className={isDarkMode ? 'bg-white/20 border-white/40 text-white placeholder:text-white/50' : ''}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                      Leave empty to auto-generate from thumbnail or title
                    </p>
                  </div>

                  <Button
                    onClick={handleUploadGame}
                    disabled={uploading || !title || !gameCode}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingGameId ? 'Updating...' : 'Uploading...'}
                      </>
                    ) : editingGameId ? (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Game
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <Card className={`p-6 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-black/5 border-black/10'}`}>
                <h3 className={`font-semibold text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Quick Template</h3>
                <pre className={`text-xs p-4 rounded overflow-x-auto border ${
                  isDarkMode ? 'bg-white/20 border-white/40 text-white' : 'bg-white border-black/10'
                }`}>
{`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      background: #000;
      color: #fff;
      font-family: Arial;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
  </style>
</head>
<body>
  <h1>My Game</h1>
  <script>
    // Your game code here
  </script>
</body>
</html>`}
                </pre>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
