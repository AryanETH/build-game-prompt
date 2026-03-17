import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WaitlistInlineProps {
  isDarkMode?: boolean;
  webhookUrl?: string;
  placeholder?: string;
  buttonText?: string;
}

export const WaitlistInline = ({ 
  isDarkMode = true,
  webhookUrl = '',
  placeholder = 'Enter your email',
  buttonText = 'Join Waitlist'
}: WaitlistInlineProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(
    localStorage.getItem('waitlist_submitted') === 'true'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    try {
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            timestamp: new Date().toISOString(),
            source: window.location.href
          }),
        });
      }

      setIsSubmitted(true);
      toast.success("You're on the list!");
      localStorage.setItem('waitlist_submitted', 'true');
      localStorage.setItem('waitlist_email', email);
      
    } catch (error) {
      console.error('Waitlist error:', error);
      setIsSubmitted(true);
      toast.success("You're on the list!");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-full ${
        isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-500/20 text-green-600'
      }`}>
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">You're on the waitlist!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <Input
        type="email"
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={`flex-1 h-12 px-4 rounded-full ${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' 
            : 'bg-black/5 border-black/20 text-black placeholder:text-black/50'
        }`}
      />
      <Button
        type="submit"
        disabled={isLoading}
        className={`h-12 px-6 rounded-full font-semibold ${
          isDarkMode 
            ? 'bg-white text-black hover:bg-white/90' 
            : 'bg-black text-white hover:bg-black/90'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          buttonText
        )}
      </Button>
    </form>
  );
};

export default WaitlistInline;
