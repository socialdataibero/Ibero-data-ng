import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Crumb } from '../../shared/page-header/PageHeader';
import {
  CANONICAL_PREFIX,
  NEW_OPTION,
  VALUE_TYPE_LABEL,
  type CanonicalVariable,
  type HarmonizerDataset,
  type MappingChoice,
  type MappingColumn,
  type MappingRouteState,
  type ValueType,
} from '../../../core/models/harmonizer.model';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { errorMessage } from '../../../core/api/http';
import { canonicalNameProblem, sameCanonicalName } from '../../../core/utils/validation';

export interface ColumnRow {
  column: MappingColumn;
  choice: string;
  newName: string;
  /** Códigos de no especificado separados por comas, tal como los escribe el usuario. */
  missingCodes: string;
  /** Tipo de la variable en el Parquet exportado. Se confirma al guardar. */
  dataType: ValueType;
}

/** `confirmed`: el guardado de la canónica; `suggested`: el inferido, sin confirmar; `changed`: lo cambió el usuario. */
export type TypeStatus = 'confirmed' | 'suggested' | 'changed';

/** Tipo confirmado de la canónica elegida, si la fila apunta a una existente que lo tiene. */
function confirmedType(choice: string, canonicals: CanonicalVariable[]): ValueType | null {
  if (!choice.startsWith(CANONICAL_PREFIX)) return null;
  const id = choice.slice(CANONICAL_PREFIX.length);
  return canonicals.find((cv) => cv.id === id)?.dataType ?? null;
}

/** El tipo con que se precarga una fila: el confirmado de su canónica o, si no hay, el inferido. */
function defaultType(choice: string, column: MappingColumn, canonicals: CanonicalVariable[]): ValueType {
  return confirmedType(choice, canonicals) ?? column.inferredType;
}

function typeStatus(row: ColumnRow, canonicals: CanonicalVariable[]): TypeStatus {
  const confirmed = confirmedType(row.choice, canonicals);
  if (confirmed !== null) return row.dataType === confirmed ? 'confirmed' : 'changed';
  return row.dataType === row.column.inferredType ? 'suggested' : 'changed';
}

/** Texto bajo el selector de tipo: de dónde viene y qué pasa al guardar. */
function typeHint(row: ColumnRow, canonicals: CanonicalVariable[]): string {
  const inferred = VALUE_TYPE_LABEL[row.column.inferredType];
  const differs = row.dataType !== row.column.inferredType;
  switch (typeStatus(row, canonicals)) {
    case 'confirmed':
      return differs ? `Confirmado. Los valores de esta edición sugieren ${inferred}.` : 'Confirmado.';
    case 'suggested':
      return 'Sugerido por los valores. Se confirma al guardar.';
    case 'changed':
      return confirmedType(row.choice, canonicals) !== null
        ? 'Cambia el tipo de esta variable en todas las ediciones.'
        : `Los valores sugieren ${inferred}. Se confirma al guardar.`;
  }
}

function parseMissingCodes(text: string): string[] {
  return [...new Set(text.split(',').map((c) => c.trim()).filter((c) => c !== ''))];
}

/**
 * Si la fila difiere de lo guardado en el servidor (H-17). Las sugerencias precargadas
 * (histórico o por nombre) y los tipos sin confirmar cuentan como cambio: se ven
 * seleccionados pero no están guardados.
 */
function isRowDirty(row: ColumnRow, canonicals: CanonicalVariable[]): boolean {
  const { column } = row;
  const savedChoice =
    column.suggestionSource === null && column.selectedCanonicalId
      ? `${CANONICAL_PREFIX}${column.selectedCanonicalId}`
      : '';
  if (row.choice !== savedChoice) return true;
  if (row.choice === '') return false;
  if (row.dataType !== confirmedType(row.choice, canonicals)) return true;
  return parseMissingCodes(row.missingCodes).join('\n') !== column.missingCodes.join('\n');
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
  const [rowErrors, setRowErrors] = useState<Map<number, string>>(new Map());
  // Destino pendiente mientras se pide confirmación por cambios sin guardar (H-17).
  const [pendingHref, setPendingHref] = useState<string | null>(null);

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
          info.columns.map((column) => {
            const choice = column.selectedCanonicalId ? `${CANONICAL_PREFIX}${column.selectedCanonicalId}` : '';
            return {
              column,
              choice,
              newName: '',
              missingCodes: column.missingCodes.join(', '),
              dataType: defaultType(choice, column, info.canonicalVariables),
            };
          }),
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

  const hasUnsavedChanges = useMemo(
    () => rows.some((row) => isRowDirty(row, canonicalVariables)),
    [rows, canonicalVariables],
  );

  const harmonizedHref = `/harmonizer/datasets/${datasetId}/harmonized`;

  // "Ver armonizado" y "Armonizador" no guardan: si hay cambios pendientes, piden confirmación
  // antes de salir (H-17).
  const leaveTo = useCallback(
    (href: string) => {
      if (hasUnsavedChanges) setPendingHref(href);
      else void navigate(href);
    },
    [hasUnsavedChanges, navigate],
  );

  const viewHarmonized = useCallback(() => leaveTo(harmonizedHref), [leaveTo, harmonizedHref]);

  const backToHarmonizer = useCallback(() => leaveTo('/harmonizer'), [leaveTo]);

  const cancelLeave = useCallback(() => setPendingHref(null), []);

  const leaveWithoutSaving = useCallback(() => {
    if (pendingHref) void navigate(pendingHref);
    setPendingHref(null);
  }, [navigate, pendingHref]);

  // Al cambiar de canónica el tipo vuelve al confirmado de la nueva, o al inferido.
  const setChoice = useCallback(
    (index: number, choice: string) => {
      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? { ...row, choice, dataType: defaultType(choice, row.column, canonicalVariables) }
            : row,
        ),
      );
      setRowErrors((prev) => {
        if (!prev.has(index)) return prev;
        const next = new Map(prev);
        next.delete(index);
        return next;
      });
    },
    [canonicalVariables],
  );

  const setDataType = useCallback((index: number, dataType: ValueType) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, dataType } : row)));
  }, []);

  const setNewName = useCallback((index: number, newName: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, newName } : row)));
    setRowErrors((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const setMissingCodes = useCallback((index: number, missingCodes: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, missingCodes } : row)));
  }, []);

  const clearAll = useCallback(() => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        choice: '',
        newName: '',
        missingCodes: '',
        dataType: row.column.inferredType,
      })),
    );
    setRowErrors(new Map());
  }, []);

  const save = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      setSaveError(null);

      // Mismas reglas que el servidor. Un nombre idéntico a una canónica existente la
      // reutiliza aunque se haya creado antes de las reglas.
      const invalidRows = new Map<number, string>();
      const newNames: string[] = [];
      rows.forEach((row, index) => {
        if (row.choice !== NEW_OPTION) return;
        const name = row.newName.trim();
        if (name === '') {
          invalidRows.set(index, 'Escribe el nombre canónico o cambia la selección.');
          return;
        }
        if (canonicalVariables.some((cv) => cv.name === name)) return;
        const problem = canonicalNameProblem(name);
        if (problem) {
          invalidRows.set(index, `El nombre no es válido: ${problem}.`);
          return;
        }
        const clash =
          canonicalVariables.find((cv) => sameCanonicalName(cv.name, name))?.name ??
          newNames.find((other) => other !== name && sameCanonicalName(other, name));
        if (clash) {
          invalidRows.set(
            index,
            `Ya existe «${clash}»; los nombres no distinguen mayúsculas. Elige esa variable o usa otro nombre.`,
          );
          return;
        }
        newNames.push(name);
      });
      if (invalidRows.size > 0) {
        setRowErrors(invalidRows);
        setSaveError('Revisa los nombres canónicos nuevos marcados en la tabla.');
        return;
      }
      setRowErrors(new Map());

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
          dataType: row.dataType,
          missingCodes: parseMissingCodes(row.missingCodes),
        }));

      void (async () => {
        try {
          await harmonizerService.saveMapping(datasetId, columns);
          void navigate(harmonizedHref);
        } catch (err) {
          setSaveError(errorMessage(err, 'No se pudo guardar el mapeo.'));
        } finally {
          setSaving(false);
        }
      })();
    },
    [datasetId, rows, canonicalVariables, navigate, harmonizedHref],
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
    hasUnsavedChanges,
    pendingHref,
    leavingToHarmonized: pendingHref === harmonizedHref,
    viewHarmonized,
    backToHarmonizer,
    cancelLeave,
    leaveWithoutSaving,
    setChoice,
    setNewName,
    setMissingCodes,
    setDataType,
    typeHint: (row: ColumnRow) => typeHint(row, canonicalVariables),
    typeStatus: (row: ColumnRow) => typeStatus(row, canonicalVariables),
    valueTypeLabel: VALUE_TYPE_LABEL,
    clearAll,
    save,
    crumbs,
    newOption: NEW_OPTION,
    canonicalPrefix: CANONICAL_PREFIX,
    suggestionLabel: SUGGESTION_LABEL,
  };
}
