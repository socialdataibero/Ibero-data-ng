import { useEffect, useMemo, useState } from 'react';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { errorMessage } from '../../../core/api/http';
import {
  CODED_ROLES,
  DISAGGREGABLE_ROLES,
  type GeoLevel,
  type ValueType,
  type VariableAnalysis,
  type VariableRole,
} from '../../../core/models/harmonizer.model';

/** A group of a measure as typed: the bounds are text until saving. */
export interface CutRow {
  from: string;
  to: string;
  label: string;
}

/** The form of «Uso en análisis»; every field is kept, the payload sends only the role's ones. */
export interface AnalysisForm {
  role: VariableRole | '';
  universe: string;
  /** «Sólo a partir de»: the numeric variable (`''` = no rule) and its minimum, as typed. */
  universeVariable: string;
  universeMin: string;
  positiveValue: string;
  geoLevel: GeoLevel | '';
  unit: string;
  splits: boolean;
  summable: boolean;
  notApplicableLabel: string;
  maxLevel: GeoLevel | '';
  cuts: CutRow[];
}

function toForm(a: VariableAnalysis): AnalysisForm {
  const d = a.disaggregation;
  return {
    role: a.role ?? '',
    universe: a.universe ?? '',
    universeVariable: a.universeRule?.variable ?? '',
    universeMin: a.universeRule ? String(a.universeRule.min) : '',
    positiveValue: a.positiveValue ?? '',
    geoLevel: a.geoLevel ?? '',
    unit: a.unit ?? '',
    splits: d !== null,
    summable: d?.summable ?? true,
    notApplicableLabel: d?.notApplicableLabel ?? '',
    maxLevel: d?.maxLevel ?? '',
    cuts: (d?.cuts ?? []).map((c) => ({
      from: String(c.from),
      to: c.to === null ? '' : String(c.to),
      label: c.label,
    })),
  };
}

const text = (v: string) => (v.trim() === '' ? null : v.trim());
const isNumber = (v: string) => v.trim() !== '' && Number.isFinite(Number(v));

/** What is sent: only the fields of the chosen role, as the server expects (variable-role.ts). */
function toPayload(f: AnalysisForm): VariableAnalysis {
  const role = f.role === '' ? null : f.role;
  if (role === null) {
    return {
      role: null,
      universe: null,
      universeRule: null,
      positiveValue: null,
      geoLevel: null,
      unit: null,
      disaggregation: null,
    };
  }
  const splits = f.splits && DISAGGREGABLE_ROLES.includes(role);
  const cuts =
    role === 'measure'
      ? f.cuts.map((c) => ({
          from: Number(c.from),
          to: c.to.trim() === '' ? null : Number(c.to),
          label: c.label.trim(),
        }))
      : [];
  return {
    role,
    universe: text(f.universe),
    universeRule:
      f.universeVariable !== '' ? { variable: f.universeVariable, min: Number(f.universeMin) } : null,
    positiveValue: role === 'dichotomous' ? text(f.positiveValue) : null,
    geoLevel: role === 'geographic' && f.geoLevel !== '' ? f.geoLevel : null,
    unit: role === 'measure' ? text(f.unit) : null,
    disaggregation: splits
      ? {
          summable: f.summable,
          ...(cuts.length > 0 ? { cuts } : {}),
          ...(text(f.notApplicableLabel) ? { notApplicableLabel: text(f.notApplicableLabel)! } : {}),
          ...(role === 'geographic' && f.maxLevel !== '' ? { maxLevel: f.maxLevel } : {}),
        }
      : null,
  };
}

/** Why the role does not fit the confirmed type, before asking the server (it refuses it too). */
function typeHint(role: VariableRole | '', dataType: ValueType | null): string | null {
  if (role === 'measure' && dataType !== 'integer' && dataType !== 'decimal') {
    return 'Para usarla como cantidad, primero confirma su tipo como Entero o Decimal en el mapeo de una edición.';
  }
  if (role !== '' && CODED_ROLES.includes(role) && (dataType === 'integer' || dataType === 'decimal')) {
    return 'Su tipo está confirmado como número. Una variable con códigos debe ser Texto o quedar sin confirmar: cámbialo primero en el mapeo, o elige otro rol.';
  }
  return null;
}

export function useVariableAnalysis({
  surveyId,
  variableId,
  saved,
  dataType,
  canEdit,
  onSaved,
}: {
  surveyId: string;
  variableId: string;
  saved: VariableAnalysis;
  dataType: ValueType | null;
  canEdit: boolean;
  onSaved: (analysis: VariableAnalysis) => void;
}) {
  const [form, setForm] = useState<AnalysisForm>(() => toForm(saved));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Numeric variables of the survey, for «Sólo a partir de» (the universe rule).
  const [numericVariables, setNumericVariables] = useState<{ name: string; label: string }[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    harmonizerService
      .listVariables(surveyId, controller.signal)
      .then((res) =>
        setNumericVariables(
          res.items
            .filter((v) => v.id !== variableId && (v.dataType === 'integer' || v.dataType === 'decimal'))
            .map((v) => ({ name: v.name, label: v.description ? `${v.name} · ${v.description}` : v.name })),
        ),
      )
      .catch(() => setNumericVariables([]));
    return () => controller.abort();
  }, [surveyId, variableId]);

  // Reloading the page data (after a recoding, for instance) keeps what is being typed unless
  // what is saved changed.
  const savedKey = JSON.stringify(saved);
  useEffect(() => {
    setForm(toForm(JSON.parse(savedKey) as VariableAnalysis));
  }, [savedKey]);

  const dirty = useMemo(
    () => JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(toForm(saved))),
    [form, saved],
  );

  const set = <K extends keyof AnalysisForm>(key: K, value: AnalysisForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice(null);
  };

  const setCut = (index: number, field: keyof CutRow, value: string) =>
    setForm((prev) => ({
      ...prev,
      cuts: prev.cuts.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  const addCut = () =>
    setForm((prev) => {
      const last = prev.cuts[prev.cuts.length - 1];
      const from = last && isNumber(last.to) ? String(Number(last.to) + 1) : '';
      return { ...prev, cuts: [...prev.cuts, { from, to: '', label: '' }] };
    });
  const removeCut = (index: number) =>
    setForm((prev) => ({ ...prev, cuts: prev.cuts.filter((_, i) => i !== index) }));

  const save = () => {
    if (!canEdit || saving) return;
    if (
      form.role === 'measure' &&
      form.splits &&
      form.cuts.some((c) => !isNumber(c.from) || (c.to.trim() !== '' && !isNumber(c.to)))
    ) {
      setError('Los límites de cada grupo deben ser números. Deja vacío el «hasta» del último para que quede abierto («y más»).');
      return;
    }
    if (form.role !== '' && form.universeVariable !== '' && !isNumber(form.universeMin)) {
      setError(`Escribe a partir de qué valor de ${form.universeVariable} se cuenta el universo (por ejemplo, 15).`);
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    void (async () => {
      try {
        const result = await harmonizerService.saveVariableAnalysis(surveyId, variableId, toPayload(form));
        onSaved(result.analysis);
        setNotice('Uso en análisis guardado. Las plantillas lo leerán cuando la variable llegue a un conjunto de datos.');
      } catch (err) {
        setError(errorMessage(err, 'No se pudo guardar el uso en análisis.'));
      } finally {
        setSaving(false);
      }
    })();
  };

  const discard = () => {
    setForm(toForm(saved));
    setError(null);
    setNotice(null);
  };

  return {
    form,
    set,
    setCut,
    addCut,
    removeCut,
    dirty,
    saving,
    error,
    notice,
    save,
    discard,
    typeHint: typeHint(form.role, dataType),
    numericVariables,
    splitsAllowed: form.role !== '' && DISAGGREGABLE_ROLES.includes(form.role),
  };
}
