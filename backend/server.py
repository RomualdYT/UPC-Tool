from fastapi import FastAPI, HTTPException, Query, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
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
upc_texts_collection = db['upc_texts']  # New collection for UPC legal texts
users_collection = db['users']
pending_changes_collection = db['pending_changes']  # For editor changes pending approval
newsletter_collection = db['newsletter']  # For newsletter management
settings_collection = db['settings']  # For system settings

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
    
    # Create text index for search
    try:
        cases_collection.create_index([("summary", "text"), ("parties", "text"), ("reference", "text")])
        upc_texts_collection.create_index([("title", "text"), ("content", "text"), ("article_number", "text")])
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

# Enhanced UPC Legal Text Models
class UPCTextModel(BaseModel):
    id: str
    document_type: str  # "rules_of_procedure", "upc_agreement", "statute", "fees"
    part_number: Optional[str] = None
    part_title: Optional[str] = None
    chapter_number: Optional[str] = None
    chapter_title: Optional[str] = None
    section_number: Optional[str] = None
    section_title: Optional[str] = None
    article_number: str  # "Rule 1", "Article 3", etc.
    title: str
    content: str
    language: str = "EN"
    cross_references: List[str] = []  # References to other articles
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
    type_of_action: str  # Changed from ActionType enum to simple string
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
    change_type: str  # 'admin_summary', 'apports', 'case_update'
    original_data: Dict[str, Any]
    new_data: Dict[str, Any]
    reason: Optional[str] = None
    status: str = 'pending'  # 'pending', 'approved', 'rejected'
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
    status: str = 'draft'  # 'draft', 'sent'

class SettingsModel(BaseModel):
    id: str
    key: str
    value: Dict[str, Any]
    updated_at: datetime
    updated_by: str

# Authentication endpoints
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    """Register a new user"""
    try:
        new_user = create_user(user)
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

# API endpoints
@app.get("/")
async def root():
    return {"message": "UPC Legal API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/cases", response_model=List[CaseModel])
async def get_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    case_type: Optional[CaseType] = Query(None),
    court_division: Optional[str] = Query(None),
    language: Optional[Language] = Query(None),
    include_excluded: bool = Query(False)
):
    """Get paginated cases with optional filtering"""
    query = {}
    
    # By default, exclude excluded cases for public access
    if not include_excluded:
        query["excluded"] = {"$ne": True}
    
    # Text search
    if search:
        query["$text"] = {"$search": search}
    
    # Date range filter
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        query["date"] = date_filter
    
    # Other filters
    if case_type:
        query["type"] = case_type
    if court_division:
        query["court_division"] = {"$regex": court_division, "$options": "i"}
    if language:
        query["language_of_proceedings"] = language
    
    try:
        cursor = cases_collection.find(query).skip(skip).limit(limit)
        cases = []
        for case in cursor:
            # Convert ObjectId to string for serialization
            case["id"] = str(case.pop("_id"))
            cases.append(case)
        return cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cases/count")
async def get_cases_count(
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    case_type: Optional[CaseType] = Query(None),
    court_division: Optional[str] = Query(None),
    language: Optional[Language] = Query(None),
    include_excluded: bool = Query(False)
):
    """Get total count of cases matching filters"""
    query = {}
    
    # By default, exclude excluded cases for public access
    if not include_excluded:
        query["excluded"] = {"$ne": True}
    
    if search:
        query["$text"] = {"$search": search}
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        query["date"] = date_filter
    if case_type:
        query["type"] = case_type
    if court_division:
        query["court_division"] = {"$regex": court_division, "$options": "i"}
    if language:
        query["language_of_proceedings"] = language
    
    try:
        count = cases_collection.count_documents(query)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cases/{case_id}", response_model=CaseModel)
async def get_case(case_id: str):
    """Get a specific case by ID"""
    try:
        case = cases_collection.find_one({"_id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Convert ObjectId to string for serialization
        case["id"] = str(case.pop("_id"))
        return case
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/cases/{case_id}")
async def update_case(case_id: str, case_update: CaseUpdateModel):
    """Update a case with administrative data"""
    try:
        # Check if case exists
        case = cases_collection.find_one({"_id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Prepare update data
        update_data = {}
        if case_update.admin_summary is not None:
            update_data["admin_summary"] = case_update.admin_summary
        if case_update.apports is not None:
            update_data["apports"] = [apport.dict() for apport in case_update.apports]
        if case_update.excluded is not None:
            update_data["excluded"] = case_update.excluded
        if case_update.exclusion_reason is not None:
            update_data["exclusion_reason"] = case_update.exclusion_reason
        
        # Update the case
        result = cases_collection.update_one(
            {"_id": case_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        # Return updated case
        updated_case = cases_collection.find_one({"_id": case_id})
        updated_case["id"] = str(updated_case.pop("_id"))
        return updated_case
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoints
@app.get("/api/admin/cases", response_model=List[CaseModel])
async def get_admin_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    case_type: Optional[CaseType] = Query(None),
    court_division: Optional[str] = Query(None),
    language: Optional[Language] = Query(None),
    excluded_only: bool = Query(False),
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get cases for admin (including excluded ones)"""
    query = {}
    
    # Filter for excluded cases only if requested
    if excluded_only:
        query["excluded"] = True
    
    # Text search
    if search:
        query["$text"] = {"$search": search}
    
    # Date range filter
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        query["date"] = date_filter
    
    # Other filters
    if case_type:
        query["type"] = case_type
    if court_division:
        query["court_division"] = {"$regex": court_division, "$options": "i"}
    if language:
        query["language_of_proceedings"] = language
    
    try:
        cursor = cases_collection.find(query).skip(skip).limit(limit)
        cases = []
        for case in cursor:
            case["id"] = str(case.pop("_id"))
            cases.append(case)
        return cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/cases/{case_id}/exclude")
async def exclude_case(
    case_id: str, 
    exclusion_data: CaseExclusionModel,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Exclude or include a case (admin only)"""
    try:
        # Check if case exists
        case = cases_collection.find_one({"_id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Update exclusion status
        update_data = {
            "excluded": exclusion_data.excluded,
            "exclusion_reason": exclusion_data.exclusion_reason if exclusion_data.excluded else None
        }
        
        result = cases_collection.update_one(
            {"_id": case_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        # Return updated case
        updated_case = cases_collection.find_one({"_id": case_id})
        updated_case["id"] = str(updated_case.pop("_id"))
        return updated_case
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/cases/excluded")
async def get_excluded_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get all excluded cases (admin only)"""
    try:
        query = {"excluded": True}
        cursor = cases_collection.find(query).skip(skip).limit(limit)
        cases = []
        for case in cursor:
            case["id"] = str(case.pop("_id"))
            cases.append(case)
        return cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Pending changes endpoints (for editor workflow)
@app.post("/api/editor/changes/submit")
async def submit_change(
    case_id: str,
    case_update: CaseUpdateModel,
    reason: Optional[str] = None,
    current_user: UserInDB = Depends(get_editor_or_admin_user)
):
    """Submit a change for approval (editors) or apply directly (admins)"""
    try:
        # Check if case exists
        case = cases_collection.find_one({"_id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # If user is admin, apply changes directly
        if current_user.role == "admin":
            update_data = {}
            if case_update.admin_summary is not None:
                update_data["admin_summary"] = case_update.admin_summary
            if case_update.apports is not None:
                update_data["apports"] = [apport.dict() for apport in case_update.apports]
            if case_update.excluded is not None:
                update_data["excluded"] = case_update.excluded
            if case_update.exclusion_reason is not None:
                update_data["exclusion_reason"] = case_update.exclusion_reason
            
            # Update the case
            result = cases_collection.update_one(
                {"_id": case_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise HTTPException(status_code=400, detail="No changes made")
            
            # Return updated case
            updated_case = cases_collection.find_one({"_id": case_id})
            updated_case["id"] = str(updated_case.pop("_id"))
            return updated_case
        
        # If user is editor, submit for approval
        else:
            change_id = str(uuid.uuid4())
            pending_change = {
                "_id": change_id,
                "case_id": case_id,
                "user_id": current_user.id,
                "user_name": current_user.username,
                "change_type": "case_update",
                "original_data": {
                    "admin_summary": case.get("admin_summary"),
                    "apports": case.get("apports", []),
                    "excluded": case.get("excluded", False),
                    "exclusion_reason": case.get("exclusion_reason")
                },
                "new_data": case_update.dict(),
                "reason": reason,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "reviewed_at": None,
                "reviewed_by": None
            }
            
            pending_changes_collection.insert_one(pending_change)
            
            return {
                "message": "Change submitted for approval",
                "change_id": change_id
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/pending-changes")
async def get_pending_changes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get all pending changes (admin only)"""
    try:
        query = {"status": "pending"}
        cursor = pending_changes_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        changes = []
        for change in cursor:
            change["id"] = str(change.pop("_id"))
            changes.append(change)
        return changes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/pending-changes/{change_id}/approve")
async def approve_change(
    change_id: str,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Approve a pending change (admin only)"""
    try:
        # Get the pending change
        change = pending_changes_collection.find_one({"_id": change_id})
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        
        if change["status"] != "pending":
            raise HTTPException(status_code=400, detail="Change already processed")
        
        # Apply the change to the case
        case_id = change["case_id"]
        new_data = change["new_data"]
        
        update_data = {}
        if new_data.get("admin_summary") is not None:
            update_data["admin_summary"] = new_data["admin_summary"]
        if new_data.get("apports") is not None:
            update_data["apports"] = new_data["apports"]
        if new_data.get("excluded") is not None:
            update_data["excluded"] = new_data["excluded"]
        if new_data.get("exclusion_reason") is not None:
            update_data["exclusion_reason"] = new_data["exclusion_reason"]
        
        # Update the case
        result = cases_collection.update_one(
            {"_id": case_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Failed to update case")
        
        # Update the pending change status
        pending_changes_collection.update_one(
            {"_id": change_id},
            {"$set": {
                "status": "approved",
                "reviewed_at": datetime.utcnow(),
                "reviewed_by": current_user.id
            }}
        )
        
        return {"message": "Change approved and applied"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/pending-changes/{change_id}/reject")
async def reject_change(
    change_id: str,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Reject a pending change (admin only)"""
    try:
        # Get the pending change
        change = pending_changes_collection.find_one({"_id": change_id})
        if not change:
            raise HTTPException(status_code=404, detail="Change not found")
        
        if change["status"] != "pending":
            raise HTTPException(status_code=400, detail="Change already processed")
        
        # Update the pending change status
        pending_changes_collection.update_one(
            {"_id": change_id},
            {"$set": {
                "status": "rejected",
                "reviewed_at": datetime.utcnow(),
                "reviewed_by": current_user.id
            }}
        )
        
        return {"message": "Change rejected"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Newsletter endpoints
@app.get("/api/admin/newsletter/subscribers")
async def get_newsletter_subscribers(
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get newsletter subscribers (admin only)"""
    try:
        # Get users who opted in for newsletter
        users = users_collection.find({"newsletter_opt_in": True})
        subscribers = []
        for user in users:
            subscribers.append({
                "id": str(user["_id"]),
                "email": user["email"],
                "username": user["username"],
                "profile": user.get("profile"),
                "created_at": user["created_at"]
            })
        return subscribers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/newsletter/send")
async def send_newsletter(
    newsletter_data: Dict[str, Any],
    current_user: UserInDB = Depends(get_admin_user)
):
    """Send newsletter to subscribers (admin only)"""
    try:
        # This is a placeholder - you would integrate with actual email service
        # For now, just store the newsletter in the database
        newsletter_id = str(uuid.uuid4())
        newsletter = {
            "_id": newsletter_id,
            "subject": newsletter_data.get("subject", ""),
            "content": newsletter_data.get("content", ""),
            "recipients": newsletter_data.get("recipients", []),
            "created_at": datetime.utcnow(),
            "sent_at": datetime.utcnow(),
            "status": "sent",
            "created_by": current_user.id
        }
        
        newsletter_collection.insert_one(newsletter)
        
        return {
            "message": "Newsletter sent successfully",
            "newsletter_id": newsletter_id,
            "recipients_count": len(newsletter_data.get("recipients", []))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Settings endpoints
@app.get("/api/admin/settings")
async def get_settings(
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get system settings (admin only)"""
    try:
        settings = settings_collection.find({})
        settings_dict = {}
        for setting in settings:
            settings_dict[setting["key"]] = setting["value"]
        return settings_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/settings/{key}")
async def update_setting(
    key: str,
    value: Dict[str, Any],
    current_user: UserInDB = Depends(get_admin_user)
):
    """Update a system setting (admin only)"""
    try:
        setting = {
            "key": key,
            "value": value,
            "updated_at": datetime.utcnow(),
            "updated_by": current_user.id
        }
        
        result = settings_collection.update_one(
            {"key": key},
            {"$set": setting},
            upsert=True
        )
        
        return {"message": f"Setting '{key}' updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced UPC/JUB Code Management endpoints
@app.get("/api/admin/upc-texts", response_model=List[UPCTextModel])
async def get_upc_texts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get UPC legal texts (admin only)"""
    try:
        query = {}
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}},
                {"article_number": {"$regex": search, "$options": "i"}},
                {"part_title": {"$regex": search, "$options": "i"}},
                {"chapter_title": {"$regex": search, "$options": "i"}},
                {"section_title": {"$regex": search, "$options": "i"}}
            ]
        
        if document_type:
            query["document_type"] = document_type
        
        cursor = upc_texts_collection.find(query).skip(skip).limit(limit)
        texts = []
        for text in cursor:
            text["id"] = str(text.pop("_id"))
            texts.append(text)
        return texts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/upc-texts")
async def create_upc_text(
    text_data: UPCTextCreateModel,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Create a new UPC legal text (admin only)"""
    try:
        text_dict = text_data.dict()
        text_dict["_id"] = str(uuid.uuid4())
        text_dict["created_date"] = datetime.utcnow().isoformat()
        text_dict["last_updated"] = datetime.utcnow().isoformat()
        text_dict["is_editable"] = True
        
        # Detect cross-references automatically
        text_dict["cross_references"] = detect_cross_references(text_dict["content"])
        
        result = upc_texts_collection.insert_one(text_dict)
        
        # Return the created text
        created_text = upc_texts_collection.find_one({"_id": text_dict["_id"]})
        created_text["id"] = str(created_text.pop("_id"))
        return created_text
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/upc-texts/{text_id}")
async def update_upc_text(
    text_id: str,
    text_data: UPCTextUpdateModel,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Update a UPC legal text (admin only)"""
    try:
        # Check if text exists and is editable
        existing_text = upc_texts_collection.find_one({"_id": text_id})
        if not existing_text:
            raise HTTPException(status_code=404, detail="Text not found")
        
        if not existing_text.get("is_editable", True):
            raise HTTPException(status_code=400, detail="This text is not editable")
        
        update_dict = {}
        if text_data.title is not None:
            update_dict["title"] = text_data.title
        if text_data.content is not None:
            update_dict["content"] = text_data.content
            # Update cross-references automatically when content changes
            update_dict["cross_references"] = detect_cross_references(text_data.content)
        if text_data.keywords is not None:
            update_dict["keywords"] = text_data.keywords
        
        update_dict["last_updated"] = datetime.utcnow().isoformat()
        
        result = upc_texts_collection.update_one(
            {"_id": text_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Text not found")
        
        # Return the updated text
        updated_text = upc_texts_collection.find_one({"_id": text_id})
        updated_text["id"] = str(updated_text.pop("_id"))
        return updated_text
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/upc-texts/{text_id}")
async def delete_upc_text(
    text_id: str,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Delete a UPC legal text (admin only)"""
    try:
        # Check if text exists and is editable
        existing_text = upc_texts_collection.find_one({"_id": text_id})
        if not existing_text:
            raise HTTPException(status_code=404, detail="Text not found")
        
        if not existing_text.get("is_editable", True):
            raise HTTPException(status_code=400, detail="This text cannot be deleted")
        
        result = upc_texts_collection.delete_one({"_id": text_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Text not found")
        
        return {"message": "Text deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/upc-texts/delete-by-type")
async def delete_upc_texts_by_type(
    delete_data: Dict[str, str],
    current_user: UserInDB = Depends(get_admin_user)
):
    """Delete all texts of a specific document type"""
    try:
        document_type = delete_data.get("document_type")
        if not document_type:
            raise HTTPException(status_code=400, detail="document_type is required")
        
        # Count texts before deletion
        count_before = upc_texts_collection.count_documents({"document_type": document_type})
        
        if count_before == 0:
            return {"message": f"No texts found for type '{document_type}'", "deleted_count": 0}
        
        # Delete all texts of the specified type
        result = upc_texts_collection.delete_many({"document_type": document_type})
        
        deleted_count = result.deleted_count
        
        return {
            "message": f"Successfully deleted {deleted_count} texts of type '{document_type}'",
            "deleted_count": deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting UPC texts by type: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ROP Import endpoint
@app.post("/api/admin/import-rop")
async def import_rop_data(
    import_params: ROPImportModel,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Import Rules of Procedure from JSON file (admin only)"""
    try:
        # Path to the ROP JSON file
        rop_file_path = os.path.join(os.path.dirname(__file__), "Ressources", "rop.json")
        
        if not os.path.exists(rop_file_path):
            raise HTTPException(status_code=404, detail="ROP JSON file not found")
        
        # Load the JSON data
        with open(rop_file_path, 'r', encoding='utf-8') as f:
            rop_data = json.load(f)
        
        imported_count = 0
        skipped_count = 0
        
        # Clear existing Rules of Procedure if overwrite is requested
        if import_params.overwrite_existing:
            upc_texts_collection.delete_many({"document_type": "rules_of_procedure"})
        
        # Import preamble
        if import_params.import_preamble and "preamble" in rop_data:
            preamble_content = "\n".join(rop_data["preamble"])
            preamble_doc = {
                "_id": str(uuid.uuid4()),
                "document_type": "rules_of_procedure",
                "part_number": None,
                "part_title": None,
                "chapter_number": None,
                "chapter_title": None,
                "section_number": None,
                "section_title": None,
                "article_number": "Preamble",
                "title": "Preamble to the Rules of Procedure",
                "content": preamble_content,
                "language": "EN",
                "cross_references": detect_cross_references(preamble_content),
                "keywords": ["preamble", "principles", "procedure", "court"],
                "created_date": datetime.utcnow().isoformat(),
                "last_updated": datetime.utcnow().isoformat(),
                "is_editable": True
            }
            upc_texts_collection.insert_one(preamble_doc)
            imported_count += 1
        
        # Import application and interpretation rules
        if import_params.import_application_rules and "application_and_interpretation" in rop_data:
            app_content = "\n".join(rop_data["application_and_interpretation"])
            app_doc = {
                "_id": str(uuid.uuid4()),
                "document_type": "rules_of_procedure",
                "part_number": None,
                "part_title": None,
                "chapter_number": None,
                "chapter_title": None,
                "section_number": None,
                "section_title": None,
                "article_number": "Application and Interpretation",
                "title": "Application of the Rules and General Principles of Interpretation",
                "content": app_content,
                "language": "EN",
                "cross_references": detect_cross_references(app_content),
                "keywords": ["application", "interpretation", "rules", "principles"],
                "created_date": datetime.utcnow().isoformat(),
                "last_updated": datetime.utcnow().isoformat(),
                "is_editable": True
            }
            upc_texts_collection.insert_one(app_doc)
            imported_count += 1
        
        # Import structured content
        if import_params.import_content and "content" in rop_data:
            for part in rop_data["content"]:
                part_number = part.get("part_number")
                part_title = part.get("part_title")
                
                for chapter in part.get("chapters", []):
                    chapter_number = chapter.get("chapter_number")
                    chapter_title = chapter.get("chapter_title")
                    
                    for section in chapter.get("sections", []):
                        section_number = section.get("section_number")
                        section_title = section.get("section_title")
                        
                        for rule in section.get("rules", []):
                            rule_number = rule.get("rule_number")
                            rule_title = rule.get("rule_title")
                            
                            # Combine rule content with paragraphs
                            content_parts = []
                            if rule_title:
                                content_parts.append(rule_title)
                            
                            paragraphs = rule.get("paragraphs", [])
                            if paragraphs:
                                content_parts.extend(paragraphs)
                            
                            rule_content = "\n".join(content_parts)
                            
                            # Skip if content is empty
                            if not rule_content.strip():
                                skipped_count += 1
                                continue
                            
                            # Check if rule already exists (if not overwriting)
                            if not import_params.overwrite_existing:
                                existing = upc_texts_collection.find_one({
                                    "document_type": "rules_of_procedure",
                                    "article_number": f"Rule {rule_number}"
                                })
                                if existing:
                                    skipped_count += 1
                                    continue
                            
                            rule_doc = {
                                "_id": str(uuid.uuid4()),
                                "document_type": "rules_of_procedure",
                                "part_number": part_number,
                                "part_title": part_title,
                                "chapter_number": chapter_number,
                                "chapter_title": chapter_title,
                                "section_number": section_number,
                                "section_title": section_title,
                                "article_number": f"Rule {rule_number}",
                                "title": rule_title or f"Rule {rule_number}",
                                "content": rule_content,
                                "language": "EN",
                                "cross_references": detect_cross_references(rule_content),
                                "keywords": [
                                    "rule", "procedure", 
                                    part_title.lower() if part_title else "",
                                    chapter_title.lower() if chapter_title else "",
                                    section_title.lower() if section_title else ""
                                ],
                                "created_date": datetime.utcnow().isoformat(),
                                "last_updated": datetime.utcnow().isoformat(),
                                "is_editable": True
                            }
                            
                            # Clean up empty keywords
                            rule_doc["keywords"] = [k for k in rule_doc["keywords"] if k.strip()]
                            
                            upc_texts_collection.insert_one(rule_doc)
                            imported_count += 1
        
        return {
            "message": "ROP data imported successfully",
            "imported_count": imported_count,
            "skipped_count": skipped_count,
            "total_processed": imported_count + skipped_count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing ROP data: {str(e)}")

# User Management and Permissions endpoints
@app.get("/api/admin/users")
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get users (admin only)"""
    try:
        query = {}
        
        if search:
            query["$or"] = [
                {"username": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        if role:
            query["role"] = role
        
        cursor = users_collection.find(query).skip(skip).limit(limit)
        users = []
        for user in cursor:
            user["id"] = str(user.pop("_id"))
            user.pop("hashed_password", None)  # Don't return password
            users.append(user)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_data: Dict[str, str],
    current_user: UserInDB = Depends(get_admin_user)
):
    """Update user role (admin only)"""
    try:
        new_role = role_data.get("role")
        if new_role not in ["user", "editor", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        result = users_collection.update_one(
            {"_id": user_id},
            {"$set": {"role": new_role, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": f"User role updated to {new_role}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Delete a user (admin only)"""
    try:
        # Prevent admin from deleting themselves
        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
        result = users_collection.delete_one({"_id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Footer Management endpoint
@app.get("/api/admin/footer")
async def get_footer_content(
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get footer content (admin only)"""
    try:
        footer_setting = settings_collection.find_one({"key": "footer"})
        if footer_setting:
            return footer_setting["value"]
        return {"content": "", "links": [], "social_media": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/footer")
async def update_footer_content(
    footer_data: Dict[str, Any],
    current_user: UserInDB = Depends(get_admin_user)
):
    """Update footer content (admin only)"""
    try:
        setting = {
            "key": "footer",
            "value": footer_data,
            "updated_at": datetime.utcnow(),
            "updated_by": current_user.id
        }
        
        result = settings_collection.update_one(
            {"key": "footer"},
            {"$set": setting},
            upsert=True
        )
        
        return {"message": "Footer updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Public footer endpoint
@app.get("/api/footer")
async def get_public_footer():
    """Get public footer content"""
    try:
        footer_setting = settings_collection.find_one({"key": "footer"})
        if footer_setting:
            return footer_setting["value"]
        return {"content": "Powered by Romulus 2 - Advanced UPC Legal Analysis", "links": [], "social_media": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPC Synchronization endpoint
@app.post("/api/admin/sync-upc")
async def sync_upc_data(
    sync_params: Dict[str, Any],
    current_user: UserInDB = Depends(get_admin_user)
):
    """Synchronize UPC data (admin only)"""
    try:
        if not SCRAPER_AVAILABLE:
            raise HTTPException(status_code=503, detail="UPC scraper not available")
        
        # This would normally trigger the UPC synchronization process
        # For now, we'll just return a success message
        return {
            "message": "UPC synchronization started",
            "status": "in_progress",
            "sync_id": str(uuid.uuid4())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/sync-status/{sync_id}")
async def get_sync_status(
    sync_id: str,
    current_user: UserInDB = Depends(get_admin_user)
):
    """Get UPC synchronization status (admin only)"""
    try:
        # This would normally check the status of the sync process
        # For now, we'll return a mock status
        return {
            "sync_id": sync_id,
            "status": "completed",
            "progress": 100,
            "cases_processed": 150,
            "cases_added": 25,
            "cases_updated": 10,
            "last_sync": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/filters")
async def get_filters():
    """Get available filter options"""
    try:
        court_divisions = cases_collection.distinct("court_division")
        languages = cases_collection.distinct("language_of_proceedings")
        tags = cases_collection.distinct("tags")
        
        return {
            "court_divisions": court_divisions,
            "languages": languages,
            "tags": tags,
            "case_types": [e.value for e in CaseType],
            "action_types": [e.value for e in ActionType]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sync/upc-texts")
async def sync_official_upc_texts(background_tasks: BackgroundTasks):
    """Load official UPC texts from PDFs"""
    try:
        # Check if text parser is available
        if not TEXT_PARSER_AVAILABLE:
            raise HTTPException(status_code=500, detail="UPC Text Parser not available")
        
        # Initialize parser with MongoDB connection
        mongodb_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
        parser = UPCTextParser(mongodb_url)
        
        # Start parsing in background
        def load_texts():
            try:
                print("Starting official UPC texts loading...")
                texts = parser.load_official_texts()
                print(f"Official texts loading completed. {len(texts)} texts processed.")
            except Exception as e:
                print(f"Error during official texts loading: {e}")
        
        # Add the parsing task to background tasks
        background_tasks.add_task(load_texts)
        
        return {"message": "Official UPC texts loading started - this may take a few minutes"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sync/upc")
async def sync_upc_data(background_tasks: BackgroundTasks):
    """Sync data with UPC website - scrapes all available pages"""
    try:
        # Check if scraper is available
        if not SCRAPER_AVAILABLE:
            raise HTTPException(status_code=500, detail="UPC Scraper not available")
        
        # Initialize scraper with MongoDB connection
        mongodb_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
        scraper = UPCScraper(mongodb_url)
        
        # Start scraping in background
        def run_scraper():
            try:
                print("Starting UPC scraper...")
                count = scraper.update_database()
                print(f"Scraping completed. {count} decisions processed.")
            except Exception as e:
                print(f"Error during scraping: {e}")
        
        # Add the scraping task to background tasks
        background_tasks.add_task(run_scraper)
        
        return {"message": "UPC data sync started - will scrape all available pages"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sync/status")
async def get_sync_status():
    """Get sync status information"""
    try:
        total_cases = cases_collection.count_documents({})
        last_sync = cases_collection.find_one(
            sort=[("_id", -1)]
        )
        
        return {
            "total_cases": total_cases,
            "last_sync": last_sync.get("date") if last_sync else None,
            "database_status": "connected"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_statistics():
    """Get database statistics"""
    try:
        stats = {
            "total_cases": cases_collection.count_documents({}),
            "case_types": list(cases_collection.distinct("type")),
            "court_divisions": list(cases_collection.distinct("court_division")),
            "languages": list(cases_collection.distinct("language_of_proceedings")),
            "recent_cases": cases_collection.count_documents({
                "date": {"$gte": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")}
            })
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPC Legal Texts Endpoints
@app.get("/api/upc-texts")
async def get_upc_texts(
    document_type: Optional[str] = Query(None),
    part_number: Optional[str] = Query(None),
    chapter_number: Optional[str] = Query(None),
    section_number: Optional[str] = Query(None),
    language: str = Query("EN"),
    search: Optional[str] = Query(None)
):
    """Get UPC legal texts with optional filtering"""
    try:
        query = {"language": language}
        
        if document_type:
            query["document_type"] = document_type
        if part_number:
            query["part_number"] = part_number
        if chapter_number:
            query["chapter_number"] = chapter_number
        if section_number:
            query["section_number"] = section_number
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}},
                {"article_number": {"$regex": search, "$options": "i"}}
            ]
        
        texts = list(upc_texts_collection.find(query).sort("article_number", 1))
        for text in texts:
            text["id"] = str(text.pop("_id"))
        
        return texts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/upc-texts/structure")
async def get_upc_structure(language: str = Query("EN")):
    """Get the hierarchical structure of UPC texts"""
    try:
        # Get all document types and their structure
        pipeline = [
            {"$match": {"language": language}},
            {"$group": {
                "_id": {
                    "document_type": "$document_type",
                    "part_number": "$part_number",
                    "part_title": "$part_title",
                    "chapter_number": "$chapter_number",
                    "chapter_title": "$chapter_title",
                    "section_number": "$section_number",
                    "section_title": "$section_title"
                },
                "rules": {"$push": {
                    "id": {"$toString": "$_id"},
                    "article_number": "$article_number",
                    "title": "$title"
                }},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.part_number": 1, "_id.chapter_number": 1, "_id.section_number": 1}}
        ]
        
        result = list(upc_texts_collection.aggregate(pipeline))
        
        # Organize into hierarchical structure
        structure = {}
        for doc in result:
            doc_type = doc["_id"]["document_type"]
            if doc_type not in structure:
                structure[doc_type] = {"parts": {}, "total_count": 0}
            
            part_num = doc["_id"]["part_number"]
            if part_num:
                if part_num not in structure[doc_type]["parts"]:
                    structure[doc_type]["parts"][part_num] = {
                        "title": doc["_id"]["part_title"],
                        "chapters": {},
                        "count": 0
                    }
                
                chapter_num = doc["_id"]["chapter_number"]
                if chapter_num:
                    if chapter_num not in structure[doc_type]["parts"][part_num]["chapters"]:
                        structure[doc_type]["parts"][part_num]["chapters"][chapter_num] = {
                            "title": doc["_id"]["chapter_title"],
                            "sections": {},
                            "count": 0
                        }
                    
                    section_num = doc["_id"]["section_number"]
                    if section_num:
                        structure[doc_type]["parts"][part_num]["chapters"][chapter_num]["sections"][section_num] = {
                            "title": doc["_id"]["section_title"],
                            "rules": doc["rules"],
                            "count": doc["count"]
                        }
                        structure[doc_type]["parts"][part_num]["chapters"][chapter_num]["count"] += doc["count"]
                    else:
                        structure[doc_type]["parts"][part_num]["chapters"][chapter_num]["rules"] = doc["rules"]
                        structure[doc_type]["parts"][part_num]["chapters"][chapter_num]["count"] += doc["count"]
                    
                    structure[doc_type]["parts"][part_num]["count"] += doc["count"]
                else:
                    structure[doc_type]["parts"][part_num]["rules"] = doc["rules"]
                    structure[doc_type]["parts"][part_num]["count"] += doc["count"]
            else:
                # Direct rules under document type
                if "rules" not in structure[doc_type]:
                    structure[doc_type]["rules"] = []
                structure[doc_type]["rules"].extend(doc["rules"])
                structure[doc_type]["direct_count"] = doc["count"]
            
            structure[doc_type]["total_count"] += doc["count"]
        
        return structure
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/upc-texts/{text_id}")
async def get_upc_text(text_id: str):
    """Get a specific UPC legal text"""
    try:
        text = upc_texts_collection.find_one({"_id": text_id})
        if not text:
            raise HTTPException(status_code=404, detail="Text not found")
        
        text["id"] = str(text.pop("_id"))
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/upc-texts/{text_id}/linked-cases")
async def get_linked_cases(text_id: str):
    """Get cases linked to a specific UPC text through apports"""
    try:
        # Get the text first
        text = upc_texts_collection.find_one({"_id": text_id})
        if not text:
            raise HTTPException(status_code=404, detail="Text not found")
        
        # Find cases that have apports referencing this article
        article_number = text.get("article_number", "")
        
        # Search for cases with apports that reference this article
        cases_with_apports = cases_collection.find({
            "apports": {
                "$elemMatch": {
                    "article_number": {"$regex": article_number, "$options": "i"}
                }
            }
        })
        
        linked_cases = []
        for case in cases_with_apports:
            # Find the relevant apports for this article
            relevant_apports = [
                apport for apport in case.get("apports", []) 
                if article_number.lower() in apport.get("article_number", "").lower()
            ]
            
            for apport in relevant_apports:
                linked_cases.append({
                    "case_id": str(case["_id"]),
                    "case_title": case.get("reference", ""),
                    "parties": case.get("parties", []),
                    "date": case.get("date", ""),
                    "citation": apport.get("citation", ""),
                    "apport_id": apport.get("id", 0),
                    "summary": case.get("summary", "")
                })
        
        return linked_cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)