import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

interface PythonResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Execute a Python script with input data
 * Uses temporary files for input/output to avoid command-line length limits
 */
export async function executePython(
  scriptPath: string,
  inputData: Record<string, any>
): Promise<PythonResult> {
  const inputFile = join(tmpdir(), `python-input-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
  const outputFile = join(tmpdir(), `python-output-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);

  try {
    // Write input data to file
    await writeFile(inputFile, JSON.stringify(inputData, null, 2), "utf-8");

    // Execute Python script (use venv if available, otherwise system python3)
    const venvPython = join(process.cwd(), "backend", "venv", "bin", "python3");
    const fs = require("fs");
    const pythonPath = fs.existsSync(venvPython) ? venvPython : "python3";
    const command = `"${pythonPath}" "${scriptPath}" "${inputFile}" "${outputFile}"`;
    
    console.log(`[python-bridge] Executing: ${command}`);
    console.log(`[python-bridge] Python path: ${pythonPath}`);
    console.log(`[python-bridge] Script path: ${scriptPath}`);
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    if (stdout) console.log(`[python-bridge] stdout: ${stdout}`);
    if (stderr) console.warn(`[python-bridge] stderr: ${stderr}`);

    // Read output file
    const outputContent = await readFile(outputFile, "utf-8");
    console.log(`[python-bridge] Output file content length: ${outputContent.length}`);
    const result = JSON.parse(outputContent);
    console.log(`[python-bridge] Parsed result success: ${result.success}`);

    // Clean up temporary files
    await unlink(inputFile).catch(() => {});
    await unlink(outputFile).catch(() => {});

    if (result.success === false) {
      return {
        success: false,
        error: result.error || "Python script execution failed",
        data: result,
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Clean up temporary files on error
    await unlink(inputFile).catch(() => {});
    await unlink(outputFile).catch(() => {});

    console.error(`[python-bridge] Error executing Python script:`, error);
    console.error(`[python-bridge] Error details:`, error instanceof Error ? error.stack : error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

