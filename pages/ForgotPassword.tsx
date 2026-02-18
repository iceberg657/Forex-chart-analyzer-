
import React, { useState, useEffect } from 'react';
import { Link } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { resetPassword, error, clearError } = useAuth();

  // Clear errors when component mounts
  useEffect(() => {
      clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    if(email) {
      setIsLoading(true);
      try {
        await resetPassword(email);
        setSuccessMessage("Password reset email sent! Check your inbox.");
      } catch (e) {
        // Error is set in context
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email to receive reset instructions
          </p>
        </div>
        
        {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 text-sm text-red-600 dark:text-red-400 text-center font-medium animate-pulse">
                {error}
            </div>
        )}

        {successMessage && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-md p-3 text-sm text-green-600 dark:text-green-400 text-center font-medium">
                {successMessage}
            </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-400/30 dark:border-gray-500/50 bg-gray-500/10 dark:bg-gray-900/40 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-red-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>

         <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
