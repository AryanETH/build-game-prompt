import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Coins, QrCode, Loader2, CheckCircle, AlertCircle, Smartphone, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from "qrcode";

interface CoinPurchaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CoinPurchase = ({ open, onOpenChange, onSuccess }: CoinPurchaseProps) => {
  const [step, setStep] = useState<'amount' | 'utr' | 'success'>('amount');
  const [amount, setAmount] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  const coins = amount ? parseInt(amount) * 2 : 0;
  const upiId = "6260976807@ibl"; // Your UPI ID
  const merchantName = "Oplus";

  // Detect if mobile device
  useEffect(() => {
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
  }, []);

  // Generate QR code when amount is set
  useEffect(() => {
    if (amount && step === 'utr') {
      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Oplus Coins Purchase`)}`;
      
      QRCode.toDataURL(upiString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(err => {
        console.error('QR generation error:', err);
      });
    }
  }, [amount, step, upiId]);

  const handleAmountSubmit = () => {
    if (!amount || parseInt(amount) < 1) {
      toast.error("Please enter a valid amount (minimum ₹1)");
      return;
    }
    setStep('utr');
  };

  const handlePayNow = () => {
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Oplus Coins Purchase`)}`;
    
    // Open UPI payment app
    window.location.href = upiString;
    
    toast.info("Opening payment app...", {
      description: "Complete the payment and return to enter UTR"
    });
  };

  const handleUtrSubmit = async () => {
    if (!utrNumber.trim()) {
      toast.error("Please enter UTR number");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please sign in");
        return;
      }

      let screenshotUrl = null;
      
      // Upload screenshot if provided
      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${userData.user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(fileName, screenshot);

        if (uploadError) {
          console.error('Screenshot upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('payment-screenshots')
            .getPublicUrl(uploadData.path);
          screenshotUrl = urlData.publicUrl;
        }
      }

      // Create purchase record
      const { error } = await (supabase as any)
        .from('coin_purchases')
        .insert({
          user_id: userData.user.id,
          amount_inr: parseFloat(amount),
          coins_amount: coins,
          utr_number: utrNumber.trim(),
          payment_screenshot_url: screenshotUrl,
          status: 'pending'
        });

      if (error) throw error;

      setStep('success');
      toast.success("Payment submitted for verification!");
      
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
        // Reset state
        setStep('amount');
        setAmount('');
        setUtrNumber('');
        setScreenshot(null);
      }, 3000);

    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || "Failed to submit purchase");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setStep('amount');
      setAmount('');
      setUtrNumber('');
      setScreenshot(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[800px]">
        {step === 'amount' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Purchase Coins
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Exchange Rate</p>
                  <p className="text-2xl font-bold">₹1 = 2 Coins</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Enter Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="Enter amount in rupees"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {amount && (
                  <p className="text-sm text-muted-foreground">
                    You will receive: <span className="font-bold text-yellow-500">{coins} Coins</span>
                  </p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold">Benefits of Plus Membership:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Golden profile badge</li>
                  <li>• Support your favorite creators</li>
                  <li>• Exclusive Plus member status</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleAmountSubmit} disabled={!amount || parseInt(amount) < 1}>
                Continue to Payment
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'utr' && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
            </DialogHeader>
            
            {/* Mobile: Vertical Layout */}
            <div className="md:hidden space-y-4 py-4">
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="text-center space-y-3">
                  {isMobile && (
                    <Button
                      onClick={handlePayNow}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2"
                      size="lg"
                    >
                      <Smartphone className="w-5 h-5" />
                      Pay ₹{amount} Now
                    </Button>
                  )}
                  
                  <div className="pt-2 border-t border-purple-500/20">
                    <p className="text-xs text-muted-foreground mb-1">UPI ID:</p>
                    <p className="text-sm font-bold font-mono">{upiId}</p>
                    <p className="text-xl font-bold text-purple-500 mt-2">₹{amount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utr">UTR/Transaction Number *</Label>
                <Input
                  id="utr"
                  placeholder="Enter 12-digit UTR number"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your payment app after completing the transaction
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">Payment Screenshot (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  />
                  {screenshot && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Your coins will be credited after admin verification (usually within 10 minutes)
                  </p>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Coins not credited?</p>
                    <p>Contact support with your UTR number for instant resolution</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Horizontal Layout */}
            <div className="hidden md:flex gap-6 py-4">
              {/* Left: QR Code */}
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="text-center space-y-3">
                    {qrCodeUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Scan to Pay</p>
                        <img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48 border-4 border-white rounded-lg shadow-lg" />
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-purple-500/20">
                      <p className="text-xs text-muted-foreground mb-1">UPI ID:</p>
                      <p className="text-sm font-bold font-mono">{upiId}</p>
                      <p className="text-2xl font-bold text-purple-500 mt-2">₹{amount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Form */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="utr-desktop">UTR/Transaction Number *</Label>
                  <Input
                    id="utr-desktop"
                    placeholder="Enter 12-digit UTR number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in your payment app after completing the transaction
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="screenshot-desktop">Payment Screenshot (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="screenshot-desktop"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    />
                    {screenshot && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Your coins will be credited after admin verification (usually within 10 minutes)
                    </p>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-semibold mb-1">Coins not credited?</p>
                      <p>Contact support with your UTR number for instant resolution</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('amount')} disabled={loading}>
                Back
              </Button>
              <Button onClick={handleUtrSubmit} disabled={loading || !utrNumber.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle>Payment Submitted!</DialogTitle>
            </DialogHeader>
            
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <p className="font-semibold mb-2">Payment Under Review</p>
                <p className="text-sm text-muted-foreground">
                  Your payment of ₹{amount} for {coins} coins has been submitted.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  You'll receive your coins after admin verification.
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
