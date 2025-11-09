import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const docType = formData.get("docType") as string;
    const docId = formData.get("docId") as string;

    if (!file || !userId || !docType || !docId) {
      return NextResponse.json(
        { error: "Missing required fields: file, userId, docType, docId" },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocTypes = ["plan_document", "lab_report", "eob"];
    if (!validDocTypes.includes(docType)) {
      return NextResponse.json(
        { error: `Invalid document type. Must be one of: ${validDocTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file type (accept PDF only)
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Step 1: Extract text from PDF using Python
    const extractScriptPath = join(process.cwd(), "backend", "scripts", "extract_text.py");
    const fileContentBase64 = buffer.toString("base64");
    
    console.log("Starting text extraction...");
    console.log("Script path:", extractScriptPath);
    console.log("File name:", file.name);
    console.log("File size:", file.size, "bytes");
    
    const extractionResult = await executePython(extractScriptPath, {
      fileContent: fileContentBase64,
      fileName: file.name,
      fileType: file.type || "application/pdf",
    });
    
    console.log("Extraction result:", {
      success: extractionResult.success,
      error: extractionResult.error,
      hasData: !!extractionResult.data,
      dataKeys: extractionResult.data ? Object.keys(extractionResult.data) : [],
    });
    
    if (!extractionResult.success) {
      console.error("Text extraction failed:", extractionResult.error);
      console.error("Extraction details:", JSON.stringify(extractionResult.data, null, 2));
      console.error("Output:", extractionResult.output);
      return NextResponse.json(
        { 
          error: extractionResult.error || "Failed to extract text from PDF",
          details: extractionResult.data,
          output: extractionResult.output,
          message: "Please ensure the PDF file is valid and not corrupted."
        },
        { status: 500 }
      );
    }
    
    if (!extractionResult.data?.text) {
      console.error("No text in extraction result:", extractionResult.data);
      return NextResponse.json(
        { 
          error: "No text extracted from PDF",
          details: extractionResult.data,
          message: "The PDF may be empty, password-protected, or contain only images."
        },
        { status: 500 }
      );
    }
    
    const extractedText = extractionResult.data.text;
    console.log("Text extracted successfully, length:", extractedText.length);
    
    // Step 2: Chunk, embed, and store in Pinecone
    const scriptPath = join(process.cwd(), "backend", "scripts", "upload_document.py");
    console.log("Starting document upload to Pinecone...");
    console.log("Upload script path:", scriptPath);
    
    const result = await executePython(scriptPath, {
      userId,
      docId,
      docType,
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      chunkSize: 1000,  // Characters per chunk
      chunkOverlap: 200,  // Overlap between chunks
    });

    console.log("Upload result:", {
      success: result.success,
      error: result.error,
      hasData: !!result.data,
    });

    if (!result.success) {
      console.error("Document upload failed:", result.error);
      console.error("Upload details:", JSON.stringify(result.data, null, 2));
      return NextResponse.json(
        { 
          error: result.error || "Failed to upload document to vector store",
          details: result.data,
          output: result.output,
        },
        { status: 500 }
      );
    }

    const uploadResponse = {
      success: true,
      docId,
      message: result.data?.message || "Document uploaded and stored successfully",
      chunkCount: result.data?.chunkCount || 1,
      vectorIds: result.data?.vectorIds || [],
      ...result.data,
    };

    // Step 3: If document type is plan_document, automatically extract benefits information
    if (docType === "plan_document") {
      try {
        console.log("Starting benefits extraction for plan document...");
        const benefitsExtractScriptPath = join(process.cwd(), "backend", "scripts", "extract_benefits.py");
        const benefitsResult = await executePython(benefitsExtractScriptPath, {
          userId,
          documentId: docId,
          docType: "plan_document",
          method: "cot",
        });

        if (benefitsResult.success && benefitsResult.data?.benefits) {
          console.log("Benefits extracted successfully, storing in SQL database...");
          
          try {
            // Import SQL storage function
            const { upsertInsuranceBenefits } = await import("@/lib/azure/sql-storage");
            
            // Transform benefits data to match SQL schema
            const benefitsData = benefitsResult.data.benefits;
            
            // Prepare benefits entity for SQL storage
            // Helper function to convert null to undefined for optional fields
            const valueOrUndefined = <T>(value: T | null | undefined): T | undefined => {
              return value === null ? undefined : value;
            };

            const benefitsEntity = {
              user_id: userId,
              plan_name: benefitsData.plan_name || "Unknown Plan",
              plan_type: valueOrUndefined(benefitsData.plan_type),
              insurance_provider: valueOrUndefined(benefitsData.insurance_provider),
              policy_number: valueOrUndefined(benefitsData.policy_number),
              group_number: valueOrUndefined(benefitsData.group_number),
              effective_date: valueOrUndefined(benefitsData.effective_date),
              expiration_date: valueOrUndefined(benefitsData.expiration_date),
              deductibles: benefitsData.deductibles ? JSON.stringify(benefitsData.deductibles) : undefined,
              copays: benefitsData.copays ? JSON.stringify(benefitsData.copays) : undefined,
              coinsurance: benefitsData.coinsurance ? JSON.stringify(benefitsData.coinsurance) : undefined,
              coverage_limits: benefitsData.coverage_limits ? JSON.stringify(benefitsData.coverage_limits) : undefined,
              services: benefitsData.services ? JSON.stringify(benefitsData.services) : undefined,
              out_of_pocket_max_individual: valueOrUndefined(benefitsData.out_of_pocket_max_individual),
              out_of_pocket_max_family: valueOrUndefined(benefitsData.out_of_pocket_max_family),
              in_network_providers: valueOrUndefined(benefitsData.in_network_providers),
              out_of_network_coverage: benefitsData.out_of_network_coverage || false,
              network_notes: valueOrUndefined(benefitsData.network_notes),
              preauth_required_services: benefitsData.preauth_required_services ? JSON.stringify(benefitsData.preauth_required_services) : undefined,
              preauth_notes: valueOrUndefined(benefitsData.preauth_notes),
              exclusions: benefitsData.exclusions ? JSON.stringify(benefitsData.exclusions) : undefined,
              exclusion_notes: valueOrUndefined(benefitsData.exclusion_notes),
              special_programs: benefitsData.special_programs ? JSON.stringify(benefitsData.special_programs) : undefined,
              additional_benefits: valueOrUndefined(benefitsData.additional_benefits),
              notes: valueOrUndefined(benefitsData.notes),
              source_document_id: docId,
            };

            // Store in SQL database
            await upsertInsuranceBenefits(benefitsEntity);
            console.log("Benefits stored successfully in SQL database");

            // Add benefits extraction results to the response
            return NextResponse.json({
              ...uploadResponse,
              benefitsExtraction: {
                success: true,
                benefitsData: benefitsData,
                sqlStored: true,
              },
            });
          } catch (sqlError) {
            console.error("Error storing benefits in SQL database:", sqlError);
            // Still return success with benefits data, but note SQL storage failed
            return NextResponse.json({
              ...uploadResponse,
              benefitsExtraction: {
                success: true,
                benefitsData: benefitsResult.data.benefits,
                sqlStored: false,
                sqlError: sqlError instanceof Error ? sqlError.message : "Unknown error",
              },
              warning: "Benefits extracted successfully, but failed to store in SQL database. Data is available in Pinecone.",
            });
          }
        } else {
          // Upload succeeded but benefits extraction failed - still return success with warning
          console.warn("Benefits extraction failed:", benefitsResult.error);
          return NextResponse.json({
            ...uploadResponse,
            benefitsExtraction: {
              success: false,
              error: benefitsResult.error || "Benefits extraction failed",
            },
            warning: "Document uploaded successfully, but benefits extraction failed. You can extract benefits information later.",
          });
        }
      } catch (benefitsError) {
        // Upload succeeded but benefits extraction threw an error - still return success with warning
        console.error("Benefits extraction error:", benefitsError);
        return NextResponse.json({
          ...uploadResponse,
          benefitsExtraction: {
            success: false,
            error: benefitsError instanceof Error ? benefitsError.message : "Unknown error during benefits extraction",
          },
          warning: "Document uploaded successfully, but benefits extraction encountered an error. You can extract benefits information later.",
        });
      }
    }

    // Step 4: If document type is lab_report, automatically extract lab data using lab agent
    if (docType === "lab_report") {
      try {
        console.log("Starting lab report extraction using lab agent...");
        const labExtractScriptPath = join(process.cwd(), "backend", "scripts", "extract_lab_agent.py");
        
        // Get file content as base64 for the lab agent
        const fileContentBase64 = buffer.toString("base64");
        
        const labResult = await executePython(labExtractScriptPath, {
          userId,
          documentId: docId,
          fileContent: fileContentBase64,
          fileName: file.name,
          fileType: file.type || "application/pdf",
        });
        
        console.log("Lab extraction result:", {
          success: labResult.success,
          error: labResult.error,
          hasData: !!labResult.data,
          dataKeys: labResult.data ? Object.keys(labResult.data) : [],
        });

        if (labResult.success && labResult.data?.labData) {
          console.log("Lab report extracted successfully, storing in SQL database...");
          
          try {
            // Import SQL storage function
            const { upsertLabReport } = await import("@/lib/azure/sql-storage");
            
            // Transform lab data to match SQL schema
            const labData = labResult.data.labData;
            
            // Helper function to convert string to title case
            const toTitleCase = (str: string): string => {
              return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
              });
            };

            // Prepare lab report entity for SQL storage
            const defaultTitle = file.name
              .replace(".pdf", "")
              .replace(/_/g, " ")
              .split(" ")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ");

            const labReportEntity = {
              id: docId,
              userId: userId,
              title: labData.title || defaultTitle,
              date: labData.date ? new Date(labData.date).toISOString().split('T')[0] : undefined,
              hospital: labData.hospital || undefined,
              doctor: labData.doctor || undefined,
              fileUrl: undefined, // File is stored in Pinecone, not as a URL
              rawExtract: labData.rawExtract || undefined,
              parameters: labData.parameters || undefined,
            };

            // Store in SQL database
            await upsertLabReport(labReportEntity);
            console.log("Lab report stored successfully in SQL database");

            // Add lab extraction results to the response
            return NextResponse.json({
              ...uploadResponse,
              labExtraction: {
                success: true,
                labData: labData,
                dashboard: labResult.data.dashboard,
                workflowCompleted: labResult.data.workflowCompleted,
                sqlStored: true,
              },
            });
          } catch (sqlError) {
            console.error("Error storing lab report in SQL database:", sqlError);
            // Still return success with lab data, but note SQL storage failed
            return NextResponse.json({
              ...uploadResponse,
              labExtraction: {
                success: true,
                labData: labResult.data.labData,
                dashboard: labResult.data.dashboard,
                workflowCompleted: labResult.data.workflowCompleted,
                sqlStored: false,
                sqlError: sqlError instanceof Error ? sqlError.message : "Unknown error",
              },
              warning: "Lab report extracted successfully, but failed to store in SQL database. Data is available in Pinecone.",
            });
          }
        } else {
          // Upload succeeded but lab extraction failed - still return success with warning
          console.warn("Lab extraction failed:", labResult.error);
          return NextResponse.json({
            ...uploadResponse,
            labExtraction: {
              success: false,
              error: labResult.error || "Lab extraction failed",
            },
            warning: "Document uploaded successfully, but lab extraction failed. You can extract lab information later.",
          });
        }
      } catch (labError) {
        // Upload succeeded but lab extraction threw an error - still return success with warning
        console.error("Lab extraction error:", labError);
        return NextResponse.json({
          ...uploadResponse,
          labExtraction: {
            success: false,
            error: labError instanceof Error ? labError.message : "Unknown error during lab extraction",
          },
          warning: "Document uploaded successfully, but lab extraction encountered an error. You can extract lab information later.",
        });
      }
    }

    // Step 5: If document type is EOB, automatically extract EOB information
    if (docType === "eob") {
      try {
        console.log("Starting EOB extraction using CoT agent...");
        const eobExtractScriptPath = join(process.cwd(), "backend", "scripts", "extract_eob.py");
        const eobResult = await executePython(eobExtractScriptPath, {
          userId,
          documentId: docId,
          docType: "eob",
          method: "cot",
        });

        console.log("EOB extraction result:", {
          success: eobResult.success,
          error: eobResult.error,
          hasData: !!eobResult.data,
          dataKeys: eobResult.data ? Object.keys(eobResult.data) : [],
        });

        if (eobResult.success && eobResult.data?.eob_data) {
          console.log("EOB extracted successfully, storing in SQL database...");
          
          try {
            // Import SQL storage function
            const { upsertEOBRecord } = await import("@/lib/azure/sql-storage");
            
            // Transform EOB data to match SQL schema
            const eobData = eobResult.data.eob_data;
            
            // Helper function to convert null to undefined for optional fields
            const valueOrUndefined = <T>(value: T | null | undefined): T | undefined => {
              return value === null ? undefined : value;
            };

            // Prepare EOB record entity for SQL storage
            const eobRecordEntity = {
              user_id: userId,
              claim_number: eobData.claim_number || docId, // Use docId as fallback
              member_name: eobData.member_name || "Unknown Member",
              member_address: valueOrUndefined(eobData.member_address),
              member_id: valueOrUndefined(eobData.member_id),
              group_number: valueOrUndefined(eobData.group_number),
              claim_date: valueOrUndefined(eobData.claim_date),
              provider_name: eobData.provider_name || "Unknown Provider",
              provider_npi: valueOrUndefined(eobData.provider_npi),
              total_billed: eobData.total_billed || 0,
              total_benefits_approved: eobData.total_benefits_approved || 0,
              amount_you_owe: eobData.amount_you_owe || 0,
              services: eobData.services ? JSON.stringify(eobData.services) : undefined,
              coverage_breakdown: eobData.coverage_breakdown ? JSON.stringify(eobData.coverage_breakdown) : undefined,
              insurance_provider: valueOrUndefined(eobData.insurance_provider),
              plan_name: valueOrUndefined(eobData.plan_name),
              policy_number: valueOrUndefined(eobData.policy_number),
              alerts: eobData.alerts && eobData.alerts.length > 0 ? JSON.stringify(eobData.alerts) : undefined,
              discrepancies: eobData.discrepancies && eobData.discrepancies.length > 0 ? JSON.stringify(eobData.discrepancies) : undefined,
              source_document_id: docId,
            };

            // Store in SQL database
            await upsertEOBRecord(eobRecordEntity);
            console.log("EOB record stored successfully in SQL database");

            // Add EOB extraction results to the response
            return NextResponse.json({
              ...uploadResponse,
              eobExtraction: {
                success: true,
                eobData: eobData,
                caseData: eobResult.data.case_data,
                sqlStored: true,
              },
            });
          } catch (sqlError) {
            console.error("Error storing EOB record in SQL database:", sqlError);
            // Still return success with EOB data, but note SQL storage failed
            return NextResponse.json({
              ...uploadResponse,
              eobExtraction: {
                success: true,
                eobData: eobResult.data.eob_data,
                caseData: eobResult.data.case_data,
                sqlStored: false,
                sqlError: sqlError instanceof Error ? sqlError.message : "Unknown error",
              },
              warning: "EOB extracted successfully, but failed to store in SQL database. Data is available in Pinecone.",
            });
          }
        } else {
          // Upload succeeded but EOB extraction failed - still return success with warning
          console.warn("EOB extraction failed:", eobResult.error);
          return NextResponse.json({
            ...uploadResponse,
            eobExtraction: {
              success: false,
              error: eobResult.error || "EOB extraction failed",
            },
            warning: "Document uploaded successfully, but EOB extraction failed. You can extract EOB information later from the cases page.",
          });
        }
      } catch (eobError) {
        // Upload succeeded but EOB extraction threw an error - still return success with warning
        console.error("EOB extraction error:", eobError);
        return NextResponse.json({
          ...uploadResponse,
          eobExtraction: {
            success: false,
            error: eobError instanceof Error ? eobError.message : "Unknown error during EOB extraction",
          },
          warning: "Document uploaded successfully, but EOB extraction encountered an error. You can extract EOB information later from the cases page.",
        });
      }
    }

    return NextResponse.json(uploadResponse);
  } catch (error) {
    console.error("Document upload error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Upload failed",
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

