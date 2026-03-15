import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle } from '../firebase';
import { LogIn, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

const DEMO_MODE_KEY = 'visionTutor.demoMode';

function readDemoMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(DEMO_MODE_KEY) === 'true';
}

function writeDemoMode(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  if (enabled) {
    window.localStorage.setItem(DEMO_MODE_KEY, 'true');
    return;
  }

  window.localStorage.removeItem(DEMO_MODE_KEY);
}

function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

  switch (code) {
    case 'auth/popup-blocked':
      return 'The Google sign-in popup was blocked by the browser. Allow popups for localhost and try again.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before the login completed.';
    case 'auth/unauthorized-domain':
      return 'This localhost domain is not authorized in Firebase Authentication for this project.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in Firebase Authentication for this project.';
    default:
      return 'Google sign-in failed for this project. You can continue in local demo mode.';
  }
}

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(readDemoMode);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        writeDemoMode(false);
        setDemoMode(false);
        setAuthError(null);
        try {
          const userDoc = doc(db, 'users', u.uid);
          const snap = await getDoc(userDoc);
          if (!snap.exists()) {
            await setDoc(userDoc, {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Failed to initialize user profile:', error);
        }
        setUser(u);
      } else {
        setUser(null);
        setDemoMode(readDemoMode());
      }
      setIsSigningIn(false);
      setLoading(false);
    });
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsSigningIn(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      setIsSigningIn(false);
      setAuthError(getAuthErrorMessage(error));
      console.error('Google sign-in failed:', error);
    }
  };

  const enableDemoMode = () => {
    writeDemoMode(true);
    setDemoMode(true);
    setAuthError(null);
    setLoading(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !demoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">VisionTutor AI</h1>
          <p className="text-zinc-400 mb-8">Your personal AI-powered homework assistant. Sign in to start learning.</p>

          {authError ? (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-100">
              {authError}
            </div>
          ) : null}
          
          <button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="w-5 h-5" />
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <button
            onClick={enableDemoMode}
            className="mt-3 w-full rounded-2xl border border-zinc-700 px-6 py-4 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Continue in local demo mode
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
