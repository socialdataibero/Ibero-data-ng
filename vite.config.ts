import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { realpathSync } from 'node:fs';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const linkedPackages = ['sectei-library'];

function resolveRealPath(path: string): string | null {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

const linkedPackageDirs = linkedPackages
  .map((name) => resolveRealPath(fileURLToPath(new URL(`./node_modules/${name}`, import.meta.url))))
  .filter((path): path is string => path !== null);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 4200,
    strictPort: true,
    fs: {
      allow: [searchForWorkspaceRoot(projectRoot), ...linkedPackageDirs],
    },
  },
});
