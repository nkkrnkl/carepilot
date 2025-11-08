/**
 * Python Bridge - Execute Python scripts from Node.js
 * This module provides a bridge to execute Python scripts and get results
 */

import { spawn } from "child_process";
import { join } from "path";

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
    try {
      // Convert options to environment variables
      const env = {
        ...process.env,
        ...Object.entries(options).reduce((acc, [key, value]) => {
          acc[`PYTHON_${key.toUpperCase()}`] = String(value);
          return acc;
        }, {} as Record<string, string>),
        // Also pass as JSON for complex objects
        PYTHON_OPTIONS_JSON: JSON.stringify(options),
      };

      // Execute Python script
      const pythonProcess = spawn("python3", [scriptPath], {
        env,
        cwd: process.cwd(),
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
        if (code === 0) {
          try {
            // Try to parse JSON output
            const data = JSON.parse(stdout);
            resolve({
              success: true,
              output: stdout,
              data,
            });
          } catch {
            // If not JSON, return as plain text
            resolve({
              success: true,
              output: stdout,
            });
          }
        } else {
          resolve({
            success: false,
            error: stderr || `Process exited with code ${code}`,
            output: stdout,
          });
        }
      });

      pythonProcess.on("error", (error) => {
        resolve({
          success: false,
          error: error.message || "Failed to execute Python script",
        });
      });
    } catch (error: any) {
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

