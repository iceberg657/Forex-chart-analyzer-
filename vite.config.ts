
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // SECURITY UPDATE: We explicitly set process.env.API_KEY to undefined for the browser bundle.
      // This prevents the sensitive API key from being exposed in the frontend code.
      // The app will detect this and automatically use the secure /api/* endpoints running on Vercel.
      'process.env.API_KEY': JSON.stringify(undefined),
    },
  };
});
