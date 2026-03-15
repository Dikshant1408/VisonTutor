import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle } from '../firebase';
import { LogIn, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
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
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
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
          
          <button
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};
