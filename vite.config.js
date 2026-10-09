import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE lets the same build run at the domain root (Netlify/Vercel)
// or under /<repo>/ on GitHub Pages.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
});
