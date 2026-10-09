import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Crumb } from '../../shared/page-header/PageHeader';
import {
  CANONICAL_PREFIX,
  NEW_OPTION,
  type CanonicalVariable,
  type HarmonizerDataset,
  type MappingChoice,
  type MappingRouteState,
} from '../../../core/models/harmonizer.model';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { errorMessage } from '../../../core/api/http';

export interface ColumnRow {
  column: { name: string; selectedCanonicalId: string | null; suggested: string | null; suggestionSource: 'history' | 'name' | null; missingCodes: string[] };
  choice: string;
  newName: string;
  /** Códigos de no especificado separados por comas, tal como los escribe el usuario. */
  missingCodes: string;
}

function parseMissingCodes(text: string): string[] {
  return [...new Set(text.split(',').map((c) => c.trim()).filter((c) => c !== ''))];
}

export const SUGGESTION_LABEL: Record<'history' | 'name', string> = {
  history: 'histórico',
  name: 'por nombre',
};

export function useHarmonizerMapping() {
  const { datasetId = '' } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  // Solo llega justo después de subir el archivo (H-10).
  const renamedColumns = (useLocation().state as MappingRouteState | null)?.renamedColumns ?? [];

  const [dataset, setDataset] = useState<HarmonizerDataset | null>(null);
  const [canonicalVariables, setCanonicalVariables] = useState<CanonicalVariable[]>([]);
  const [rows, setRows] = useState<ColumnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    (async () => {
      try {
        const info = await harmonizerService.getMapping(datasetId, controller.signal);
        if (!active) return;
        setDataset(info.dataset);
        setCanonicalVariables(info.canonicalVariables);
        setRows(
          info.columns.map((column) => ({
            column,
            choice: column.selectedCanonicalId ? `${CANONICAL_PREFIX}${column.selectedCanonicalId}` : '',
            newName: '',
            missingCodes: column.missingCodes.join(', '),
          })),
        );
      } catch (err) {
        if (!active) return;
        setLoadError(errorMessage(err, 'No se pudo cargar el mapeo de este dataset.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [datasetId]);

  const mappedCount = useMemo(
    () =>
      rows.filter(
        (r) => r.choice !== '' && (r.choice !== NEW_OPTION || r.newName.trim() !== ''),
      ).length,
    [rows],
  );

  const setChoice = useCallback((index: number, choice: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, choice } : row)));
    setRowErrors((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const setNewName = useCallback((index: number, newName: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, newName } : row)));
    setRowErrors((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const setMissingCodes = useCallback((index: number, missingCodes: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, missingCodes } : row)));
  }, []);

  const clearAll = useCallback(() => {
    setRows((prev) => prev.map((row) => ({ ...row, choice: '', newName: '', missingCodes: '' })));
    setRowErrors(new Set());
  }, []);

  const save = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      setSaveError(null);

      const invalidIndexes = new Set<number>();
      rows.forEach((row, index) => {
        if (row.choice === NEW_OPTION && row.newName.trim() === '') invalidIndexes.add(index);
      });
      if (invalidIndexes.size > 0) {
        setRowErrors(invalidIndexes);
        setSaveError('Escribe el nombre canónico nuevo en cada columna marcada como "Crear nueva…", o cambia esa selección.');
        return;
      }
      setRowErrors(new Set());

      // Dos columnas a la misma canónica: en la vista armonizada una sobrescribiría a la otra.
      const columnsByTarget = new Map<string, string[]>();
      for (const row of rows) {
        if (row.choice === '') continue;
        let target = row.choice;
        if (row.choice === NEW_OPTION) {
          const name = row.newName.trim();
          const existing = canonicalVariables.find((cv) => cv.name === name);
          target = existing ? `${CANONICAL_PREFIX}${existing.id}` : `${NEW_OPTION}${name}`;
        }
        columnsByTarget.set(target, [...(columnsByTarget.get(target) ?? []), row.column.name]);
      }
      const collisions = [...columnsByTarget.values()].filter((names) => names.length > 1);
      if (collisions.length > 0) {
        setSaveError(
          `Cada variable canónica solo puede asignarse a una columna. Estas columnas comparten canónica: ${collisions
            .map((names) => names.join(', '))
            .join('; ')}.`,
        );
        return;
      }

      setSaving(true);

      const columns: MappingChoice[] = rows
        .filter((row) => row.choice !== '')
        .map((row) => ({
          column: row.column.name,
          choice: row.choice,
          newName: row.choice === NEW_OPTION ? row.newName.trim() : undefined,
          missingCodes: parseMissingCodes(row.missingCodes),
        }));

      void (async () => {
        try {
          await harmonizerService.saveMapping(datasetId, columns);
          void navigate(`/harmonizer/datasets/${datasetId}/harmonized`);
        } catch (err) {
          setSaveError(errorMessage(err, 'No se pudo guardar el mapeo.'));
        } finally {
          setSaving(false);
        }
      })();
    },
    [datasetId, rows, canonicalVariables, navigate],
  );

  const crumbs: Crumb[] = [
    { label: 'Inicio', href: '/dashboard' },
    { label: 'Armonizador', href: '/harmonizer' },
    { label: 'Mapeo' },
  ];

  return {
    datasetId,
    dataset,
    renamedColumns,
    canonicalVariables,
    rows,
    loading,
    loadError,
    saving,
    saveError,
    rowErrors,
    mappedCount,
    setChoice,
    setNewName,
    setMissingCodes,
    clearAll,
    save,
    crumbs,
    newOption: NEW_OPTION,
    canonicalPrefix: CANONICAL_PREFIX,
    suggestionLabel: SUGGESTION_LABEL,
  };
}
