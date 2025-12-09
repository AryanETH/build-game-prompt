import { X, Timer, Mic, MicOff, Users, Volume2, VolumeX, Keyboard, MousePointer, DollarSign, Gamepad2, QrCode, Smartphone, Radio, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { LookingForPlayer } from "./LookingForPlayer";
import { TurnBasedGame } from "./TurnBasedGame";
import QRCode from "qrcode";

interface GamePlayerProps {
  game: {
    id: string;
    title: string;
    game_code: string;
    sound_url?: string | null;
  };
  onClose: () => void;
}

export const GamePlayer = ({ game, onClose }: GamePlayerProps) => {
  const roomId = `game-${game.id}`;
  const { isReady, isMicOn, remoteAudios, participants, toggleMic, error } = useVoiceChat(roomId);
  const [soundOn, setSoundOn] = useState(true);
  const [showControlsOverlay, setShowControlsOverlay] = useState(false);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Tip dialog state
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  
  // Matchmaking state
  const {
    isInQueue,
    matchSession,
    isMatching,
    queueCount,
    userId,
    joinQueue,
    leaveQueue,
    switchTurn,
    updateScore,
    endMatch,
    isMyTurn,
  } = useMatchmaking(game.id);
  
  const [player1Data, setPlayer1Data] = useState<any>(null);
  const [player2Data, setPlayer2Data] = useState<any>(null);
  const [tipCurrency, setTipCurrency] = useState<"INR" | "USD">("INR");
  const [exchangeRate, setExchangeRate] = useState<number>(83); // Default fallback
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [rateLastUpdated, setRateLastUpdated] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // UPI details
  const UPI_ID = "6260976807@axl";
  const UPI_NAME = "ANIL";
  
  // Detect if desktop
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  // Fetch live exchange rate when dialog opens
  useEffect(() => {
    if (!tipDialogOpen) return;
    
    const fetchExchangeRate = async () => {
      setIsLoadingRate(true);
      try {
        // Using exchangerate-api.com (free, no API key required)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        if (data && data.rates && data.rates.INR) {
          setExchangeRate(data.rates.INR);
          setRateLastUpdated(new Date().toLocaleTimeString());
          console.log('✅ Live exchange rate fetched:', data.rates.INR);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate, using fallback:', error);
        // Keep using fallback rate of 83
      } finally {
        setIsLoadingRate(false);
      }
    };
    
    fetchExchangeRate();
  }, [tipDialogOpen]);
  
  const handleTip = async () => {
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    // Convert to INR if USD selected (using live exchange rate)
    const amountInINR = tipCurrency === "USD" ? Math.round(amount * exchangeRate) : amount;
    
    // Build UPI link
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&mc=0000&mode=02&purpose=00&tn=${encodeURIComponent("Tip via Oplus AI")}&am=${amountInINR}&cu=INR`;
    
    // Desktop: Show QR Code
    if (isDesktop) {
      try {
        const qrDataUrl = await QRCode.toDataURL(upiLink, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrDataUrl);
        setShowQrCode(true);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        alert("Failed to generate QR code");
      }
    } else {
      // Mobile: Open UPI app directly
      window.location.href = upiLink;
      setTipDialogOpen(false);
      setTipAmount("");
    }
  };

  const AudioStream = ({ stream }: { stream: MediaStream }) => {
    const ref = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    }, [stream]);
    return <audio ref={ref} autoPlay playsInline />;
  };

  useEffect(() => {
    // Respect user's default sound preference
    try {
      const raw = localStorage.getItem('playgen:settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.enableSoundByDefault === 'boolean') {
          setSoundOn(!!parsed.enableSoundByDefault);
        }
      }
    } catch {}

    // Show desktop controls overlay briefly
    const isDesktop = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (isDesktop) {
      setShowControlsOverlay(true);
      const t = setTimeout(() => setShowControlsOverlay(false), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  // Toggle live status
  const toggleLive = async () => {
    try {
      const newLiveStatus = !isLive;
      const { error } = await supabase
        .from('games')
        .update({
          is_live: newLiveStatus,
          live_started_at: newLiveStatus ? new Date().toISOString() : null,
        })
        .eq('id', game.id);
      
      if (error) throw error;
      setIsLive(newLiveStatus);
    } catch (error) {
      console.error('Failed to toggle live status:', error);
    }
  };

  useEffect(() => {
    // Mark this game as being actively played via presence
    const presenceKey = `player_${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(`playing:${game.id}`, {
      config: { presence: { key: presenceKey } },
    });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.track({ started_at: new Date().toISOString() });
      }
    });
    return () => {
      channel.unsubscribe();
    };
  }, [game.id]);
  
  // Cleanup: Turn off live when closing
  useEffect(() => {
    return () => {
      if (isLive) {
        supabase
          .from('games')
          .update({ is_live: false, live_started_at: null })
          .eq('id', game.id);
      }
    };
  }, [isLive, game.id]);



  useEffect(() => {
    if (!game.sound_url) return;
    if (!bgAudioRef.current) return;
    bgAudioRef.current.muted = !soundOn;
  }, [soundOn, game.sound_url]);
  
  // Fetch player data when matched
  useEffect(() => {
    if (!matchSession) return;
    
    const fetchPlayers = async () => {
      const { data: p1 } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', matchSession.player1_id)
        .single();
      
      const { data: p2 } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', matchSession.player2_id)
        .single();
      
      setPlayer1Data({ ...p1, score: matchSession.player1_score });
      setPlayer2Data({ ...p2, score: matchSession.player2_score });
    };
    
    fetchPlayers();
  }, [matchSession]);

  // Show turn-based game when matched
  if (matchSession?.status === 'playing' && player1Data && player2Data) {
    return (
      <TurnBasedGame
        matchId={matchSession.id}
        gameCode={game.game_code}
        player1={player1Data}
        player2={player2Data}
        currentTurn={matchSession.current_turn || ''}
        myId={userId || ''}
        isMyTurn={isMyTurn}
        onSwitchTurn={() => switchTurn(matchSession.id)}
        onUpdateScore={(score) => updateScore(matchSession.id, score)}
        onEndMatch={(winnerId) => endMatch(matchSession.id, winnerId)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <div className="h-full flex flex-col">
        {/* Header - Slim Version */}
        <div className="border-b border-border/50 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="text-base md:text-lg font-bold truncate">{game.title}</h2>
            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{participants.length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Dropdown Menu for Controls */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[150]">
                <DropdownMenuItem onClick={toggleLive} className="cursor-pointer">
                  <Radio className={`h-4 w-4 mr-2 ${isLive ? 'text-red-500' : ''}`} />
                  <span>{isLive ? 'Stop Live' : 'Go Live'}</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setSoundOn((v) => !v)} className="cursor-pointer">
                  {soundOn ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                  <span>{soundOn ? 'Sound On' : 'Sound Off'}</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={toggleMic} className="cursor-pointer">
                  {isMicOn ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                  <span>{isMicOn ? 'Mic On' : 'Mic Off'}</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={joinQueue} 
                  disabled={isInQueue || !!matchSession}
                  className="cursor-pointer"
                >
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  <span>Find Player</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setTipDialogOpen(true)} className="cursor-pointer">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Tip Creator</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-destructive/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 overflow-hidden">
          <iframe
            srcDoc={game.game_code}
            className="w-full h-full border-0"
            title={game.title}
            sandbox="allow-scripts allow-same-origin"
          />
          {showControlsOverlay && (
            <div className="pointer-events-none absolute inset-x-4 top-20 z-10 rounded-xl bg-black/60 text-white p-3 md:p-4 flex items-center gap-3 justify-center">
              <Keyboard className="h-5 w-5" />
              <div className="text-xs md:text-sm">
                Use WASD or Arrow Keys to move, Space for action. Click inside the game to focus.
              </div>
              <MousePointer className="h-5 w-5 hidden md:block" />
            </div>
          )}
          {game.sound_url && (
            <audio ref={bgAudioRef} src={game.sound_url || undefined} autoPlay loop />
          )}
          {/* Hidden remote audio elements */}
          <div className="sr-only">
            {remoteAudios.map((ra) => (
              <AudioStream key={ra.userId} stream={ra.stream} />
            ))}
          </div>
        </div>
        {/* Fallback error message */}
        {error && (
          <div className="p-2 text-center text-xs text-destructive">{error}</div>
        )}
      </div>
      
      {/* Tip Dialog */}
      <Dialog open={tipDialogOpen} onOpenChange={(open) => {
        setTipDialogOpen(open);
        if (!open) {
          setShowQrCode(false);
          setTipAmount("");
        }
      }}>
        <DialogContent className="sm:max-w-md z-[200]">
          <DialogHeader>
            <DialogTitle>Tip the Creator</DialogTitle>
          </DialogHeader>
          
          {!showQrCode ? (
            <>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={tipCurrency} onValueChange={(v) => setTipCurrency(v as "INR" | "USD")}>
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="z-[250]">
                  <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                  <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                  {tipCurrency === "INR" ? "₹" : "$"}
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder={tipCurrency === "INR" ? "Enter amount" : "Enter amount"}
                  className="pl-8 pr-20"
                />
                {tipAmount && !isNaN(parseFloat(tipAmount)) && parseFloat(tipAmount) > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-green-600 dark:text-green-400">
                    {tipCurrency === "USD" 
                      ? `≈ ₹${Math.round(parseFloat(tipAmount) * exchangeRate)}`
                      : `≈ $${(parseFloat(tipAmount) / exchangeRate).toFixed(2)}`
                    }
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {tipCurrency === "INR" ? "Indian Rupee" : "US Dollar"}
                  {isLoadingRate && <span className="animate-pulse">⟳</span>}
                </span>
                {tipAmount && !isNaN(parseFloat(tipAmount)) && parseFloat(tipAmount) > 0 && (
                  <span className="font-medium">
                    Final: ₹{tipCurrency === "USD" ? Math.round(parseFloat(tipAmount) * exchangeRate) : parseFloat(tipAmount)} INR
                  </span>
                )}
              </div>
              {rateLastUpdated && (
                <p className="text-[10px] text-muted-foreground">
                  Live rate: $1 = ₹{exchangeRate.toFixed(2)} • Updated: {rateLastUpdated}
                </p>
              )}
            </div>
            
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Quick Tips:</p>
              <div className="flex gap-2 flex-wrap">
                {tipCurrency === "INR" ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setTipAmount("10")}>₹10</Button>
                    <Button size="sm" variant="outline" onClick={() => setTipAmount("50")}>₹50</Button>
                    <Button size="sm" variant="outline" onClick={() => setTipAmount("100")}>₹100</Button>
                    <Button size="sm" variant="outline" onClick={() => setTipAmount("500")}>₹500</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setTipAmount("1")}>$1</Button>
                    <Button size="sm" variant="outline" onClick={() => setTipAmount("5")}>$5</Button>
                    <Button size="sm" variant="outline" onClick={() => setTipAmount("10")}>$10</Button>
                    <Button size="sm" variant="outline" onClick={() => setTipAmount("20")}>$20</Button>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTipDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTip}
              disabled={!tipAmount || isNaN(parseFloat(tipAmount)) || parseFloat(tipAmount) <= 0}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isDesktop ? (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Send Tip via UPI
                </>
              )}
            </Button>
          </DialogFooter>
          </>
          
          ) : (
            <>
              {/* QR Code Display (Desktop Only) */}
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                    <img src={qrCodeUrl} alt="UPI Payment QR Code" className="w-64 h-64" />
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-lg font-semibold">
                      {tipCurrency === "INR" ? "₹" : "$"}{tipAmount}
                      {tipCurrency === "USD" && ` (≈ ₹${Math.round(parseFloat(tipAmount) * exchangeRate)})`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Scan this QR code with any UPI app
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      <span>PhonePe</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      <span>Google Pay</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      <span>Paytm</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      ✓ After scanning, complete the payment in your UPI app
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowQrCode(false)}>
                  Back
                </Button>
                <Button
                  onClick={() => {
                    setTipDialogOpen(false);
                    setShowQrCode(false);
                    setTipAmount("");
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Looking for Player Overlay */}
      {isInQueue && (
        <LookingForPlayer
          queueCount={queueCount}
          onCancel={leaveQueue}
        />
      )}
    </div>
  );
};