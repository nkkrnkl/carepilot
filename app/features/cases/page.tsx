"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Download,
  Send,
  CreditCard,
  FileX,
  Calendar,
  User,
  Receipt,
  Loader2,
  X,
  Edit,
  Save
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCases, getEOBData } from "@/lib/services/cases-service";
import { CaseData, EOBExtractionResult } from "@/lib/types/cases";
import { Toaster, toast } from "sonner";
import { PatientNavbar } from "@/components/layout/patient-navbar";

// Helper function to generate audit trail from EOB data
const generateAuditTrail = (eobData: EOBExtractionResult | null): Array<{
  date: string;
  action: string;
  user: string;
  details?: string;
}> => {
  if (!eobData) return [];
  
  const trail = [];
  const eob = eobData.eob_data;
  
  if (eob.extracted_date) {
    trail.push({
      date: new Date(eob.extracted_date).toLocaleDateString(),
      action: "EOB processed",
      user: "AI Assistant",
      details: `Extracted from document ${eob.source_document_id}`,
    });
  }
  
  if (eob.claim_date) {
    trail.push({
      date: eob.claim_date,
      action: "Claim received",
      user: "System",
      details: `Claim ${eob.claim_number} from ${eob.provider_name || "Provider"}`,
    });
  }
  
  if (eob.discrepancies && eob.discrepancies.length > 0) {
    trail.push({
      date: new Date().toLocaleDateString(),
      action: "Discrepancies identified",
      user: "AI Assistant",
      details: eob.discrepancies.join(", "),
    });
  }
  
  if (eob.alerts && eob.alerts.length > 0) {
    trail.push({
      date: new Date().toLocaleDateString(),
      action: "Alert triggered",
      user: "System",
      details: eob.alerts.join(", "),
    });
  }
  
  return trail;
};

// Helper function to generate documents list from EOB data
const generateDocuments = (eobData: EOBExtractionResult | null): Array<{
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}> => {
  if (!eobData) return [];
  
  const docs = [];
  const eob = eobData.eob_data;
  
  if (eob.source_document_id) {
    docs.push({
      id: eob.source_document_id,
      name: `EOB_${eob.claim_number || eob.source_document_id}.pdf`,
      type: "EOB",
      date: eob.claim_date || eob.extracted_date || new Date().toISOString().split("T")[0],
      size: "—", // Size would come from SQL Server
    });
  }
  
  return docs;
};

// Helper function to generate next step from EOB data
const generateNextStep = (eobData: EOBExtractionResult | null): string | null => {
  if (!eobData) return null;
  
  const eob = eobData.eob_data;
  const caseData = eobData.case_data;
  
  if (caseData.status === "Needs Review") {
    if (eob.amount_you_owe > 0) {
      return `Review amount owed: $${eob.amount_you_owe.toFixed(2)}. Consider appealing if coverage issue is resolved.`;
    }
    return "Review case and determine next action.";
  }
  
  if (caseData.status === "In Progress") {
    if (eob.discrepancies && eob.discrepancies.length > 0) {
      return `Review discrepancies: ${eob.discrepancies.join(", ")}. AI will follow up in 5 days if no action is taken.`;
    }
    return "Case is being processed. AI will follow up if no response is received.";
  }
  
  return null;
};

// Removed mock data - now using real data from API

const getStatusColor = (status: string) => {
  switch (status) {
    case "Needs Review":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "In Progress":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "Resolved":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Bill":
      return <Receipt className="h-4 w-4" />;
    case "EOB":
      return <FileText className="h-4 w-4" />;
    case "Claim":
      return <FileX className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export default function CasesPage() {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [cases, setCases] = useState<CaseData[]>([]);
  const [selectedCaseData, setSelectedCaseData] = useState<CaseData | null>(null);
  const [selectedEOBData, setSelectedEOBData] = useState<EOBExtractionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCase, setLoadingCase] = useState(false);

  const { user } = useUser();
  const userId = user?.email || "user-123"; // Use authenticated user email

  // Fetch cases on component mount
  useEffect(() => {
    async function fetchCases() {
      setLoading(true);
      try {
        const fetchedCases = await getCases(userId);
        setCases(fetchedCases);
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();
  }, [userId]);

  // Fetch detailed case data when a case is selected
  useEffect(() => {
    async function fetchCaseDetails() {
      if (!selectedCase) {
        setSelectedCaseData(null);
        setSelectedEOBData(null);
        setEditingStatus(false);
        return;
      }

      setLoadingCase(true);
      try {
        // Extract claim number from case ID (format: "eob-{claim_number}")
        const claimNumber = selectedCase.replace("eob-", "");
        
        // Fetch EOB data from SQL Server
        const eobData = await getEOBData(claimNumber, userId);
        if (eobData) {
          setSelectedEOBData(eobData);
          setSelectedCaseData(eobData.case_data);
          setNewStatus(eobData.case_data.status);
        } else {
          // Fallback: find case in local state
          const caseData = cases.find((c) => c.id === selectedCase);
          setSelectedCaseData(caseData || null);
          setNewStatus(caseData?.status || "In Progress");
          setSelectedEOBData(null);
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
        // Fallback: find case in local state
        const caseData = cases.find((c) => c.id === selectedCase);
        setSelectedCaseData(caseData || null);
        setNewStatus(caseData?.status || "In Progress");
        setSelectedEOBData(null);
      } finally {
        setLoadingCase(false);
      }
    }

    fetchCaseDetails();
  }, [selectedCase, userId, cases]);

  const filteredCases = cases.filter(
    (c) => filterStatus === "All" || c.status === filterStatus
  );

  const selectedAuditTrail = generateAuditTrail(selectedEOBData);
  const selectedDocuments = generateDocuments(selectedEOBData);
  const selectedNextStep = generateNextStep(selectedEOBData);

  const handlePayBill = (caseId: string) => {
    // Mock payment functionality
    alert(`Payment processing for case ${caseId}...`);
    // In production, this would call an API
  };

  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealEmail, setAppealEmail] = useState<any>(null);
  const [generatingAppeal, setGeneratingAppeal] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleAppealClaim = async (caseId: string) => {
    setGeneratingAppeal(true);
    setAppealError(null);
    setShowAppealModal(true);

    try {
      // Extract claim number from case ID (format: "eob-{claim_number}")
      const claimNumber = caseId.replace("eob-", "");
      
      console.log("Generating appeal for case:", caseId, "claim number:", claimNumber);
      
      // Try to get EOB data first (for UI display), but API will fetch from SQL if needed
      let eobDataToUse = selectedEOBData;
      
      if (!eobDataToUse) {
        console.log("EOB data not loaded in UI, fetching...");
        eobDataToUse = await getEOBData(claimNumber, userId);
        if (eobDataToUse) {
          setSelectedEOBData(eobDataToUse);
        }
      }

      // Call appeal API with claim number and userId - API will fetch from SQL Server
      // This ensures we always have the latest data from the database
      const response = await fetch("/api/appeals/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: caseId,
          userId: userId,
          claimNumber: claimNumber,
          // Optionally include eob_data if we have it (for faster processing)
          // But API will fetch from SQL if not provided
          eob_data: eobDataToUse?.eob_data || null,
          // Don't pass discrepancy_types - let the appeal agent categorize them from eob_data.discrepancies
          discrepancy_types: null,
          additional_context: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to generate appeal email (${response.status})`;
        console.error("Appeal generation failed:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.success || !data.appeal_email) {
        throw new Error("Invalid response from appeal generation API");
      }

      console.log("Appeal email generated successfully");
      setAppealEmail(data.appeal_email);
    } catch (error) {
      console.error("Error generating appeal:", error);
      setAppealError(error instanceof Error ? error.message : "Failed to generate appeal email");
    } finally {
      setGeneratingAppeal(false);
    }
  };

  if (selectedCaseData) {
    if (loadingCase) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-4" />
            <p className="text-gray-600">Loading case details...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Toaster />
        {/* Navigation */}
        <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCase(null)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Cases
                </Button>
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <span className="text-xl font-bold text-gray-900">Case Details</span>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link href="/">Home</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Case Details */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Show EOB details if available */}
          {selectedEOBData && selectedEOBData.eob_data && (
            <Card className="mb-6 border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg">EOB Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {selectedEOBData.eob_data.member_name && (
                    <div>
                      <div className="text-gray-500">Member</div>
                      <div className="font-semibold">{selectedEOBData.eob_data.member_name}</div>
                    </div>
                  )}
                  {selectedEOBData.eob_data.member_id && (
                    <div>
                      <div className="text-gray-500">Member ID</div>
                      <div className="font-semibold">{selectedEOBData.eob_data.member_id}</div>
                    </div>
                  )}
                  {selectedEOBData.eob_data.group_number && (
                    <div>
                      <div className="text-gray-500">Group Number</div>
                      <div className="font-semibold">{selectedEOBData.eob_data.group_number}</div>
                    </div>
                  )}
                  {selectedEOBData.eob_data.claim_number && (
                    <div>
                      <div className="text-gray-500">Claim Number</div>
                      <div className="font-semibold">{selectedEOBData.eob_data.claim_number}</div>
                    </div>
                  )}
                  {selectedEOBData.eob_data.total_billed !== undefined && (
                    <div>
                      <div className="text-gray-500">Total Billed</div>
                      <div className="font-semibold">${selectedEOBData.eob_data.total_billed.toFixed(2)}</div>
                    </div>
                  )}
                  {selectedEOBData.eob_data.total_benefits_approved !== undefined && (
                    <div>
                      <div className="text-gray-500">Benefits Approved</div>
                      <div className="font-semibold">${selectedEOBData.eob_data.total_benefits_approved.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Case Header */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(selectedCaseData.type)}
                    <CardTitle className="text-2xl font-bold">
                      {selectedCaseData.title}
                    </CardTitle>
                    {editingStatus ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white shadow-sm"
                          disabled={updatingStatus}
                        >
                          <option value="Needs Review">Needs Review</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={async () => {
                            setUpdatingStatus(true);
                            try {
                              const response = await fetch("/api/cases/update-status", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  caseId: selectedCaseData.id,
                                  userId: userId,
                                  status: newStatus,
                                }),
                              });

                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || "Failed to update status");
                              }

                              // Update local state
                              const updatedCaseData = {
                                ...selectedCaseData,
                                status: newStatus as "Needs Review" | "In Progress" | "Resolved",
                              };
                              setSelectedCaseData(updatedCaseData);

                              // Update cases list
                              setCases(
                                cases.map((c) =>
                                  c.id === selectedCaseData.id
                                    ? { ...c, status: newStatus as "Needs Review" | "In Progress" | "Resolved" }
                                    : c
                                )
                              );

                              setEditingStatus(false);
                            } catch (error) {
                              console.error("Error updating status:", error);
                              alert(error instanceof Error ? error.message : "Failed to update status. Please try again.");
                            } finally {
                              setUpdatingStatus(false);
                            }
                          }}
                          disabled={updatingStatus || newStatus === selectedCaseData.status}
                          className="h-8"
                        >
                          {updatingStatus ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingStatus(false);
                            setNewStatus(selectedCaseData.status);
                          }}
                          disabled={updatingStatus}
                          className="h-8"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(selectedCaseData.status)}>
                          {selectedCaseData.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingStatus(true);
                            setNewStatus(selectedCaseData.status);
                          }}
                          className="h-6 px-2 hover:bg-gray-100"
                          title="Change status"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-lg">
                    {selectedCaseData.description}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    ${selectedCaseData.amount.toFixed(2)}
                  </div>
                  {selectedCaseData.alert && (
                    <Badge className="bg-red-100 text-red-800 border-red-300">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {selectedCaseData.alert}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Provider</div>
                  <div className="font-semibold">{selectedCaseData.provider || "Weill Cornell Medicine"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-semibold">{selectedCaseData.date}</div>
                </div>
                {selectedCaseData.dueDate && (
                  <div>
                    <div className="text-sm text-gray-500">Due Date</div>
                    <div className="font-semibold">{selectedCaseData.dueDate}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">Case ID</div>
                  <div className="font-semibold">{selectedCaseData.id}</div>
                </div>
              </div>
              {/* Show action buttons - always show if there are actions available */}
              {((selectedCaseData.type === "Bill" && selectedCaseData.status !== "Resolved") ||
                selectedCaseData.status === "Needs Review" || 
                (selectedCaseData.type === "EOB") ||
                (selectedEOBData?.eob_data?.discrepancies && selectedEOBData.eob_data.discrepancies.length > 0)) && (
                <div className="flex gap-3 mt-4">
                  {selectedCaseData.type === "Bill" && selectedCaseData.status !== "Resolved" && (
                    <Button
                      onClick={() => handlePayBill(selectedCaseData.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Bill
                    </Button>
                  )}
                  {/* Show Appeal button for cases with discrepancies, needs review, or EOB cases */}
                  {(selectedCaseData.status === "Needs Review" || 
                    (selectedCaseData.type === "EOB") ||
                    (selectedEOBData?.eob_data?.discrepancies && selectedEOBData.eob_data.discrepancies.length > 0)) && (
                    <Button
                      onClick={() => handleAppealClaim(selectedCaseData.id)}
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      disabled={generatingAppeal}
                      title="Generate appeal email for this claim"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {generatingAppeal ? "Generating Appeal..." : "Appeal Claim"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appeal Email Modal */}
          {showAppealModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Appeal Email</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAppealModal(false);
                        setAppealEmail(null);
                        setAppealError(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatingAppeal && (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-4" />
                      <p className="text-gray-600">Generating appeal email...</p>
                    </div>
                  )}

                  {appealError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{appealError}</p>
                    </div>
                  )}

                  {appealEmail && !generatingAppeal && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-700">To: <span className="text-red-500">*</span></label>
                        <Input
                          value={appealEmail.recipient || ""}
                          className="mt-1"
                          placeholder="Enter recipient email address (e.g., appeals@insurance.com)"
                          onChange={(e) => {
                            if (appealEmail) {
                              setAppealEmail({
                                ...appealEmail,
                                recipient: e.target.value,
                              });
                            }
                          }}
                          onBlur={(e) => {
                            // Validate email format on blur
                            const email = e.target.value.trim();
                            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                              // Email format is invalid, but we'll let the user know when they try to send
                            }
                          }}
                          title="Enter the email address of the insurance provider's appeals department"
                        />
                        {appealEmail.recipient && !appealEmail.recipient.includes("@") && (
                          <p className="text-xs text-red-500 mt-1">
                            ⚠ Please enter a valid email address (e.g., appeals@insurance.com)
                          </p>
                        )}
                        {appealEmail.recipient && appealEmail.recipient.includes("@") && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Valid email address
                          </p>
                        )}
                        {!appealEmail.recipient && (
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the insurance provider's appeals department email address
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Subject:</label>
                        <Input
                          value={appealEmail.subject || ""}
                          readOnly
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Body:</label>
                        <textarea
                          value={appealEmail.body || ""}
                          readOnly
                          rows={15}
                          className="w-full mt-1 p-3 border border-gray-300 rounded-md font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Key Points:</label>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {appealEmail.key_points?.map((point: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600">
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          onClick={async () => {
                            try {
                              // Copy to clipboard
                              const emailText = `To: ${appealEmail.recipient}\nSubject: ${appealEmail.subject}\n\n${appealEmail.body}`;
                              await navigator.clipboard.writeText(emailText);
                              
                              // Show success message
                              const message = document.createElement("div");
                              message.textContent = "Email copied to clipboard!";
                              message.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50";
                              document.body.appendChild(message);
                              setTimeout(() => {
                                document.body.removeChild(message);
                              }, 2000);
                            } catch (error) {
                              console.error("Failed to copy to clipboard:", error);
                              alert("Failed to copy email. Please select and copy manually.");
                            }
                          }}
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Copy Email
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              setSendingEmail(true);
                              setEmailSent(false);
                              
                              // Validate recipient email
                              const recipientEmail = appealEmail.recipient?.trim() || "";
                              
                              // Check if it's a valid email address
                              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              const isValidEmail = emailRegex.test(recipientEmail);
                              
                              if (!isValidEmail) {
                                setSendingEmail(false);
                                toast.error("Please enter a valid email address in the 'To' field");
                                return;
                              }
                              
                              // Encode email components
                              const subject = encodeURIComponent(appealEmail.subject || "");
                              const body = encodeURIComponent(appealEmail.body || "");
                              
                              // Construct mailto link with all components
                              const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
                              
                              // Try to open email client
                              // Create a temporary anchor element to trigger mailto
                              const link = document.createElement("a");
                              link.href = mailtoLink;
                              link.style.display = "none";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              // Mark as sent after a short delay
                              setTimeout(() => {
                                setEmailSent(true);
                                setSendingEmail(false);
                                toast.success("Email client opened! Please review and send the email.");
                                
                                // Reset sent state after a delay
                                setTimeout(() => {
                                  setEmailSent(false);
                                }, 3000);
                              }, 500);
                              
                            } catch (error) {
                              console.error("Error opening email client:", error);
                              setSendingEmail(false);
                              toast.error("Failed to open email client. Please ensure you have an email client configured, or use the 'Copy Email' button.");
                            }
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={sendingEmail || !appealEmail?.recipient?.includes("@")}
                          title={
                            sendingEmail
                              ? "Opening email client..."
                              : !appealEmail?.recipient?.includes("@")
                              ? "Please enter a valid email address in the 'To' field"
                              : `Send email to ${appealEmail.recipient}`
                          }
                        >
                          {sendingEmail ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Opening...
                            </>
                          ) : emailSent ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Email Opened
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Email
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowAppealModal(false);
                            setAppealEmail(null);
                            setAppealError(null);
                            setEmailSent(false);
                            setSendingEmail(false);
                          }}
                          variant="outline"
                        >
                          Close
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Relevant Documents */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Relevant Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-semibold">{doc.name}</div>
                            <div className="text-sm text-gray-500">
                              {doc.type} • {doc.size} • {doc.date}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No documents available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAuditTrail.length > 0 ? (
                  <div className="space-y-4">
                    {selectedAuditTrail.map((entry, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-purple-600 mt-2" />
                          {index < selectedAuditTrail.length - 1 && (
                            <div className="h-16 w-0.5 bg-gray-200 ml-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {entry.date}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {entry.user}
                            </Badge>
                          </div>
                          <div className="font-medium text-gray-800 mb-1">
                            {entry.action}
                          </div>
                          {entry.details && (
                            <div className="text-sm text-gray-600">
                              {entry.details}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No audit trail available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Services Details */}
          {selectedEOBData && selectedEOBData.eob_data.services && selectedEOBData.eob_data.services.length > 0 && (
            <Card className="mt-6 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-purple-600" />
                  Services ({selectedEOBData.eob_data.services.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedEOBData.eob_data.services.map((service, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{service.service_description}</div>
                          {service.service_date && (
                            <div className="text-sm text-gray-500 mt-1">
                              Date: {service.service_date}
                            </div>
                          )}
                          {(service.cpt_code || service.icd10_code) && (
                            <div className="text-xs text-gray-400 mt-1">
                              {service.cpt_code && `CPT: ${service.cpt_code}`}
                              {service.cpt_code && service.icd10_code && " • "}
                              {service.icd10_code && `ICD-10: ${service.icd10_code}`}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-gray-900">
                            ${service.amount_billed.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Covered: ${service.covered.toFixed(2)}
                          </div>
                          {service.not_covered > 0 && (
                            <div className="text-sm text-red-600">
                              Not Covered: ${service.not_covered.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Coverage Breakdown */}
          {selectedEOBData && selectedEOBData.eob_data.coverage_breakdown && (
            <Card className="mt-6 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  Coverage Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Billed</div>
                    <div className="font-semibold text-lg">
                      ${selectedEOBData.eob_data.coverage_breakdown.total_billed.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Not Covered</div>
                    <div className="font-semibold text-lg text-red-600">
                      ${selectedEOBData.eob_data.coverage_breakdown.total_not_covered.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Benefits Approved</div>
                    <div className="font-semibold text-lg text-green-600">
                      ${selectedEOBData.eob_data.coverage_breakdown.total_benefits_approved.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">You Owe</div>
                    <div className="font-semibold text-lg text-purple-600">
                      ${selectedEOBData.eob_data.coverage_breakdown.amount_you_owe.toFixed(2)}
                    </div>
                  </div>
                  {selectedEOBData.eob_data.coverage_breakdown.total_coinsurance > 0 && (
                    <div>
                      <div className="text-sm text-gray-500">Coinsurance</div>
                      <div className="font-semibold">
                        ${selectedEOBData.eob_data.coverage_breakdown.total_coinsurance.toFixed(2)}
                      </div>
                    </div>
                  )}
                  {selectedEOBData.eob_data.coverage_breakdown.total_deductions > 0 && (
                    <div>
                      <div className="text-sm text-gray-500">Deductions</div>
                      <div className="font-semibold">
                        ${selectedEOBData.eob_data.coverage_breakdown.total_deductions.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
                {selectedEOBData.eob_data.coverage_breakdown.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                      {selectedEOBData.eob_data.coverage_breakdown.notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Alerts and Discrepancies */}
          {selectedEOBData && selectedEOBData.eob_data && 
           ((selectedEOBData.eob_data.alerts && selectedEOBData.eob_data.alerts.length > 0) || 
            (selectedEOBData.eob_data.discrepancies && selectedEOBData.eob_data.discrepancies.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {selectedEOBData.eob_data.alerts && selectedEOBData.eob_data.alerts.length > 0 && (
                <Card className="border-2 border-yellow-200 bg-yellow-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-5 w-5" />
                      Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedEOBData.eob_data.alerts.map((alert, index) => (
                        <li key={index} className="text-sm text-yellow-900">
                          • {alert}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {selectedEOBData.eob_data.discrepancies && selectedEOBData.eob_data.discrepancies.length > 0 && (
                <Card className="border-2 border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      Discrepancies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedEOBData.eob_data.discrepancies.map((discrepancy, index) => (
                        <li key={index} className="text-sm text-red-900">
                          • {discrepancy}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Next Step */}
          {selectedNextStep && (
            <Card className="mt-6 border-2 border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Next Step
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{selectedNextStep}</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster />
      <PatientNavbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700">Case Management</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Case Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Track and manage all your bills, EOBs, and claims in one place. 
            Review cases, track progress, and take action when needed.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filterStatus === "All" ? "default" : "outline"}
            onClick={() => setFilterStatus("All")}
          >
            All Cases
          </Button>
          <Button
            variant={filterStatus === "Needs Review" ? "default" : "outline"}
            onClick={() => setFilterStatus("Needs Review")}
          >
            Needs Review
          </Button>
          <Button
            variant={filterStatus === "In Progress" ? "default" : "outline"}
            onClick={() => setFilterStatus("In Progress")}
          >
            In Progress
          </Button>
          <Button
            variant={filterStatus === "Resolved" ? "default" : "outline"}
            onClick={() => setFilterStatus("Resolved")}
          >
            Resolved
          </Button>
        </div>

        {/* Cases Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>All Cases</CardTitle>
            <CardDescription>
              {cases.length} case{cases.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow
                      key={caseItem.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedCase(caseItem.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(caseItem.type)}
                          <span className="font-medium">{caseItem.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{caseItem.title}</div>
                        <div className="text-sm text-gray-500">
                          {caseItem.description}
                        </div>
                      </TableCell>
                      <TableCell>{caseItem.provider}</TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          ${caseItem.amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(caseItem.status)}>
                          {caseItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{caseItem.date}</TableCell>
                      <TableCell>
                        {caseItem.alert ? (
                          <Badge className="bg-red-100 text-red-800 border-red-300">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {caseItem.alert}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCase(caseItem.id);
                          }}
                        >
                          View
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-4" />
            <p className="text-gray-600">Loading cases...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && cases.length === 0 && (
          <Card className="border-2">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
              <p className="text-gray-600">
                Upload EOB documents to see cases here.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {!loading && cases.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {cases.length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Needs Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {cases.filter((c) => c.status === "Needs Review").length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {cases.filter((c) => c.status === "In Progress").length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  $
                  {cases
                    .reduce((sum, c) => sum + c.amount, 0)
                    .toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}

