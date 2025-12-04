
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // We removed the define block here.
  // This ensures the app uses the /api/ proxy on Vercel,
  // keeping your API_KEY secure on the server side.
});
