import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveAuthData } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      navigate('/login?error=google_auth_failed');
      return;
    }

    if (accessToken && refreshToken) {
      try {
        // Decode JWT to get user info (simple decode, not verification)
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        
        const authData = {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: payload.id,
            email: payload.email,
            full_name: payload.full_name || payload.email,
            role: payload.role || 'bidder',
            is_active: true,
          }
        };

        // Save auth data
        saveAuthData(authData);
        
        // Update context
        login(authData.user);
        
        // Redirect to home page
        navigate('/');
      } catch (error) {
        console.error('Failed to parse token:', error);
        navigate('/login?error=token_parse_failed');
      }
    } else {
      navigate('/login?error=no_tokens');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Signing you in...</h2>
        <p className="text-muted-foreground">Please wait while we complete your Google sign-in</p>
      </div>
    </div>
  );
}
