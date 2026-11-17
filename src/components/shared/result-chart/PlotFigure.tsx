import { useEffect, useRef, useState } from 'react';
import * as Plot from '@observablehq/plot';

export function PlotFigure({ options }: { options: Plot.PlotOptions }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    try {
      const figure = Plot.plot(options);
      ref.current?.replaceChildren(figure);
      return () => figure.remove();
    } catch {
      ref.current?.replaceChildren();
      setFailed(true);
    }
  }, [options]);
  return (
    <>
      {failed ? <p role="alert">No se pudo dibujar la gráfica. Consulta la tabla de resultados.</p> : null}
      <div ref={ref} className="c-result-chart__figure" />
    </>
  );
}
