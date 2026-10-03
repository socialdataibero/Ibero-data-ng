import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync, realpathSync } from 'node:fs';
import { execSync } from 'node:child_process';

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

function runGit(command: string): string | null {
  try {
    return execSync(`git ${command}`, { cwd: projectRoot, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

function resolveVersion(baseVersion: string): string {
  const [major = '0', minor = '0', patch = '0'] = baseVersion.split('.');
  const commitCount = runGit('rev-list --count HEAD');
  return `${major}.${minor}.${commitCount ?? patch}`;
}

const buildInfo = {
  version: resolveVersion(packageJson.version),
  commit: runGit('rev-parse --short HEAD'),
  dirty: (runGit('status --porcelain') ?? '') !== '',
  builtAt: new Date().toISOString(),
};

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD__: JSON.stringify(buildInfo),
  },
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
