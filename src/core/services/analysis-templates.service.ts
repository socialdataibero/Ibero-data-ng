import { http } from '../api/http';
import type { Analysis } from '../models/analysis.model';
import type { DatasetVisibility } from '../models/dataset.model';
import type {
  TemplateCatalog,
  TemplateRequest,
  TemplateResult,
} from '../models/analysis-template.model';

export interface TemplatePublishMeta {
  title: string;
  slug: string;
  folder: string;
  description?: string;
  visibility: DatasetVisibility;
}

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

  /** Runs the template again on the server and saves its result as an analysis of the dataset. */
  publish: (organizationId: string, datasetId: string, request: TemplateRequest, meta: TemplatePublishMeta) =>
    http.post<Analysis>(`${base(organizationId, datasetId)}/analyses/templates`, { ...request, ...meta }),
};
