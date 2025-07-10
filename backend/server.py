from fastapi import FastAPI, HTTPException, Query, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pymongo import MongoClient
import os
import uuid
from enum import Enum
import asyncio
import threading

# Import the scraper at module level
try:
    from .upc_scraper import UPCScraper
    SCRAPER_AVAILABLE = True
except ImportError:
    SCRAPER_AVAILABLE = False
    print("Warning: UPCScraper not available")

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['upc_legal']
cases_collection = db['cases']
documents_collection = db['documents']

app = FastAPI(title="UPC Legal API", version="1.0.0")

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

class CaseModel(BaseModel):
    id: str
    date: str
    type: CaseType
    registry_number: str
    order_reference: str
    case_number: Optional[str] = None
    court_division: str
    type_of_action: ActionType
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

# Initialize sample data
@app.on_event("startup")
async def startup_event():
    # Create text index for search
    cases_collection.create_index([("summary", "text"), ("parties", "text"), ("reference", "text")])
    
    # Check if we have any cases in the database
    case_count = cases_collection.count_documents({})
    
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
        cases_collection.insert_many(sample_cases)
        print("Sample data loaded as fallback")
    else:
        print(f"Database already contains {case_count} cases")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
