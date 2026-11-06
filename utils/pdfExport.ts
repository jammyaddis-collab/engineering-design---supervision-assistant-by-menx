import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface EngineeringDocumentMetadata {
  title: string;
  projectName: string;
  projectCode: string;
  engineerName: string;
  projectPhase: 'Design' | 'Tendering' | 'Construction/Supervision' | 'Handover';
  applicableCodes: string;
  revision: string;
  date: string;
  documentType: string;
  includeSignOff: boolean;
  includeDisclaimer: boolean;
}

export const DEFAULT_ENGINEERING_METADATA: EngineeringDocumentMetadata = {
  title: 'Engineering Technical Consultation & Review Note',
  projectName: 'Infrastructure & Structural Development Project',
  projectCode: 'ENG-2026-MENX-01',
  engineerName: 'Engineer Meneyahil',
  projectPhase: 'Construction/Supervision',
  applicableCodes: 'ACI 318-19, Eurocodes, AASHTO LRFD, ASTM Standards',
  revision: 'Rev. 01 (Final Draft)',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  documentType: 'Technical Consultation Log',
  includeSignOff: true,
  includeDisclaimer: true,
};

/**
 * Exports an HTML element as a PDF using html2canvas and jsPDF.
 * Optimized for standard A4 pages with crisp high-DPI rasterization.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string = 'engineering_document.pdf',
  onProgress?: (progress: number) => void
): Promise<void> {
  onProgress?.(10);

  // A4 dimensions in mm: 210 x 297
  const pdfWidthMm = 210;
  const pdfHeightMm = 297;
  const marginMm = 10;
  const contentWidthMm = pdfWidthMm - marginMm * 2;

  // Render element to canvas with high resolution
  const canvas = await html2canvas(element, {
    scale: 2, // 2x resolution for crystal clear text and diagrams
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  onProgress?.(50);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF('p', 'mm', 'a4');

  const imgWidth = contentWidthMm;
  const pageContentHeightMm = pdfHeightMm - marginMm * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = marginMm;
  let page = 1;

  // First page
  pdf.addImage(imgData, 'JPEG', marginMm, position, imgWidth, imgHeight);
  heightLeft -= pageContentHeightMm;

  // Add consecutive pages if content exceeds single page
  while (heightLeft > 0) {
    position = marginMm - pageContentHeightMm * page;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', marginMm, position, imgWidth, imgHeight);
    page++;
    heightLeft -= pageContentHeightMm;
  }

  onProgress?.(90);

  // Save the PDF
  pdf.save(filename);
  onProgress?.(100);
}

/**
 * Triggers native browser print formatted specifically for engineering documents
 */
export function triggerBrowserPrint(): void {
  window.print();
}
