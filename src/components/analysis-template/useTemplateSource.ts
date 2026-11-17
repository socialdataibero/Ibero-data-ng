import { useEffect, useState } from 'react';
import { datasetsService } from '../../core/services/datasets.service';
import { resourcesService } from '../../core/services/resources.service';
import { errorMessage, isNotFound } from '../../core/api/http';
import type { Dataset } from '../../core/models/dataset.model';
import type { Resource } from '../../core/models/resource.model';

export function useTemplateSource(organizationId: string, datasetId: string) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setDataset(null);
    setResources(null);
    setNotFound(false);
    setLoadError(null);
    void Promise.all([
      datasetsService.get(organizationId, datasetId),
      resourcesService.list(organizationId, datasetId),
    ])
      .then(([nextDataset, nextResources]) => {
        if (!active) return;
        setDataset(nextDataset);
        setResources(nextResources);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (isNotFound(err)) setNotFound(true);
        else setLoadError(errorMessage(err, 'No se pudo cargar el conjunto de datos y sus archivos.'));
      });
    return () => {
      active = false;
    };
  }, [organizationId, datasetId, attempt]);

  return {
    dataset,
    resources,
    notFound,
    loadError,
    retrySource: () => setAttempt((value) => value + 1),
  };
}
