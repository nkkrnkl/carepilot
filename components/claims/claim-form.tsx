"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Play, Loader2 } from "lucide-react";
import { WorkflowProgress } from "./workflow-progress";

interface ClaimFormProps {
  userId: string;
  uploadedDocuments?: Array<{ id: string; type: string; name: string }>;
}

export function ClaimForm({ userId, uploadedDocuments = [] }: ClaimFormProps) {
  const [docId, setDocId] = useState("");
  const [docType, setDocType] = useState("clinical_note");
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessClaim = async () => {
    if (!docId && uploadedDocuments.length === 0) {
      setError("Please upload a document or enter a document ID");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setWorkflowSteps([]);

    try {
      const selectedDoc = uploadedDocuments.find((doc) => doc.id === docId) || uploadedDocuments[0];
      const finalDocId = docId || selectedDoc?.id || "";
      const finalDocType = docType || selectedDoc?.type || "clinical_note";

      const response = await fetch("/api/claims/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          docId: finalDocId,
          docType: finalDocType,
          taskDescription: "Process the claim for the uploaded document",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process claim");
      }

      const data = await response.json();

      // Update workflow steps based on response
      const steps = [
        {
          step: 1,
          title: "Pre-Check Coverage",
          status: data.steps?.step1?.status === "Completed" ? "completed" : "pending",
          data: data.steps?.step1,
        },
        {
          step: 2,
          title: "Assemble Codes",
          status: data.steps?.step2?.status === "Completed" ? "completed" : "pending",
          data: data.steps?.step2,
        },
        {
          step: 3,
          title: "Generate Clean Claim",
          status: data.steps?.step3?.status === "Clean" ? "completed" : "pending",
          data: data.steps?.step3,
        },
        {
          step: 4,
          title: "Monitor Status",
          status: data.steps?.step4?.status === "Submitted" ? "completed" : "pending",
          data: data.steps?.step4,
        },
      ];

      setWorkflowSteps(steps);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Process Claim</CardTitle>
          <CardDescription>
            Select a document and process it through the 4-step claims workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Selection */}
          {uploadedDocuments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Document
              </label>
              <select
                value={docId}
                onChange={(e) => {
                  setDocId(e.target.value);
                  const doc = uploadedDocuments.find((d) => d.id === e.target.value);
                  if (doc) setDocType(doc.type);
                }}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select a document...</option>
                {uploadedDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manual Document ID Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Document ID (if not selecting from uploads)
            </label>
            <Input
              type="text"
              placeholder="Enter document ID"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={isProcessing}
            >
              <option value="clinical_note">Clinical Note</option>
              <option value="plan_document">Plan Document</option>
              <option value="bill">Bill</option>
              <option value="lab_report">Lab Report</option>
              <option value="eob">EOB</option>
            </select>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcessClaim}
            disabled={isProcessing || (!docId && uploadedDocuments.length === 0)}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Process Claim
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Progress */}
      {workflowSteps.length > 0 && (
        <WorkflowProgress steps={workflowSteps} />
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Claim Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.claim && (
                <div>
                  <h3 className="font-semibold mb-2">Generated Claim</h3>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(result.claim, null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Export Claim
                </Button>
                <Button variant="outline" size="sm">
                  Submit Claim
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

