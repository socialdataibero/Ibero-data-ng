export const buildInfo = __APP_BUILD__;

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatBuildInfo(): string {
  const parts = [`Versión ${buildInfo.version}`];
  if (buildInfo.commit) {
    parts.push(
      buildInfo.dirty ? `${buildInfo.commit} (con cambios sin guardar)` : buildInfo.commit,
    );
  }
  parts.push(`compilada ${dateFormatter.format(new Date(buildInfo.builtAt))}`);
  return parts.join(' · ');
}
