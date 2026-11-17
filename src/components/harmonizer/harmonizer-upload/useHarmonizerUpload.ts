import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NEW_OPTION,
  type AnalysisUnit,
  type HarmonizerImportPhase,
  type HarmonizerSurvey,
  type MappingRouteState,
  type SourceDesign,
  type UploadEncoding,
} from '../../../core/models/harmonizer.model';
import { useHarmonizerAccess } from '../../../core/hooks/useHarmonizerAccess';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { uploadEdition, waitForImport, type EditionUpload } from '../../../core/services/harmonizer-upload';
import { ApiError, errorMessage, fieldErrors } from '../../../core/api/http';
import { SOURCE_INFO_MISSING } from '../../../core/api/harmonizer-error-messages';
import { isValidYear } from '../../../core/utils/validation';
import type { Crumb } from '../../shared/page-header/PageHeader';

export const CRUMBS: Crumb[] = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Armonizador', href: '/harmonizer' },
  { label: 'Subir archivo' },
];

export function useHarmonizerUpload() {
  const navigate = useNavigate();
  const access = useHarmonizerAccess({ loadOrganizations: true });
  const [organizationId, setOrganizationId] = useState('');
  const [allSurveys, setSurveys] = useState<HarmonizerSurvey[]>([]);

  const [datasetName, setDatasetName] = useState('');
  const [datasetYear, setDatasetYear] = useState<number | ''>(new Date().getFullYear());
  const [selectedSurveyId, setUploadSurveyId] = useState('');
  const surveys = allSurveys.filter(access.isSurveyEditable);
  const uploadSurveyId = selectedSurveyId === NEW_OPTION || surveys.some((survey) => survey.id === selectedSurveyId)
    ? selectedSurveyId : (surveys[0]?.id ?? NEW_OPTION);
  const canUploadToSurvey = !access.loading && !access.error && (uploadSurveyId === NEW_OPTION
    ? access.editableOrganizations.some((organization) => organization.id === organizationId)
    : surveys.some((survey) => survey.id === uploadSurveyId));
  const [newSurveyName, setNewSurveyName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [encoding, setEncoding] = useState<UploadEncoding>('auto');
  // Sin valor inicial: la persona debe elegirlos.
  const [design, setDesign] = useState<SourceDesign | ''>('');
  const [unit, setUnit] = useState<AnalysisUnit | ''>('');
  // `uploading`: the file is being sent; `processing`: the server is importing it.
  const [stage, setStage] = useState<'idle' | 'uploading' | 'processing'>('idle');
  const uploading = stage !== 'idle';
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [processing, setProcessing] = useState<{ phase: HarmonizerImportPhase | null; rowsRead: number }>({
    phase: null,
    rowsRead: 0,
  });
  const uploadRef = useRef<EditionUpload | null>(null);
  const pollRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Leaving the page stops an upload in progress. An import already on the server goes on;
  // its edition shows up in the survey list when it finishes.
  useEffect(
    () => () => {
      uploadRef.current?.cancel();
      pollRef.current?.abort();
    },
    [],
  );

  // Closing or reloading the tab while the file is being sent loses the upload (the next one
  // starts from zero), so the browser asks first. Once the file is on the server (`processing`)
  // the import goes on without the page, so there is nothing to warn about.
  useEffect(() => {
    if (stage !== 'uploading') return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers only show the dialog when `returnValue` is set.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [stage]);

  const [errorDatasetName, setErrorDatasetName] = useState('');
  const [errorDatasetYear, setErrorDatasetYear] = useState('');
  const [errorNewSurveyName, setErrorNewSurveyName] = useState('');
  const [errorFile, setErrorFile] = useState('');
  const [errorDesign, setErrorDesign] = useState('');
  const [errorUnit, setErrorUnit] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    (async () => {
      try {
        const list = await harmonizerService.listSurveys(controller.signal);
        if (!active) return;
        setSurveys(list);
      } catch (err) {
        if (active) setError(errorMessage(err, 'No se pudieron cargar las encuestas.'));
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const canUpload = useMemo(() => {
    if (!canUploadToSurvey || !file || !datasetName.trim() || datasetYear === '') return false;
    if (!design || !unit) return false;
    return uploadSurveyId !== NEW_OPTION || newSurveyName.trim() !== '';
  }, [canUploadToSurvey, file, datasetName, datasetYear, design, unit, uploadSurveyId, newSurveyName]);

  // El servidor elige el lector por la extensión; la codificación solo aplica a DBF.
  const isDbf = !!file && /\.dbf$/i.test(file.name);

  const onFileSelected = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  }, []);

  const validate = useCallback((): boolean => {
    let ok = true;

    if (!datasetName.trim()) {
      setErrorDatasetName('El nombre de la edición es obligatorio.');
      ok = false;
    }

    if (datasetYear === '' || !isValidYear(String(datasetYear), 1900, 2100)) {
      setErrorDatasetYear('Ingresa un año válido entre 1900 y 2100.');
      ok = false;
    }

    if (uploadSurveyId === NEW_OPTION && !newSurveyName.trim()) {
      setErrorNewSurveyName('El nombre de la nueva encuesta es obligatorio.');
      ok = false;
    }

    if (!file) {
      setErrorFile('Selecciona un archivo CSV o DBF.');
      ok = false;
    }

    if (!design) {
      setErrorDesign(SOURCE_INFO_MISSING.design);
      ok = false;
    }

    if (!unit) {
      setErrorUnit(SOURCE_INFO_MISSING.unit);
      ok = false;
    }

    return ok;
  }, [datasetName, datasetYear, uploadSurveyId, newSurveyName, file, design, unit]);

  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      setErrorDatasetName('');
      setErrorDatasetYear('');
      setErrorNewSurveyName('');
      setErrorFile('');
      setErrorDesign('');
      setErrorUnit('');
      setError(null);

      if (!canUploadToSurvey || uploading || !validate() || !file || datasetYear === '' || !design || !unit)
        return;

      setStage('uploading');
      setProgress({ sent: 0, total: file.size });
      setProcessing({ phase: null, rowsRead: 0 });

      void (async () => {
        try {
          const upload = uploadEdition(
            file,
            {
              name: datasetName.trim(),
              year: Number(datasetYear),
              surveyId: uploadSurveyId,
              organizationId: uploadSurveyId === NEW_OPTION ? organizationId : undefined,
              newSurvey: uploadSurveyId === NEW_OPTION ? newSurveyName.trim() : undefined,
              encoding: isDbf ? encoding : undefined,
              design,
              unit,
            },
            (sent, total) => setProgress({ sent, total }),
          );
          uploadRef.current = upload;
          const importId = await upload.done;
          uploadRef.current = null;

          setStage('processing');
          const controller = new AbortController();
          pollRef.current = controller;
          const finished = await waitForImport(
            importId,
            (status) => setProcessing({ phase: status.phase, rowsRead: status.rowsRead }),
            controller.signal,
          );
          const { datasetId, renamedColumns, source } = finished.result!;
          const state: MappingRouteState = { renamedColumns, source };
          void navigate(`/harmonizer/datasets/${datasetId}/mapping`, { state });
        } catch (err) {
          // Cancelled by the user, or the page was left.
          if (err instanceof DOMException && err.name === 'AbortError') return;
          if (err instanceof ApiError && err.body?.code === 'survey_name_taken') {
            setErrorNewSurveyName(
              'Ya existe una encuesta con ese nombre. Elígela en la lista de encuestas.',
            );
            return;
          }
          if (err instanceof ApiError && err.body?.code === 'source_info_required') {
            const missing = Array.isArray(err.body.params?.missing) ? err.body.params.missing : [];
            if (missing.includes('design')) setErrorDesign(SOURCE_INFO_MISSING.design);
            if (missing.includes('unit')) setErrorUnit(SOURCE_INFO_MISSING.unit);
            return;
          }
          if (err instanceof ApiError && err.body?.code === 'dataset_name_taken') {
            const survey = surveys.find((s) => s.id === uploadSurveyId);
            setErrorDatasetName(
              `Ya existe una edición llamada «${datasetName.trim()}» en ${
                survey ? `la encuesta «${survey.name}»` : 'esta encuesta'
              }. Usa otro nombre.`,
            );
            return;
          }
          if (
            err instanceof ApiError &&
            (err.body?.code === 'csv_not_utf8' ||
              err.body?.code === 'csv_empty' ||
              err.body?.code === 'csv_no_rows' ||
              err.body?.code === 'csv_invalid' ||
              err.body?.code === 'dbf_invalid' ||
              err.body?.code === 'dbf_field_unsupported' ||
              err.body?.code === 'dbf_not_utf8' ||
              err.body?.code === 'dbf_no_rows' ||
              err.body?.code === 'dbf_too_large' ||
              err.body?.code === 'gzip_invalid' ||
              err.body?.code === 'upload_too_large')
          ) {
            setErrorFile(errorMessage(err, 'No se pudo leer el archivo.'));
            return;
          }
          const matched = fieldErrors(err, [
            'name',
            'year',
            'surveyId',
            'newSurvey',
            'organizationId',
            'encoding',
            'design',
            'unit',
          ]);
          if (matched.organizationId) setError(matched.organizationId);
          if (matched.surveyId) setError(matched.surveyId);
          if (matched.name) setErrorDatasetName(matched.name);
          if (matched.year) setErrorDatasetYear(matched.year);
          if (matched.newSurvey) setErrorNewSurveyName(matched.newSurvey);
          if (matched.encoding) setErrorFile(matched.encoding);
          if (matched.design) setErrorDesign(matched.design);
          if (matched.unit) setErrorUnit(matched.unit);

          if (Object.keys(matched).length === 0) {
            setError(errorMessage(err, 'No se pudo subir el archivo.'));
          }
        } finally {
          uploadRef.current = null;
          pollRef.current = null;
          setStage('idle');
        }
      })();
    },
    [
      canUploadToSurvey,
      uploading,
      organizationId,
      validate,
      file,
      datasetYear,
      uploadSurveyId,
      newSurveyName,
      datasetName,
      isDbf,
      encoding,
      design,
      unit,
      surveys,
      navigate,
    ],
  );

  const cancelUpload = useCallback(() => {
    uploadRef.current?.cancel();
  }, []);

  return {
    surveys,
    organizations: access.editableOrganizations,
    organizationId,
    setOrganizationId,
    accessLoading: access.loading,
    accessError: access.error,
    datasetName,
    setDatasetName,
    datasetYear,
    setDatasetYear,
    uploadSurveyId,
    setUploadSurveyId,
    newSurveyName,
    setNewSurveyName,
    onFileSelected,
    isDbf,
    encoding,
    setEncoding,
    design,
    setDesign,
    unit,
    setUnit,
    uploading,
    stage,
    progress,
    processing,
    cancelUpload,
    error,
    fieldErrors: {
      datasetName: errorDatasetName,
      datasetYear: errorDatasetYear,
      newSurveyName: errorNewSurveyName,
      file: errorFile,
      design: errorDesign,
      unit: errorUnit,
    },
    canUpload,
    submit,
    newOption: NEW_OPTION,
  };
}
