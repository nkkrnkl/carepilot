/**
 * Python Bridge - Execute Python scripts from Node.js
 * This module provides a bridge to execute Python scripts and get results
 */

import { spawn } from "child_process";
import { join } from "path";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { accessSync, constants } from "fs";

export interface PythonExecutionOptions {
  [key: string]: any;
}

export interface PythonExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: any;
}

/**
 * Execute a Python script with options
 * @param scriptPath - Path to the Python script
 * @param options - Options to pass to the script (as environment variables or JSON)
 * @returns Promise with execution result
 */
export async function executePython(
  scriptPath: string,
  options: PythonExecutionOptions = {}
): Promise<PythonExecutionResult> {
  return new Promise((resolve) => {
    let inputFile: string | null = null;
    let outputFile: string | null = null;

    try {
      // Create temporary input and output files
      const tempDir = tmpdir();
      const uuid = randomUUID();
      inputFile = join(tempDir, `python_input_${uuid}.json`);
      outputFile = join(tempDir, `python_output_${uuid}.json`);

      // Write input data to file
      writeFileSync(inputFile, JSON.stringify(options, null, 2), 'utf-8');

      // Check if we have a virtual environment in the backend directory
      const backendVenvPath = join(process.cwd(), "backend", "venv", "bin", "python");
      const pythonExecutable = (() => {
        try {
          if (existsSync(backendVenvPath)) {
            // Verify it's executable
            accessSync(backendVenvPath, constants.F_OK | constants.X_OK);
            return backendVenvPath;
          }
        } catch (e) {
          // Fallback to system python3
          console.log("⚠️ Virtual environment not found, using system python3");
        }
        return "python3";
      })();
      
      console.log(`🐍 Using Python executable: ${pythonExecutable}`);

      // Execute Python script with file arguments
      const pythonProcess = spawn(pythonExecutable, [scriptPath, inputFile, outputFile], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          // Ensure virtual environment is used if it exists
          ...(pythonExecutable.includes("venv") ? {
            VIRTUAL_ENV: join(process.cwd(), "backend", "venv"),
            PATH: `${join(process.cwd(), "backend", "venv", "bin")}:${process.env.PATH}`,
          } : {}),
        },
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        // Clean up input file
        if (inputFile) {
          try {
            unlinkSync(inputFile);
          } catch (e) {
            // Ignore cleanup errors
          }
        }

        if (code === 0) {
          try {
            // Read output from file
            if (outputFile) {
              try {
                const outputData = readFileSync(outputFile, 'utf-8');
                const data = JSON.parse(outputData);
                
                // Clean up output file
                try {
                  unlinkSync(outputFile);
                } catch (e) {
                  // Ignore cleanup errors
                }

                resolve({
                  success: true,
                  output: stdout,
                  data,
                });
                return;
              } catch (fileError) {
                console.warn("Failed to read output file, trying stdout:", fileError);
                // Fall through to stdout parsing
              }
            }
            
            // Fallback: try to parse stdout
            if (stdout.trim()) {
              try {
                const data = JSON.parse(stdout);
                resolve({
                  success: true,
                  output: stdout,
                  data,
                });
                return;
              } catch (parseError) {
                console.warn("Failed to parse stdout as JSON:", parseError);
              }
            }
            
            // If we get here, return success with stdout as output
            resolve({
              success: true,
              output: stdout,
            });
          } catch (parseError) {
            console.error("Error processing Python output:", parseError);
            resolve({
              success: false,
              error: `Failed to process Python script output: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
              output: stdout,
            });
          }
        } else {
          // Process exited with non-zero code - it's an error
          let errorData: any = null;
          let errorMessage = stderr || `Process exited with code ${code}`;
          
          // Try to read error from output file
          if (outputFile) {
            try {
              if (existsSync(outputFile)) {
                const outputData = readFileSync(outputFile, 'utf-8');
                errorData = JSON.parse(outputData);
                
                // If the output file contains error information, use it
                if (errorData.error) {
                  errorMessage = errorData.error;
                }
                if (errorData.error_type) {
                  errorMessage = `[${errorData.error_type}] ${errorMessage}`;
                }
                
                // Clean up output file
                try {
                  unlinkSync(outputFile);
                } catch (e) {
                  // Ignore cleanup errors
                }
              }
            } catch (e) {
              console.warn("Failed to read error from output file:", e);
              // Continue with stderr/stdout error message
            }
          }

          // Also check stdout for error messages
          if (stdout.trim() && !errorData) {
            try {
              const stdoutData = JSON.parse(stdout);
              if (stdoutData.error) {
                errorMessage = stdoutData.error;
                errorData = stdoutData;
              }
            } catch (e) {
              // stdout is not JSON, use as-is if stderr is empty
              if (!stderr) {
                errorMessage = stdout.trim() || errorMessage;
              }
            }
          }

          resolve({
            success: false,
            error: errorMessage,
            output: stdout,
            data: errorData,
          });
        }
      });

      pythonProcess.on("error", (error) => {
        // Clean up files on error
        if (inputFile) {
          try {
            unlinkSync(inputFile);
          } catch (e) {}
        }
        if (outputFile) {
          try {
            unlinkSync(outputFile);
          } catch (e) {}
        }

        resolve({
          success: false,
          error: error.message || "Failed to execute Python script",
        });
      });
    } catch (error: any) {
      // Clean up files on error
      if (inputFile) {
        try {
          unlinkSync(inputFile);
        } catch (e) {}
      }
      if (outputFile) {
        try {
          unlinkSync(outputFile);
        } catch (e) {}
      }

      resolve({
        success: false,
        error: error.message || "Unknown error executing Python script",
      });
    }
  });
}

/**
 * Execute Python script with file input
 * @param scriptPath - Path to the Python script
 * @param inputFilePath - Path to input file
 * @param options - Additional options
 * @returns Promise with execution result
 */
export async function executePythonWithFile(
  scriptPath: string,
  inputFilePath: string,
  options: PythonExecutionOptions = {}
): Promise<PythonExecutionResult> {
  return executePython(scriptPath, {
    ...options,
    input_file: inputFilePath,
  });
}

