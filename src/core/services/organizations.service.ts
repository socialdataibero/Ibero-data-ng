import { http } from '../api/http';
import type { Organization } from '../models/dataset.model';
import type { OrganizationMembership } from '../models/user.model';

export type OrganizationSort = 'recent' | 'name-asc' | 'name-desc' | 'datasets-desc' | 'members-desc';

export interface ListOrganizationsParams {
  q?: string;
  terms?: string[];
  sort?: OrganizationSort;
  limit?: number;
  offset?: number;
}

export interface ListOrganizationsResult {
  total: number;
  items: Organization[];
}

function buildQuery(params: ListOrganizationsParams): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  for (const term of params.terms ?? []) qs.append('term', term);
  if (params.sort) qs.set('sort', params.sort);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return query ? `?${query}` : '';
}

export const organizationsService = {
  /** The signed-in user's memberships, with their role in each organization. */
  myMemberships: (signal?: AbortSignal) =>
    http.get<OrganizationMembership[]>('/users/me/organizations', signal),

  /** Paginated, filtered listing — drives the real Organizations list UI. */
  listPaged: (params: ListOrganizationsParams = {}, signal?: AbortSignal) => http.get<ListOrganizationsResult>(`/organizations${buildQuery(params)}`, signal),

  recent: () => http.get<Organization[]>('/organizations/recent'),

  /** Bare list of every organization, for the dashboard summary widget. */
  list: async (): Promise<Organization[]> => {
    const { items } = await organizationsService.listPaged({ limit: 200 });
    return items;
  },

  get: (organizationId: string) => http.get<Organization>(`/organizations/${organizationId}`),

  create: (name: string, slug: string, description?: string) =>
    http.post<Organization>('/organizations', { name, slug, description }),

  remove: (organizationId: string) => http.delete<void>(`/organizations/${organizationId}`),
};
