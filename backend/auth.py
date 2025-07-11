from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pymongo import MongoClient
import os
import uuid

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "romulus-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['upc_legal']
users_collection = db['users']

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
security = HTTPBearer()

# Enums
class UserRole(str):
    USER = "user"
    EDITOR = "editor"
    ADMIN = "admin"

class UserProfile(str):
    PROFESSIONAL = "professional"
    STUDENT = "student"
    ACADEMIC = "academic"
    OTHER = "other"

# Pydantic models
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    profile: Optional[UserProfile] = None
    newsletter_opt_in: bool = False

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: UserRole
    profile: Optional[UserProfile] = None
    newsletter_opt_in: bool = False
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserInDB(BaseModel):
    id: str
    email: str
    username: str
    hashed_password: str
    role: UserRole
    profile: Optional[UserProfile] = None
    newsletter_opt_in: bool = False
    created_at: datetime
    updated_at: datetime

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(email: str):
    user = users_collection.find_one({"email": email})
    if user:
        user["id"] = str(user.pop("_id"))
        return UserInDB(**user)
    return None

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_user(user_data: UserCreate):
    # Check if user already exists
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    if users_collection.find_one({"username": user_data.username}):
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    user_dict = {
        "_id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "hashed_password": get_password_hash(user_data.password),
        "role": UserRole.USER,
        "profile": user_data.profile,
        "newsletter_opt_in": user_data.newsletter_opt_in,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    users_collection.insert_one(user_dict)
    user_dict["id"] = user_dict.pop("_id")
    return UserInDB(**user_dict)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = get_user(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    return current_user

async def get_admin_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_editor_or_admin_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role not in [UserRole.EDITOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Function to create initial admin user
def create_initial_admin():
    admin_email = "admin@romulus.com"
    admin_user = users_collection.find_one({"email": admin_email})
    
    if not admin_user:
        admin_id = str(uuid.uuid4())
        admin_dict = {
            "_id": admin_id,
            "email": admin_email,
            "username": "admin",
            "hashed_password": get_password_hash("admin123"),
            "role": UserRole.ADMIN,
            "profile": UserProfile.PROFESSIONAL,
            "newsletter_opt_in": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        users_collection.insert_one(admin_dict)
        print(f"Initial admin user created: {admin_email}")
        return admin_dict
    else:
        print("Admin user already exists")
        return admin_user