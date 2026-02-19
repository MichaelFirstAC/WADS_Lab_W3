'use client';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';

export default function DashboardPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutMessage, setSignOutMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && !isSigningOut) {
        router.replace('/login');
      }
    });

    return unsubscribe;
  }, [isSigningOut, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutMessage('Signed out successfully!');

    try {
      await signOut(auth);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace('/login');
    } catch {
      setIsSigningOut(false);
      setSignOutMessage('Sign out failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {signOutMessage && (
        <div
          data-testid="signout-message"
          className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg"
        >
          {signOutMessage}
        </div>
      )}
      {isSigningOut && (
        <div
          data-testid="signout-buffer"
          className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg animate-pulse"
        >
          Buffering... Redirecting to login
        </div>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
      >
        {isSigningOut ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
}
