import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, X, ArrowRight, Table } from 'lucide-react';

export interface CsvColumnMapping {
  fieldKey: string;
  fieldLabel: string;
  required?: boolean;
}

interface CsvImportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  fields: CsvColumnMapping[];
  sampleFileName: string;
  sampleHeaders: string[];
  sampleDataRow: string[];
  onImport: (mappedItems: Partial<T>[]) => void;
  defaultValues?: Partial<T>;
}

export function CsvImportModal<T>({
  isOpen,
  onClose,
  title,
  description,
  fields,
  sampleFileName,
  sampleHeaders,
  sampleDataRow,
  onImport,
}: CsvImportModalProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({}); // fieldKey -> csvHeader
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      sampleHeaders.join(',') +
      '\n' +
      sampleDataRow.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', sampleFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string) => {
    // Simple robust CSV parser handling quotes
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) {
        lines.push(currentRow);
      }
    }

    if (lines.length < 2) {
      setErrorMsg('CSV file must contain a header row and at least 1 data row.');
      return;
    }

    const headers = lines[0];
    const data = lines.slice(1);

    setCsvHeaders(headers);
    setRawRows(data);

    // Initial smart auto-mapping by matching lowercased labels/keys with header names
    const initialMapping: Record<string, string> = {};
    fields.forEach((field) => {
      const fieldKeyLower = field.fieldKey.toLowerCase();
      const fieldLabelLower = field.fieldLabel.toLowerCase();

      const matchedHeader = (headers || []).find((h) => {
        const hLower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          hLower === fieldKeyLower.replace(/[^a-z0-9]/g, '') ||
          hLower === fieldLabelLower.replace(/[^a-z0-9]/g, '') ||
          hLower.includes(fieldKeyLower)
        );
      });

      if (matchedHeader) {
        initialMapping[field.fieldKey] = matchedHeader;
      } else {
        initialMapping[field.fieldKey] = '';
      }
    });

    setColumnMap(initialMapping);
    setStep('mapping');
    setErrorMsg(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setErrorMsg('Please select a valid CSV file (.csv)');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCsvText(content);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleProceedToPreview = () => {
    // Check if required fields are mapped
    const missingRequired = fields
      .filter((f) => f.required && !columnMap[f.fieldKey])
      .map((f) => f.fieldLabel);

    if (missingRequired.length > 0) {
      setErrorMsg(`Please map required field(s): ${missingRequired.join(', ')}`);
      return;
    }

    setErrorMsg(null);
    setStep('preview');
  };

  const handleFinalImport = () => {
    const mappedItems: Partial<T>[] = rawRows.map((row) => {
      const item: Record<string, any> = {};

      fields.forEach((field) => {
        const headerName = columnMap[field.fieldKey];
        if (headerName) {
          const colIndex = csvHeaders.indexOf(headerName);
          if (colIndex !== -1 && row[colIndex] !== undefined) {
            item[field.fieldKey] = row[colIndex];
          }
        }
      });

      return item as Partial<T>;
    });

    onImport(mappedItems);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setCsvHeaders([]);
    setRawRows([]);
    setColumnMap({});
    setStep('upload');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">{title}</h2>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-3xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                  Click to select CSV File
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload your UTF-8 formatted CSV spreadsheet containing customer or inventory records.
                </p>
              </div>

              {/* Download Sample CSV */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Need a CSV Template?
                  </h4>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                    Download a pre-formatted template with standard sample headers.
                  </p>
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-2xs hover:bg-indigo-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Sample CSV
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Map CSV Headers to Fields ({rawRows.length} rows found)
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">File: {file?.name}</span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {fields.map((field) => {
                  const selectedHeader = columnMap[field.fieldKey] || '';
                  return (
                    <div
                      key={field.fieldKey}
                      className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {field.fieldLabel}
                        </span>
                        {field.required && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                            Required
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={selectedHeader}
                          onChange={(e) =>
                            setColumnMap({ ...columnMap, [field.fieldKey]: e.target.value })
                          }
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Ignore Field --</option>
                          {csvHeaders.map((header, idx) => (
                            <option key={idx} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Table className="w-4 h-4 text-indigo-600" /> Data Preview (First 5 of {rawRows.length} Rows)
                </h3>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      {fields
                        .filter((f) => columnMap[f.fieldKey])
                        .map((f) => (
                          <th key={f.fieldKey} className="p-3 whitespace-nowrap">
                            {f.fieldLabel}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rawRows.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {fields
                          .filter((f) => columnMap[f.fieldKey])
                          .map((f) => {
                            const hName = columnMap[f.fieldKey];
                            const cIdx = csvHeaders.indexOf(hName);
                            const val = cIdx !== -1 ? row[cIdx] : '';
                            return (
                              <td key={f.fieldKey} className="p-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {val || <span className="text-slate-300 italic">N/A</span>}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={step === 'upload' ? onClose : () => setStep(step === 'preview' ? 'mapping' : 'upload')}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
          >
            {step === 'upload' ? 'Cancel' : 'Back'}
          </button>

          {step === 'mapping' && (
            <button
              type="button"
              onClick={handleProceedToPreview}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
            >
              Preview Data ({rawRows.length} Rows)
            </button>
          )}

          {step === 'preview' && (
            <button
              type="button"
              onClick={handleFinalImport}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> Import {rawRows.length} Records
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
