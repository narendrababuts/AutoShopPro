
import html2pdf from 'html2pdf.js';

/**
 * Formats a date string into local DD/MM/YYYY format
 */
export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formats a time string into local HH:MM format
 */
export const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Configure and download PDF from HTML element
 */
export const generatePDF = (
  element: HTMLElement,
  invoiceId: string,
  onSuccess: () => void,
  onError: (error: any) => void
) => {
  console.log('Starting PDF generation process with element:', element);
  
  // Create a deep clone of the invoice element to prevent modifications to the original
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Create a temporary container for the PDF content
  const tempContainer = document.createElement('div');
  tempContainer.appendChild(clonedElement);
  document.body.appendChild(tempContainer);
  
  // Set appropriate styling for PDF rendering
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = '210mm';  // A4 width
  tempContainer.style.height = 'auto';
  
  clonedElement.style.width = '210mm';
  clonedElement.style.maxWidth = '210mm';
  clonedElement.style.margin = '0';
  clonedElement.style.padding = '15mm 15mm 20mm 15mm';  // A4 standard margins
  clonedElement.style.boxSizing = 'border-box';
  clonedElement.style.backgroundColor = 'white';
  clonedElement.style.fontSize = '11pt';
  
  // Make sure numbers are properly preserved in the PDF output
  const numberElements = clonedElement.querySelectorAll('.text-right, [class*="text-right"], td');
  numberElements.forEach(elem => {
    const el = elem as HTMLElement;
    // Find any text that looks like a price (₹ followed by numbers)
    const text = el.innerText;
    if (text && text.includes('₹')) {
      // Ensure text is not converted to simplified numbers
      el.style.whiteSpace = 'nowrap';
      // Preserve text exactly as is
      el.setAttribute('data-pdf-preserve', 'true');
    }
  });
  
  // Ensure all content is visible and properly sized
  const tables = clonedElement.querySelectorAll('table');
  tables.forEach(table => {
    table.style.width = '100%';
    table.style.tableLayout = 'fixed';
    table.style.borderCollapse = 'collapse';
    table.style.pageBreakInside = 'avoid';
  });
  
  // Configure proper cell sizes
  const cells = clonedElement.querySelectorAll('th, td');
  cells.forEach(cell => {
    (cell as HTMLElement).style.wordBreak = 'break-word';
    (cell as HTMLElement).style.overflowWrap = 'break-word';
    (cell as HTMLElement).style.padding = '3px 4px';
    (cell as HTMLElement).style.fontSize = '9pt';
  });
  
  // Set font sizes for better PDF rendering
  const headings = clonedElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    (heading as HTMLElement).style.margin = '0.3em 0';
    
    if (heading.tagName === 'H1') {
      (heading as HTMLElement).style.fontSize = '16pt';
    } else if (heading.tagName === 'H2') {
      (heading as HTMLElement).style.fontSize = '14pt';
    } else {
      (heading as HTMLElement).style.fontSize = '12pt';
    }
  });
  
  // Configure html2pdf options for A4 page with proper DPI
  const opt = {
    margin: 0,
    filename: `Invoice-${invoiceId.substring(0, 8).toUpperCase()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: true,
      letterRendering: true,
      width: 794,
      height: 1123,
      windowWidth: 210 * 3.78,  // Convert mm to px (3.78 px per mm at 96 DPI)
      foreignObjectRendering: false, // Try disabling foreignObject rendering
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true,
      precision: 16,
      floatPrecision: "smart" // Use smart precision for floating point numbers
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.page-break-before', after: '.page-break-after', avoid: '.page-break-avoid' }
  };
  
  console.log('PDF generation options:', opt);
  
  // Generate and download PDF
  html2pdf()
    .from(clonedElement)
    .set(opt)
    .toPdf()
    .get('pdf')
    .then((pdf) => {
      // Ensure PDF is properly formatted
      pdf.save(`Invoice-${invoiceId.substring(0, 8).toUpperCase()}.pdf`);
      
      // Clean up
      document.body.removeChild(tempContainer);
      onSuccess();
      console.log('PDF generation successful');
    })
    .catch((error) => {
      console.error('PDF generation error:', error);
      document.body.removeChild(tempContainer);
      onError(error);
    });
};
