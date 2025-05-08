import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   // https://vitejs.dev/config/
   export default defineConfig(({ mode }) => ({
     plugins: [react()],
     base: mode === 'production' ? './' : '/',
     server: {
       historyApiFallback: true // Support SPA routing for subdirectories in dev
     }
   }));