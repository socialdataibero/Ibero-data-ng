/**
 * CSV mínimo para archivos que la web arma o lee sin pasar por el servidor (plantillas y mapeos):
 * separador coma, comillas dobles para valores con coma, comillas o saltos de línea, y `""` para
 * una comilla literal.
 */

function quote(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Texto CSV con BOM, para que Excel lo abra como UTF-8. */
export function toCsv(rows: string[][]): string {
  return `﻿${rows.map((row) => row.map(quote).join(',')).join('\r\n')}\r\n`;
}

export function downloadCsv(rows: string[][], filename: string): void {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Filas de un texto CSV. Quita el BOM y las líneas vacías. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  const input = text.replace(/^﻿/, '');
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        value += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        value += ch;
      }
    } else if (ch === '"' && value === '') {
      quoted = true;
    } else if (ch === ',') {
      row.push(value);
      value = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += ch;
    }
  }
  if (value !== '' || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const COMBINING_MARKS = /\p{M}/gu;

/** Encabezado de CSV para compararlo: sin acentos, en minúsculas y con `_` en lugar de espacios. */
export function csvHeaderKey(header: string): string {
  return header
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_');
}
