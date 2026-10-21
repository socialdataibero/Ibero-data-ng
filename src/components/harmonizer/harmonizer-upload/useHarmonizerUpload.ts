import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NEW_OPTION,
  type HarmonizerSurvey,
  type MappingRouteState,
  type UploadEncoding,
} from '../../../core/models/harmonizer.model';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { ApiError, errorMessage, fieldErrors } from '../../../core/api/http';
import { isValidYear } from '../../../core/utils/validation';
import type { Crumb } from '../../shared/page-header/PageHeader';

export const CRUMBS: Crumb[] = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Armonizador', href: '/harmonizer' },
  { label: 'Subir archivo' },
];

export function useHarmonizerUpload() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<HarmonizerSurvey[]>([]);

  const [datasetName, setDatasetName] = useState('');
  const [datasetYear, setDatasetYear] = useState<number | ''>(new Date().getFullYear());
  const [uploadSurveyId, setUploadSurveyId] = useState(NEW_OPTION);
  const [newSurveyName, setNewSurveyName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [encoding, setEncoding] = useState<UploadEncoding>('auto');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [errorDatasetName, setErrorDatasetName] = useState('');
  const [errorDatasetYear, setErrorDatasetYear] = useState('');
  const [errorNewSurveyName, setErrorNewSurveyName] = useState('');
  const [errorFile, setErrorFile] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    (async () => {
      try {
        const list = await harmonizerService.listSurveys(controller.signal);
        if (!active) return;
        setSurveys(list);
        if (list.length > 0)
          setUploadSurveyId((current) => (current === NEW_OPTION ? list[0].id : current));
      } catch {}
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const canUpload = useMemo(() => {
    if (!file || !datasetName.trim() || datasetYear === '') return false;
    return uploadSurveyId !== NEW_OPTION || newSurveyName.trim() !== '';
  }, [file, datasetName, datasetYear, uploadSurveyId, newSurveyName]);

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

    return ok;
  }, [datasetName, datasetYear, uploadSurveyId, newSurveyName, file]);

  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      setErrorDatasetName('');
      setErrorDatasetYear('');
      setErrorNewSurveyName('');
      setErrorFile('');
      setError(null);

      if (!validate() || !file || datasetYear === '') return;

      setUploading(true);

      void (async () => {
        try {
          const { datasetId, renamedColumns, source } = await harmonizerService.uploadDataset(
            {
              name: datasetName.trim(),
              year: Number(datasetYear),
              surveyId: uploadSurveyId,
              newSurvey: uploadSurveyId === NEW_OPTION ? newSurveyName.trim() : undefined,
              encoding: isDbf ? encoding : undefined,
            },
            file,
          );
          const state: MappingRouteState = { renamedColumns, source };
          void navigate(`/harmonizer/datasets/${datasetId}/mapping`, { state });
        } catch (err) {
          if (err instanceof ApiError && err.body?.code === 'survey_name_taken') {
            setErrorNewSurveyName(
              'Ya existe una encuesta con ese nombre. Elígela en la lista de encuestas.',
            );
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
              err.body?.code === 'dbf_no_rows')
          ) {
            setErrorFile(errorMessage(err, 'No se pudo leer el archivo.'));
            return;
          }
          const matched = fieldErrors(err, ['name', 'year', 'surveyId', 'newSurvey', 'encoding']);
          if (matched.name) setErrorDatasetName(matched.name);
          if (matched.year) setErrorDatasetYear(matched.year);
          if (matched.newSurvey) setErrorNewSurveyName(matched.newSurvey);
          if (matched.encoding) setErrorFile(matched.encoding);

          if (Object.keys(matched).length === 0) {
            setError(errorMessage(err, 'No se pudo subir el archivo.'));
          }
        } finally {
          setUploading(false);
        }
      })();
    },
    [
      validate,
      file,
      datasetYear,
      uploadSurveyId,
      newSurveyName,
      datasetName,
      isDbf,
      encoding,
      surveys,
      navigate,
    ],
  );

  return {
    surveys,
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
    uploading,
    error,
    fieldErrors: {
      datasetName: errorDatasetName,
      datasetYear: errorDatasetYear,
      newSurveyName: errorNewSurveyName,
      file: errorFile,
    },
    canUpload,
    submit,
    newOption: NEW_OPTION,
  };
}
