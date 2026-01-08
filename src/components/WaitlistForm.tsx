import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface WaitlistFormProps {
  isDarkMode?: boolean;
  webhookUrl?: string;
}

export const WaitlistForm = ({ 
  isDarkMode = true,
  webhookUrl = '' // Your Google Apps Script webhook URL
}: WaitlistFormProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    try {
      // Send to Google Sheets via webhook
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors', // Required for Google Apps Script
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim(),
            timestamp: new Date().toISOString(),
            source: window.location.href
          }),
        });
      }

      setIsSubmitted(true);
      toast.success("You're on the list! 🎉");
      
      // Store in localStorage to remember submission
      localStorage.setItem('waitlist_submitted', 'true');
      localStorage.setItem('waitlist_email', email);
      
    } catch (error) {
      console.error('Waitlist submission error:', error);
      // Still show success since no-cors doesn't return response
      setIsSubmitted(true);
      toast.success("You're on the list! 🎉");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if already submitted
  if (isSubmitted || localStorage.getItem('waitlist_submitted') === 'true') {
    return (
      <div className={`text-center p-6 rounded-2xl border ${
        isDarkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-black/5 border-black/10'
      }`}>
        <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${
          isDarkMode ? 'text-green-400' : 'text-green-600'
        }`} />
        <h3 className={`text-xl font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          You're on the waitlist!
        </h3>
        <p className={`text-sm ${
          isDarkMode ? 'text-white/60' : 'text-black/60'
        }`}>
          We'll notify you when it's your turn to join.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className={`p-6 rounded-2xl border ${
        isDarkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-black/5 border-black/10'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className={`w-5 h-5 ${
            isDarkMode ? 'text-purple-400' : 'text-purple-600'
          }`} />
          <h3 className={`text-lg font-bold ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Join the Waitlist
          </h3>
        </div>
        
        <p className={`text-sm mb-4 ${
          isDarkMode ? 'text-white/60' : 'text-black/60'
        }`}>
          Be the first to know when we launch new features.
        </p>

        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40' 
                : 'bg-black/5 border-black/20 text-black placeholder:text-black/40'
            }`}
          />
          
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40' 
                : 'bg-black/5 border-black/20 text-black placeholder:text-black/40'
            }`}
          />
          
          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full font-semibold ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Waitlist'
            )}
          </Button>
        </div>
        
        <p className={`text-xs mt-3 text-center ${
          isDarkMode ? 'text-white/40' : 'text-black/40'
        }`}>
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </form>
  );
};

export default WaitlistForm;
