import { http } from '../api/http';
import type { QueryResult, Resource } from '../models/resource.model';

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

  runQuery: (organizationId: string, datasetId: string, resourceId: string, sql: string) =>
    http.post<QueryResult>(`${base(organizationId, datasetId)}/${resourceId}/query`, { sql }),

  vistraceHandoff: (organizationId: string, datasetId: string, resourceId: string) =>
    http.get<{ url: string }>(`${base(organizationId, datasetId)}/${resourceId}/vistrace-handoff`),
};
