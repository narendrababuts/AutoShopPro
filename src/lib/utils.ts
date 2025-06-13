
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number input by removing leading zeros
 * @param value String or number input
 * @returns Formatted number string without leading zeros
 */
export function formatNumber(value: string | number): string {
  if (!value && value !== 0) return '';
  
  // Convert to string if it's a number
  const stringValue = typeof value === 'number' ? value.toString() : value;
  
  // Remove leading zeros unless it's a decimal number
  if (stringValue.startsWith('0') && stringValue.length > 1 && !stringValue.startsWith('0.')) {
    const cleaned = stringValue.replace(/^0+/, '');
    return cleaned === '' ? '0' : cleaned;
  }
  
  return stringValue;
}

/**
 * Format number input for form fields 
 * @param e Event from input field
 */
export function handleNumberInput(e: React.ChangeEvent<HTMLInputElement>) {
  const value = e.target.value;
  if (value) {
    e.target.value = formatNumber(value);
  }
}

/**
 * Parse a string or number input and ensure no leading zeros
 * @param value Input value
 * @returns Parsed number without leading zeros
 */
export function parseNumberInput(value: string | number): number {
  if (typeof value === 'number') return value;
  
  // Remove leading zeros first
  const cleanedValue = formatNumber(value);
  const parsed = parseInt(cleanedValue, 10);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format numbers using Indian numbering system (lakhs, crores)
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted string in Indian number format
 */
export function formatIndianNumber(value: number | string, decimals = 2): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Use toLocaleString with en-IN locale to get Indian number formatting
  return numValue.toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
}

/**
 * Format currency in Indian Rupees format
 * @param value Number to format
 * @returns Formatted string with ₹ symbol and Indian number format
 */
export function formatIndianCurrency(value: number | string): string {
  if (value === null || value === undefined || value === '') {
    return '₹0.00';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Use toLocaleString with en-IN locale and currency style
  return numValue.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Create a URL for downloading an object as a blob
 * @param data The data to convert to a blob
 * @param contentType The MIME content type
 * @returns A URL for the blob
 */
export function createBlobUrl(data: any, contentType: string): string {
  const blob = new Blob([data], { type: contentType });
  return URL.createObjectURL(blob);
}

/**
 * Trigger a file download in the browser
 * @param url URL of the file to download
 * @param filename Name to save the file as
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Download data as a file
 * @param data Data to download
 * @param filename Name to save the file as
 * @param contentType MIME content type
 */
export function downloadBlob(data: any, filename: string, contentType: string): void {
  const url = createBlobUrl(data, contentType);
  downloadFile(url, filename);
}
