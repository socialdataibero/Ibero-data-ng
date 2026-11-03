import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { resourcesService } from '../../core/services/resources.service';
import { datasetsService } from '../../core/services/datasets.service';
import { errorMessage, isNotFound } from '../../core/api/http';
import type { Resource } from '../../core/models/resource.model';
import type { Dataset } from '../../core/models/dataset.model';
import type { Analysis } from '../../core/models/analysis.model';
import { useOrganizationRole } from '../../core/hooks/useOrganizationRole';

export function useDatasetDetail() {
  const { organizationId = '', datasetId = '' } = useParams();
  const { canEdit, canDelete } = useOrganizationRole(organizationId);

  const [dataset, setDataset] = useState<Dataset | null>(null);
  // The server answers 404 both for a missing dataset and for a private one the user cannot see.
  const [datasetNotFound, setDatasetNotFound] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selectedResourceId, setSelectedResourceId] = useState('');
  const selectedResource = useMemo(
    () => resources.find((r) => r.id === selectedResourceId) ?? null,
    [resources, selectedResourceId],
  );

  const [openingVistrace, setOpeningVistrace] = useState(false);
  const [vistraceError, setVistraceError] = useState<string | null>(null);
  const [editingAnalysis, setEditingAnalysis] = useState<Analysis | null>(null);

  const reloadResources = useCallback(async () => {
    setLoadingResources(true);
    try {
      const list = await resourcesService.list(organizationId, datasetId);
      setResources(list);
      setSelectedResourceId((current) => current || (list.length > 0 ? list[0].id : ''));
    } catch (err) {
      if (!isNotFound(err)) throw err;
      setDatasetNotFound(true);
    } finally {
      setLoadingResources(false);
    }
  }, [organizationId, datasetId]);

  useEffect(() => {
    void reloadResources();
    setDatasetNotFound(false);
    void datasetsService
      .get(organizationId, datasetId)
      .then(setDataset)
      .catch((err: unknown) => {
        if (!isNotFound(err)) throw err;
        setDatasetNotFound(true);
      });
  }, [reloadResources, organizationId, datasetId]);

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await resourcesService.upload(organizationId, datasetId, file);
      await reloadResources();
    } catch {
      setUploadError(
        'No se pudo subir el archivo (¿necesitas rol ADMIN/EDITOR? ¿es un .parquet válido?).',
      );
    } finally {
      setUploading(false);
      input.value = '';
    }
  };

  const onRequestEditResource = (analysis: Analysis) => {
    setSelectedResourceId(analysis.sourceResourceId);
    setEditingAnalysis(analysis);
  };

  const openInVistrace = async () => {
    if (!selectedResourceId) return;
    setVistraceError(null);
    const vistraceTab = window.open('about:blank', '_blank');
    if (!vistraceTab) {
      setVistraceError(
        'Permite las ventanas emergentes para abrir vistrace en una pestaña nueva.',
      );
      return;
    }
    vistraceTab.opener = null;
    setOpeningVistrace(true);
    try {
      const { url } = await resourcesService.vistraceHandoff(
        organizationId,
        datasetId,
        selectedResourceId,
      );
      vistraceTab.location.replace(url);
    } catch (err) {
      vistraceTab.close();
      setVistraceError(errorMessage(err, 'No se pudo abrir en vistrace.'));
    } finally {
      setOpeningVistrace(false);
    }
  };

  return {
    canEdit,
    canDelete,
    organizationId,
    datasetId,
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
  };
}
