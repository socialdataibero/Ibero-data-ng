import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function useInternalLinkNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) return;

      const anchor = (event.target as Element | null)?.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download') || anchor.relList.contains('external')) return;

      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);
}
