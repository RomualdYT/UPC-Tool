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

# Import authentication
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    
    # Create initial admin user
    create_initial_admin()
    
    # Create text index for search
    try:
        cases_collection.create_index([("summary", "text"), ("parties", "text"), ("reference", "text")])
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
                "document_type": "rules_of_procedure",
                "section": "Part I - General Provisions",
                "article_number": "Rule 1",
                "title": "Scope of the Rules",
                "content": "These Rules shall govern the procedure before the Court in accordance with the Agreement and the Statute.",
                "language": "EN",
                "cross_references": ["Rule 2", "Article 1 UPCA"],
                "keywords": ["procedure", "scope", "agreement", "statute"],
                "created_date": "2025-01-11",
                "last_updated": "2025-01-11"
            },
            {
                "_id": str(uuid.uuid4()),
                "document_type": "rules_of_procedure",
                "section": "Part I - General Provisions",
                "article_number": "Rule 2",
                "title": "Definitions",
                "content": "For the purposes of these Rules: (a) 'Agreement' means the Agreement on a Unified Patent Court; (b) 'Statute' means the Statute of the Unified Patent Court; (c) 'Court' means the Unified Patent Court; (d) 'Registry' means the Registry of the Court.",
                "language": "EN",
                "cross_references": ["Rule 1", "Rule 3"],
                "keywords": ["definitions", "agreement", "statute", "court", "registry"],
                "created_date": "2025-01-11",
                "last_updated": "2025-01-11"
            },
            {
                "_id": str(uuid.uuid4()),
                "document_type": "rules_of_procedure",
                "section": "Part II - Proceedings before the Court of First Instance",
                "article_number": "Rule 13",
                "title": "Contents of the Statement of claim",
                "content": "The Statement of claim shall contain: (a) the names of the parties and of their representatives; (b) postal and electronic addresses for service and the names of the persons authorised to accept service; (c) the subject-matter of the dispute and the facts relied on; (d) the evidence relied on; (e) the reasons in fact and law relied on; (f) the order or remedy sought; (g) details of any order sought for provisional measures; (h) an indication of any oral procedure preferred; (i) a list of documents; (j) information on any parallel or related proceedings.",
                "language": "EN",
                "cross_references": ["Rule 14", "Rule 15", "Rule 206"],
                "keywords": ["statement", "claim", "procedure", "evidence", "remedy"],
                "created_date": "2025-01-11",
                "last_updated": "2025-01-11"
            },
            {
                "_id": str(uuid.uuid4()),
                "document_type": "rules_of_procedure",
                "section": "Part VI - Provisional measures",
                "article_number": "Rule 206",
                "title": "Application for provisional measures",
                "content": "1. An Application for provisional measures may be lodged as a separate action or in conjunction with an action on the merits. 2. The Application for provisional measures shall contain the information set out in Rule 13 and, in addition: (a) an indication of the provisional measure sought; (b) the reasons why the provisional measure is needed; (c) the facts and evidence relied on; (d) where appropriate, an indication that the applicant is prepared to provide a security.",
                "language": "EN",
                "cross_references": ["Rule 13", "Rule 207", "Article 60 UPCA"],
                "keywords": ["provisional", "measures", "application", "security", "evidence"],
                "created_date": "2025-01-11",
                "last_updated": "2025-01-11"
            },
            {
                "_id": str(uuid.uuid4()),
                "document_type": "upc_agreement",
                "section": "Part I - General and Institutional Provisions",
                "article_number": "Article 32",
                "title": "Competence of the Court",
                "content": "1. The Court shall have exclusive competence in respect of: (a) actions for actual or threatened infringements of patents and supplementary protection certificates and related defences, including counterclaims concerning licences; (b) actions for declarations of non-infringement of patents and supplementary protection certificates; (c) actions for provisional and protective measures and injunctions; (d) actions for revocation of patents and for declaration of invalidity of supplementary protection certificates; (e) counterclaims for revocation of patents and for declaration of invalidity of supplementary protection certificates; (f) actions for damages or compensation derived from the provisional protection conferred by a published European patent application; (g) actions relating to the use of the invention prior to the granting of the patent or to the right based on prior use of the invention; (h) actions for compensation for licences on the basis of Article 8 of Regulation (EU) No 1257/2012.",
                "language": "EN",
                "cross_references": ["Article 33", "Article 34", "Rule 13"],
                "keywords": ["competence", "infringement", "revocation", "provisional measures", "damages"],
                "created_date": "2025-01-11",
                "last_updated": "2025-01-11"
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

# UPC Legal Text Models
class UPCTextModel(BaseModel):
    id: str
    document_type: str  # "rules_of_procedure", "upc_agreement", "statute", "fees"
    section: str  # "Part I", "Chapter 1", etc.
    article_number: str  # "Rule 1", "Article 3", etc.
    title: str
    content: str
    language: str = "EN"
    cross_references: List[str] = []  # References to other articles
    keywords: List[str] = []
    created_date: str
    last_updated: str

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

class CaseUpdateModel(BaseModel):
    admin_summary: Optional[str] = None
    apports: Optional[List[ApportModel]] = None

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
    language: Optional[Language] = Query(None)
):
    """Get paginated cases with optional filtering"""
    query = {}
    
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
    language: Optional[Language] = Query(None)
):
    """Get total count of cases matching filters"""
    query = {}
    
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
    section: Optional[str] = Query(None),
    language: str = Query("EN")
):
    """Get UPC legal texts with optional filtering"""
    try:
        query = {"language": language}
        if document_type:
            query["document_type"] = document_type
        if section:
            query["section"] = section
        
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
        # Get all document types and their sections
        pipeline = [
            {"$match": {"language": language}},
            {"$group": {
                "_id": "$document_type",
                "sections": {"$addToSet": "$section"},
                "count": {"$sum": 1}
            }}
        ]
        
        result = list(upc_texts_collection.aggregate(pipeline))
        
        structure = {}
        for doc in result:
            structure[doc["_id"]] = {
                "sections": doc["sections"],
                "count": doc["count"]
            }
        
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
