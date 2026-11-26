/**
 * UNIFIED FORMATTERS FOR MOLDINS ERP
 * Single Source of Truth for Indian grouping numbers, currency, and dates.
 */

/**
 * Format number with Indian numbering grouping: 12,34,567.89
 */
export function formatIndianNumber(
  value: number | string | null | undefined,
  decimals: number = 2,
  trimTrailingZeros: boolean = false
): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const fixed = absNum.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');

  // Indian number grouping logic (last 3, then every 2)
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  let result = formattedInt;
  if (decimals > 0 && decPart) {
    if (trimTrailingZeros) {
      const trimmedDec = decPart.replace(/0+$/, '');
      if (trimmedDec.length > 0) {
        result += '.' + trimmedDec;
      }
    } else {
      result += '.' + decPart;
    }
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Format currency with Rupee symbol and Indian grouping: ₹5,40,000.00
 */
export function formatCurrency(
  value: number | string | null | undefined,
  decimals: number = 2
): string {
  return `₹${formatIndianNumber(value, decimals)}`;
}

/**
 * Format dates strictly in dd/mm/yyyy format
 */
export function formatDate(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

/**
 * Format datetime in dd/mm/yyyy, hh:mm am/pm
 */
export function formatDateTime(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';

    const dateStr = formatDate(d);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const hourStr = String(hours).padStart(2, '0');

    return `${dateStr} ${hourStr}:${minutes} ${ampm}`;
  } catch {
    return '—';
  }
}

/**
 * Convert numeric amount to Indian Currency Words (e.g. INR Two Lakh Eighteen Thousand Three Hundred Only)
 */
export function numberToIndianWords(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return 'Zero Rupees Only';
  const n = Math.round(Number(num));
  if (isNaN(n) || n === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(val: number): string {
    if (val < 20) return a[val];
    const digit = val % 10;
    return b[Math.floor(val / 10)] + (digit ? ' ' + a[digit] : '');
  }

  function convert(val: number): string {
    if (val < 100) return inWords(val);
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 ? ' ' + convert(val % 100) : '');
    if (val < 100000) return convert(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 ? ' ' + convert(val % 1000) : '');
    if (val < 10000000) return convert(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 ? ' ' + convert(val % 100000) : '');
    return convert(Math.floor(val / 10000000)) + ' Crore' + (val % 10000000 ? ' ' + convert(val % 10000000) : '');
  }

  return `INR ${convert(n)} Only`;
}
