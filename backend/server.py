from fastapi import FastAPI, HTTPException, Query, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pymongo import MongoClient
from contextlib import asynccontextmanager
import os
import uuid
from enum import Enum
import asyncio
import threading
import json
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests

# Import authentication
import sys
import os
# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from auth import (
    UserCreate, UserLogin, UserResponse, Token, UserInDB,
    authenticate_user, create_access_token, create_user,
    get_current_user, get_current_active_user, get_admin_user, get_editor_or_admin_user,
    create_initial_admin, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Import the scraper at module level
try:
    import sys
    import os
    # Add current directory to path for imports
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
    
    from upc_scraper import UPCScraper
    from upc_text_parser import UPCTextParser
    SCRAPER_AVAILABLE = True
    TEXT_PARSER_AVAILABLE = True
    print("UPCScraper and UPCTextParser imported successfully")
except ImportError as e:
    SCRAPER_AVAILABLE = False
    TEXT_PARSER_AVAILABLE = False
    print(f"Warning: UPCScraper/UPCTextParser not available: {e}")

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['upc_legal']
cases_collection = db['cases']
documents_collection = db['documents']
upc_texts_collection = db['upc_texts']
users_collection = db['users']
pending_changes_collection = db['pending_changes']
newsletter_collection = db['newsletter']
newsletter_campaigns_collection = db['newsletter_campaigns']
newsletter_subscribers_collection = db['newsletter_subscribers']
settings_collection = db['settings']
permissions_collection = db['permissions']
gdpr_consents_collection = db['gdpr_consents']
gdpr_requests_collection = db['gdpr_requests']
seo_metadata_collection = db['seo_metadata']

# Email service helper
class EmailService:
    def __init__(self):
        self.config = None
        self.enabled = False  # Désactivé par défaut
        self.load_config()
    
    def load_config(self):
        """Load email configuration from settings"""
        try:
            email_settings = settings_collection.find_one({"key": "email_service"})
            if email_settings:
                self.config = email_settings["value"]
                self.enabled = self.config.get("enabled", False)  # Vérifier si activé
        except Exception as e:
            print(f"Email config load error: {e}")
    
    def send_email(self, to_emails: List[str], subject: str, content: str, content_type: str = "html"):
        """Send email using configured service"""
        if not self.enabled:
            print("Email service is disabled")
            return True  # Return True pour ne pas bloquer le système
        
        if not self.config:
            raise Exception("Email service not configured")
        
        service_type = self.config.get("type", "smtp")
        
        if service_type == "sendgrid":
            return self._send_sendgrid(to_emails, subject, content, content_type)
        elif service_type == "mailchimp":
            return self._send_mailchimp(to_emails, subject, content, content_type)
        elif service_type == "smtp":
            return self._send_smtp(to_emails, subject, content, content_type)
        else:
            raise Exception(f"Unknown email service type: {service_type}")
    
    def _send_sendgrid(self, to_emails: List[str], subject: str, content: str, content_type: str):
        """Send email via SendGrid"""
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            sg = sendgrid.SendGridAPIClient(api_key=self.config["api_key"])
            
            for email in to_emails:
                message = Mail(
                    from_email=Email(self.config["from_email"]),
                    to_emails=[To(email)],
                    subject=subject,
                    html_content=content if content_type == "html" else None,
                    plain_text_content=content if content_type == "text" else None
                )
                
                response = sg.send(message)
                print(f"SendGrid response: {response.status_code}")
            
            return True
        except Exception as e:
            print(f"SendGrid error: {e}")
            return False
    
    def _send_mailchimp(self, to_emails: List[str], subject: str, content: str, content_type: str):
        """Send email via Mailchimp"""
        try:
            # Note: Mailchimp Transactional API (Mandrill) implementation
            api_key = self.config["api_key"]
            
            headers = {
                "Content-Type": "application/json"
            }
            
            for email in to_emails:
                data = {
                    "key": api_key,
                    "message": {
                        "html": content if content_type == "html" else None,
                        "text": content if content_type == "text" else None,
                        "subject": subject,
                        "from_email": self.config["from_email"],
                        "from_name": self.config.get("from_name", "UPC Legal"),
                        "to": [{"email": email}]
                    }
                }
                
                response = requests.post(
                    "https://mandrillapp.com/api/1.0/messages/send.json",
                    json=data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    print(f"Mailchimp email sent to {email}")
                else:
                    print(f"Mailchimp error: {response.text}")
            
            return True
        except Exception as e:
            print(f"Mailchimp error: {e}")
            return False
    
    def _send_smtp(self, to_emails: List[str], subject: str, content: str, content_type: str):
        """Send email via SMTP"""
        try:
            smtp_server = smtplib.SMTP(self.config["smtp_host"], self.config["smtp_port"])
            
            if self.config.get("smtp_tls", True):
                smtp_server.starttls()
            
            if self.config.get("smtp_user") and self.config.get("smtp_password"):
                smtp_server.login(self.config["smtp_user"], self.config["smtp_password"])
            
            for email in to_emails:
                message = MIMEMultipart("alternative")
                message["Subject"] = subject
                message["From"] = self.config["from_email"]
                message["To"] = email
                
                part = MIMEText(content, content_type)
                message.attach(part)
                
                smtp_server.sendmail(self.config["from_email"], email, message.as_string())
            
            smtp_server.quit()
            return True
        except Exception as e:
            print(f"SMTP error: {e}")
            return False

# Initialize email service
email_service = EmailService()

# Helper function to detect cross-references in text
def detect_cross_references(text: str) -> List[str]:
    """Detect cross-references in text content"""
    references = []
    
    # Pattern for Rule references (e.g., "Rule 13", "Rule 206.1")
    rule_pattern = r'Rule\s+(\d+(?:\.\d+)?(?:[a-z])?)'
    rule_matches = re.findall(rule_pattern, text, re.IGNORECASE)
    for match in rule_matches:
        references.append(f"Rule {match}")
    
    # Pattern for Article references (e.g., "Article 32", "Article 60 UPCA")
    article_pattern = r'Article\s+(\d+(?:\.\d+)?(?:[a-z])?)'
    article_matches = re.findall(article_pattern, text, re.IGNORECASE)
    for match in article_matches:
        references.append(f"Article {match}")
    
    # Pattern for specific Agreement references
    agreement_pattern = r'Article\s+(\d+(?:\.\d+)?(?:[a-z])?)\s+(?:of\s+the\s+)?(?:Agreement|UPCA)'
    agreement_matches = re.findall(agreement_pattern, text, re.IGNORECASE)
    for match in agreement_matches:
        references.append(f"Article {match} UPCA")
    
    # Pattern for paragraph references within same rule
    paragraph_pattern = r'paragraph\s+(\d+(?:\.\d+)?(?:[a-z])?)'
    paragraph_matches = re.findall(paragraph_pattern, text, re.IGNORECASE)
    for match in paragraph_matches:
        references.append(f"paragraph {match}")
    
    # Remove duplicates and sort
    references = sorted(list(set(references)))
    
    return references

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    
    # Create initial admin user
    create_initial_admin()
    
    # Initialize default settings
    default_settings = [
        {
            "key": "seo_config",
            "value": {
                "default_title": "UPC Legal - Décisions et Ordonnances",
                "default_description": "Recherchez et analysez instantanément les décisions et ordonnances de la Cour Unifiée du Brevet",
                "default_keywords": ["UPC", "brevet", "décisions", "juridique", "cour unifiée"],
                "site_name": "UPC Legal",
                "twitter_handle": "@upc_legal",
                "og_image": "/assets/og-image.jpg",
                "canonical_base_url": "https://upc-legal.com"
            }
        },
        {
            "key": "gdpr_config",
            "value": {
                "enabled": True,
                "privacy_policy_url": "/privacy-policy",
                "cookie_policy_url": "/cookie-policy",
                "data_retention_days": 365,
                "contact_email": "privacy@upc-legal.com",
                "consent_required": True,
                "analytics_tracking": True
            }
        },
        {
            "key": "email_service",
            "value": {
                "enabled": False,  # Désactivé par défaut
                "type": "smtp",
                "smtp_host": "localhost",
                "smtp_port": 587,
                "smtp_tls": True,
                "from_email": "noreply@upc-legal.com",
                "from_name": "UPC Legal",
                "api_key": "",
                "smtp_user": "",
                "smtp_password": ""
            }
        },
        {
            "key": "newsletter_config",
            "value": {
                "enabled": True,
                "double_opt_in": True,
                "welcome_email": True,
                "unsubscribe_url": "/unsubscribe",
                "frequency": "weekly",
                "auto_campaigns": False
            }
        }
    ]
    
    # Insert default settings if they don't exist
    for setting in default_settings:
        existing = settings_collection.find_one({"key": setting["key"]})
        if not existing:
            settings_collection.insert_one({
                **setting,
                "updated_at": datetime.utcnow(),
                "updated_by": "system"
            })
    
    # Create text index for search
    try:
        cases_collection.create_index([("summary", "text"), ("parties", "text"), ("reference", "text")])
        upc_texts_collection.create_index([("title", "text"), ("content", "text"), ("article_number", "text")])
        newsletter_collection.create_index([("subject", "text"), ("content", "text")])
        users_collection.create_index([("email", 1)], unique=True)
    except Exception as e:
        print(f"Index creation warning: {e}")
    
    # Check if we have any cases in the database
    case_count = cases_collection.count_documents({})
    
    # Initialize UPC texts if they don't exist
    upc_text_count = upc_texts_collection.count_documents({})
    if upc_text_count == 0:
        print("No UPC texts found. Loading sample UPC legal texts...")
        sample_upc_texts = [
            {
                "_id": str(uuid.uuid4()),
                "document_type": "upc_agreement",
                "part_number": "1",
                "part_title": "General and Institutional Provisions",
                "chapter_number": None,
                "chapter_title": None,
                "section_number": None,
                "section_title": None,
                "article_number": "Article 32",
                "title": "Competence of the Court",
                "content": "1. The Court shall have exclusive competence in respect of: (a) actions for actual or threatened infringements of patents and supplementary protection certificates and related defences, including counterclaims concerning licences; (b) actions for declarations of non-infringement of patents and supplementary protection certificates; (c) actions for provisional and protective measures and injunctions; (d) actions for revocation of patents and for declaration of invalidity of supplementary protection certificates; (e) counterclaims for revocation of patents and for declaration of invalidity of supplementary protection certificates; (f) actions for damages or compensation derived from the provisional protection conferred by a published European patent application; (g) actions relating to the use of the invention prior to the granting of the patent or to the right based on prior use of the invention; (h) actions for compensation for licences on the basis of Article 8 of Regulation (EU) No 1257/2012.",
                "language": "EN",
                "cross_references": ["Article 33", "Article 34", "Rule 13"],
                "keywords": ["competence", "infringement", "revocation", "provisional measures", "damages"],
                "created_date": "2025-01-11",
                "last_updated": "2025-01-11",
                "is_editable": True
            }
        ]
        
        try:
            upc_texts_collection.insert_many(sample_upc_texts)
            print("Sample UPC legal texts loaded")
        except Exception as e:
            print(f"UPC texts loading warning: {e}")
    else:
        print(f"Database already contains {upc_text_count} UPC legal texts")
    
    if case_count == 0:
        print("No cases found in database. Loading sample data...")
        # Fallback to sample data
        sample_cases = [
            {
                "_id": str(uuid.uuid4()),
                "date": "2025-01-08",
                "type": "Order",
                "registry_number": "App_31860/2025",
                "order_reference": "ORD_32533/2025",
                "court_division": "Court of First Instance - Milan (IT) Local Division",
                "type_of_action": "Generic application",
                "language_of_proceedings": "EN",
                "parties": ["Progress Maschinen & Automation AG", "AWM s.r.l.", "Schnell s.p.a."],
                "summary": "The Milan Local Division, under Judge Pierluigi Perrotti, issued an order in the case between claimant Progress Maschinen & Automation AG and defendants AWM s.r.l. and Schnell s.p.a. regarding patent infringement and counterclaim for patent revocation.",
                "legal_norms": ["Art. 32 UPCA", "Rule 13 RoP"],
                "tags": ["patent infringement", "counterclaim", "revocation"],
                "excluded": False,
                "exclusion_reason": None,
                "documents": [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Download Order (EN)",
                        "url": "/api/documents/sample_order_en.pdf",
                        "language": "EN",
                        "case_id": ""
                    }
                ]
            },
            {
                "_id": str(uuid.uuid4()),
                "date": "2025-01-03",
                "type": "Order",
                "registry_number": "App_28457/2025",
                "order_reference": "ORD_29288/2025",
                "court_division": "Court of First Instance - Munich (DE) Local Division",
                "type_of_action": "Generic application",
                "language_of_proceedings": "DE",
                "parties": ["Renault Deutschland AG", "Renault Retail Group Deutschland GmbH"],
                "summary": "The President of the Court of First Instance in Munich issued an order concerning an application by Renault entities to change the language of proceedings from German to English.",
                "legal_norms": ["Art. 49 UPCA", "Rule 321 RoP"],
                "tags": ["language change", "procedural order"],
                "excluded": False,
                "exclusion_reason": None,
                "documents": [
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Download Order (EN)",
                        "url": "/api/documents/sample_order_de.pdf",
                        "language": "EN",
                        "case_id": ""
                    }
                ]
            }
        ]
        try:
            cases_collection.insert_many(sample_cases)
            print("Sample data loaded as fallback")
        except Exception as e:
            print(f"Sample data loading warning: {e}")
    else:
        print(f"Database already contains {case_count} cases")
    
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(title="UPC Legal API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class CaseType(str, Enum):
    order = "Order"
    decision = "Decision"

class ActionType(str, Enum):
    generic_application = "Generic application"
    patent_infringement = "Patent infringement"
    patent_revocation = "Patent revocation"
    application_rop_223 = "Application Rop 223"
    application_for_costs = "Application For Costs"
    counterclaim_for_revocation = "Counterclaim for revocation"
    appeal_rop220_2 = "Appeal RoP220.2"
    application_for_provisional_measures = "Application for provisional measures"
    appeal_rop220_1 = "Appeal RoP220.1"
    application_rop_265 = "Application Rop 265"
    application_to_leave_to_appeal = "Application to leave to appeal a cost decision (RoP221)"
    application_rop262_1_b = "Application RoP262.1 (b)"
    revocation_action = "Revocation Action"
    application_rop_333 = "Application Rop 333"
    preliminary_objection = "Preliminary objection"
    application_rop_360 = "Application Rop 360"
    generic_order = "Generic Order"
    decision_by_default = "Decision By Default"
    application_rop_365 = "Application Rop 365"

class Language(str, Enum):
    danish = "DA"
    german = "DE"
    english = "EN"
    french = "FR"
    italian = "IT"
    dutch = "NL"

class EmailServiceType(str, Enum):
    smtp = "smtp"
    sendgrid = "sendgrid"
    mailchimp = "mailchimp"

class ConsentType(str, Enum):
    analytics = "analytics"
    marketing = "marketing"
    functional = "functional"
    necessary = "necessary"

class GDPRRequestType(str, Enum):
    access = "access"
    portability = "portability"
    rectification = "rectification"
    erasure = "erasure"
    restriction = "restriction"
    objection = "objection"

# Pydantic models
class DocumentModel(BaseModel):
    id: str
    title: str
    url: str
    language: str
    case_id: str

class ApportModel(BaseModel):
    id: int
    article_number: str
    regulation: str
    citation: str

# Enhanced Newsletter Models
class NewsletterCampaignModel(BaseModel):
    id: str
    title: str
    subject: str
    content: str
    html_content: Optional[str] = None
    template_id: Optional[str] = None
    status: str = "draft"  # draft, scheduled, sent, archived
    recipients_count: int = 0
    sent_count: int = 0
    open_count: int = 0
    click_count: int = 0
    bounce_count: int = 0
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str

class NewsletterCampaignCreateModel(BaseModel):
    title: str
    subject: str
    content: str
    html_content: Optional[str] = None
    template_id: Optional[str] = None
    recipients: List[str] = []
    schedule_at: Optional[datetime] = None

class NewsletterCampaignUpdateModel(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    html_content: Optional[str] = None
    template_id: Optional[str] = None
    recipients: Optional[List[str]] = None
    schedule_at: Optional[datetime] = None

class NewsletterSubscriberModel(BaseModel):
    id: str
    email: str
    status: str = "active"  # active, inactive, bounced, complained
    opt_in_date: datetime
    opt_out_date: Optional[datetime] = None
    source: str = "website"
    metadata: Dict[str, Any] = {}

class NewsletterSubscriptionModel(BaseModel):
    email: EmailStr
    opt_in: bool = True
    source: str = "website"
    metadata: Dict[str, Any] = {}

# Enhanced UPC Legal Text Models
class UPCTextModel(BaseModel):
    id: str
    document_type: str
    part_number: Optional[str] = None
    part_title: Optional[str] = None
    chapter_number: Optional[str] = None
    chapter_title: Optional[str] = None
    section_number: Optional[str] = None
    section_title: Optional[str] = None
    article_number: str
    title: str
    content: str
    language: str = "EN"
    cross_references: List[str] = []
    keywords: List[str] = []
    created_date: str
    last_updated: str
    is_editable: bool = True

class UPCTextCreateModel(BaseModel):
    document_type: str
    part_number: Optional[str] = None
    part_title: Optional[str] = None
    chapter_number: Optional[str] = None
    chapter_title: Optional[str] = None
    section_number: Optional[str] = None
    section_title: Optional[str] = None
    article_number: str
    title: str
    content: str
    language: str = "EN"
    keywords: List[str] = []

class UPCTextUpdateModel(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    keywords: Optional[List[str]] = None

class ROPImportModel(BaseModel):
    overwrite_existing: bool = False
    import_preamble: bool = True
    import_application_rules: bool = True
    import_content: bool = True

class LinkedCaseModel(BaseModel):
    case_id: str
    case_title: str
    parties: List[str]
    date: str
    citation: str
    apport_id: int
    summary: str

class CaseModel(BaseModel):
    id: str
    date: str
    type: CaseType
    registry_number: str
    order_reference: str
    case_number: Optional[str] = None
    court_division: str
    type_of_action: str
    language_of_proceedings: Language
    parties: List[str]
    patent: Optional[str] = None
    legal_norms: List[str] = []
    tags: List[str] = []
    keywords: List[str] = []
    headnotes: Optional[str] = None
    summary: str
    documents: List[DocumentModel] = []
    admin_summary: Optional[str] = None
    apports: Optional[List[ApportModel]] = []
    excluded: bool = False
    exclusion_reason: Optional[str] = None

class CaseUpdateModel(BaseModel):
    admin_summary: Optional[str] = None
    apports: Optional[List[ApportModel]] = None
    excluded: Optional[bool] = None
    exclusion_reason: Optional[str] = None

class CaseExclusionModel(BaseModel):
    excluded: bool
    exclusion_reason: Optional[str] = None

class PendingChangeModel(BaseModel):
    id: str
    case_id: str
    user_id: str
    user_name: str
    change_type: str
    original_data: Dict[str, Any]
    new_data: Dict[str, Any]
    reason: Optional[str] = None
    status: str = 'pending'
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

class NewsletterModel(BaseModel):
    id: str
    subject: str
    content: str
    recipients: List[str]
    created_at: datetime
    sent_at: Optional[datetime] = None
    status: str = 'draft'

class SettingsModel(BaseModel):
    id: str
    key: str
    value: Dict[str, Any]
    updated_at: datetime
    updated_by: str

# Email Service Configuration Models
class EmailServiceConfigModel(BaseModel):
    enabled: bool = False
    type: EmailServiceType
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_tls: bool = True
    api_key: Optional[str] = None
    from_email: str
    from_name: Optional[str] = None

# Permission Models
class PermissionModel(BaseModel):
    id: str
    name: str
    description: str
    resource: str
    action: str
    created_at: datetime
    updated_at: datetime

class RoleModel(BaseModel):
    id: str
    name: str
    description: str
    permissions: List[str]
    created_at: datetime
    updated_at: datetime

class UserPermissionModel(BaseModel):
    user_id: str
    role_id: str
    additional_permissions: List[str] = []
    restrictions: List[str] = []
    created_at: datetime
    updated_at: datetime

# GDPR Models
class GDPRConsentModel(BaseModel):
    id: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    consent_type: ConsentType
    consent_given: bool
    consent_date: datetime
    withdrawal_date: Optional[datetime] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    purpose: str
    lawful_basis: str

class GDPRRequestModel(BaseModel):
    id: str
    user_id: Optional[str] = None
    email: str
    request_type: GDPRRequestType
    description: str
    status: str = "pending"  # pending, in_progress, completed, rejected
    created_at: datetime
    processed_at: Optional[datetime] = None
    processed_by: Optional[str] = None
    response: Optional[str] = None

class GDPRConsentUpdateModel(BaseModel):
    consent_type: ConsentType
    consent_given: bool
    purpose: str
    lawful_basis: str = "consent"

class GDPRDataRequestModel(BaseModel):
    email: str
    request_type: GDPRRequestType
    description: str

# SEO Models
class SEOMetadataModel(BaseModel):
    id: str
    page_path: str
    title: str
    description: str
    keywords: List[str] = []
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    og_type: str = "website"
    twitter_card: str = "summary_large_image"
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    canonical_url: Optional[str] = None
    schema_markup: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

class SEOMetadataCreateModel(BaseModel):
    page_path: str
    title: str
    description: str
    keywords: List[str] = []
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    og_type: str = "website"
    twitter_card: str = "summary_large_image"
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    canonical_url: Optional[str] = None
    schema_markup: Optional[Dict[str, Any]] = None

class SEOMetadataUpdateModel(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[List[str]] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    og_type: Optional[str] = None
    twitter_card: Optional[str] = None
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    canonical_url: Optional[str] = None
    schema_markup: Optional[Dict[str, Any]] = None

# Authentication endpoints
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    """Register a new user"""
    try:
        new_user = create_user(user)
        
        # If user opted in for newsletter, add them to subscribers
        if user.newsletter_opt_in:
            newsletter_subscriber = {
                "_id": str(uuid.uuid4()),
                "email": user.email,
                "status": "active",
                "opt_in_date": datetime.utcnow(),
                "source": "registration",
                "metadata": {
                    "user_id": new_user.id,
                    "username": user.username
                }
            }
            newsletter_subscribers_collection.insert_one(newsletter_subscriber)
        
        return UserResponse(
            id=new_user.id,
            email=new_user.email,
            username=new_user.username,
            role=new_user.role,
            profile=new_user.profile,
            newsletter_opt_in=new_user.newsletter_opt_in,
            created_at=new_user.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin):
    """Login user and return access token"""
    authenticated_user = authenticate_user(user.email, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": authenticated_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        profile=current_user.profile,
        newsletter_opt_in=current_user.newsletter_opt_in,
        created_at=current_user.created_at
    )

# Newsletter endpoints
@app.post("/api/newsletter/subscribe")
async def subscribe_to_newsletter(subscription: NewsletterSubscriptionModel):
    """Subscribe to newsletter"""
    try:
        # Check if already subscribed
        existing = newsletter_subscribers_collection.find_one({"email": subscription.email})
        if existing:
            if existing["status"] == "active":
                return {"message": "Already subscribed", "status": "success"}
            else:
                # Reactivate subscription
                newsletter_subscribers_collection.update_one(
                    {"email": subscription.email},
                    {"$set": {
                        "status": "active",
                        "opt_in_date": datetime.utcnow(),
                        "opt_out_date": None,
                        "source": subscription.source,
                        "metadata": subscription.metadata
                    }}
                )
                return {"message": "Subscription reactivated", "status": "success"}
        
        # Create new subscription
        subscriber = {
            "_id": str(uuid.uuid4()),
            "email": subscription.email,
            "status": "active" if subscription.opt_in else "inactive",
            "opt_in_date": datetime.utcnow() if subscription.opt_in else None,
            "source": subscription.source,
            "metadata": subscription.metadata
        }
        
        newsletter_subscribers_collection.insert_one(subscriber)
        
        return {"message": "Subscribed successfully", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/newsletter/unsubscribe")
async def unsubscribe_from_newsletter(email: EmailStr):
    """Unsubscribe from newsletter"""
    try:
        result = newsletter_subscribers_collection.update_one(
            {"email": email},
            {"$set": {
                "status": "inactive",
                "opt_out_date": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        return {"message": "Unsubscribed successfully", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/newsletter/campaigns")
async def get_newsletter_campaigns(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get newsletter campaigns (admin only)"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        cursor = newsletter_campaigns_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        campaigns = []
        for campaign in cursor:
            campaign["id"] = str(campaign.pop("_id"))
            campaigns.append(campaign)
        return campaigns
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/newsletter/subscribers")
async def get_newsletter_subscribers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get newsletter subscribers (admin only)"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        cursor = newsletter_subscribers_collection.find(query).skip(skip).limit(limit).sort("opt_in_date", -1)
        subscribers = []
        for subscriber in cursor:
            subscriber["id"] = str(subscriber.pop("_id"))
            subscribers.append(subscriber)
        return subscribers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/newsletter/campaigns")
async def create_newsletter_campaign(
    campaign_data: NewsletterCampaignCreateModel,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Create newsletter campaign (admin only)"""
    try:
        campaign_id = str(uuid.uuid4())
        
        # Get recipients count
        recipients_count = 0
        if campaign_data.recipients:
            recipients_count = len(campaign_data.recipients)
        else:
            # Count active subscribers
            recipients_count = newsletter_subscribers_collection.count_documents({"status": "active"})
        
        campaign = {
            "_id": campaign_id,
            "title": campaign_data.title,
            "subject": campaign_data.subject,
            "content": campaign_data.content,
            "html_content": campaign_data.html_content,
            "template_id": campaign_data.template_id,
            "status": "scheduled" if campaign_data.schedule_at else "draft",
            "recipients_count": recipients_count,
            "sent_count": 0,
            "open_count": 0,
            "click_count": 0,
            "bounce_count": 0,
            "scheduled_at": campaign_data.schedule_at,
            "sent_at": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_user.id,
            "updated_by": current_user.id
        }
        
        newsletter_campaigns_collection.insert_one(campaign)
        
        # Return the created campaign
        campaign["id"] = str(campaign.pop("_id"))
        return campaign
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/newsletter/campaigns/{campaign_id}")
async def update_newsletter_campaign(
    campaign_id: str,
    campaign_data: NewsletterCampaignUpdateModel,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Update newsletter campaign (admin only)"""
    try:
        # Check if campaign exists
        existing_campaign = newsletter_campaigns_collection.find_one({"_id": campaign_id})
        if not existing_campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Don't allow editing sent campaigns
        if existing_campaign["status"] == "sent":
            raise HTTPException(status_code=400, detail="Cannot edit sent campaign")
        
        update_data = {
            "updated_at": datetime.utcnow(),
            "updated_by": current_user.id
        }
        
        if campaign_data.title is not None:
            update_data["title"] = campaign_data.title
        if campaign_data.subject is not None:
            update_data["subject"] = campaign_data.subject
        if campaign_data.content is not None:
            update_data["content"] = campaign_data.content
        if campaign_data.html_content is not None:
            update_data["html_content"] = campaign_data.html_content
        if campaign_data.template_id is not None:
            update_data["template_id"] = campaign_data.template_id
        if campaign_data.schedule_at is not None:
            update_data["scheduled_at"] = campaign_data.schedule_at
            update_data["status"] = "scheduled"
        
        newsletter_campaigns_collection.update_one(
            {"_id": campaign_id},
            {"$set": update_data}
        )
        
        # Return updated campaign
        updated_campaign = newsletter_campaigns_collection.find_one({"_id": campaign_id})
        updated_campaign["id"] = str(updated_campaign.pop("_id"))
        return updated_campaign
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/newsletter/campaigns/{campaign_id}/send")
async def send_newsletter_campaign(
    campaign_id: str,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Send newsletter campaign (admin only)"""
    try:
        # Get campaign
        campaign = newsletter_campaigns_collection.find_one({"_id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        if campaign["status"] == "sent":
            raise HTTPException(status_code=400, detail="Campaign already sent")
        
        # Get active subscribers
        subscribers = list(newsletter_subscribers_collection.find({"status": "active"}))
        if not subscribers:
            raise HTTPException(status_code=400, detail="No active subscribers")
        
        # Send emails (only if email service is enabled)
        sent_count = 0
        if email_service.enabled:
            recipient_emails = [sub["email"] for sub in subscribers]
            
            # Send email
            success = email_service.send_email(
                to_emails=recipient_emails,
                subject=campaign["subject"],
                content=campaign["html_content"] or campaign["content"],
                content_type="html" if campaign["html_content"] else "text"
            )
            
            if success:
                sent_count = len(recipient_emails)
        else:
            # Simulate sending (for testing)
            sent_count = len(subscribers)
            print(f"Email service disabled. Would send to {sent_count} recipients")
        
        # Update campaign status
        newsletter_campaigns_collection.update_one(
            {"_id": campaign_id},
            {"$set": {
                "status": "sent",
                "sent_at": datetime.utcnow(),
                "sent_count": sent_count,
                "updated_at": datetime.utcnow(),
                "updated_by": current_user.id
            }}
        )
        
        return {"message": f"Campaign sent to {sent_count} subscribers", "sent_count": sent_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Email service configuration endpoints
@app.get("/api/admin/email-service")
async def get_email_service_config(current_user: UserInDB = Depends(get_admin_user)):
    """Get email service configuration (admin only)"""
    try:
        config = settings_collection.find_one({"key": "email_service"})
        if config:
            return config["value"]
        else:
            return {"enabled": False, "type": "smtp"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/email-service")
async def update_email_service_config(
    config: EmailServiceConfigModel,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Update email service configuration (admin only)"""
    try:
        config_dict = config.dict()
        
        # Update in database
        settings_collection.update_one(
            {"key": "email_service"},
            {"$set": {
                "value": config_dict,
                "updated_at": datetime.utcnow(),
                "updated_by": current_user.id
            }},
            upsert=True
        )
        
        # Reload email service config
        email_service.load_config()
        
        return {"message": "Email service configuration updated", "config": config_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# SEO endpoints
@app.get("/api/seo/metadata")
async def get_seo_metadata(page_path: str = Query(...)):
    """Get SEO metadata for a specific page"""
    try:
        metadata = seo_metadata_collection.find_one({"page_path": page_path})
        if metadata:
            metadata["id"] = str(metadata.pop("_id"))
            return metadata
        else:
            # Return default SEO
            default_seo = settings_collection.find_one({"key": "seo_config"})
            if default_seo:
                return {
                    "title": default_seo["value"]["default_title"],
                    "description": default_seo["value"]["default_description"],
                    "keywords": default_seo["value"]["default_keywords"],
                    "canonical_url": f"{default_seo['value']['canonical_base_url']}{page_path}"
                }
            else:
                return {"title": "UPC Legal", "description": "Legal research platform"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/seo/metadata")
async def create_seo_metadata(
    metadata: SEOMetadataCreateModel,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Create SEO metadata (admin only)"""
    try:
        metadata_id = str(uuid.uuid4())
        
        seo_data = {
            "_id": metadata_id,
            **metadata.dict(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        seo_metadata_collection.insert_one(seo_data)
        
        seo_data["id"] = str(seo_data.pop("_id"))
        return seo_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/seo/metadata/{metadata_id}")
async def update_seo_metadata(
    metadata_id: str,
    metadata: SEOMetadataUpdateModel,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Update SEO metadata (admin only)"""
    try:
        update_data = {
            "updated_at": datetime.utcnow(),
            **{k: v for k, v in metadata.dict().items() if v is not None}
        }
        
        result = seo_metadata_collection.update_one(
            {"_id": metadata_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="SEO metadata not found")
        
        updated_metadata = seo_metadata_collection.find_one({"_id": metadata_id})
        updated_metadata["id"] = str(updated_metadata.pop("_id"))
        return updated_metadata
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/settings")
async def get_all_settings(current_user: UserInDB = Depends(get_admin_user)):
    """Get all settings (admin only)"""
    try:
        settings = list(settings_collection.find({}))
        settings_dict = {}
        for setting in settings:
            settings_dict[setting["key"]] = setting["value"]
        return settings_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Cases endpoints (keeping existing implementation)
@app.get("/api/cases")
async def get_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    case_type: Optional[str] = Query(None),
    court_division: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    excluded: Optional[bool] = Query(None)
):
    """Get cases with optional filtering"""
    try:
        # Build query
        query = {}
        
        if excluded is not None:
            query["excluded"] = excluded
        
        if case_type:
            query["type"] = case_type
        
        if court_division:
            query["court_division"] = {"$regex": court_division, "$options": "i"}
        
        if language:
            query["language_of_proceedings"] = language
        
        if date_from or date_to:
            date_query = {}
            if date_from:
                date_query["$gte"] = date_from
            if date_to:
                date_query["$lte"] = date_to
            query["date"] = date_query
        
        if search:
            query["$text"] = {"$search": search}
        
        # Get cases
        cursor = cases_collection.find(query).skip(skip).limit(limit).sort("date", -1)
        cases = []
        for case in cursor:
            case["id"] = str(case.pop("_id"))
            cases.append(case)
        
        return cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cases/{case_id}")
async def get_case_detail(case_id: str):
    """Get detailed case information"""
    try:
        case = cases_collection.find_one({"_id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        case["id"] = str(case.pop("_id"))
        return case
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    """Get database statistics"""
    try:
        total_cases = cases_collection.count_documents({})
        total_orders = cases_collection.count_documents({"type": "Order"})
        total_decisions = cases_collection.count_documents({"type": "Decision"})
        
        # Get recent cases (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_cases = list(cases_collection.find({
            "date": {"$gte": thirty_days_ago.strftime("%Y-%m-%d")}
        }).sort("date", -1).limit(10))
        
        for case in recent_cases:
            case["id"] = str(case.pop("_id"))
        
        return {
            "total_cases": total_cases,
            "total_orders": total_orders,
            "total_decisions": total_decisions,
            "recent_cases": recent_cases
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPC Text endpoints
@app.get("/api/upc-texts")
async def get_upc_texts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None)
):
    """Get UPC legal texts with optional filtering"""
    try:
        query = {}
        
        if document_type:
            query["document_type"] = document_type
        
        if search:
            query["$text"] = {"$search": search}
        
        cursor = upc_texts_collection.find(query).skip(skip).limit(limit).sort("article_number", 1)
        texts = []
        for text in cursor:
            text["id"] = str(text.pop("_id"))
            texts.append(text)
        
        return texts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/upc-texts/{text_id}")
async def get_upc_text_detail(text_id: str):
    """Get detailed UPC text information"""
    try:
        text = upc_texts_collection.find_one({"_id": text_id})
        if not text:
            raise HTTPException(status_code=404, detail="UPC text not found")
        
        text["id"] = str(text.pop("_id"))
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)