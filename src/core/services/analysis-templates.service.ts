import { http } from '../api/http';
import type {
  TemplateCatalog,
  TemplateRequest,
  TemplateResult,
} from '../models/analysis-template.model';

const base = (organizationId: string, datasetId: string) =>
  `/organizations/${organizationId}/datasets/${datasetId}`;

export const analysisTemplatesService = {
  /**
   * Every template, whether this resource can use it, and the columns each input can take, for
   * `edition` (or the first edition of the file).
   */
  list: (
    organizationId: string,
    datasetId: string,
    resourceId: string,
    edition: string | null,
    signal?: AbortSignal,
  ) =>
    http.get<TemplateCatalog>(
      `${base(organizationId, datasetId)}/resources/${resourceId}/templates${edition ? `?edition=${encodeURIComponent(edition)}` : ''}`,
      signal,
    ),

  /** Runs a template over a resource without saving. */
  preview: (organizationId: string, datasetId: string, request: TemplateRequest) =>
    http.post<TemplateResult>(`${base(organizationId, datasetId)}/analyses/templates/preview`, request),
};
