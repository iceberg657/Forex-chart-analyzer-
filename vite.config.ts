import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    // Removed define: { 'process.env.API_KEY': ... }
    // This allows the environment-injected API_KEY to be used directly in Google AI Studio
    // while keeping the app flexible for production environments.
  };
});