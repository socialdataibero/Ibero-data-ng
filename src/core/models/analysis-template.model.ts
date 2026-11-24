/**
 * Analysis templates (demo), mirror of the server's analysis-templates module
 * (`template-catalog.ts` and `template-run.ts`; README "Analysis templates (demo)").
 */

export type TemplateId = 'distribution' | 'proportion' | 'weighted_mean';
export type InputName = 'variable' | 'conditions' | 'measure' | 'group';
export type MissingChoice = 'exclude' | 'include';
export type VariableRole =
  | 'category'
  | 'ordinal'
  | 'dichotomous'
  | 'geographic'
  | 'measure'
  | 'weight'
  | 'stratum'
  | 'psu'
  | 'identifier'
  | 'label'
  | 'temporal'
  | 'free_text';

export interface InputOption {
  column: string;
  label: string;
  role: VariableRole;
  categoryCount: number | null;
  hasMissingCodes: boolean;
  universe: string | null;
}

export interface TemplateInput {
  name: InputName;
  label: string;
  help: string;
  roles: VariableRole[];
  optional: boolean;
  multiple?: { min: number; max: number };
  maxCategories?: number;
  options: InputOption[];
}

export interface TemplateListing {
  id: TemplateId;
  version: number;
  contract: string;
  name: string;
  description: string;
  compatible: boolean;
  reason: { code: string; message: string } | null;
  inputs: TemplateInput[];
  missing: { input: 'variable' | 'conditions'; options: MissingChoice[]; default: MissingChoice } | null;
}

/** An edition of the resource's source (its metadata `editions`). */
export interface TemplateEdition {
  id: string;
  name: string | null;
  year: number | null;
}

export interface TemplateCatalog {
  resourceId: string;
  source: { title: string; design: 'census' | 'sample'; unitPlural: string } | null;
  /** Editions of the file; with several, the analysis is about one (`edition` of the request). */
  editions: TemplateEdition[];
  templates: TemplateListing[];
}

export interface TemplateRequest {
  resourceId: string;
  templateId: TemplateId;
  variable?: string;
  conditions?: string[];
  measure?: string;
  group?: string | null;
  missing?: MissingChoice;
  /** Needed when the resource has several editions (`template_edition_required`). */
  edition?: string | null;
}

/** One row of the result table (column names of the proposal, section 3.6). */
export interface ResultRow {
  fuente: string;
  edicion: number | null;
  indicador: string;
  criterio: string | null;
  nivel: string;
  cve: string;
  nombre: string;
  grupo_codigo: string | null;
  grupo: string | null;
  corte_codigo: string | null;
  corte: string | null;
  num: number;
  den: number;
  den_total: number | null;
  ee: number | null;
  ee_total: number | null;
  casos: number;
  es_total: boolean;
}

export type Base = 'own' | 'total' | 'both';

export interface TemplateResult {
  template: { id: TemplateId; version: number; contract: string; name: string };
  source: { title: string; design: 'census' | 'sample'; unitPlural: string };
  /** The edition the figures are about. */
  edition: TemplateEdition;
  inputs: {
    variable: string | null;
    conditions: string[];
    measure: string | null;
    group: string | null;
    missing: MissingChoice | null;
  };
  dimensions: {
    group: { column: 'nombre' | 'grupo'; codeColumn: 'cve' | 'grupo_codigo'; label: string; role: VariableRole } | null;
    series: { column: 'criterio' | 'corte'; codeColumn: 'criterio' | 'corte_codigo'; label: string } | null;
  };
  value: { kind: 'proportion' | 'mean'; label: string; unit: string | null };
  bases: { id: Base; label: string; note: string; description: string }[] | null;
  texts: { title: string; question: string; note: string; missing: string | null };
  warnings: { code: string; message: string; base?: 'own' | 'total' }[];
  charts: { recommended: ChartType; compatible: ChartType[] };
  rows: ResultRow[];
}

export type ChartType =
  | 'barras_horizontales'
  | 'barras_apiladas_100'
  | 'lollipop'
  | 'numero_destacado'
  | 'tabla';

export const CHART_LABEL: Record<ChartType, string> = {
  barras_horizontales: 'Barras horizontales',
  barras_apiladas_100: 'Barras apiladas al 100%',
  lollipop: 'Puntos (lollipop)',
  numero_destacado: 'Número destacado',
  tabla: 'Tabla',
};
