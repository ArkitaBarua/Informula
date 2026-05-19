import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { loadProfile } from '@/services/profile';

const BYPASS_PATHS = new Set<string>([
  '/post-auth',
  '/onboarding',
  '/sso-callback',
]);

const FirstLoginGuard: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      if (!isSignedIn || !user) return;

      // Don't guard onboarding/auth routes
      if (BYPASS_PATHS.has(location.pathname)) return;

      // Check if this is the first time this user has signed in this session
      const userSessionKey = `profileGuardChecked_${user.id}`;
      if (sessionStorage.getItem(userSessionKey) === 'true') return;

      // Check if user has ever completed onboarding (persistent across sessions)
      const hasCompletedOnboardingKey = `hasCompletedOnboarding_${user.id}`;
      if (localStorage.getItem(hasCompletedOnboardingKey) === 'true') {
        // User has completed onboarding before, don't redirect
        sessionStorage.setItem(userSessionKey, 'true');
        return;
      }

      try {
        const data = await loadProfile(user.id);
        const incomplete = !data || data.age === null || !data.gender || !data.diet_type;
        if (incomplete) {
          // Only redirect to onboarding on first sign-in
          navigate('/onboarding', { replace: true });
        } else {
          // Mark as completed onboarding
          localStorage.setItem(hasCompletedOnboardingKey, 'true');
        }

        sessionStorage.setItem(userSessionKey, 'true');
      } catch (error) {
        // On timeout or error, assume incomplete and send to onboarding
        navigate('/onboarding', { replace: true });
        sessionStorage.setItem(userSessionKey, 'true');
      }
    };
    run();
  }, [isSignedIn, user, navigate, location.pathname]);

  return null;
};

export default FirstLoginGuard;


