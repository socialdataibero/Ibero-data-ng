import { useId, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from 'sectei-library';
import { AnalysisBuilder } from '../analysis-builder/AnalysisBuilder';
import { PageHeader } from '../shared/page-header/PageHeader';
import { PageHeaderSkeleton } from '../shared/page-header/PageHeaderSkeleton';
import { DatasetNotFound } from '../shared/dataset-not-found/DatasetNotFound';
import { DatasetResourcesSkeleton } from './DatasetDetailSkeleton';
import { useDatasetDetail } from './useDatasetDetail';
import './dataset-detail.css';

function visibilityLabel(visibility: string): string {
  if (visibility === 'PUBLIC') return 'Público';
  if (visibility === 'PRIVATE') return 'Privado';
  return visibility;
}

export function DatasetDetail() {
  const { pathname } = useLocation();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    organizationId,
    datasetId,
    canEdit,
    canDelete,
    dataset,
    datasetNotFound,
    resources,
    loadingResources,
    uploading,
    uploadError,
    selectedResourceId,
    setSelectedResourceId,
    selectedResource,
    openingVistrace,
    vistraceError,
    editingAnalysis,
    setEditingAnalysis,
    onFileSelected,
    onRequestEditResource,
    openInVistrace,
  } = useDatasetDetail();

  const title = dataset?.title ?? 'Conjunto de datos';
  // Opened from the datasets catalog (/datasets/...), the page stays in that section (SDI-131).
  const crumbs = pathname.startsWith('/datasets/')
    ? [
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Conjuntos de datos', href: '/datasets' },
        { label: title },
      ]
    : [
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Organizaciones', href: '/organizations' },
        { label: 'Conjuntos de datos', href: `/organizations/${organizationId}` },
        { label: title },
      ];

  if (datasetNotFound) return <DatasetNotFound />;

  return (
    <div className="c-dataset-detail">
      {dataset ? (
        <PageHeader
          title={dataset.title}
          intro={
            <div className="c-dataset-detail__header-meta">
              <div className="c-dataset-detail__tags" aria-label="Clasificación">
                <span className="c-dataset-detail__chip">
                  {visibilityLabel(dataset.visibility)}
                </span>
                {dataset.survey ? (
                  <span className="c-dataset-detail__chip">{dataset.survey}</span>
                ) : null}
                {dataset.year ? (
                  <span className="c-dataset-detail__chip">{dataset.year}</span>
                ) : null}
                {dataset.periodType ? (
                  <span className="c-dataset-detail__chip">{dataset.periodType}</span>
                ) : null}
                <span className="c-dataset-detail__chip">v{dataset.revision}</span>
              </div>
              {dataset.description ? (
                <p className="c-dataset-detail__description">{dataset.description}</p>
              ) : null}
            </div>
          }
          crumbs={crumbs}
          action={
            canEdit ? (
              <div className="c-dataset-detail__header-actions" role="group" aria-label="Acciones">
                {!dataset.supersededBy ? (
                  <Button
                    type="button"
                    variant="secondary"
                    icon="pictogram-add"
                    href={`/organizations/${organizationId}/datasets/new?revisionOf=${dataset.id}`}
                  >
                    Crear revisión
                  </Button>
                ) : null}
              </div>
            ) : null
          }
        />
      ) : (
        <PageHeaderSkeleton />
      )}

      <div className="container width-fixed c-dataset-detail__body">
        {dataset &&
        (dataset.sourceOrg ||
          dataset.licenseId ||
          dataset.tags.length > 0 ||
          dataset.revisionOf ||
          dataset.supersededBy) ? (
          <section className="c-dataset-detail__metadata" aria-label="Metadatos">
            {(dataset.sourceOrg || dataset.licenseId || dataset.tags.length > 0) && (
              <div className="c-dataset-detail__facts">
                {dataset.sourceOrg ? (
                  <span>
                    <strong>Fuente:</strong> {dataset.sourceOrg}
                  </span>
                ) : null}
                {dataset.licenseId ? (
                  <span>
                    <strong>Licencia:</strong> {dataset.licenseId}
                  </span>
                ) : null}
                {dataset.tags.length > 0 ? (
                  <span>
                    <strong>Etiquetas:</strong> {dataset.tags.join(', ')}
                  </span>
                ) : null}
              </div>
            )}

            {dataset.revisionOf ? (
              <p className="c-dataset-detail__note">
                Revisión de{' '}
                <Link to={`/organizations/${organizationId}/datasets/${dataset.revisionOf.id}`}>
                  {dataset.revisionOf.title}
                </Link>{' '}
                (v{dataset.revisionOf.revision}).
                {dataset.changelog ? ` Cambios: ${dataset.changelog}` : null}
              </p>
            ) : null}

            {dataset.supersededBy ? (
              <p className="c-dataset-detail__note c-dataset-detail__note--alert">
                Hay una revisión más reciente:{' '}
                <Link to={`/organizations/${organizationId}/datasets/${dataset.supersededBy.id}`}>
                  {dataset.supersededBy.title}
                </Link>{' '}
                (v{dataset.supersededBy.revision}).
              </p>
            ) : null}
          </section>
        ) : null}

        {canEdit ? (
          <section className="c-dataset-detail__section" aria-labelledby="upload-title">
            <h2 id="upload-title" className="c-dataset-detail__subtitle">
              Subir archivo Parquet
            </h2>
            <input
              ref={fileRef}
              id={fileInputId}
              type="file"
              accept=".parquet"
              className="c-dataset-detail__file-input"
              aria-label="Archivo Parquet"
              disabled={uploading}
              onChange={onFileSelected}
            />
            <Button
              type="button"
              variant="secondary"
              icon="pictogram-file-upload"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'Subiendo…' : 'Seleccionar archivo'}
            </Button>
            <p className="c-dataset-detail__help">
              Sube un archivo <code>.parquet</code> como recurso de este conjunto de datos.{' '}
              ¿Necesitas unificar columnas de varias ediciones de una encuesta primero?{' '}
              <Link to="/harmonizer" className="hyperlink">
                Usa el Armonizador
              </Link>{' '}
              y desde ahí podrás adjuntar el resultado directamente a este o cualquier otro conjunto
              de datos.
            </p>
            {uploadError ? <p className="c-dataset-detail__error">{uploadError}</p> : null}
          </section>
        ) : null}

        <section className="c-dataset-detail__section" aria-labelledby="resources-title">
          <h2 id="resources-title" className="c-dataset-detail__subtitle">
            Recursos
          </h2>
          {loadingResources ? (
            <DatasetResourcesSkeleton />
          ) : resources.length === 0 ? (
            <p className="c-dataset-detail__help">Todavía no hay archivos subidos.</p>
          ) : (
            <>
              <label className="c-dataset-detail__label" htmlFor="dataset-resource">
                Archivo
              </label>
              <select
                id="dataset-resource"
                name="resource"
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
              >
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.filename} ({(resource.sizeBytes / 1024).toFixed(1)} KB)
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="primary"
                icon="pictogram-link-external"
                aria-describedby="vistrace-help"
                onClick={openInVistrace}
                disabled={openingVistrace || !selectedResourceId}
              >
                {openingVistrace ? 'Abriendo…' : 'Crear análisis con vistrace'}
              </Button>
              <p id="vistrace-help" className="c-dataset-detail__help">
                Abre este archivo en vistrace en una pestaña nueva. Desde ahí, “Guardar en Ibero
                Data” lo publica como análisis de este conjunto de datos con su receta completa.
              </p>
              {vistraceError ? <p className="c-dataset-detail__error">{vistraceError}</p> : null}
            </>
          )}
        </section>

        {selectedResourceId ? (
          <section className="c-dataset-detail__section" aria-labelledby="analysis-section-title">
            <h2 id="analysis-section-title" className="c-dataset-detail__subtitle">
              Análisis por pasos
            </h2>
            <AnalysisBuilder
              organizationId={organizationId}
              datasetId={datasetId}
              resourceId={selectedResourceId}
              resourceColumns={selectedResource?.columns ?? null}
              datasetResources={resources}
              editingAnalysis={editingAnalysis}
              canEdit={canEdit}
              canDelete={canDelete}
              onRequestEditResource={onRequestEditResource}
              onEditingConsumed={() => setEditingAnalysis(null)}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
