import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function VerifyRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || !type) {
        navigate('/auth');
        return;
      }

      try {
        // Verify the token using the custom domain
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (error) {
          console.error('Verification error:', error);
          navigate('/auth?error=verification_failed');
        } else {
          navigate('/feed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        navigate('/auth?error=verification_failed');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return <LoadingSpinner fullScreen />;
}
