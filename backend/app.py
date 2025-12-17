import uvicorn
import certifi
import time
import requests 
from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import bcrypt

# ==============================================================================
# 1. CẤU HÌNH (CONFIGURATION)
# ==============================================================================

CONNECTION_STRING = "mongodb+srv://lequocvi2412_db_user:123456789#@cluster0.ujbl7hs.mongodb.net/?appName=Cluster0"
DATABASE_NAME = "du_lich_am_thuc"
COLLECTION_NAME = "restaurants"

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password, hashed_password):
    plain_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_bytes, hashed_bytes)

def convert_document(document):
    if document and "_id" in document:
        document["id"] = str(document["_id"])
        del document["_id"]
    return document

# ==============================================================================
# 2. KHỞI TẠO APP & DB
# ==============================================================================
app = FastAPI()
db = None
collection_quan_an = None
collection_users = None

@app.on_event("startup")
def startup_db_client():
    global db, collection_quan_an, collection_users
    try:
        print("Đang kết nối tới MongoDB Atlas...")
        ca = certifi.where()
        client = MongoClient(CONNECTION_STRING, tlsCAFile=ca, server_api=ServerApi('1'))
        client.admin.command('ping')
        print("✅ Kết nối MongoDB thành công!")
        db = client[DATABASE_NAME]
        collection_quan_an = db[COLLECTION_NAME]
        collection_users = db["users"]
    except Exception as e:
        print(f"❌ LỖI KẾT NỐI MONGODB: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# 3. DATA MODELS
# ==============================================================================

class UserResetPassword(BaseModel):
    phone: str
    new_password: str
    
class GoogleAuthRequest(BaseModel):
    token: str
    
class UserLogin(BaseModel):
    phone: str
    password: str

class UserSignup(BaseModel):
    username: str
    phone: str
    password: str
    
class FacebookAuthRequest(BaseModel):
    accessToken: str 
    userID: str
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None

class FilterRandomRequest(BaseModel):
    tags: Dict[str, Any] | None = None
    count: int = 3
    geo: Dict[str, Any] | None = None

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    avatar: Optional[str] = None

class HistoryRequest(BaseModel):
    restaurant_id: str

class BookmarkRequest(BaseModel):
    restaurant_id: str

# ==============================================================================
# 4. API ENDPOINTS
# ==============================================================================

@app.post("/api/auth/register")
async def register(user: UserSignup):
    if collection_users is None: raise HTTPException (status_code=503)
    if collection_users.find_one({"phone": user.phone}):
        raise HTTPException(status_code=400, detail="Số điện thoại đã được đăng ký")
    
    new_user = {
        "username": user.username,
        "phone": user.phone,
        "password": get_password_hash(user.password),
        "created_at": time.time(),
        "login_type": "local",
        "avatar": "", 
        "history": [],
        "bookmarks": []
    }
    collection_users.insert_one(new_user)
    return {"message": "Đăng ký thành công", "user": {"username": user.username}}

@app.post("/api/auth/login")
async def login(user: UserLogin):
    if collection_users is None: raise HTTPException(status_code=503)
    found_user = collection_users.find_one({"phone": user.phone})
    if not found_user: raise HTTPException(status_code=400, detail="SĐT chưa đăng ký")
    if "password" not in found_user or not verify_password(user.password, found_user["password"]):
        raise HTTPException(status_code=400, detail="Sai mật khẩu")
    return {"message": "Đăng nhập thành công", "user": convert_document(found_user)}

@app.post("/api/auth/google")
async def google_login(payload: GoogleAuthRequest):
    if collection_users is None: raise HTTPException(status_code=503)
    try:
        response = requests.get(f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={payload.token}")
        if response.status_code != 200: raise HTTPException(status_code=401)
        
        user_info = response.json()
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        
        existing_user = collection_users.find_one({"email": email})
        
        if not existing_user:
            new_user = {
                "email": email, "username": name, "avatar": picture, "phone": email,
                "created_at": time.time(), "login_type": "google", "history": [], "bookmarks": []
            }
            collection_users.insert_one(new_user)
            return {"message": "Google Login", "user": convert_document(new_user)}
        else:
            return {"message": "Google Login", "user": convert_document(existing_user)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/facebook")
async def facebook_login(payload: FacebookAuthRequest):
    if collection_users is None: raise HTTPException(status_code=503)
    existing_user = collection_users.find_one({"facebook_id": payload.userID})
    user_key = payload.email if payload.email else payload.userID
    
    if not existing_user:
        new_user = {
            "facebook_id": payload.userID, "username": payload.name, "email": payload.email, 
            "avatar": payload.picture, "phone": user_key, "created_at": time.time(),
            "login_type": "facebook", "history": [], "bookmarks": []
        }
        collection_users.insert_one(new_user)
        return {"message": "FB Login", "user": convert_document(new_user)}
    else:
        return {"message": "FB Login", "user": convert_document(existing_user)}

@app.post("/api/auth/reset-password")
async def reset_password(payload: UserResetPassword):
    if collection_users is None: raise HTTPException(status_code=503)
    user = collection_users.find_one({"phone": payload.phone})
    if not user: raise HTTPException(status_code=404, detail="SĐT chưa đăng ký")
    hashed_password = get_password_hash(payload.new_password)
    collection_users.update_one({"phone": payload.phone}, {"$set": {"password": hashed_password}})
    return {"message": "Đặt lại mật khẩu thành công"}

# --- USER FEATURES ---

@app.get("/api/user/{phone}")
async def get_user_profile(phone: str):
    if collection_users is None: raise HTTPException(status_code=503)
    user = collection_users.find_one({"phone": phone})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    history_ids = [ObjectId(hid) for hid in user.get("history", []) if ObjectId.is_valid(hid)]
    history_docs = list(collection_quan_an.find({"_id": {"$in": history_ids}}))
    
    bookmark_ids = [ObjectId(bid) for bid in user.get("bookmarks", []) if ObjectId.is_valid(bid)]
    bookmark_docs = list(collection_quan_an.find({"_id": {"$in": bookmark_ids}}))

    user_data = convert_document(user)
    user_data["history_items"] = [convert_document(d) for d in history_docs]
    user_data["bookmark_items"] = [convert_document(d) for d in bookmark_docs]
    return user_data

@app.put("/api/user/{phone}/update")
async def update_user_profile(phone: str, payload: UpdateProfileRequest):
    if collection_users is None: raise HTTPException(status_code=503)
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if "username" in update_data and not update_data["username"]: del update_data["username"]
    if not update_data: return {"message": "No data"}
    collection_users.update_one({"phone": phone}, {"$set": update_data})
    return {"message": "Update success"}

@app.post("/api/user/{phone}/history")
async def add_history(phone: str, payload: HistoryRequest):
    if collection_users is None: raise HTTPException(status_code=503)
    collection_users.update_one({"phone": phone}, {"$addToSet": {"history": payload.restaurant_id}})
    return {"message": "Added history"}

# --- ĐÃ SỬA: Xóa History dùng Query Parameter để an toàn và chính xác ---
@app.delete("/api/user/{phone}/history")
async def delete_history(phone: str, restaurant_id: Optional[str] = None):
    if collection_users is None: raise HTTPException(status_code=503)

    if restaurant_id:
         # CHỈ XÓA ID QUÁN KHỎI DANH SÁCH HISTORY CỦA USER
         # Dùng $pull để lấy ra khỏi mảng
         collection_users.update_one(
            {"phone": phone},
            {"$pull": {"history": restaurant_id}}
        )
         return {"message": "Removed item from history"}
    else:
        # Nếu không gửi ID -> Xóa hết (Tính năng tùy chọn)
         collection_users.update_one(
            {"phone": phone},
            {"$set": {"history": []}}
        )
         return {"message": "Cleared all history"}

@app.post("/api/user/{phone}/bookmark")
async def toggle_bookmark(phone: str, payload: BookmarkRequest):
    if collection_users is None: raise HTTPException(status_code=503)
    user = collection_users.find_one({"phone": phone})
    if not user: raise HTTPException(status_code=404)
    
    bookmarks = user.get("bookmarks", [])
    if payload.restaurant_id in bookmarks:
        collection_users.update_one({"phone": phone}, {"$pull": {"bookmarks": payload.restaurant_id}})
        return {"status": "removed"}
    else:
        collection_users.update_one({"phone": phone}, {"$addToSet": {"bookmarks": payload.restaurant_id}})
        return {"status": "added"}

@app.post("/api/filter-random")
async def filter_random(payload: FilterRandomRequest):
    if collection_quan_an is None: raise HTTPException(status_code=503)
    try:
        pipeline = []
        # (Giữ nguyên logic random cũ của bạn ở đây nếu có thêm geo/tags...)
        # Ở đây tôi để đơn giản để chạy được
        pipeline.append({"$sample": {"size": payload.count}})
        docs = list(collection_quan_an.aggregate(pipeline))
        return [convert_document(d) for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/restaurant/{restaurant_id}")
async def get_restaurant_details(restaurant_id: str):
    if collection_quan_an is None: raise HTTPException(status_code=503)
    try:
        obj_id = ObjectId(restaurant_id)
        restaurant = collection_quan_an.find_one({"_id": obj_id})
        if restaurant: return convert_document(restaurant)
        else: raise HTTPException(status_code=404)
    except: raise HTTPException(status_code=500)

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)