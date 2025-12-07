import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AlertCircle, Loader2, CheckCircle, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClaimMissingCoinsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClaimMissingCoins = ({ open, onOpenChange }: ClaimMissingCoinsProps) => {
  const [utrNumber, setUtrNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!utrNumber.trim()) {
      toast.error("Please enter UTR number");
      return;
    }
    if (!amount || parseInt(amount) < 1) {
      toast.error("Please enter the amount you paid");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please sign in");
        return;
      }

      // Check if this UTR already exists
      const { data: existingPurchase } = await (supabase as any)
        .from('coin_purchases')
        .select('*')
        .eq('utr_number', utrNumber.trim())
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (existingPurchase) {
        if (existingPurchase.status === 'verified') {
          toast.info("This payment has already been verified and coins credited!");
          onOpenChange(false);
          return;
        } else if (existingPurchase.status === 'pending') {
          toast.info("This payment is already under review. Please wait for admin verification.");
          onOpenChange(false);
          return;
        } else if (existingPurchase.status === 'rejected') {
          toast.error(`This payment was rejected. Reason: ${existingPurchase.rejection_reason || 'Invalid payment'}`);
          return;
        }
      }

      // Create new claim
      const coins = parseInt(amount) * 2;
      const { error } = await (supabase as any)
        .from('coin_purchases')
        .insert({
          user_id: userData.user.id,
          amount_inr: parseFloat(amount),
          coins_amount: coins,
          utr_number: utrNumber.trim(),
          status: 'pending'
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Claim submitted! Admin will verify and credit your coins.");
      
      setTimeout(() => {
        onOpenChange(false);
        setSubmitted(false);
        setUtrNumber('');
        setAmount('');
      }, 3000);

    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error(error.message || "Failed to submit claim");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setSubmitted(false);
      setUtrNumber('');
      setAmount('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                Claim Missing Coins
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">Already made a payment?</p>
                    <p>If you've completed a UPI payment but haven't received your coins, submit your UTR number here for instant verification.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim-amount">Amount Paid (₹) *</Label>
                <Input
                  id="claim-amount"
                  type="number"
                  min="1"
                  placeholder="Enter amount you paid"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {amount && (
                  <p className="text-sm text-muted-foreground">
                    You should receive: <span className="font-bold text-yellow-500">{parseInt(amount) * 2} Coins</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim-utr">UTR/Transaction Number *</Label>
                <Input
                  id="claim-utr"
                  placeholder="Enter 12-digit UTR number"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your payment app's transaction history
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Admin will verify your payment and credit coins within 10 minutes
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !utrNumber.trim() || !amount}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Claim'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Claim Submitted!</DialogTitle>
            </DialogHeader>
            
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <p className="font-semibold mb-2">Claim Under Review</p>
                <p className="text-sm text-muted-foreground">
                  Your claim for ₹{amount} ({parseInt(amount) * 2} coins) has been submitted.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Admin will verify and credit your coins shortly.
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
