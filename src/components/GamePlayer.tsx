import { X, Timer, Mic, MicOff, Users, Volume2, VolumeX, Keyboard, MousePointer, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [tipCurrency, setTipCurrency] = useState<"INR" | "USD">("INR");
  const [exchangeRate, setExchangeRate] = useState<number>(83); // Default fallback
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [rateLastUpdated, setRateLastUpdated] = useState<string>("");
  
  // UPI details
  const UPI_ID = "6260976807@axl";
  const UPI_NAME = "ANIL";
  
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
  
  const handleTip = () => {
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    // Convert to INR if USD selected (using live exchange rate)
    const amountInINR = tipCurrency === "USD" ? Math.round(amount * exchangeRate) : amount;
    
    // Build UPI link
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&mc=0000&mode=02&purpose=00&tn=${encodeURIComponent("Tip via Oplus AI")}&am=${amountInINR}&cu=INR`;
    
    // Open UPI app
    window.location.href = upiLink;
    
    // Close dialog
    setTipDialogOpen(false);
    setTipAmount("");
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



  useEffect(() => {
    if (!game.sound_url) return;
    if (!bgAudioRef.current) return;
    bgAudioRef.current.muted = !soundOn;
  }, [soundOn, game.sound_url]);

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{game.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{participants.length} playing</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1 mr-2">
              <Users className="h-4 w-4" /> {participants.length}
            </div>
            {game.sound_url && (
              <Button
                variant={soundOn ? "default" : "secondary"}
                size="icon"
                onClick={() => setSoundOn((v) => !v)}
                title={soundOn ? "Sound off" : "Sound on"}
                className={soundOn ? "gradient-primary" : ""}
              >
                {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            )}
            <Button
              variant={isMicOn ? "default" : "secondary"}
              size="icon"
              onClick={toggleMic}
              title={isMicOn ? "Mute mic" : "Unmute mic"}
              className={isMicOn ? "gradient-primary" : ""}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setTipDialogOpen(true)}
              title="Tip the creator"
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <DollarSign className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-destructive/20"
            >
              <X className="h-5 w-5" />
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
      <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
        <DialogContent className="sm:max-w-md z-[200]">
          <DialogHeader>
            <DialogTitle>Tip the Creator 💰</DialogTitle>
          </DialogHeader>
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
              <DollarSign className="h-4 w-4 mr-2" />
              Send Tip via UPI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};