declare module 'pdf-parse' {
  interface PdfData {
    text: string;
    numpages: number;
    numrender: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: any;
    };
    metadata: {
      [key: string]: any;
    };
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }): Promise<PdfData>;

  export = pdfParse;
}