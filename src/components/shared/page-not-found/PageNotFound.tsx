import { Button } from 'sectei-library';

/** Shown inside the portal shell for any URL that matches no route (SDI-112), so the header and a way back stay visible. */
export function PageNotFound() {
  return (
    <section className="container width-fixed" style={{ paddingBlock: '3rem' }}>
      <h1>Página no encontrada</h1>
      <p>La dirección que abriste no existe o cambió de lugar.</p>
      <Button type="button" variant="primary" icon="pictogram-arrow-left" href="/">
        Ir al inicio
      </Button>
    </section>
  );
}
