/**
 * PDF utility functions
 * Uses dynamic imports to avoid build-time errors with canvas library
 */

export async function convertPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  try {
    // Dynamically import pdfjs-dist and canvas to avoid build-time errors
    const pdfjsLib = await import("pdfjs-dist");
    const { createCanvas } = await import("canvas");

    // Configure PDF.js worker (only in Node.js environment)
    if (typeof window === "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.mjs");
    }

    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const images: Buffer[] = [];

    // Convert first page to image (for lab reports, first page usually contains the data)
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    // Render PDF page to canvas
    await page.render({
      canvas: canvas as any,
      canvasContext: context as any,
      viewport: viewport,
    }).promise;

    // Convert canvas to buffer
    const imageBuffer = canvas.toBuffer("image/png");
    images.push(imageBuffer);

    return images;
  } catch (error) {
    console.error("PDF conversion error:", error);
    throw new Error(`Failed to convert PDF to image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

