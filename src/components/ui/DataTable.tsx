'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { SearchInput } from './SearchInput';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';

export interface Column<T> {
  id?: string;
  headerHi?: string;
  headerEn?: string;
  header?: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  accessor?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  exportValue?: (item: T) => string | number;
  className?: string;
  sortable?: boolean;
  sticky?: 'right' | 'left';
}

export interface DataTableProps<T> {
  titleHi?: string;
  titleEn?: string;
  columns: Column<T>[];
  data: T[];
  excelFileName?: string;
  exportFileName?: string;
  searchPlaceholder?: string;
  searchKeys?: string[];
  actionButton?: React.ReactNode;
  isLoading?: boolean;
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  emptyAction?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyDesc?: string;
  className?: string;
  showSearch?: boolean;
  onExportExcel?: () => void | Promise<void>;
}

export function DataTable<T extends Record<string, any>>({
  titleHi,
  titleEn,
  columns,
  data = [],
  excelFileName = 'Moldins_ERP_Report',
  exportFileName,
  searchPlaceholder,
  searchKeys,
  actionButton,
  isLoading = false,
  loading = false,
  emptyMessage,
  emptyAction,
  emptyTitle,
  emptyDescription,
  emptyDesc,
  className = '',
  showSearch = true,
  onExportExcel,
}: DataTableProps<T>) {
  const { lang, t } = useLanguage();
  const actualFileName = exportFileName || excelFileName;
  const isTableLoading = isLoading || loading;

  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [sortColumnKey, setSortColumnKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter data based on search across all table fields and formatted column values
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();

    const valuesForSearch = (item: T) => {
      const vals: any[] = [];

      const extractDeep = (obj: any, depth = 0) => {
        if (obj === null || obj === undefined || depth > 5) return;
        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
          vals.push(obj);
          return;
        }
        if (obj instanceof Date) {
          vals.push(obj.toISOString());
          vals.push(obj.toLocaleDateString('en-GB'));
          vals.push(obj.toLocaleDateString('en-IN'));
          return;
        }
        if (Array.isArray(obj)) {
          obj.forEach((elem) => extractDeep(elem, depth + 1));
          return;
        }
        if (typeof obj === 'object') {
          Object.values(obj).forEach((val) => extractDeep(val, depth + 1));
        }
      };

      if (searchKeys?.length) {
        searchKeys.forEach((key) => {
          if (key.includes('.')) {
            const nestedVal = key.split('.').reduce((acc, part) => acc?.[part], item as any);
            extractDeep(nestedVal);
          } else {
            extractDeep(item[key]);
          }
        });
      } else {
        extractDeep(item);
      }

      // Also include computed exportValues and accessorKey values from all columns
      // (This enables instant search by formatted date e.g. "15/11", units "kWh", currency, combined mould name/category, etc.)
      columns.forEach((col) => {
        if (col.id === 'actions' || col.id === 'action') return;
        if (col.exportValue) {
          try {
            extractDeep(col.exportValue(item));
          } catch {}
        }
        if (col.accessorKey && item[col.accessorKey] !== undefined) {
          extractDeep(item[col.accessorKey]);
        }
      });

      return vals;
    };

    return data.filter((item) =>
      valuesForSearch(item).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      )
    );
  }, [data, search, searchKeys, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumnKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumnKey];
      const bVal = b[sortColumnKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const compare = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));

      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [filteredData, sortColumnKey, sortDirection]);

  // Pagination calculation
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSort = (key: string) => {
    if (sortColumnKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumnKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumnKey(key);
      setSortDirection('asc');
    }
  };

  // Dynamic import of exceljs only on demand
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      if (onExportExcel) {
        await onExportExcel();
        return;
      }
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Moldins ERP';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Data');

      // Setup headers
      worksheet.columns = columns
        .filter((col) => col.id !== 'actions' && col.id !== 'action')
        .map((col) => ({
          header: lang === 'hi'
            ? (col.headerHi || (col.header ? t(col.header) : '') || col.headerEn || '')
            : (col.headerEn || (col.header ? t(col.header) : '') || col.headerHi || ''),
          key: String(col.accessorKey || col.id || col.headerEn || col.header),
          width: 22,
        }));

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' },
      };

      // Add rows
      sortedData.forEach((item) => {
        const rowData: Record<string, any> = {};
        columns.forEach((col) => {
          if (col.id === 'actions' || col.id === 'action') return;
          const key = String(col.accessorKey || col.id || col.headerEn || col.header);
          let cellVal: any = '';

          if (col.exportValue) {
            try {
              cellVal = col.exportValue(item);
            } catch {
              cellVal = '';
            }
          } else if (col.accessorKey && item[col.accessorKey] !== undefined) {
            cellVal = item[col.accessorKey];
          } else if (col.id && item[col.id] !== undefined) {
            cellVal = item[col.id];
          } else if (key && item[key] !== undefined) {
            cellVal = item[key];
          }

          // Smart fallback: extract text from rendered accessor / cell if cellVal is empty
          if ((cellVal === '' || cellVal === undefined || cellVal === null) && (col.accessor || col.cell)) {
            try {
              const fn = col.accessor || col.cell;
              const rendered = fn ? fn(item) : null;
              if (typeof rendered === 'string' || typeof rendered === 'number') {
                cellVal = rendered;
              } else if (React.isValidElement(rendered)) {
                const extractText = (node: any): string => {
                  if (!node) return '';
                  if (typeof node === 'string' || typeof node === 'number') return String(node);
                  if (Array.isArray(node)) return node.map(extractText).filter(Boolean).join(' ');
                  if (React.isValidElement(node) && (node as any).props) {
                    return extractText((node as any).props.children);
                  }
                  return '';
                };
                const text = extractText(rendered).trim();
                if (text) cellVal = text;
              }
            } catch {}
          }

          // If cellVal is an object or array, extract readable text
          if (cellVal !== null && cellVal !== undefined && typeof cellVal === 'object') {
            if (Array.isArray(cellVal)) {
              cellVal = cellVal
                .map((el) => {
                  if (el && typeof el === 'object') {
                    return el.name || el.title || el.product?.name || JSON.stringify(el);
                  }
                  return String(el);
                })
                .join(', ');
            } else if (cellVal instanceof Date) {
              cellVal = cellVal.toLocaleDateString('en-GB');
            } else if (cellVal.name || cellVal.title) {
              cellVal = cellVal.name || cellVal.title;
            } else {
              cellVal = Object.values(cellVal)
                .filter((v) => typeof v === 'string' || typeof v === 'number')
                .join(' - ');
            }
          }

          rowData[key] = cellVal ?? '';
        });
        worksheet.addRow(rowData);
      });

      // Format cells & borders for clean professional Excel sheet
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'E2E8F0' } },
            left: { style: 'thin', color: { argb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
            right: { style: 'thin', color: { argb: 'E2E8F0' } },
          };
          if (rowNumber > 1) {
            cell.alignment = { vertical: 'middle' };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${actualFileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel export error:', error);
      setExportError(t('table.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const primaryTitle = lang === 'hi' ? (titleHi || (titleEn ? t(titleEn) : '')) : (titleEn || (titleHi ? t(titleHi) : ''));
  const effectivePlaceholder = searchPlaceholder || t('common.searchPlaceholder');

  return (
    <div
      className={`bg-surface rounded border border-border overflow-hidden transition-colors ${className}`}
    >
      {/* Table Header Bar & Top Filters */}
      <div className="p-3 bg-surface border-b border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {primaryTitle && (
            <h3 className="font-semibold text-sm text-text-primary leading-tight">
              {primaryTitle}
            </h3>
          )}
          <span className="text-xs text-text-muted font-normal">
            {totalItems} {t('table.totalRecords')}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap print:hidden">
          {/* Search Input with strict 36px left padding */}
          {showSearch && (
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setCurrentPage(1);
              }}
              placeholder={effectivePlaceholder}
              className="w-full sm:w-64"
            />
          )}

          {/* Excel Export Button in Top Right */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            disabled={isExporting || totalItems === 0}
            leftIcon={
              isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )
            }
            title={t('common.exportExcel')}
          >
            <span>{isExporting ? t('common.exporting') : t('common.exportExcel')}</span>
          </Button>

          {/* Action Button (e.g. Add Item) */}
          {actionButton}
        </div>
      </div>

      {exportError && (
        <div className="mx-3 mt-3 rounded border border-danger/30 bg-danger-bg px-3 py-2 text-xs font-medium text-danger">
          {exportError}
        </div>
      )}

      {/* Horizontal scroll ONLY inside the table container, never the page */}
      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-page border-b border-border text-text-secondary text-xs uppercase tracking-wide font-semibold">
              {columns.map((col, idx) => {
                const colKey = String(col.accessorKey || col.id || idx);
                const isSorted = sortColumnKey === colKey;
                const colTitle = lang === 'hi'
                  ? (col.headerHi || (col.header ? t(col.header) : '') || col.headerEn)
                  : (col.headerEn || (col.header ? t(col.header) : '') || col.headerHi);

                const isActionsCol = col.id === 'actions' || col.id === 'action' || col.sticky === 'right';

                return (
                  <th
                    key={idx}
                    onClick={() => col.accessorKey && handleSort(String(col.accessorKey))}
                    className={`h-[44px] px-3.5 whitespace-nowrap select-none sticky top-0 bg-page z-10 ${
                      isActionsCol
                        ? 'sticky right-0 z-20 shadow-[-1px_0_0_0_var(--border)] print:hidden'
                        : ''
                    } ${
                      col.accessorKey ? 'cursor-pointer hover:text-text-primary' : ''
                    } ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right'
                          ? 'justify-end'
                          : col.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span>{colTitle}</span>
                      {col.accessorKey && (
                        <span className="text-text-muted">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-brand" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-brand" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm text-text-primary">
            {isTableLoading && paginatedData.length === 0 ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="h-[44px]">
                  {columns.map((_, cIdx) => (
                    <td key={`skel-c-${cIdx}`} className="px-3.5">
                      <div className="h-4 rounded animate-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="h-[44px] hover:bg-brand-subtle/50 transition-colors"
                >
                  {columns.map((col, colIdx) => {
                    const isActionsCol = col.id === 'actions' || col.id === 'action' || col.sticky === 'right';
                    const cellContent = col.cell
                      ? col.cell(item)
                      : col.accessor
                      ? col.accessor(item)
                      : col.accessorKey
                      ? typeof item[col.accessorKey] === 'object' && item[col.accessorKey] !== null
                        ? item[col.accessorKey].name || item[col.accessorKey].title || item[col.accessorKey].nameHindi || ''
                        : String(item[col.accessorKey] ?? '')
                      : '';

                    return (
                      <td
                        key={colIdx}
                        className={`px-3.5 text-text-primary text-sm whitespace-nowrap ${
                          isActionsCol
                            ? 'sticky right-0 bg-surface z-10 shadow-[-1px_0_0_0_var(--border)] print:hidden'
                            : ''
                        } ${
                          col.align === 'right'
                            ? 'text-right tabular-nums'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-0 border-none">
                  {emptyMessage ? (
                    <div className="p-6 text-center text-text-secondary">{emptyMessage}</div>
                  ) : (
                    <EmptyState
                      isFiltered={Boolean(search.trim())}
                      title={emptyTitle}
                      description={emptyDescription || emptyDesc}
                      action={emptyAction}
                      className="border-none rounded-none"
                    />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer: Rows per page & Navigation at Bottom Right */}
      <div className="p-3 bg-surface border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary print:hidden">
        <div>
          <span>
            {t('table.page')} {currentPage} {t('table.of')} {totalPages} ({totalItems} {t('table.records')})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">{t('table.rowsPerPage')}:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="min-h-[32px] px-2 text-xs bg-surface text-text-primary border border-border rounded focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              <span>{t('table.prev')}</span>
            </Button>
            <span className="px-2 py-1 text-xs tabular-nums text-text-primary font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              <span>{t('table.next')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
