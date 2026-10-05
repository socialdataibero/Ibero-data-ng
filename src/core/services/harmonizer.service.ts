import { http, downloadBlob, triggerDownload } from '../api/http';
import type {
  HarmonizerSurvey,
  HarmonizerDataset,
  MappingInfo,
  MappingChoice,
  DatasetHarmonizedView,
  SurveyHarmonizedView,
  ExportFormat,
} from '../models/harmonizer.model';

export interface UploadDatasetPayload {
  name: string;
  year: number;
  surveyId: string;
  newSurvey?: string;
}

export interface UpdateSurveyPayload {
  name?: string;
  description?: string;
}

export interface ListSurveysParams {
  limit?: number;
  offset?: number;
}

export interface ListSurveysResult {
  total: number;
  items: HarmonizerSurvey[];
}

function variablesQuery(variables?: string[]): string {
  if (!variables?.length) return '';
  const params = new URLSearchParams();
  for (const v of variables) params.append('variables', v);
  return `?${params.toString()}`;
}

export const harmonizerService = {
  listSurveysPaged: ({ limit, offset }: ListSurveysParams = {}, signal?: AbortSignal) => {
    const qs = new URLSearchParams();
    if (limit !== undefined) qs.set('limit', String(limit));
    if (offset !== undefined) qs.set('offset', String(offset));
    const query = qs.toString();
    return http.get<ListSurveysResult>(`/harmonizer/surveys${query ? `?${query}` : ''}`, signal);
  },

  listSurveys: async (signal?: AbortSignal): Promise<HarmonizerSurvey[]> => {
    const { items } = await harmonizerService.listSurveysPaged({ limit: 200 }, signal);
    return items;
  },

  createSurvey: async (name: string, description?: string): Promise<HarmonizerSurvey> => {
    const created = await http.post<{ id: string; name: string; description: string | null }>(
      '/harmonizer/surveys',
      { name, description },
    );
    return { ...created, datasets: [] };
  },

  getSurvey: (surveyId: string, signal?: AbortSignal) =>
    http.get<{ id: string; name: string; description: string | null }>(
      `/harmonizer/surveys/${surveyId}`,
      signal,
    ),

  updateSurvey: (surveyId: string, payload: UpdateSurveyPayload) =>
    http.patch<{ id: string; name: string; description: string | null }>(
      `/harmonizer/surveys/${surveyId}`,
      payload,
    ),

  removeSurvey: (surveyId: string) => http.delete<void>(`/harmonizer/surveys/${surveyId}`),

  uploadDataset: (payload: UploadDatasetPayload, file: File) => {
    const form = new FormData();
    form.append('name', payload.name);
    form.append('year', String(payload.year));
    form.append('surveyId', payload.surveyId);
    if (payload.newSurvey) form.append('newSurvey', payload.newSurvey);
    form.append('file', file);
    return http.post<{ datasetId: string; dataset: HarmonizerDataset }>('/harmonizer/upload', form);
  },

  getMapping: (datasetId: string, signal?: AbortSignal) =>
    http.get<MappingInfo>(`/harmonizer/datasets/${datasetId}/mapping`, signal),

  saveMapping: (datasetId: string, columns: MappingChoice[]) =>
    http.put<{ ok: true; datasetId: string }>(`/harmonizer/datasets/${datasetId}/mapping`, {
      columns,
    }),

  getDatasetHarmonized: (datasetId: string, signal?: AbortSignal) =>
    http.get<DatasetHarmonizedView>(`/harmonizer/datasets/${datasetId}/harmonized`, signal),

  getSurveyHarmonized: (surveyId: string, variables?: string[], signal?: AbortSignal) =>
    http.get<SurveyHarmonizedView>(
      `/harmonizer/surveys/${surveyId}/harmonized${variablesQuery(variables)}`,
      signal,
    ),

  downloadDatasetExport: async (datasetId: string, fmt: ExportFormat): Promise<void> => {
    const { blob, filename } = await downloadBlob(
      `/harmonizer/datasets/${datasetId}/harmonized.${fmt}`,
    );
    triggerDownload(blob, filename ?? `harmonized.${fmt}`);
  },

  downloadSurveyExport: async (
    surveyId: string,
    fmt: ExportFormat,
    variables?: string[],
  ): Promise<void> => {
    const { blob, filename } = await downloadBlob(
      `/harmonizer/surveys/${surveyId}/harmonized.${fmt}${variablesQuery(variables)}`,
    );
    triggerDownload(blob, filename ?? `harmonized.${fmt}`);
  },

  /** Same export as downloadDatasetExport, but returned as a Blob instead of triggering a browser download. */
  getDatasetExportBlob: (datasetId: string, fmt: ExportFormat) =>
    downloadBlob(`/harmonizer/datasets/${datasetId}/harmonized.${fmt}`),

  /** Same export as downloadSurveyExport, but returned as a Blob instead of triggering a browser download. */
  getSurveyExportBlob: (surveyId: string, fmt: ExportFormat, variables?: string[]) =>
    downloadBlob(`/harmonizer/surveys/${surveyId}/harmonized.${fmt}${variablesQuery(variables)}`),
};
