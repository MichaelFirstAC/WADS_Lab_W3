'use client';

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { auth } from '@/lib/firebase';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage('');
    setAuthError('');
    setIsRedirecting(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'signUp') {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        setSuccessMessage('Account created!');
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        setSuccessMessage('Login successful!');
      }
      setFormData({ email: '', password: '' });
      setIsRedirecting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/dashboard');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSuccessMessage('');
    setAuthError('');
    setIsRedirecting(false);
    setIsGoogleLoading(true);

    try {
      const googleProvider = new GoogleAuthProvider();
      await signInWithPopup(auth, googleProvider);
      setSuccessMessage('Login successful!');
      setIsRedirecting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/dashboard');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Google login failed. Please try again.';
      setAuthError(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {authMode === 'signUp' ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600">
              {authMode === 'signUp' ? 'Sign up to get started' : 'Sign in to your account'}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div
              data-testid="success-message"
              className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg"
            >
              {successMessage}
            </div>
          )}
          {authError && (
            <div
              data-testid="auth-error"
              className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg"
            >
              {authError}
            </div>
          )}
          {isRedirecting && (
            <div
              data-testid="redirect-buffer"
              className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg animate-pulse"
            >
              Buffering... Redirecting to dashboard
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                data-testid="email-input"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600" data-testid="email-error">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                data-testid="password-input"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600" data-testid="password-error">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              data-testid="submit-button"
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 mt-6"
            >
              {isLoading
                ? authMode === 'signUp'
                  ? 'Creating account...'
                  : 'Signing in...'
                : authMode === 'signUp'
                  ? 'Create Account'
                  : 'Sign In'}
            </button>

            <div className="flex items-center">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-500 uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              data-testid="google-signin-button"
              className="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              {isGoogleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {authMode === 'signUp' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                data-testid="toggle-auth-mode"
                onClick={() => setAuthMode(authMode === 'signUp' ? 'signIn' : 'signUp')}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {authMode === 'signUp' ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
