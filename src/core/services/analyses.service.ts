import { http } from '../api/http';
import type { Analysis, OpCatalog, PreviewResult, Step } from '../models/analysis.model';
import type { DatasetVisibility } from '../models/dataset.model';

export interface CreateAnalysisPayload {
  resourceId: string;
  title: string;
  slug: string;
  folder: string;
  description?: string;
  visibility?: DatasetVisibility;
  steps: Step[];
  roundDecimals?: number;
}

const base = (organizationId: string, datasetId: string) =>
  `/organizations/${organizationId}/datasets/${datasetId}/analyses`;

export const analysesService = {
  operations: (organizationId: string, datasetId: string) =>
    http.get<OpCatalog>(`${base(organizationId, datasetId)}/operations`),

  list: (organizationId: string, datasetId: string) =>
    http.get<Analysis[]>(base(organizationId, datasetId)),

  preview: (
    organizationId: string,
    datasetId: string,
    resourceId: string,
    steps: Step[],
    roundDecimals?: number,
  ) =>
    http.post<PreviewResult>(`${base(organizationId, datasetId)}/preview`, {
      resourceId,
      steps,
      roundDecimals,
    }),

  create: (organizationId: string, datasetId: string, payload: CreateAnalysisPayload) =>
    http.post<Analysis>(base(organizationId, datasetId), payload),

  update: (
    organizationId: string,
    datasetId: string,
    analysisId: string,
    payload: CreateAnalysisPayload,
  ) => http.patch<Analysis>(`${base(organizationId, datasetId)}/${analysisId}`, payload),

  getData: (organizationId: string, datasetId: string, analysisId: string) =>
    http.get<PreviewResult>(`${base(organizationId, datasetId)}/${analysisId}/data`),

  vistraceHandoff: (organizationId: string, datasetId: string, analysisId: string) =>
    http.get<{ url: string }>(`${base(organizationId, datasetId)}/${analysisId}/vistrace-handoff`),

  remove: (organizationId: string, datasetId: string, analysisId: string) =>
    http.delete<void>(`${base(organizationId, datasetId)}/${analysisId}`),
};
