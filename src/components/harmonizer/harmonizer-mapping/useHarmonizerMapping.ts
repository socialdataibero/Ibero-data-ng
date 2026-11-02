import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
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
  type MappingInfo,
  type MappingRouteState,
  type ValueType,
} from '../../../core/models/harmonizer.model';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { errorMessage } from '../../../core/api/http';
import { canonicalNameProblem, sameCanonicalName } from '../../../core/utils/validation';
import { csvHeaderKey, downloadCsv, parseCsv } from '../../../core/utils/csv';

export interface ColumnRow {
  column: MappingColumn;
  choice: string;
  newName: string;
  /** Descripción de la canónica nueva; la propone el diccionario. */
  newDescription: string;
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

export const SUGGESTION_LABEL: Record<'history' | 'name' | 'description', string> = {
  history: 'histórico',
  name: 'por nombre',
  description: 'por descripción',
};

/** Fila recién cargada del servidor: lo guardado o la sugerencia, con su tipo por defecto. */
function initialRow(column: MappingColumn, canonicals: CanonicalVariable[]): ColumnRow {
  const choice = column.selectedCanonicalId ? `${CANONICAL_PREFIX}${column.selectedCanonicalId}` : '';
  return {
    column,
    choice,
    newName: '',
    newDescription: '',
    missingCodes: column.missingCodes.join(', '),
    dataType: defaultType(choice, column, canonicals),
  };
}

/** Columnas del CSV de mapeo que la web exporta e importa. */
const MAPPING_CSV_HEADER = ['columna', 'variable', 'tipo', 'no_especificado', 'descripcion'];

const TYPE_FROM_CSV: Record<string, ValueType> = {
  texto: 'text',
  text: 'text',
  entero: 'integer',
  integer: 'integer',
  decimal: 'decimal',
};

const TYPE_TO_CSV: Record<ValueType, string> = { text: 'texto', integer: 'entero', decimal: 'decimal' };

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString('es-MX')} ${n === 1 ? one : many}`;
}

function listSample(items: string[], max = 8): string {
  return items.length <= max ? items.join(', ') : `${items.slice(0, max).join(', ')} y ${items.length - max} más`;
}

/**
 * Destino al que apunta una fila, para detectar dos columnas en la misma canónica: `cv:<id>` o
 * el nombre nuevo en minúsculas (los nombres no distinguen mayúsculas).
 */
function rowTarget(row: ColumnRow, canonicals: CanonicalVariable[]): string | null {
  if (row.choice === '') return null;
  if (row.choice !== NEW_OPTION) return row.choice;
  const name = row.newName.trim();
  if (!name) return null;
  const existing = canonicals.find((cv) => sameCanonicalName(cv.name, name));
  return existing ? `${CANONICAL_PREFIX}${existing.id}` : `${NEW_OPTION}${name.toLowerCase()}`;
}

/**
 * Asigna a la fila la canónica con el nombre `name`: la existente (aunque cambien las
 * mayúsculas) o una nueva. Devuelve el motivo si no se puede.
 */
function assignByName(
  row: ColumnRow,
  name: string,
  canonicals: CanonicalVariable[],
  taken: Set<string>,
  description = '',
): { row: ColumnRow } | { problem: 'invalid' | 'taken' } {
  const existing =
    canonicals.find((cv) => cv.name === name) ?? canonicals.find((cv) => sameCanonicalName(cv.name, name));
  const target = existing ? `${CANONICAL_PREFIX}${existing.id}` : `${NEW_OPTION}${name.toLowerCase()}`;
  if (!existing && canonicalNameProblem(name)) return { problem: 'invalid' };
  if (taken.has(target)) return { problem: 'taken' };
  taken.add(target);
  const choice = existing ? target : NEW_OPTION;
  return {
    row: {
      ...row,
      choice,
      newName: existing ? '' : name,
      newDescription: existing ? '' : description,
      dataType: defaultType(choice, row.column, canonicals),
    },
  };
}

export function useHarmonizerMapping() {
  const { datasetId = '' } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  // Solo llega justo después de subir el archivo (H-10).
  const routeState = useLocation().state as MappingRouteState | null;
  const renamedColumns = routeState?.renamedColumns ?? [];
  const uploadSource = routeState?.source ?? null;

  const [dataset, setDataset] = useState<HarmonizerDataset | null>(null);
  const [canonicalVariables, setCanonicalVariables] = useState<CanonicalVariable[]>([]);
  const [rows, setRows] = useState<ColumnRow[]>([]);
  const [codebook, setCodebook] = useState<MappingInfo['codebook']>(null);
  const [codebooks, setCodebooks] = useState<MappingInfo['codebooks']>([]);
  const [otherEditions, setOtherEditions] = useState<MappingInfo['otherEditions']>([]);
  // Diccionario y tabla elegidos en el selector, antes de aplicarlos.
  const [codebookChoice, setCodebookChoice] = useState('');
  const [tableChoice, setTableChoice] = useState('');
  const [attachingCodebook, setAttachingCodebook] = useState(false);
  const [codebookError, setCodebookError] = useState<string | null>(null);
  const [copySource, setCopySource] = useState('');
  const [copying, setCopying] = useState(false);
  // Resultado de la última acción masiva, para que el usuario sepa qué cambió.
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [onlyUnmapped, setOnlyUnmapped] = useState(false);
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
        setRows(info.columns.map((column) => initialRow(column, info.canonicalVariables)));
        setCodebook(info.codebook);
        setCodebooks(info.codebooks);
        setOtherEditions(info.otherEditions);
        setCodebookChoice(info.codebook?.id ?? '');
        setTableChoice(info.codebook?.table ?? '');
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
        newDescription: '',
        missingCodes: '',
        dataType: row.column.inferredType,
      })),
    );
    setRowErrors(new Map());
    setBulkError(null);
    setBulkNotice('Se quitaron todas las asignaciones. Nada cambia hasta pulsar «Guardar mapeo».');
  }, []);

  const showBulk = useCallback((notice: string | null, error: string | null = null) => {
    setBulkNotice(notice);
    setBulkError(error);
    setRowErrors(new Map());
  }, []);

  // Columnas sin mapear → la canónica con su mismo nombre (existente o nueva). Las demás no cambian.
  const mapAllByName = useCallback(() => {
    const taken = new Set(rows.map((r) => rowTarget(r, canonicalVariables)).filter((t): t is string => t !== null));
    const invalid: string[] = [];
    const clashing: string[] = [];
    let assigned = 0;
    const next = rows.map((row) => {
      if (row.choice !== '') return row;
      const result = assignByName(row, row.column.name, canonicalVariables, taken);
      if ('problem' in result) {
        (result.problem === 'invalid' ? invalid : clashing).push(row.column.name);
        return row;
      }
      assigned++;
      return result.row;
    });
    setRows(next);
    const parts = [`Se asignaron ${plural(assigned, 'columna', 'columnas')} a la variable de su mismo nombre.`];
    if (invalid.length > 0) {
      parts.push(
        `No se asignaron ${plural(invalid.length, 'columna', 'columnas')} cuyo nombre no sirve como variable (letras sin acento, números y _; empieza con letra): ${listSample(invalid)}.`,
      );
    }
    if (clashing.length > 0) {
      parts.push(
        `Tampoco ${plural(clashing.length, 'columna', 'columnas')} cuya variable ya usa otra columna: ${listSample(clashing)}.`,
      );
    }
    parts.push('Revisa y pulsa «Guardar mapeo».');
    showBulk(parts.join(' '));
  }, [rows, canonicalVariables, showBulk]);

  /**
   * Con diccionario: las columnas sin mapear van a la variable de su mismo nombre (con la
   * descripción del diccionario), los códigos de «No especificado» vacíos se llenan con los del
   * diccionario y los tipos sin confirmar toman el que sugiere el diccionario.
   */
  const completeWithCodebook = useCallback(() => {
    const taken = new Set(rows.map((r) => rowTarget(r, canonicalVariables)).filter((t): t is string => t !== null));
    let assigned = 0;
    let codes = 0;
    let types = 0;
    const skipped: string[] = [];
    const next = rows.map((original) => {
      const info = original.column.codebook;
      if (!info) return original;
      let row = original;
      if (row.choice === '') {
        const result = assignByName(row, row.column.name, canonicalVariables, taken, info.label ?? '');
        if ('problem' in result) {
          skipped.push(row.column.name);
          return row;
        }
        row = result.row;
        assigned++;
      }
      // Se agregan los del diccionario que falten, sin quitar los que ya estaban escritos (por
      // ejemplo, copiados de otra edición).
      const current = parseMissingCodes(row.missingCodes);
      const added = info.missingCodes.filter((c) => !current.includes(c));
      if (added.length > 0) {
        row = { ...row, missingCodes: [...current, ...added].join(', ') };
        codes++;
      }
      if (typeStatus(row, canonicalVariables) === 'suggested' && row.dataType !== info.suggestedType) {
        row = { ...row, dataType: info.suggestedType };
        types++;
      } else if (row !== original && confirmedType(row.choice, canonicalVariables) === null) {
        row = { ...row, dataType: info.suggestedType };
      }
      return row;
    });
    setRows(next);
    const parts = [
      `Con el diccionario se asignaron ${plural(assigned, 'columna', 'columnas')}, se agregaron códigos de «No especificado» en ${plural(codes, 'columna', 'columnas')} y se ajustó el tipo sugerido de ${plural(types, 'columna', 'columnas')}.`,
    ];
    if (skipped.length > 0) {
      parts.push(`No se pudieron asignar: ${listSample(skipped)} (nombre no válido o variable ya usada).`);
    }
    parts.push('Revisa y pulsa «Guardar mapeo».');
    showBulk(parts.join(' '));
  }, [rows, canonicalVariables, showBulk]);

  // Copia el mapeo guardado de otra edición por nombre de columna: variable y códigos de «No
  // especificado». Una columna de esta edición que apuntaba a una de esas variables se desmapea.
  const copyFromEdition = useCallback(() => {
    if (!copySource) return;
    setCopying(true);
    void (async () => {
      try {
        const saved = await harmonizerService.getSavedMapping(copySource);
        const byColumn = new Map(saved.columns.map((c) => [c.column, c]));
        const copiedTargets = new Set(
          rows.filter((r) => byColumn.has(r.column.name)).map((r) => `${CANONICAL_PREFIX}${byColumn.get(r.column.name)!.canonicalId}`),
        );
        let copied = 0;
        const released: string[] = [];
        const next = rows.map((row) => {
          const source = byColumn.get(row.column.name);
          if (source) {
            copied++;
            const choice = `${CANONICAL_PREFIX}${source.canonicalId}`;
            return {
              ...row,
              choice,
              newName: '',
              newDescription: '',
              missingCodes: source.missingCodes.join(', '),
              dataType: defaultType(choice, row.column, canonicalVariables),
            };
          }
          const target = rowTarget(row, canonicalVariables);
          if (target && copiedTargets.has(target)) {
            released.push(row.column.name);
            return { ...row, choice: '', newName: '', newDescription: '', missingCodes: '' };
          }
          return row;
        });
        setRows(next);
        const missing = saved.columns.filter((c) => !rows.some((r) => r.column.name === c.column)).map((c) => c.column);
        const parts = [
          `Se copió el mapeo de «${saved.dataset.name}» en ${plural(copied, 'columna', 'columnas')} con el mismo nombre.`,
        ];
        if (missing.length > 0) {
          parts.push(`Esta edición no tiene ${plural(missing.length, 'columna', 'columnas')} de aquella: ${listSample(missing)}.`);
        }
        if (released.length > 0) {
          parts.push(`Se desmapearon ${listSample(released)} porque su variable ahora la usa otra columna.`);
        }
        parts.push('Revisa y pulsa «Guardar mapeo».');
        showBulk(parts.join(' '));
      } catch (err) {
        showBulk(null, errorMessage(err, 'No se pudo leer el mapeo de esa edición.'));
      } finally {
        setCopying(false);
      }
    })();
  }, [copySource, rows, canonicalVariables, showBulk]);

  const variableName = useCallback(
    (row: ColumnRow) => {
      if (row.choice === NEW_OPTION) return row.newName.trim();
      if (!row.choice.startsWith(CANONICAL_PREFIX)) return '';
      const id = row.choice.slice(CANONICAL_PREFIX.length);
      return canonicalVariables.find((cv) => cv.id === id)?.name ?? '';
    },
    [canonicalVariables],
  );

  /** El mapeo en pantalla (con lo no guardado) como CSV, para editarlo en una hoja de cálculo. */
  const exportMappingCsv = useCallback(() => {
    const data = rows.map((row) => {
      const name = variableName(row);
      return [
        row.column.name,
        name,
        name ? TYPE_TO_CSV[row.dataType] : '',
        name ? parseMissingCodes(row.missingCodes).join(', ') : '',
        row.column.codebook?.label ?? '',
      ];
    });
    const base = dataset ? `mapeo_${dataset.name}_${dataset.year}` : 'mapeo';
    downloadCsv([MAPPING_CSV_HEADER, ...data], `${base.replace(/[^\p{L}\p{N}_.-]+/gu, '_')}.csv`);
  }, [rows, dataset, variableName]);

  /**
   * Aplica un CSV de mapeo (`columna, variable, tipo, no_especificado`) sobre la pantalla. Una
   * `variable` vacía desmapea la columna; una que no existe se crea al guardar. Las columnas que
   * el CSV no menciona no cambian. Nada se guarda hasta pulsar «Guardar mapeo».
   */
  const importMappingCsv = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      void (async () => {
        const records = parseCsv(await file.text());
        const [header, ...data] = records;
        const keys = (header ?? []).map(csvHeaderKey);
        const at = (key: string) => keys.indexOf(key);
        if (at('columna') < 0 || at('variable') < 0) {
          showBulk(
            null,
            `El CSV debe tener al menos las columnas «columna» y «variable» (exporta el mapeo para ver el formato: ${MAPPING_CSV_HEADER.join(', ')}).`,
          );
          return;
        }
        const byColumn = new Map(data.map((r) => [(r[at('columna')] ?? '').trim(), r]));
        const unknown = [...byColumn.keys()].filter((c) => c && !rows.some((row) => row.column.name === c));
        const badTypes: string[] = [];
        let changed = 0;
        const next = rows.map((row) => {
          const record = byColumn.get(row.column.name);
          if (!record) return row;
          changed++;
          const name = (record[at('variable')] ?? '').trim();
          if (!name) return { ...row, choice: '', newName: '', newDescription: '', missingCodes: '' };
          const existing =
            canonicalVariables.find((cv) => cv.name === name) ??
            canonicalVariables.find((cv) => sameCanonicalName(cv.name, name));
          const choice = existing ? `${CANONICAL_PREFIX}${existing.id}` : NEW_OPTION;
          const typeText = at('tipo') >= 0 ? csvHeaderKey(record[at('tipo')] ?? '') : '';
          let dataType = defaultType(choice, row.column, canonicalVariables);
          if (typeText) {
            const parsed = TYPE_FROM_CSV[typeText];
            if (parsed) dataType = parsed;
            else badTypes.push(row.column.name);
          }
          return {
            ...row,
            choice,
            newName: existing ? '' : name,
            newDescription: existing ? '' : (row.column.codebook?.label ?? ''),
            missingCodes: at('no_especificado') >= 0 ? (record[at('no_especificado')] ?? '').trim() : row.missingCodes,
            dataType,
          };
        });
        setRows(next);
        const parts = [`Se aplicó el CSV a ${plural(changed, 'columna', 'columnas')}.`];
        if (unknown.length > 0) {
          parts.push(`Se ignoraron ${plural(unknown.length, 'columna', 'columnas')} que esta edición no tiene: ${listSample(unknown)}.`);
        }
        if (badTypes.length > 0) {
          parts.push(`Tipo no reconocido (usa texto, entero o decimal) en: ${listSample(badTypes)}; se dejó el sugerido.`);
        }
        parts.push('Revisa y pulsa «Guardar mapeo».');
        showBulk(parts.join(' '));
      })();
    },
    [rows, canonicalVariables, showBulk],
  );

  /**
   * Asocia (o quita) el diccionario de la edición y vuelve a pedir el mapeo para ver lo que dice
   * de cada columna. Lo que el usuario ya cambió en pantalla se conserva.
   */
  const applyCodebook = useCallback(() => {
    setAttachingCodebook(true);
    setCodebookError(null);
    void (async () => {
      try {
        await harmonizerService.setDatasetCodebook(datasetId, codebookChoice || null, tableChoice || undefined);
        const info = await harmonizerService.getMapping(datasetId);
        setCanonicalVariables(info.canonicalVariables);
        setCodebook(info.codebook);
        setCodebooks(info.codebooks);
        setTableChoice(info.codebook?.table ?? '');
        setRows((prev) => {
          const previous = new Map(prev.map((row) => [row.column.name, row]));
          return info.columns.map((column) => {
            const old = previous.get(column.name);
            return old && isRowDirty(old, canonicalVariables)
              ? { ...old, column }
              : initialRow(column, info.canonicalVariables);
          });
        });
        showBulk(
          info.codebook
            ? `Diccionario «${info.codebook.name}» (tabla ${info.codebook.table || 'única'}): describe ${plural(info.codebook.matchedColumns, 'columna', 'columnas')} de ${info.columns.length}. Usa «Completar con el diccionario» para asignarlas.`
            : 'La edición ya no tiene diccionario.',
        );
      } catch (err) {
        setCodebookError(errorMessage(err, 'No se pudo asociar el diccionario.'));
      } finally {
        setAttachingCodebook(false);
      }
    })();
  }, [datasetId, codebookChoice, tableChoice, canonicalVariables, showBulk]);

  const chooseCodebook = useCallback((id: string) => {
    setCodebookChoice(id);
    setTableChoice('');
    setCodebookError(null);
  }, []);

  // Filas visibles con su posición en `rows`, que es la que usan los setters.
  const visibleRows = useMemo(() => {
    const text = filter.trim().toLowerCase();
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (onlyUnmapped && rowTarget(row, canonicalVariables) !== null) return false;
        if (!text) return true;
        return [row.column.name, row.column.codebook?.label ?? '', variableName(row)].some((t) =>
          t.toLowerCase().includes(text),
        );
      });
  }, [rows, filter, onlyUnmapped, canonicalVariables, variableName]);

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
          newDescription:
            row.choice === NEW_OPTION && row.newDescription.trim() ? row.newDescription.trim() : undefined,
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
    uploadSource,
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
    mapAllByName,
    completeWithCodebook,
    codebook,
    codebooks,
    codebookChoice,
    chooseCodebook,
    tableChoice,
    setTableChoice,
    applyCodebook,
    attachingCodebook,
    codebookError,
    otherEditions,
    copySource,
    setCopySource,
    copyFromEdition,
    copying,
    exportMappingCsv,
    importMappingCsv,
    bulkNotice,
    bulkError,
    filter,
    setFilter,
    onlyUnmapped,
    setOnlyUnmapped,
    visibleRows,
    save,
    crumbs,
    newOption: NEW_OPTION,
    canonicalPrefix: CANONICAL_PREFIX,
    suggestionLabel: SUGGESTION_LABEL,
  };
}
