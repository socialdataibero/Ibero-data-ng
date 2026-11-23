import { http } from '../api/http';
import type { QueryResult, Resource, SourceStatus } from '../models/resource.model';

const base = (organizationId: string, datasetId: string) =>
  `/organizations/${organizationId}/datasets/${datasetId}/resources`;

export const resourcesService = {
  list: (organizationId: string, datasetId: string) =>
    http.get<Resource[]>(base(organizationId, datasetId)),

  upload: (organizationId: string, datasetId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post<Resource>(base(organizationId, datasetId), formData);
  },

  /**
   * Saves a harmonized view of the survey harmonizer as a resource: the server writes the
   * Parquet straight to storage (README "From the harmonizer"), so it never goes through the
   * browser or the upload's 500 MB limit.
   */
  attachHarmonized: (
    organizationId: string,
    datasetId: string,
    source: { editionId: string } | { surveyId: string; variables?: string[] },
  ) => http.post<Resource>(`${base(organizationId, datasetId)}/from-harmonizer`, source),

  /**
   * Replaces what the analysis templates know about each variable of the resource (README
   * "Variable metadata"). `metadata` is the object as written, e.g. a JSON file the user picked.
   */
  setVariableMetadata: (organizationId: string, datasetId: string, resourceId: string, metadata: unknown) =>
    http.put<Resource>(`${base(organizationId, datasetId)}/${resourceId}/variable-metadata`, { metadata }),

  /** Whether the harmonizer changed after the resource was saved from it. */
  sourceStatus: (organizationId: string, datasetId: string, resourceId: string) =>
    http.get<SourceStatus>(`${base(organizationId, datasetId)}/${resourceId}/source-status`),

  runQuery: (organizationId: string, datasetId: string, resourceId: string, sql: string) =>
    http.post<QueryResult>(`${base(organizationId, datasetId)}/${resourceId}/query`, { sql }),

  vistraceHandoff: (organizationId: string, datasetId: string, resourceId: string) =>
    http.get<{ url: string }>(`${base(organizationId, datasetId)}/${resourceId}/vistrace-handoff`),
};
