import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { errorMessage } from '../../../core/api/http';
import { downloadCsv } from '../../../core/utils/csv';
import type {
  CodebookDetail,
  CodebookList,
  CodebookSummary,
} from '../../../core/models/harmonizer.model';
import type { Crumb } from '../../shared/page-header/PageHeader';

const CODEBOOK_FILE = /\.(xlsx?|csv)$/i;

/** Plantilla CSV del diccionario, con un ejemplo de cada tipo de fila. */
const TEMPLATE: string[][] = [
  ['tabla', 'variable', 'descripcion', 'pregunta', 'seccion', 'tipo', 'codigo', 'etiqueta', 'faltante'],
  ['', 'sexo', 'Sexo', '¿Es hombre o mujer?', 'Datos generales', 'texto', '1', 'Hombre', ''],
  ['', 'sexo', '', '', '', '', '3', 'Mujer', ''],
  ['', 'sexo', '', '', '', '', '9', 'No especificado', 'sí'],
  ['', 'edad', 'Edad', '¿Cuántos años cumplidos tiene?', 'Datos generales', 'entero', '0..130', 'Años cumplidos', ''],
  ['', 'edad', '', '', '', '', '999', 'No especificado', 'sí'],
];

export function useHarmonizerCodebooks() {
  const { surveyId = '' } = useParams();
  const [data, setData] = useState<CodebookList | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; file?: string }>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<CodebookSummary | null>(null);
  // El input de archivo no se controla con `value`: se reinicia cambiando su `key`.
  const [fileInputKey, setFileInputKey] = useState(0);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CodebookDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<CodebookSummary | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoadError(null);
    (async () => {
      try {
        const result = await harmonizerService.listCodebooks(surveyId, controller.signal);
        if (!active) return;
        setData(result);
      } catch (err) {
        if (!active) return;
        setLoadError(errorMessage(err, 'No se pudieron cargar los diccionarios.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [surveyId, refreshKey]);

  const crumbs = useMemo<Crumb[]>(
    () => [
      { label: 'Inicio', href: '/dashboard' },
      { label: 'Armonizador', href: '/harmonizer' },
      { label: data ? `Diccionarios de ${data.survey.name}` : 'Diccionarios' },
    ],
    [data],
  );

  const chooseFile = (chosen: File | null) => {
    setFile(chosen);
    setFieldErrors((prev) => ({ ...prev, file: undefined }));
    // El nombre del archivo, sin extensión, es un buen nombre por defecto.
    if (chosen && name.trim() === '') setName(chosen.name.replace(/\.[^.]+$/, ''));
  };

  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const errors: { name?: string; file?: string } = {};
      if (name.trim() === '') errors.name = 'Escribe un nombre para el diccionario.';
      if (!file) errors.file = 'Elige el archivo del diccionario.';
      else if (!CODEBOOK_FILE.test(file.name)) {
        errors.file = 'El diccionario debe ser un libro de Excel (.xls o .xlsx) o un archivo CSV (.csv).';
      }
      setFieldErrors(errors);
      setUploadError(null);
      setUploaded(null);
      if (Object.keys(errors).length > 0 || !file) return;
      setUploading(true);
      void (async () => {
        try {
          const created = await harmonizerService.createCodebook(surveyId, name.trim(), file);
          setUploaded(created);
          setName('');
          setFile(null);
          setFileInputKey((k) => k + 1);
          setRefreshKey((k) => k + 1);
        } catch (err) {
          setUploadError(errorMessage(err, 'No se pudo subir el diccionario.'));
        } finally {
          setUploading(false);
        }
      })();
    },
    [name, file, surveyId],
  );

  const toggleDetail = (codebook: CodebookSummary) => {
    if (openId === codebook.id) {
      setOpenId(null);
      return;
    }
    setOpenId(codebook.id);
    setDetail(null);
    setDetailError(null);
    void (async () => {
      try {
        setDetail(await harmonizerService.getCodebook(codebook.id));
      } catch (err) {
        setDetailError(errorMessage(err, 'No se pudo cargar el diccionario.'));
      }
    })();
  };

  const confirmRemove = async () => {
    if (!pendingDelete) return;
    const codebook = pendingDelete;
    setRemovingId(codebook.id);
    setDeleteError(null);
    try {
      await harmonizerService.removeCodebook(codebook.id);
      if (openId === codebook.id) setOpenId(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setDeleteError(errorMessage(err, 'No se pudo borrar el diccionario.'));
    } finally {
      setRemovingId(null);
      setPendingDelete(null);
    }
  };

  return {
    surveyId,
    data,
    loading,
    loadError,
    crumbs,
    name,
    setName: (value: string) => {
      setName(value);
      setFieldErrors((prev) => ({ ...prev, name: undefined }));
    },
    chooseFile,
    fileInputKey,
    fieldErrors,
    uploading,
    uploadError,
    uploaded,
    submit,
    openId,
    detail,
    detailError,
    toggleDetail,
    pendingDelete,
    requestRemove: (codebook: CodebookSummary) => {
      setDeleteError(null);
      setPendingDelete(codebook);
    },
    cancelRemove: () => setPendingDelete(null),
    confirmRemove,
    removingId,
    deleteError,
    downloadTemplate: () => downloadCsv(TEMPLATE, 'plantilla_diccionario.csv'),
  };
}
