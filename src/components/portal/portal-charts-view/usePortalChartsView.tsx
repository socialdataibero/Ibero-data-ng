import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { portalCatalogService, mainResource, type CatalogPackage } from '../../../core/services/portal-catalog.service';
import { deriveCharts, labelColumn, tableToCsv, tableForModal, type TableData, type ChartBlock } from '../../../core/utils/portal-charts';
import { describeSteps } from '../../../core/utils/portal-recipe';
import { usePortalRequest } from '../../../core/hooks/usePortalRequest';
import type { PortalChartsHeaderTab } from '../../shared/portal/portal-charts-header/PortalChartsHeader';
import type { PortalModalTab } from '../../shared/portal/portal-modal/PortalModal';
import { publicErrorMessage } from '../../../core/api/http';

const PERIOD_COLUMN = /^(a(n|ñ)i?o|year|periodo|per(i|í)odo)$/i;
const MAX_TABS = 8;

interface ViewData {
  pkg: CatalogPackage | null;
  table: TableData | null;
}

async function loadView(id: string, signal: AbortSignal): Promise<ViewData> {
  let name = id;
  if (!name) {
    const { packages } = await portalCatalogService.searchPackages({ rows: 1 }, signal);
    name = packages[0]?.name;
    if (!name) return { pkg: null, table: null };
  }

  const pkg = await portalCatalogService.viewPackage(name, signal);
  const resource = mainResource(pkg);
  if (!resource) return { pkg, table: null };

  const table = await portalCatalogService.readTable(resource, { limit: 500 }, signal);
  return { pkg, table };
}

function longDate(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface TabDef {
  id: string;
  label: string;
  charts: ChartBlock[];
}

function buildTabs(table: TableData | null): TabDef[] {
  if (!table?.rows?.length) return [];

  const period = (table.columns ?? []).find((c) => PERIOD_COLUMN.test(c.id));
  const values = period
    ? [...new Set(table.rows.map((row) => row[period.id]).filter((v) => v !== null && v !== undefined && v !== ''))].sort()
    : [];

  if (!period || values.length < 2 || values.length > MAX_TABS) {
    const charts = deriveCharts(table);
    return charts.length ? [{ id: 'all', label: 'Todos los registros', charts }] : [];
  }

  return values
    .map((value): TabDef | null => {
      const rows = table.rows.filter((row) => String(row[period.id]) === String(value));
      const columns = table.columns.filter((c) => c.id !== period.id);
      const charts = deriveCharts({ columns, rows });
      return charts.length ? { id: String(value), label: String(value), charts } : null;
    })
    .filter((tab): tab is TabDef => tab !== null);
}

function mapTabs(tabs: TabDef[]): PortalChartsHeaderTab[] {
  return tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    charts: tab.charts.map((block) => ({
      id: block.id,
      title: block.title,
      description: block.description,
      chart: {
        indexName: block.indexName,
        variables: block.variables,
        data: block.data,
        tickCountY: 6,
      },
    })),
  }));
}

function downloadCsv(name: string, content: string) {
  const blob = new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function usePortalChartsView() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') ?? '';

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('table');
  const [openingVizCanvas, setOpeningVizCanvas] = useState(false);
  const [vizCanvasError, setVizCanvasError] = useState<string | null>(null);

  const { data, loading, error } = usePortalRequest(({ signal }) => loadView(id, signal), [id]);

  const pkg = data?.pkg ?? null;
  const table = data?.table ?? null;

  const tabs = useMemo(() => buildTabs(table), [table]);
  const modalTable = useMemo(() => tableForModal(table), [table]);

  const organization = pkg?.organization ?? { id: '', name: '' };
  const isAnalysis = pkg?.type === 'analysis';
  const title = pkg?.title || pkg?.name || 'Vista de datos';

  const steps = useMemo(() => describeSteps(pkg?.recipe as never), [pkg]);

  const modalTabs = useMemo((): PortalModalTab[] => {
    if (!pkg) return [];
    const tabList: PortalModalTab[] = [
      {
        id: 'table',
        label: 'Tabla de datos',
        title: 'Descargar tabla de datos',
        table: { columns: modalTable.columns, rows: modalTable.rows, size: 'condensed' },
        actions: [{ id: 'csv', label: 'Descargar CSV', onClick: () => downloadCsv(pkg.name, tableToCsv(table)) }],
      },
    ];
    if (steps.length > 0) {
      const recipe = pkg.recipe as { sourceResourceName?: string } | null | undefined;
      tabList.push({
        id: 'recipe',
        label: 'Cómo se hizo',
        title: 'Cómo se hizo este análisis',
        description: recipe?.sourceResourceName ? `Parte del recurso "${recipe.sourceResourceName}".` : undefined,
        content: (
          <ol className="modal-popup__steps-list">
            {steps.map((step) => (
              <li key={step.id}>{step.text}</li>
            ))}
          </ol>
        ) as ReactNode,
      });
    }

    return tabList;
  }, [pkg, table, modalTable, steps]);

  const openModal = (tabId: string) => {
    setModalTab(tabId);
    setModalOpen(true);
  };

  const goToVizCanvas = async () => {
    if (!pkg) return;
    setOpeningVizCanvas(true);
    setVizCanvasError(null);
    try {
      const url = await portalCatalogService.openInVizCanvas(pkg.name);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setVizCanvasError(publicErrorMessage(err, 'No se pudo abrir en VizCanvas.'));
    } finally {
      setOpeningVizCanvas(false);
    }
  };

  return {
    loading,
    error,
    pkg,
    table,
    title,
    isAnalysis,
    organization,
    tabs,
    steps,
    longDate,
    mapTabs,
    labelColumn,
    modalOpen,
    setModalOpen,
    modalTab,
    setModalTab,
    modalTabs,
    openModal,
    openingVizCanvas,
    vizCanvasError,
    goToVizCanvas,
  };
}
