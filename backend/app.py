import uvicorn
import certifi
import time
import requests 
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
# from passlib.context import CryptContext
import bcrypt

# ==============================================================================
# 1. CẤU HÌNH (CONFIGURATION)
# ==============================================================================

# Connection String MongoDB của bạn
CONNECTION_STRING = "mongodb+srv://lequocvi2412_db_user:123456789#@cluster0.ujbl7hs.mongodb.net/?appName=Cluster0"
DATABASE_NAME = "du_lich_am_thuc"
COLLECTION_NAME = "quan_an"

# Cấu hình mã hóa mật khẩu
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password):
#     return pwd_context.hash(password)

def get_password_hash(password):
    # Convert string to bytes, generate salt, and hash
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password, hashed_password):
    # Convert both to bytes and check
    plain_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_bytes, hashed_bytes)

def convert_document(document):
    """Chuyển đổi ObjectId thành string để trả về JSON"""
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

# Cấu hình CORS
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

class NewReview(BaseModel):
    comment: str

class FilterRandomRequest(BaseModel):
    tags: Dict[str, Any] | None = None
    count: int = 3
    geo: Dict[str, Any] | None = None

class SpecialityVNUpdate(BaseModel):
    ids: List[str] | None = None
    names_contains: List[str] | None = None
    value: bool = True

# ==============================================================================
# 4. API ENDPOINTS - AUTHENTICATION (Đăng nhập/Đăng ký)
# ==============================================================================

@app.post("/api/auth/register")
async def register(user: UserSignup):
    if collection_users is None:
        raise HTTPException (status_code=503, detail = "Database chưa kết nối")
    
    if collection_users.find_one({"phone": user.phone}):
        raise HTTPException(status_code=400, detail="Số điện thoại đã được đăng ký")
    
    new_user = {
        "username": user.username,
        "phone": user.phone,
        "password": get_password_hash(user.password),
        "created_at": time.time(),
        "login_type": "local"
    }
    collection_users.insert_one(new_user)
    return {"message": "Đăng ký thành công", "user": {"username": user.username}}

@app.post("/api/auth/google")
async def google_login(payload: GoogleAuthRequest):
    """
    Sử dụng access_token từ Frontend để gọi Google API lấy thông tin User
    """
    if collection_users is None:
        raise HTTPException (status_code=503, detail = "Database chưa kết nối")
    
    try:
        # Gọi API Google để lấy thông tin user từ token
        response = requests.get(f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={payload.token}")
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Token Google không hợp lệ hoặc đã hết hạn")
        
        user_info = response.json()
        
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        google_id = user_info.get("sub")
        
        existing_user = collection_users.find_one({"email": email})
        
        if not existing_user:
            new_user = {
                "google_id": google_id,
                "email": email,
                "username": name,
                "avatar": picture,
                "created_at": time.time(),
                "login_type": "google"
            }
            collection_users.insert_one(new_user)
            return {"message": "Đăng ký Google thành công", "user": {"name": name, "avatar": picture}}
        else:
            return {"message": "Đăng nhập Google thành công", "user": {"name": existing_user.get("username"), "avatar": existing_user.get("avatar")}}
        
    except Exception as e:
        print(f"Google Login Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(user: UserLogin):
    if collection_users is None:
         raise HTTPException(status_code=503, detail="Lỗi kết nối DB")

    found_user = collection_users.find_one({"phone": user.phone})

    if not found_user:
        raise HTTPException(status_code=400, detail="Số điện thoại chưa đăng ký")

    if "password" not in found_user or not verify_password(user.password, found_user["password"]):
        raise HTTPException(status_code=400, detail="Sai mật khẩu")
    
    return {"message": "Đăng nhập thành công", "user": {"name": found_user.get("username")}}

@app.post("/api/auth/facebook")
async def facebook_login(payload: FacebookAuthRequest):
    if collection_users is None:
         raise HTTPException(status_code=503, detail="Lỗi kết nối DB")
    
    existing_user = collection_users.find_one({"facebook_id": payload.userID})

    if not existing_user:
        new_user = {
            "facebook_id": payload.userID,
            "username": payload.name,
            "email": payload.email, 
            "avatar": payload.picture,
            "created_at": time.time(),
            "login_type": "facebook"
        }
        collection_users.insert_one(new_user)
        return {"message": "Đăng ký FB thành công", "user": {"name": payload.name, "avatar": payload.picture}}
    else:
        return {"message": "Đăng nhập FB thành công", "user": {"name": existing_user.get("username"), "avatar": existing_user.get("avatar")}}

@app.post("/api/auth/reset-password")
async def reset_password(payload: UserResetPassword):
    if collection_users is None:
         raise HTTPException(status_code=503, detail="Lỗi kết nối DB")
    
    user = collection_users.find_one({"phone": payload.phone})
    if not user:
        raise HTTPException(status_code=404, detail="Số điện thoại chưa đăng ký")
    
    hashed_password = get_password_hash(payload.new_password)
    
    collection_users.update_one(
        {"phone": payload.phone},
        {"$set": {"password": hashed_password}}
    )
    return {"message": "Đặt lại mật khẩu thành công"}

# ==============================================================================
# 5. API ENDPOINTS - RESTAURANT & FILTER (Chức năng chính)
# ==============================================================================

@app.get("/api/restaurant/{restaurant_id}")
async def get_restaurant_details(restaurant_id: str):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server DB")
    try:
        obj_id = ObjectId(restaurant_id)
        restaurant = collection_quan_an.find_one({"_id": obj_id})
        if restaurant:
            return convert_document(restaurant)
        else:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhà hàng")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {e}")

@app.patch("/api/restaurant/{restaurant_id}/add_review")
async def add_review_to_restaurant(restaurant_id: str, review: NewReview):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server DB")
    try:
        obj_id = ObjectId(restaurant_id)
        result = collection_quan_an.update_one(
            {"_id": obj_id},
            {"$push": {"review": review.comment}}
        )
        if result.matched_count == 1:
            return {"message": "Review added successfully"}
        else:
            raise HTTPException(status_code=404, detail="Restaurant not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {e}")

@app.delete("/api/restaurant/{restaurant_id}")
async def delete_restaurant(restaurant_id: str):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server DB")
    try:
        obj_id = ObjectId(restaurant_id)
        result = collection_quan_an.delete_one({"_id": obj_id})
        if result.deleted_count == 1:
            return {"message": f"Deleted restaurant {restaurant_id}"}
        else:
            raise HTTPException(status_code=404, detail="Restaurant not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {e}")

@app.post("/api/filter-random")
async def filter_random(payload: FilterRandomRequest):
    """
    Lọc nhà hàng theo TẤT CẢ tag được chọn (AND), sau đó trả về ngẫu nhiên `count` bản ghi.
    """
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server DB")

    try:
        tags = payload.tags or {}
        size = max(1, min(int(payload.count or 3), 50))

        key_map = {
            "price_range": "tags.price_range",
            "price": "tags.price_range",
            "budget": "tags.price_range",
            "cuisine_origin": "tags.cuisine_origin",
            "origin": "tags.cuisine_origin",
            "country": "tags.cuisine_origin",
            "main_dishes": "tags.main_dishes",
            "foodType": "tags.main_dishes",
            "specialities": "tags.specialities",
            "speciality": "tags.specialities",
            "features": "tags.specialities",
            "speciality_vn": "tags.speciality_vn",
        }

        and_clauses: List[Dict[str, Any]] = []

        # Chỉ lấy các quán có image_urls tồn tại và không rỗng
        and_clauses.append({"image_urls": {"$exists": True}})
        and_clauses.append({"image_urls": {"$ne": []}})

        for k, v in tags.items():
            path = key_map.get(k, f"tags.{k}")
            if isinstance(v, list):
                values = [x for x in v if isinstance(x, str) and x.strip()]
                if values:
                    and_clauses.append({path: {"$all": values}})
            elif isinstance(v, str):
                vv = v.strip()
                if vv:
                    and_clauses.append({path: vv})
            elif isinstance(v, bool):
                and_clauses.append({path: v})

        # Build pipeline with optional geo filter
        pipeline = []

        geo = payload.geo or {}
        center = (geo.get("center") if isinstance(geo, dict) else None) or {}
        lat = center.get("lat")
        lng = center.get("lng")
        max_km = geo.get("maxKm") if isinstance(geo, dict) else None

        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)) and isinstance(max_km, (int, float)):
            query_obj = {"$and": and_clauses} if and_clauses else {}
            try:
                pipeline.append({
                    "$geoNear": {
                        "near": {"type": "Point", "coordinates": [float(lng), float(lat)]},
                        "distanceField": "dist",
                        "maxDistance": float(max_km) * 1000.0,
                        "spherical": True,
                        "query": query_obj
                    }
                })
            except Exception:
                if query_obj:
                    pipeline.append({"$match": query_obj})
        else:
            if and_clauses:
                pipeline.append({"$match": {"$and": and_clauses}})

        pipeline.append({"$sample": {"size": size}})

        docs = list(collection_quan_an.aggregate(pipeline))
        return [convert_document(d) for d in docs]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

@app.get("/api/restaurants/all_ids")
async def get_all_restaurant_ids():
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi DB")
    try:
        cursor = collection_quan_an.find({}, {"_id": 1})
        return [str(doc["_id"]) for doc in cursor]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi: {e}")

@app.post("/api/admin/set_speciality_vn")
async def admin_set_speciality_vn(payload: SpecialityVNUpdate):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server DB")

    try:
        or_filters: List[Dict[str, Any]] = []
        if payload.ids:
            valid_ids = []
            for s in payload.ids:
                try:
                    valid_ids.append(ObjectId(s))
                except Exception:
                    continue
            if valid_ids:
                or_filters.append({"_id": {"$in": valid_ids}})

        if payload.names_contains:
            for kw in payload.names_contains:
                if isinstance(kw, str) and kw.strip():
                    or_filters.append({"name": {"$regex": kw.strip(), "$options": "i"}})

        if not or_filters:
            raise HTTPException(status_code=400, detail="Cần cung cấp 'ids' hoặc 'names_contains'")

        filter_query = {"$or": or_filters}
        update_doc = {"$set": {"tags.speciality_vn": bool(payload.value)}}
        result = collection_quan_an.update_many(filter_query, update_doc)

        return {
            "matched": result.matched_count,
            "modified": result.modified_count,
            "value": bool(payload.value)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

if __name__ == "__main__":
    print("Khởi chạy API server tại http://127.0.0.1:8000")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)