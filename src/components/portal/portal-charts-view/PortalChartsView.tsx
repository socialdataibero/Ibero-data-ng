import { Button } from 'sectei-library';
import { PortalDatasetHeader } from '../portal-dataset-header/PortalDatasetHeader';
import { PortalChartsHeader } from '../../shared/portal/portal-charts-header/PortalChartsHeader';
import { PortalModal } from '../../shared/portal/portal-modal/PortalModal';
import { PortalChartsViewSkeleton } from './PortalChartsViewSkeleton';
import { usePortalChartsView } from './usePortalChartsView';

export default function PortalChartsView() {
  const {
    loading,
    error,
    pkg,
    table,
    title,
    isAnalysis,
    organization,
    tabs,
    steps,
    longDate,
    mapTabs,
    labelColumn,
    modalOpen,
    setModalOpen,
    modalTab,
    setModalTab,
    modalTabs,
    openModal,
    openingVizCanvas,
    vizCanvasError,
    goToVizCanvas,
  } = usePortalChartsView();

  if (loading) {
    return <PortalChartsViewSkeleton />;
  }

  if (error || !pkg) {
    return (
      <main id="main-content">
        <section className="container width-fixed" style={{ paddingBlock: '3rem' }}>
          <p role="alert" className="text-color-secondary">
            {error ? `No se pudieron cargar los datos: ${error.message}` : 'No se encontró el conjunto solicitado en el catálogo.'}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content">
      <PortalDatasetHeader
        title={title}
        label={isAnalysis ? 'Análisis' : 'Datos'}
        source={organization.title || organization.name || 'Portal de datos'}
        institution={organization.title || organization.name || ''}
        lastUpdated={longDate(pkg.metadata_modified)}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Datos', href: '/datos' },
          { label: title },
        ]}
      />

      <section className="container width-fixed" style={{ paddingBlock: '2rem' }}>
        {tabs.length > 0 ? (
          <PortalChartsHeader
            title={title}
            titleHighlight={`${title.split(' ')[0]} `}
            tabs={mapTabs(tabs)}
            onAction={() => {
              openModal('table');
            }}
          />
        ) : (
          <p className="text-color-secondary">
            Este recurso no tiene columnas que se puedan graficar automáticamente. Tiene {table?.total ?? 0} registros — puedes
            revisarlos en la tabla de datos.
          </p>
        )}

        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}>
          {steps.length > 0 ? (
            <button type="button" className="hyperlink" onClick={() => openModal('recipe')}>
              Ver cómo se hizo este análisis
            </button>
          ) : null}
          <Button type="button" variant="secondary" onClick={goToVizCanvas} disabled={openingVizCanvas}>
            {openingVizCanvas ? 'Abriendo…' : 'Abrir en VizCanvas'}
          </Button>
        </div>
        {vizCanvasError ? (
          <p role="alert" className="text-color-secondary" style={{ marginTop: '0.5rem' }}>
            {vizCanvasError}
          </p>
        ) : null}

        <p className="text-color-secondary text-size-2" style={{ marginTop: '1rem' }}>
          {table?.total ?? 0} registros · {(table?.columns ?? []).length} columnas ·{' '}
          {table?.source === 'duckdb' ? 'DuckDB sobre Parquet' : 'DataStore'} ·{' '}
          {(table?.columns ?? []).map((c) => labelColumn(c.id)).join(', ')}
        </p>
      </section>

      <PortalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tabs={modalTabs}
        activeId={modalTab}
        onTabChange={(tabId) => setModalTab(tabId)}
      />
    </main>
  );
}
