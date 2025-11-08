"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Circle } from "lucide-react";

interface WorkflowStep {
  step: number;
  title: string;
  status: "pending" | "in_progress" | "completed" | "error";
  data?: any;
  error?: string;
}

interface WorkflowProgressProps {
  steps: WorkflowStep[];
}

const STEP_TITLES = [
  "Pre-Check Coverage",
  "Assemble Codes",
  "Generate Clean Claim",
  "Monitor Status",
];

export function WorkflowProgress({ steps }: WorkflowProgressProps) {
  const getStepIcon = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadge = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-700">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claims Processing Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {STEP_TITLES.map((title, index) => {
            const step = steps.find((s) => s.step === index + 1);
            const stepNumber = index + 1;
            const status = step?.status || "pending";

            return (
              <div key={stepNumber} className="flex gap-4">
                {/* Step Number & Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      status === "completed"
                        ? "bg-green-100"
                        : status === "in_progress"
                        ? "bg-blue-100"
                        : status === "error"
                        ? "bg-red-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {getStepIcon(status)}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Step {stepNumber}: {title}
                    </h3>
                    {getStepBadge(status)}
                  </div>

                  {/* Step Data Display */}
                  {step?.data && status === "completed" && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                      {stepNumber === 1 && step.data.payer_id && (
                        <p className="text-gray-700">
                          <span className="font-medium">Payer:</span> {step.data.payer_id}
                        </p>
                      )}
                      {stepNumber === 2 && step.data.suggested_cpt && (
                        <div className="space-y-1">
                          <p className="font-medium text-gray-700">CPT Codes:</p>
                          <ul className="list-disc list-inside text-gray-600">
                            {step.data.suggested_cpt.map((cpt: any, idx: number) => (
                              <li key={idx}>
                                {cpt.code}: {cpt.justification}
                              </li>
                            ))}
                          </ul>
                          {step.data.suggested_icd10 && (
                            <>
                              <p className="font-medium text-gray-700 mt-2">ICD-10 Codes:</p>
                              <ul className="list-disc list-inside text-gray-600">
                                {step.data.suggested_icd10.map((icd10: any, idx: number) => (
                                  <li key={idx}>
                                    {icd10.code}: {icd10.justification}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                      {stepNumber === 3 && step.data.claim_json && (
                        <div className="space-y-1">
                          <p className="font-medium text-gray-700">Claim Status: {step.data.status}</p>
                          <p className="text-gray-600">
                            CPT: {step.data.claim_json.cpt_codes?.join(", ")}
                          </p>
                          <p className="text-gray-600">
                            ICD-10: {step.data.claim_json.icd10_codes?.join(", ")}
                          </p>
                        </div>
                      )}
                      {stepNumber === 4 && step.data.monitoring_note && (
                        <p className="text-gray-700">{step.data.monitoring_note}</p>
                      )}
                    </div>
                  )}

                  {/* Error Display */}
                  {step?.error && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                      {step.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

