"""
Appeal Email Generation Agent

This agent generates concise, professional appeal emails for EOB discrepancies.
It analyzes the EOB data, identifies discrepancies, and creates a well-structured
appeal letter that can be sent to insurance providers.
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime

from pinecone_store import PineconeVectorStore
from api import K2APIClient
from eob_schema import EOBInfo


class AppealEmailAgent:
    """Agent for generating professional appeal emails"""
    
    def __init__(self, vector_store: Optional[PineconeVectorStore] = None, llm_client: Optional[K2APIClient] = None):
        """
        Initialize the Appeal Email Agent
        
        Args:
            vector_store: PineconeVectorStore instance (optional)
            llm_client: K2APIClient instance (optional)
        """
        self.vector_store = vector_store or PineconeVectorStore()
        self.llm_client = llm_client or K2APIClient()
    
    def generate_appeal_email(
        self,
        eob_data: Dict[str, Any],
        discrepancy_types: Optional[List[str]] = None,
        additional_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a professional appeal email based on EOB data and discrepancies
        
        Args:
            eob_data: EOB data dictionary (from EOBExtractionResult.eob_data)
            discrepancy_types: List of specific discrepancy types to focus on
            additional_context: Any additional context or notes from the user
        
        Returns:
            Dictionary containing:
                - subject: Email subject line
                - body: Email body text
                - recipient: Suggested recipient (insurance provider)
                - key_points: List of key points to include in the appeal
                - suggested_attachments: List of suggested attachments
        """
        print(f"Generating appeal email for claim {eob_data.get('claim_number', 'Unknown')}...")
        
        # Extract key information
        claim_number = eob_data.get("claim_number", "Unknown")
        member_name = eob_data.get("member_name", "Member")
        member_id = eob_data.get("member_id", "")
        insurance_provider = eob_data.get("insurance_provider", "Insurance Provider")
        provider_name = eob_data.get("provider_name", "Provider")
        claim_date = eob_data.get("claim_date", "")
        total_billed = eob_data.get("total_billed", 0.0)
        total_benefits_approved = eob_data.get("total_benefits_approved", 0.0)
        amount_you_owe = eob_data.get("amount_you_owe", 0.0)
        discrepancies = eob_data.get("discrepancies", [])
        alerts = eob_data.get("alerts", [])
        services = eob_data.get("services", [])
        
        print(f"  Found {len(discrepancies)} discrepancies: {discrepancies}")
        print(f"  Discrepancy types provided: {discrepancy_types}")
        print(f"  Services count: {len(services)}")
        
        # Use "Weill Cornell Medicine" as default provider name
        if not provider_name or provider_name == "Unknown":
            provider_name = "Weill Cornell Medicine"
        
        # Determine discrepancy types if not provided
        if not discrepancy_types:
            print("  No discrepancy types provided, identifying from discrepancies...")
            discrepancy_types = self._identify_discrepancy_types(discrepancies, eob_data)
            print(f"  Identified discrepancy types: {discrepancy_types}")
        else:
            print(f"  Using provided discrepancy types: {discrepancy_types}")
        
        # Build context for the LLM
        context = self._build_appeal_context(
            eob_data=eob_data,
            discrepancy_types=discrepancy_types,
            additional_context=additional_context
        )
        
        # Generate the appeal email
        email_content = self._generate_email_with_llm(context)
        
        # Build subject line with member name, member ID, and claim number (required format)
        subject = email_content.get("subject", "")
        
        # Ensure subject line includes all required information: member name, member ID, claim number
        if not subject:
            subject = f"Appeal Request - {member_name} - Member ID: {member_id} - Claim: {claim_number}"
        else:
            # Validate that subject has all required fields
            has_member_name = member_name.lower() in subject.lower() if member_name != "Member" else True
            has_member_id = member_id in subject if member_id else True
            has_claim_number = claim_number in subject if claim_number != "Unknown" else True
            
            if not (has_member_name and has_member_id and has_claim_number):
                # Rebuild subject with required format
                subject = f"Appeal Request - {member_name} - Member ID: {member_id} - Claim: {claim_number}"
        
        # Get insurance provider name (should come from SQL database in production)
        # For now, use the insurance_provider from EOB data
        insurance_provider_name = insurance_provider
        if not insurance_provider_name or insurance_provider_name == "":
            # Try to get from plan_name or other fields
            insurance_provider_name = eob_data.get("plan_name") or "Insurance Provider"
        
        # Format the response (removed suggested_attachments as per requirements)
        result = {
            "subject": subject,
            "body": email_content.get("body", ""),
            "recipient": insurance_provider_name,
            "key_points": email_content.get("key_points", discrepancy_types),
            "metadata": {
                "claim_number": claim_number,
                "member_name": member_name,
                "member_id": member_id,
                "generated_date": datetime.now().isoformat(),
                "discrepancy_types": discrepancy_types,
                "insurance_provider": insurance_provider_name,
            }
        }
        
        print(f"✅ Appeal email generated successfully")
        return result
    
    def _identify_discrepancy_types(self, discrepancies: List[str], eob_data: Dict[str, Any]) -> List[str]:
        """Identify and categorize discrepancy types"""
        types = []
        
        # Analyze discrepancies
        discrepancy_text = " ".join(discrepancies).lower()
        
        if "duplicate" in discrepancy_text:
            types.append("Duplicate Charges")
        
        if "mismatch" in discrepancy_text or "amount" in discrepancy_text:
            types.append("Amount Discrepancy")
        
        if "service" in discrepancy_text:
            types.append("Service Coding Issue")
        
        # Check for common issues
        total_billed = eob_data.get("total_billed", 0.0)
        total_approved = eob_data.get("total_benefits_approved", 0.0)
        
        if total_billed > 0 and total_approved == 0:
            types.append("Complete Denial")
        elif total_approved < total_billed * 0.5:
            types.append("Underpayment")
        
        # Check for high amounts
        if eob_data.get("amount_you_owe", 0.0) > 1000:
            types.append("High Amount Owed")
        
        # Default if no specific types identified
        if not types:
            types.append("Billing Discrepancy")
        
        return types
    
    def _build_appeal_context(
        self,
        eob_data: Dict[str, Any],
        discrepancy_types: List[str],
        additional_context: Optional[str]
    ) -> str:
        """Build context string for the LLM"""
        
        # Identify overcharged services (where not_covered > 0 or amount is high relative to covered)
        services = eob_data.get("services", [])
        overcharged_services = []
        for service in services:
            amount_billed = service.get("amount_billed", 0.0)
            covered = service.get("covered", 0.0)
            not_covered = service.get("not_covered", 0.0)
            
            # Consider overcharged if not_covered > 0 or if covered amount is significantly less than billed
            if not_covered > 0 or (amount_billed > 0 and covered < amount_billed * 0.5):
                overcharged_services.append({
                    "description": service.get("service_description", "Unknown"),
                    "date": service.get("service_date", "Unknown"),
                    "amount_billed": amount_billed,
                    "covered": covered,
                    "not_covered": not_covered,
                    "overcharge_amount": not_covered if not_covered > 0 else amount_billed - covered
                })
        
        context = f"""You are generating a professional, concise appeal email for an insurance claim dispute.

**Claim Information:**
- Claim Number: {eob_data.get("claim_number", "Unknown")}
- Member Name: {eob_data.get("member_name", "Unknown")}
- Member ID: {eob_data.get("member_id", "N/A")}
- Group Number: {eob_data.get("group_number", "N/A")}
- Insurance Provider: {eob_data.get("insurance_provider", "Unknown")}
- Provider Name: {eob_data.get("provider_name", "Unknown")}
- Claim Date: {eob_data.get("claim_date", "Unknown")}

**Financial Summary:**
- Total Billed: ${eob_data.get("total_billed", 0.0):.2f}
- Total Benefits Approved: ${eob_data.get("total_benefits_approved", 0.0):.2f}
- Amount You Owe: ${eob_data.get("amount_you_owe", 0.0):.2f}

**Discrepancy Types Identified:**
{chr(10).join(f"- {dt}" for dt in discrepancy_types)}

**Specific Discrepancies:**
{chr(10).join(f"- {d}" for d in eob_data.get("discrepancies", [])) if eob_data.get("discrepancies") else "- No specific discrepancies listed"}

**Overcharged Services:**
"""
        
        if overcharged_services:
            for i, service in enumerate(overcharged_services, 1):
                context += f"""
Service {i} - {service['description']}:
- Service Date: {service['date']}
- Amount Billed: ${service['amount_billed']:.2f}
- Amount Covered: ${service['covered']:.2f}
- Amount Not Covered/Overcharged: ${service['overcharge_amount']:.2f}
"""
        else:
            context += "- No overcharged services identified\n"
        
        # Add all services for context
        context += "\n**All Services:**\n"
        for i, service in enumerate(services, 1):
            context += f"""Service {i}:
- Description: {service.get("service_description", "Unknown")}
- Date: {service.get("service_date", "Unknown")}
- Amount Billed: ${service.get("amount_billed", 0.0):.2f}
- Covered: ${service.get("covered", 0.0):.2f}
- Not Covered: ${service.get("not_covered", 0.0):.2f}
"""
        
        if additional_context:
            context += f"\n**Additional Context from User:**\n{additional_context}\n"
        
        return context
    
    def _generate_email_with_llm(self, context: str) -> Dict[str, Any]:
        """Generate appeal email using LLM"""
        
        system_prompt = """You are a professional healthcare billing specialist who writes clear, concise, and professional appeal letters to insurance companies.

Your task is to generate a professional appeal email that:
1. Is concise and to the point (3-4 paragraphs maximum)
2. Clearly states the issue and what is being appealed
3. Provides specific claim information and amounts
4. Specifically outlines the types of discrepancies found (if any)
5. Specifically lists the types of services that were overcharged (if any)
6. References the insurance provider name
7. Requests a review and correction
8. Maintains a professional, respectful tone
9. Includes a clear call to action

Return ONLY a JSON object with the following structure:
{
  "subject": "Appeal Request - [MEMBER_NAME] - Member ID: [MEMBER_ID] - Claim: [CLAIM_NUMBER]",
  "body": "Professional email body text here...",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"]
}

Do NOT include any reasoning, explanations, or markdown formatting. Return ONLY the JSON object."""
        
        user_prompt = f"""{context}

**Instructions:**
Generate a professional appeal email based on the information above.

**Subject Line Requirements:**
- Must include: Member's full name, Member ID, and Claim Number
- Format: "Appeal Request - [Member Name] - Member ID: [Member ID] - Claim: [Claim Number]"

**Email Body Requirements:**
- Address the email to the Insurance Provider (use the Insurance Provider name from the claim information)
- Be professional and respectful
- Clearly state the claim number, member name, and member ID in the opening
- Specifically outline each type of discrepancy identified (list them clearly)
- Specifically list the types of services that were overcharged (mention service descriptions and overcharge amounts)
- Explain why these discrepancies/overcharges are incorrect
- Request a review and correction
- Include specific amounts and dates
- Be 3-4 paragraphs maximum
- Do NOT mention attachments in the email body
- ALWAYS close the email with a polite and professional closing such as "Sincerely," "Thank you for your attention to this matter," or "I appreciate your prompt review of this appeal," followed by the member's name

**Key Points:**
- List the main issues: discrepancy types and overcharged services
- Include specific amounts and claim information

Return ONLY the JSON object with subject, body, and key_points."""
        
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ]
        
        # Call LLM
        response = self.llm_client.chat(messages)
        
        if not response or "choices" not in response:
            raise Exception("Failed to get response from LLM")
        
        # Extract JSON from response
        content = response["choices"][0]["message"]["content"]
        json_text = self._extract_json(content)
        
        try:
            email_content = json.loads(json_text)
            # Ensure email body ends with a polite closing
            email_content = self._ensure_polite_closing(email_content, context)
        except json.JSONDecodeError as e:
            # Fallback: create a basic email structure
            print(f"Warning: Failed to parse JSON from LLM, using fallback: {str(e)}")
            email_content = self._create_fallback_email(context)
        
        return email_content
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from text (may be in markdown code blocks)"""
        import re
        
        # Strategy 1: Look for JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # Strategy 2: Look for JSON object directly
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        return text
    
    def _ensure_polite_closing(self, email_content: Dict[str, Any], context: str) -> Dict[str, Any]:
        """Ensure the email body ends with a polite and professional closing"""
        import re
        
        body = email_content.get("body", "")
        if not body:
            return email_content
        
        # Extract member name from context
        member_match = re.search(r'Member Name: ([^\n]+)', context)
        member_name = member_match.group(1).strip() if member_match else "Member"
        
        # Common polite closings
        polite_closings = [
            "sincerely",
            "thank you for your attention",
            "i appreciate your prompt review",
            "thank you for your time",
            "respectfully",
            "best regards",
        ]
        
        # Check if body already ends with a polite closing
        body_lower = body.lower().strip()
        ends_with_closing = any(body_lower.endswith(closing) or closing in body_lower[-100:].lower() for closing in polite_closings)
        ends_with_member_name = body_lower.endswith(member_name.lower().strip())
        
        # If the body doesn't end with a polite closing, add one
        if not ends_with_closing or not ends_with_member_name:
            # Remove any trailing whitespace
            body = body.rstrip()
            
            # Check the last few lines for existing closing
            last_lines = body.split('\n')[-5:] if len(body.split('\n')) >= 5 else body.split('\n')
            last_text = ' '.join(last_lines).lower()
            
            # If it doesn't have a polite closing, add one
            if not any(closing in last_text for closing in polite_closings):
                # Add a polite closing if not present
                if not body.endswith('\n'):
                    body += '\n'
                body += f"\nThank you for your attention to this matter. I look forward to your prompt review and resolution.\n\nSincerely,\n{member_name}"
            elif not ends_with_member_name:
                # Has a closing but not the member name - check if it's just missing the name
                if not body.endswith(member_name):
                    body += f"\n{member_name}"
        
        email_content["body"] = body
        return email_content
    
    def _create_fallback_email(self, context: str) -> Dict[str, Any]:
        """Create a fallback email if LLM fails"""
        import re
        # Extract basic info from context
        claim_match = re.search(r'Claim Number: ([^\n]+)', context)
        claim_number = claim_match.group(1) if claim_match else "Unknown"
        
        member_match = re.search(r'Member Name: ([^\n]+)', context)
        member_name = member_match.group(1) if member_match else "Member"
        
        member_id_match = re.search(r'Member ID: ([^\n]+)', context)
        member_id = member_id_match.group(1) if member_id_match else "N/A"
        
        insurance_provider_match = re.search(r'Insurance Provider: ([^\n]+)', context)
        insurance_provider = insurance_provider_match.group(1) if insurance_provider_match else "Insurance Provider"
        
        # Extract discrepancies
        discrepancies = []
        discrepancy_section = re.search(r'\*\*Specific Discrepancies:\*\*(.*?)(?=\*\*|$)', context, re.DOTALL)
        if discrepancy_section:
            discrepancy_lines = [line.strip() for line in discrepancy_section.group(1).split('\n') if line.strip() and line.strip().startswith('-')]
            discrepancies = [line.replace('-', '').strip() for line in discrepancy_lines]
        
        # Extract overcharged services
        overcharged_services = []
        overcharged_section = re.search(r'\*\*Overcharged Services:\*\*(.*?)(?=\*\*|$)', context, re.DOTALL)
        if overcharged_section:
            service_lines = [line.strip() for line in overcharged_section.group(1).split('\n') if 'Service' in line and 'Description' not in line]
            for line in service_lines:
                if 'Service' in line and '-' in line:
                    service_desc = re.search(r'Service \d+ - ([^:]+):', line)
                    if service_desc:
                        overcharged_services.append(service_desc.group(1))
        
        # Build email body
        body_parts = [
            f"Dear {insurance_provider},",
            "",
            f"I am writing to appeal the decision regarding claim {claim_number} for {member_name} (Member ID: {member_id}). After reviewing the Explanation of Benefits, I have identified the following issues that require your review:",
            ""
        ]
        
        if discrepancies:
            body_parts.append("**Discrepancies Identified:**")
            for disc in discrepancies[:5]:  # Limit to 5 most important
                body_parts.append(f"- {disc}")
            body_parts.append("")
        
        if overcharged_services:
            body_parts.append("**Overcharged Services:**")
            for service in overcharged_services[:5]:  # Limit to 5 most important
                body_parts.append(f"- {service}")
            body_parts.append("")
        
        body_parts.extend([
            "I request that you review these discrepancies and overcharges and reconsider the coverage determination. I believe there may have been errors in the processing of this claim.",
            "",
            "Thank you for your attention to this matter. I look forward to your prompt review and resolution.",
            "",
            "Sincerely,",
            member_name
        ])
        
        return {
            "subject": f"Appeal Request - {member_name} - Member ID: {member_id} - Claim: {claim_number}",
            "body": "\n".join(body_parts),
            "key_points": [
                f"Claim {claim_number} for {member_name}",
                "Discrepancies identified" if discrepancies else "Billing issues identified",
                "Overcharged services" if overcharged_services else "Service billing issues"
            ]
        }

