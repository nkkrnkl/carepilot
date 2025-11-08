"""
EOB (Explanation of Benefits) Schema

This module defines the data structures for EOB information extracted from PDF documents.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


# ==================== EOB DATA STRUCTURES ====================

@dataclass
class ServiceDetail:
    """Service detail from EOB"""
    service_description: str
    service_date: str  # YYYY-MM-DD format
    amount_billed: float
    not_covered: float
    covered: float
    cpt_code: Optional[str] = None
    icd10_code: Optional[str] = None


@dataclass
class CoverageBreakdown:
    """Coverage breakdown from EOB"""
    total_billed: float
    total_not_covered: float
    total_covered_before_deductions: float
    total_coinsurance: float
    total_deductions: float
    total_benefits_approved: float
    amount_you_owe: float
    notes: Optional[str] = None


@dataclass
class EOBInfo:
    """Complete EOB information"""
    # Required fields (no defaults) - must come first
    member_name: str
    claim_number: str
    provider_name: str
    total_billed: float
    total_benefits_approved: float
    amount_you_owe: float
    
    # Optional fields (with defaults) - must come after required fields
    member_address: Optional[str] = None
    member_id: Optional[str] = None
    group_number: Optional[str] = None
    claim_date: Optional[str] = None  # YYYY-MM-DD format
    provider_npi: Optional[str] = None
    
    # Service Details
    services: List[ServiceDetail] = field(default_factory=list)
    
    # Coverage Breakdown
    coverage_breakdown: Optional[CoverageBreakdown] = None
    
    # Additional Information
    insurance_provider: Optional[str] = None
    plan_name: Optional[str] = None
    policy_number: Optional[str] = None
    
    # Alerts and Flags
    alerts: List[str] = field(default_factory=list)
    discrepancies: List[str] = field(default_factory=list)
    
    # Metadata
    extracted_date: Optional[str] = None
    source_document_id: Optional[str] = None
    user_id: Optional[str] = None
    
    def __post_init__(self):
        """Initialize empty lists if None"""
        if self.services is None:
            self.services = []
        if self.alerts is None:
            self.alerts = []
        if self.discrepancies is None:
            self.discrepancies = []
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'EOBInfo':
        """Create EOBInfo from dictionary"""
        # Parse service details
        services = []
        for s in data.get("services", []):
            try:
                services.append(ServiceDetail(**s))
            except Exception as e:
                print(f"Warning: Failed to parse service: {str(e)}")
                continue
        
        # Parse coverage breakdown
        coverage_breakdown = None
        if data.get("coverage_breakdown"):
            try:
                coverage_breakdown = CoverageBreakdown(**data["coverage_breakdown"])
            except Exception as e:
                print(f"Warning: Failed to parse coverage breakdown: {str(e)}")
        
        return cls(
            # Required fields
            member_name=data.get("member_name", "Unknown"),
            claim_number=data.get("claim_number", "Unknown"),
            provider_name=data.get("provider_name", "Unknown"),
            total_billed=data.get("total_billed", 0.0),
            total_benefits_approved=data.get("total_benefits_approved", 0.0),
            amount_you_owe=data.get("amount_you_owe", 0.0),
            # Optional fields
            member_address=data.get("member_address"),
            member_id=data.get("member_id"),
            group_number=data.get("group_number"),
            claim_date=data.get("claim_date"),
            provider_npi=data.get("provider_npi"),
            services=services,
            coverage_breakdown=coverage_breakdown,
            insurance_provider=data.get("insurance_provider"),
            plan_name=data.get("plan_name"),
            policy_number=data.get("policy_number"),
            alerts=data.get("alerts", []),
            discrepancies=data.get("discrepancies", []),
            extracted_date=data.get("extracted_date"),
            source_document_id=data.get("source_document_id"),
            user_id=data.get("user_id")
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert EOBInfo to dictionary"""
        result = {
            "member_name": self.member_name,
            "member_address": self.member_address,
            "member_id": self.member_id,
            "group_number": self.group_number,
            "claim_number": self.claim_number,
            "claim_date": self.claim_date,
            "provider_name": self.provider_name,
            "provider_npi": self.provider_npi,
            "total_billed": self.total_billed,
            "total_benefits_approved": self.total_benefits_approved,
            "amount_you_owe": self.amount_you_owe,
            "services": [
                {
                    "service_description": s.service_description,
                    "service_date": s.service_date,
                    "amount_billed": s.amount_billed,
                    "not_covered": s.not_covered,
                    "covered": s.covered,
                    "cpt_code": s.cpt_code,
                    "icd10_code": s.icd10_code
                }
                for s in self.services
            ],
            "alerts": self.alerts,
            "discrepancies": self.discrepancies,
            "insurance_provider": self.insurance_provider,
            "plan_name": self.plan_name,
            "policy_number": self.policy_number,
        }
        
        if self.coverage_breakdown:
            result["coverage_breakdown"] = {
                "total_billed": self.coverage_breakdown.total_billed,
                "total_not_covered": self.coverage_breakdown.total_not_covered,
                "total_covered_before_deductions": self.coverage_breakdown.total_covered_before_deductions,
                "total_coinsurance": self.coverage_breakdown.total_coinsurance,
                "total_deductions": self.coverage_breakdown.total_deductions,
                "total_benefits_approved": self.coverage_breakdown.total_benefits_approved,
                "amount_you_owe": self.coverage_breakdown.amount_you_owe,
                "notes": self.coverage_breakdown.notes
            }
        
        if self.extracted_date:
            result["extracted_date"] = self.extracted_date
        if self.source_document_id:
            result["source_document_id"] = self.source_document_id
        if self.user_id:
            result["user_id"] = self.user_id
        
        return result
    
    def to_case_format(self) -> Dict[str, Any]:
        """
        Convert EOBInfo to case format for the cases page
        
        Returns:
            Dictionary with case information for the UI
        """
        # Determine status based on amount owed and alerts
        status = "Resolved"
        if self.amount_you_owe > 0:
            status = "Needs Review"
        if self.discrepancies:
            status = "In Progress"
        if not self.claim_date:
            status = "In Progress"  # If no date, mark as in progress
        
        # Determine alert
        alert = None
        if self.amount_you_owe > 1000:
            alert = "High amount"
        elif self.discrepancies:
            alert = "Discrepancy found"
        elif self.alerts:
            alert = self.alerts[0]  # Use first alert
        
        # Use "Weill Cornell Medicine" as default provider name
        provider_name = self.provider_name or "Weill Cornell Medicine"
        
        # Build title
        title = f"{self.insurance_provider or 'Insurance'} - Explanation of Benefits"
        if provider_name and provider_name != "Unknown":
            title = f"{self.insurance_provider or 'Insurance'} - EOB for {provider_name}"
        
        # Use current date if claim_date is not available
        from datetime import datetime
        claim_date = self.claim_date or datetime.now().strftime("%Y-%m-%d")
        
        return {
            "id": f"eob-{self.claim_number}",
            "type": "EOB",
            "title": title,
            "amount": float(self.amount_you_owe),
            "status": status,
            "date": claim_date,
            "dueDate": None,  # EOBs typically don't have due dates
            "alert": alert,
            "provider": provider_name,
            "description": f"EOB for claim {self.claim_number}",
            "claim_number": self.claim_number,
            "total_billed": float(self.total_billed),
            "total_benefits_approved": float(self.total_benefits_approved),
            "services_count": len(self.services),
            "member_name": self.member_name,
            "group_number": self.group_number,
            "member_id": self.member_id
        }


# ==================== SQL TABLE SCHEMA ====================

EOB_TABLE_SCHEMA = """
CREATE TABLE IF NOT EXISTS eob_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    claim_number VARCHAR(255) NOT NULL,
    member_name VARCHAR(255) NOT NULL,
    member_address TEXT,
    member_id VARCHAR(255),
    group_number VARCHAR(255),
    claim_date DATE,
    provider_name VARCHAR(255) NOT NULL,
    provider_npi VARCHAR(255),
    total_billed DECIMAL(10, 2) NOT NULL,
    total_benefits_approved DECIMAL(10, 2) NOT NULL,
    amount_you_owe DECIMAL(10, 2) NOT NULL,
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    coverage_breakdown JSONB,
    insurance_provider VARCHAR(255),
    plan_name VARCHAR(255),
    policy_number VARCHAR(255),
    alerts JSONB DEFAULT '[]'::jsonb,
    discrepancies JSONB DEFAULT '[]'::jsonb,
    source_document_id VARCHAR(255),
    extracted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_claim_user UNIQUE(claim_number, user_id)
);

CREATE INDEX IF NOT EXISTS idx_eob_user_id ON eob_records(user_id);
CREATE INDEX IF NOT EXISTS idx_eob_claim_number ON eob_records(claim_number);
CREATE INDEX IF NOT EXISTS idx_eob_claim_date ON eob_records(claim_date);
CREATE INDEX IF NOT EXISTS idx_eob_provider ON eob_records(provider_name);
"""

