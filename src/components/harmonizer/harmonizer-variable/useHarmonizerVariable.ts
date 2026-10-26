import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { errorMessage } from '../../../core/api/http';
import {
  VALUE_TYPE_LABEL,
  type CatalogCategory,
  type ComparisonEdition,
  type VariableComparison,
} from '../../../core/models/harmonizer.model';
import type { Crumb } from '../../shared/page-header/PageHeader';

/** Recodificación en edición: por edición, valor del archivo → código común (`''` = sin recodificar). */
type ValueMaps = Record<string, Record<string, string>>;

/** Códigos numéricos sin ceros a la izquierda (`01` = `1`), como los compara el servidor. */
export function codeKey(value: string): string {
  const v = value.trim();
  return /^\d+$/.test(v) ? v.replace(/^0+(?=\d)/, '') : v;
}

function savedMaps(editions: ComparisonEdition[]): ValueMaps {
  return Object.fromEntries(
    editions.map((e) => [
      e.datasetId,
      Object.fromEntries(e.values.filter((v) => v.recoded).map((v) => [v.value, v.code])),
    ]),
  );
}

function sameRecoding(a: CatalogCategory[], b: CatalogCategory[], ma: ValueMaps, mb: ValueMaps): boolean {
  const cat = (c: CatalogCategory[]) => JSON.stringify(c.map((x) => [x.code.trim(), x.label.trim()]));
  const maps = (m: ValueMaps) =>
    JSON.stringify(
      Object.keys(m)
        .sort()
        .map((k) => [k, Object.entries(m[k]).filter(([, to]) => to !== '').sort()]),
    );
  return cat(a) === cat(b) && maps(ma) === maps(mb);
}

export function useHarmonizerVariable() {
  const { surveyId = '', variableId = '' } = useParams();
  const [data, setData] = useState<VariableComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [maps, setMaps] = useState<ValueMaps>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const adopt = useCallback((result: VariableComparison) => {
    setData(result);
    setCatalog(result.variable.categories.map((c) => ({ ...c })));
    setMaps(savedMaps(result.editions));
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoadError(null);
    (async () => {
      try {
        const result = await harmonizerService.getVariableComparison(surveyId, variableId, controller.signal);
        if (!active) return;
        adopt(result);
      } catch (err) {
        if (!active) return;
        setLoadError(errorMessage(err, 'No se pudo cargar la comparación de la variable.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [surveyId, variableId, adopt]);

  const crumbs = useMemo<Crumb[]>(
    () => [
      { label: 'Inicio', href: '/dashboard' },
      { label: 'Armonizador', href: '/harmonizer' },
      { label: 'Variables', href: `/harmonizer/surveys/${surveyId}/variables` },
      { label: data?.variable.name ?? 'Variable' },
    ],
    [data, surveyId],
  );

  const dirty = useMemo(
    () =>
      data !== null &&
      !sameRecoding(catalog, data.variable.categories, maps, savedMaps(data.editions)),
    [catalog, maps, data],
  );

  /** Filas de la tabla lado a lado: un código común (o equivalente sin ceros) por fila. */
  const comparisonRows = useMemo(() => {
    if (!data) return [];
    const keys = new Map<string, string>();
    for (const e of data.editions) {
      for (const v of e.values) {
        if (!v.missing && !keys.has(codeKey(v.code))) keys.set(codeKey(v.code), v.code);
      }
    }
    return [...keys.keys()]
      .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
      .map((key) => ({
        key,
        cells: data.editions.map((e) => e.values.filter((v) => !v.missing && codeKey(v.code) === key)),
      }));
  }, [data]);

  const applySuggestion = () => {
    if (!data) return;
    setCatalog(data.suggestion.categories.map((c) => ({ ...c })));
    setMaps((prev) => {
      const next: ValueMaps = {};
      for (const e of data.editions) {
        next[e.datasetId] = { ...prev[e.datasetId], ...data.suggestion.valueMaps[e.datasetId] };
      }
      return next;
    });
    const proposed = Object.values(data.suggestion.valueMaps).reduce((n, m) => n + Object.keys(m).length, 0);
    setNotice(
      `Se cargó la propuesta: ${data.suggestion.categories.length} categorías y ${proposed} valores con su código común. Los valores sin propuesta quedan «sin recodificar» para que elijas. Nada se guarda hasta pulsar «Guardar recodificación».`,
    );
  };

  const addCategory = () => setCatalog((prev) => [...prev, { code: '', label: '' }]);

  const updateCategory = (index: number, field: keyof CatalogCategory, value: string) =>
    setCatalog((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));

  const removeCategory = (index: number) => {
    const code = catalog[index]?.code.trim();
    setCatalog((prev) => prev.filter((_, i) => i !== index));
    // Los valores que iban a ese código quedan sin recodificar.
    if (code) {
      setMaps((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([id, m]) => [
            id,
            Object.fromEntries(Object.entries(m).map(([from, to]) => [from, to === code ? '' : to])),
          ]),
        ),
      );
    }
  };

  const setTarget = (datasetId: string, value: string, target: string) =>
    setMaps((prev) => ({ ...prev, [datasetId]: { ...prev[datasetId], [value]: target } }));

  const persist = (categories: CatalogCategory[], valueMaps: ValueMaps, done: string) => {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    setNotice(null);
    void (async () => {
      try {
        const result = await harmonizerService.saveRecoding(surveyId, variableId, {
          categories: categories.map((c) => ({ code: c.code.trim(), label: c.label.trim() })),
          editions: data.editions.map((e) => ({
            datasetId: e.datasetId,
            values: Object.entries(valueMaps[e.datasetId] ?? {})
              .filter(([, to]) => to.trim() !== '')
              .map(([from, to]) => ({ from, to: to.trim() })),
          })),
        });
        adopt(result);
        setNotice(done);
      } catch (err) {
        setSaveError(errorMessage(err, 'No se pudo guardar la recodificación.'));
      } finally {
        setSaving(false);
      }
    })();
  };

  const save = () =>
    persist(
      catalog,
      maps,
      'Recodificación guardada. La vista armonizada y las descargas ya usan los códigos comunes.',
    );

  const clearRecoding = () =>
    persist([], {}, 'Se quitó la recodificación: cada edición vuelve a sus códigos originales.');

  const discard = () => {
    if (!data) return;
    adopt(data);
    setNotice(null);
    setSaveError(null);
  };

  const review = (mark: boolean) => {
    setReviewing(true);
    setReviewError(null);
    void (async () => {
      try {
        if (mark) {
          adopt(await harmonizerService.reviewVariable(surveyId, variableId));
        } else {
          await harmonizerService.clearVariableReview(surveyId, variableId);
          adopt(await harmonizerService.getVariableComparison(surveyId, variableId));
        }
      } catch (err) {
        setReviewError(errorMessage(err, 'No se pudo guardar la revisión.'));
      } finally {
        setReviewing(false);
      }
    })();
  };

  return {
    surveyId,
    data,
    loading,
    loadError,
    crumbs,
    comparisonRows,
    catalog,
    maps,
    dirty,
    saving,
    saveError,
    notice,
    reviewing,
    reviewError,
    applySuggestion,
    addCategory,
    updateCategory,
    removeCategory,
    setTarget,
    save,
    clearRecoding,
    discard,
    review,
    valueTypeLabel: VALUE_TYPE_LABEL,
  };
}
