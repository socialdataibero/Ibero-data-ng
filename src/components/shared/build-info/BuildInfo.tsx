import { formatBuildInfo } from '../../../core/build-info';
import './build-info.css';

export function BuildInfo() {
  return (
    <footer className="c-build-info text-color-secondary">
      <small>{formatBuildInfo()}</small>
    </footer>
  );
}
