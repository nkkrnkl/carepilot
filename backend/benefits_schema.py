"""
Standardized Schema for Insurance Benefits

This module defines the schema for storing insurance benefits information
in a SQL database. The schema ensures consistency across different insurance providers.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import json

# ==================== BENEFITS SCHEMA ====================

@dataclass
class Deductible:
    """Deductible information"""
    amount: Optional[float] = None
    type: Optional[str] = None  # "individual", "family", "per_person"
    applies_to: Optional[str] = None  # "medical", "dental", "vision", etc.
    annual: bool = True
    network: Optional[str] = None  # "in_network", "out_of_network", "both"
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class Copay:
    """Copay information"""
    amount: Optional[float] = None
    service_type: Optional[str] = None  # "primary_care", "specialist", "emergency", etc.
    network: Optional[str] = None  # "in_network", "out_of_network"
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class Coinsurance:
    """Coinsurance information"""
    percentage: Optional[float] = None  # e.g., 20 for 20%
    applies_to: Optional[str] = None  # "medical", "dental", "vision", etc.
    network: Optional[str] = None  # "in_network", "out_of_network"
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class CoverageLimit:
    """Coverage limit information"""
    limit_type: Optional[str] = None  # "annual", "lifetime", "per_visit", "per_service"
    amount: Optional[float] = None
    applies_to: Optional[str] = None  # "medical", "dental", "vision", etc.
    network: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class ServiceCoverage:
    """Coverage for a specific service type"""
    service_name: str
    covered: bool = True
    requires_preauth: bool = False
    copay: Optional[Copay] = None
    coinsurance: Optional[Coinsurance] = None
    coverage_limit: Optional[CoverageLimit] = None
    notes: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        result = {
            "service_name": self.service_name,
            "covered": self.covered,
            "requires_preauth": self.requires_preauth,
        }
        if self.copay:
            result["copay"] = self.copay.to_dict()
        if self.coinsurance:
            result["coinsurance"] = self.coinsurance.to_dict()
        if self.coverage_limit:
            result["coverage_limit"] = self.coverage_limit.to_dict()
        if self.notes:
            result["notes"] = self.notes
        return result


@dataclass
class InsuranceBenefits:
    """Complete insurance benefits information"""
    # Basic Information
    plan_name: str
    plan_type: Optional[str] = None  # "HMO", "PPO", "EPO", "POS", etc.
    insurance_provider: Optional[str] = None
    policy_number: Optional[str] = None
    group_number: Optional[str] = None
    effective_date: Optional[str] = None
    expiration_date: Optional[str] = None
    
    # Deductibles
    deductibles: List[Deductible] = None
    
    # Copays
    copays: List[Copay] = None
    
    # Coinsurance
    coinsurance: List[Coinsurance] = None
    
    # Coverage Limits
    coverage_limits: List[CoverageLimit] = None
    
    # Service Coverage
    services: List[ServiceCoverage] = None
    
    # Out of Pocket
    out_of_pocket_max_individual: Optional[float] = None
    out_of_pocket_max_family: Optional[float] = None
    
    # Network Information
    in_network_providers: Optional[str] = None
    out_of_network_coverage: bool = False
    network_notes: Optional[str] = None
    
    # Pre-authorization Requirements
    preauth_required_services: List[str] = None
    preauth_notes: Optional[str] = None
    
    # Exclusions
    exclusions: List[str] = None
    exclusion_notes: Optional[str] = None
    
    # Additional Information
    special_programs: List[str] = None  # e.g., "Wellness programs", "Preventive care"
    additional_benefits: Optional[str] = None
    notes: Optional[str] = None
    
    # Metadata
    extracted_date: Optional[str] = None
    source_document_id: Optional[str] = None
    user_id: Optional[str] = None
    
    def __post_init__(self):
        """Initialize empty lists if None"""
        if self.deductibles is None:
            self.deductibles = []
        if self.copays is None:
            self.copays = []
        if self.coinsurance is None:
            self.coinsurance = []
        if self.coverage_limits is None:
            self.coverage_limits = []
        if self.services is None:
            self.services = []
        if self.preauth_required_services is None:
            self.preauth_required_services = []
        if self.exclusions is None:
            self.exclusions = []
        if self.special_programs is None:
            self.special_programs = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = {
            "plan_name": self.plan_name,
        }
        
        # Add optional fields
        if self.plan_type:
            result["plan_type"] = self.plan_type
        if self.insurance_provider:
            result["insurance_provider"] = self.insurance_provider
        if self.policy_number:
            result["policy_number"] = self.policy_number
        if self.group_number:
            result["group_number"] = self.group_number
        if self.effective_date:
            result["effective_date"] = self.effective_date
        if self.expiration_date:
            result["expiration_date"] = self.expiration_date
        
        # Add lists
        result["deductibles"] = [d.to_dict() for d in self.deductibles]
        result["copays"] = [c.to_dict() for c in self.copays]
        result["coinsurance"] = [c.to_dict() for c in self.coinsurance]
        result["coverage_limits"] = [cl.to_dict() for cl in self.coverage_limits]
        result["services"] = [s.to_dict() for s in self.services]
        result["preauth_required_services"] = self.preauth_required_services
        result["exclusions"] = self.exclusions
        result["special_programs"] = self.special_programs
        
        # Add optional fields
        if self.out_of_pocket_max_individual:
            result["out_of_pocket_max_individual"] = self.out_of_pocket_max_individual
        if self.out_of_pocket_max_family:
            result["out_of_pocket_max_family"] = self.out_of_pocket_max_family
        if self.in_network_providers:
            result["in_network_providers"] = self.in_network_providers
        result["out_of_network_coverage"] = self.out_of_network_coverage
        if self.network_notes:
            result["network_notes"] = self.network_notes
        if self.preauth_notes:
            result["preauth_notes"] = self.preauth_notes
        if self.exclusion_notes:
            result["exclusion_notes"] = self.exclusion_notes
        if self.additional_benefits:
            result["additional_benefits"] = self.additional_benefits
        if self.notes:
            result["notes"] = self.notes
        if self.extracted_date:
            result["extracted_date"] = self.extracted_date
        if self.source_document_id:
            result["source_document_id"] = self.source_document_id
        if self.user_id:
            result["user_id"] = self.user_id
        
        return result
    
    def to_sql_insert(self, table_name: str = "insurance_benefits") -> Dict[str, Any]:
        """
        Convert to SQL-ready format
        
        Returns a dictionary with:
        - sql: SQL INSERT statement
        - values: Values for the INSERT statement
        """
        data = self.to_dict()
        
        # Create SQL columns and values
        columns = []
        values = []
        placeholders = []
        
        # Handle JSON fields (lists and complex objects)
        json_fields = [
            "deductibles", "copays", "coinsurance", "coverage_limits",
            "services", "preauth_required_services", "exclusions", "special_programs"
        ]
        
        for key, value in data.items():
            if value is not None:
                columns.append(key)
                if key in json_fields:
                    values.append(json.dumps(value))
                    placeholders.append("?::jsonb")  # PostgreSQL JSONB
                else:
                    values.append(value)
                    placeholders.append("?")
        
        sql = f"""
        INSERT INTO {table_name} ({', '.join(columns)})
        VALUES ({', '.join(placeholders)})
        ON CONFLICT (plan_name, policy_number, user_id) 
        DO UPDATE SET
            {', '.join([f"{col} = EXCLUDED.{col}" for col in columns if col not in ["plan_name", "policy_number", "user_id"]])}
        """
        
        return {
            "sql": sql,
            "values": values,
            "data": data
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'InsuranceBenefits':
        """Create InsuranceBenefits from dictionary"""
        # Ensure plan_name exists (required field)
        plan_name = data.get("plan_name")
        if not plan_name:
            # Try to generate a default plan name
            plan_name = f"Unknown Plan - {data.get('source_document_id', data.get('document_id', 'unknown'))}"
        
        # Parse nested objects with error handling
        deductibles = []
        for d in data.get("deductibles", []):
            try:
                deductibles.append(Deductible(**d))
            except Exception as e:
                print(f"Warning: Failed to parse deductible: {str(e)}")
                continue
        
        copays = []
        for c in data.get("copays", []):
            try:
                copays.append(Copay(**c))
            except Exception as e:
                print(f"Warning: Failed to parse copay: {str(e)}")
                continue
        
        coinsurance = []
        for c in data.get("coinsurance", []):
            try:
                coinsurance.append(Coinsurance(**c))
            except Exception as e:
                print(f"Warning: Failed to parse coinsurance: {str(e)}")
                continue
        
        coverage_limits = []
        for cl in data.get("coverage_limits", []):
            try:
                coverage_limits.append(CoverageLimit(**cl))
            except Exception as e:
                print(f"Warning: Failed to parse coverage limit: {str(e)}")
                continue
        
        services = []
        for s in data.get("services", []):
            try:
                services.append(ServiceCoverage(
                    service_name=s.get("service_name", "unknown"),
                    covered=s.get("covered", True),
                    requires_preauth=s.get("requires_preauth", False),
                    copay=Copay(**s["copay"]) if s.get("copay") else None,
                    coinsurance=Coinsurance(**s["coinsurance"]) if s.get("coinsurance") else None,
                    coverage_limit=CoverageLimit(**s["coverage_limit"]) if s.get("coverage_limit") else None,
                    notes=s.get("notes")
                ))
            except Exception as e:
                print(f"Warning: Failed to parse service: {str(e)}")
                continue
        
        return cls(
            plan_name=plan_name,
            plan_type=data.get("plan_type"),
            insurance_provider=data.get("insurance_provider"),
            policy_number=data.get("policy_number"),
            group_number=data.get("group_number"),
            effective_date=data.get("effective_date"),
            expiration_date=data.get("expiration_date"),
            deductibles=deductibles,
            copays=copays,
            coinsurance=coinsurance,
            coverage_limits=coverage_limits,
            services=services,
            out_of_pocket_max_individual=data.get("out_of_pocket_max_individual"),
            out_of_pocket_max_family=data.get("out_of_pocket_max_family"),
            in_network_providers=data.get("in_network_providers"),
            out_of_network_coverage=data.get("out_of_network_coverage", False),
            network_notes=data.get("network_notes"),
            preauth_required_services=data.get("preauth_required_services", []),
            preauth_notes=data.get("preauth_notes"),
            exclusions=data.get("exclusions", []),
            exclusion_notes=data.get("exclusion_notes"),
            special_programs=data.get("special_programs", []),
            additional_benefits=data.get("additional_benefits"),
            notes=data.get("notes"),
            extracted_date=data.get("extracted_date"),
            source_document_id=data.get("source_document_id"),
            user_id=data.get("user_id")
        )


# ==================== SQL TABLE SCHEMA ====================

SQL_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS insurance_benefits (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50),
    insurance_provider VARCHAR(255),
    policy_number VARCHAR(100),
    group_number VARCHAR(100),
    effective_date DATE,
    expiration_date DATE,
    
    -- Deductibles (JSONB)
    deductibles JSONB,
    
    -- Copays (JSONB)
    copays JSONB,
    
    -- Coinsurance (JSONB)
    coinsurance JSONB,
    
    -- Coverage Limits (JSONB)
    coverage_limits JSONB,
    
    -- Service Coverage (JSONB)
    services JSONB,
    
    -- Out of Pocket
    out_of_pocket_max_individual DECIMAL(10, 2),
    out_of_pocket_max_family DECIMAL(10, 2),
    
    -- Network Information
    in_network_providers TEXT,
    out_of_network_coverage BOOLEAN DEFAULT FALSE,
    network_notes TEXT,
    
    -- Pre-authorization
    preauth_required_services JSONB,
    preauth_notes TEXT,
    
    -- Exclusions
    exclusions JSONB,
    exclusion_notes TEXT,
    
    -- Additional Information
    special_programs JSONB,
    additional_benefits TEXT,
    notes TEXT,
    
    -- Metadata
    extracted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_document_id VARCHAR(255),
    user_id VARCHAR(255),
    
    -- Constraints
    CONSTRAINT unique_plan_user UNIQUE(plan_name, policy_number, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_id ON insurance_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_provider ON insurance_benefits(insurance_provider);
CREATE INDEX IF NOT EXISTS idx_extracted_date ON insurance_benefits(extracted_date);
"""

