
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuth';
import { useEnvironment } from '../hooks/useEnvironment';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle, error, clearError } = useAuth();
  const navigate = useNavigate();
  const environment = useEnvironment();
  const showSocialLogin = environment !== 'aistudio';

  // Clear errors when component mounts
  useEffect(() => {
      clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(email && password) {
      setIsLoading(true);
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (e) {
        // Error is set in context
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
      setIsLoading(true);
      try {
          await loginWithGoogle();
          navigate('/dashboard');
      } catch (e) {
          // Error is set in context, or logged if it was a cancellation
          console.log("Google Login failed or cancelled", e);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to Apex Trader
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Access your dashboard
          </p>
        </div>
        
        {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 text-sm text-red-600 dark:text-red-400 text-center font-medium animate-pulse">
                {error}
            </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-400/30 dark:border-gray-500/50 bg-gray-500/10 dark:bg-gray-900/40 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-gray-400/30 dark:border-gray-500/50 bg-gray-500/10 dark:bg-gray-900/40 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-red-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
              {!isLoading && (
                  <span className="ml-2 transform transition-transform duration-200 ease-in-out group-hover:translate-x-1 group-active:translate-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
              )}
            </button>
          </div>
        </form>

        {showSocialLogin && (
            <>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-100 dark:bg-gray-900 text-gray-500 rounded">Or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                   <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-2.14-.15-2.14z"/>
                   </svg>
                   Sign in with Google
                </button>
            </>
        )}

         <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
