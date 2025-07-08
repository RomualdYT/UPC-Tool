from fastapi import FastAPI, HTTPException, Query, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pymongo import MongoClient
import os
import uuid
from enum import Enum
import asyncio
import threading
from .upc_scraper import UPCScraper

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['upc_legal']
cases_collection = db['cases']
documents_collection = db['documents']

# Initialize UPC scraper
scraper = UPCScraper(MONGO_URL)

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

class CaseModel(BaseModel):
    id: str
    date: str
    type: CaseType
    reference: str
    registry_number: str
    case_number: Optional[str] = None
    court_division: str
    type_of_action: ActionType
    language_of_proceedings: Language
    parties: List[str]
    patent: Optional[str] = None
    legal_norms: List[str] = []
    tags: List[str] = []
    summary: str
    documents: List[DocumentModel] = []

class SearchFilters(BaseModel):
    keywords: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    case_type: Optional[CaseType] = None
    court_division: Optional[str] = None
    language: Optional[Language] = None
    tags: Optional[List[str]] = None

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
            case["id"] = case.pop("_id")
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
        
        case["id"] = case.pop("_id")
        return case
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

@app.post("/api/cases", response_model=CaseModel)
async def create_case(case: CaseModel):
    """Create a new case"""
    try:
        case_dict = case.dict()
        case_dict["_id"] = case_dict.pop("id")
        result = cases_collection.insert_one(case_dict)
        case_dict["id"] = case_dict.pop("_id")
        return case_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sync/upc")
async def sync_upc_data(background_tasks: BackgroundTasks, max_pages: Optional[int] = None):
    """Sync data with UPC website"""
    try:
        background_tasks.add_task(sync_upc_decisions, max_pages)
        return {"message": "UPC data sync started", "max_pages": max_pages}
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

async def sync_upc_decisions(max_pages: Optional[int] = None):
    """Background task to sync UPC decisions"""
    try:
        count = scraper.update_database(max_pages)
        print(f"UPC sync completed: {count} decisions updated")
    except Exception as e:
        print(f"UPC sync failed: {e}")

@app.get("/api/stats")
async def get_statistics():
    """Get database statistics"""
    try:
        from datetime import timedelta
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
        print("No cases found in database. Starting UPC sync...")
        try:
            # Try to sync with UPC website
            count = scraper.update_database(max_pages=2)
            print(f"Initial sync completed: {count} decisions loaded")
        except Exception as e:
            print(f"UPC sync failed, loading sample data: {e}")
            # Fallback to sample data if sync fails
            sample_cases = [
                {
                    "_id": str(uuid.uuid4()),
                    "date": "2025-01-08",
                    "type": "Order",
                    "reference": "ORD_32533/2025",
                    "registry_number": "App_31860/2025",
                    "court_division": "Milano (IT)",
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
                    "reference": "ORD_29288/2025",
                    "registry_number": "App_28457/2025",
                    "court_division": "München (DE)",
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
        # Optional: sync in background every startup
        # asyncio.create_task(sync_upc_decisions(max_pages=1))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)