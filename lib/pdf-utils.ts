// Use legacy build for Node.js compatibility (avoids DOMMatrix requirement)
// The legacy build is designed for Node.js and doesn't require browser APIs like DOMMatrix
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "canvas";

// Disable worker for Node.js (not needed in server environment)
// The legacy build works without a worker in Node.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

export async function convertPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  try {
    // Convert Buffer to Uint8Array (pdfjs-dist requires Uint8Array, not Buffer)
    const uint8Array = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const images: Buffer[] = [];

    // Process first page (lab reports usually have all info on first page)
    const pageNum = 1;
    const page = await pdf.getPage(pageNum);

    const viewport = page.getViewport({ scale: 2.0 });
    
    // Create a buffer for the canvas
    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);
    
    // Create canvas and render PDF page
    const nodeCanvas = createCanvas(width, height);
    const context = nodeCanvas.getContext("2d");

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const imageBuffer = nodeCanvas.toBuffer("image/png");
    images.push(imageBuffer);

    return images;
  } catch (error) {
    console.error("PDF conversion error:", error);
    throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

