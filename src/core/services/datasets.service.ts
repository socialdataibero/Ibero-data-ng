import { http } from '../api/http';
import type { Dataset, DatasetVisibility, PeriodType, Survey } from '../models/dataset.model';

export interface CreateDatasetPayload {
  title: string;
  slug: string;
  description?: string;
  visibility?: DatasetVisibility;
  survey?: Survey;
  year?: number;
  periodType?: PeriodType;
  sourceOrg?: string;
  sourceUrl?: string;
  tags?: string[];
  licenseId?: string;
  revisionOfId?: string;
  changelog?: string;
}

export type DatasetSort = 'recent' | 'title-asc' | 'title-desc' | 'year-desc' | 'year-asc';

export interface ListDatasetsParams {
  q?: string;
  terms?: string[];
  sort?: DatasetSort;
  limit?: number;
  offset?: number;
}

export interface ListDatasetsResult {
  total: number;
  items: Dataset[];
}

function buildQuery(params: ListDatasetsParams): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  for (const term of params.terms ?? []) qs.append('term', term);
  if (params.sort) qs.set('sort', params.sort);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return query ? `?${query}` : '';
}

export const datasetsService = {
  /** Paginated, filtered listing for an organization — drives the real list UI. */
  listPaged: (organizationId: string, params: ListDatasetsParams = {}) =>
    http.get<ListDatasetsResult>(`/organizations/${organizationId}/datasets${buildQuery(params)}`),

  /** Paginated, filtered global listing — drives the admin Datasets page. */
  listAllPaged: (params: ListDatasetsParams = {}) =>
    http.get<ListDatasetsResult>(`/datasets${buildQuery(params)}`),

  /** Bare list for the dashboard's "recent datasets" widget. */
  listAll: async (limit?: number): Promise<Dataset[]> => {
    const { items } = await datasetsService.listAllPaged({ limit, sort: 'recent' });
    return items;
  },

  get: (organizationId: string, datasetId: string) =>
    http.get<Dataset>(`/organizations/${organizationId}/datasets/${datasetId}`),

  create: (organizationId: string, payload: CreateDatasetPayload) =>
    http.post<Dataset>(`/organizations/${organizationId}/datasets`, payload),

  remove: (organizationId: string, datasetId: string) =>
    http.delete<void>(`/organizations/${organizationId}/datasets/${datasetId}`),
};
