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
import json
import random
from criteria import DETERMINING_CRITERIA
import os
import unicodedata

# ==============================================================================
# 1. CẤU HÌNH (CONFIGURATION)
# ==============================================================================

CONNECTION_STRING = "mongodb+srv://lequocvi2412_db_user:123456789#@cluster0.ujbl7hs.mongodb.net/?appName=Cluster0"
DATABASE_NAME = "du_lich_am_thuc"
COLLECTION_NAME = "restaurants"

client = MongoClient(CONNECTION_STRING, server_api=ServerApi('1'))
db = client[DATABASE_NAME]
collection_quan_an = db[COLLECTION_NAME]
try:
    # Tìm các document đang ở dạng cũ (có key 'lat' trong coordinates)
    old_data_cursor = collection_quan_an.find({"coordinates.lat": {"$exists": True}})
    count = 0
    
    for doc in old_data_cursor:
        try:
            old_coords = doc.get("coordinates", {})
            # Chuyển từ String sang Float
            lat_str = old_coords.get("lat")
            lng_str = old_coords.get("long")
            
            if lat_str and lng_str:
                lat = float(lat_str)
                lng = float(lng_str)
                
                # Tạo cấu trúc GeoJSON: [Longitude, Latitude]
                new_coords = {
                    "type": "Point",
                    "coordinates": [lng, lat]
                }
                
                # Cập nhật lại vào DB
                collection_quan_an.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"coordinates": new_coords}}
                )
                count += 1
        except Exception as e:
            print(f"Lỗi convert ID {doc.get('_id')}: {e}")

    if count > 0:
        print(f"✅ Đã cập nhật thành công {count} địa điểm sang chuẩn GeoJSON!")

except Exception as e:
    print(f"⚠️ Lỗi khi cập nhật dữ liệu: {e}")

# [ĐOẠN TẠO INDEX MÀ BẠN ĐÃ THÊM LÚC NÃY]
try:
    collection_quan_an.create_index([("coordinates", "2dsphere")])
    print("✅ Geospatial index created successfully!")
except Exception as e:
    print(f"⚠️ Warning creating index: {e}")

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

class NewReview(BaseModel):
    comment: str

class SpecialityVNUpdate(BaseModel):
    ids: Optional[List[str]] = None
    names_contains: Optional[List[str]] = None
    value: bool

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

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
        # Lấy tên từ Google, nếu không có thì lấy phần đầu email
        name = user_info.get("name") or email.split("@")[0]
        picture = user_info.get("picture")
        
        existing_user = collection_users.find_one({"email": email})
        
        if not existing_user:
            new_user = {
                "email": email, 
                "username": name, # Lưu vào field username
                "avatar": picture, 
                "phone": email,
                "created_at": time.time(), 
                "login_type": "google", 
                "history": [], 
                "bookmarks": []
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
            "facebook_id": payload.userID, 
            "username": payload.name, 
            "email": payload.email, 
            "avatar": payload.picture, 
            "phone": user_key, 
            "created_at": time.time(),
            "login_type": "facebook", 
            "history": [], 
            "bookmarks": []
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
    
    # [FIX] Search by phone OR email OR facebook_id
    user_filter = {
        "$or": [
            {"phone": phone},
            {"email": phone},
            {"facebook_id": phone}
        ]
    }
    
    user = collection_users.find_one(user_filter)
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
    
    user_filter = {
        "$or": [{"phone": phone}, {"email": phone}, {"facebook_id": phone}]
    }
    
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if "username" in update_data and not update_data["username"]: del update_data["username"]
    if not update_data: return {"message": "No data"}
    
    result = collection_users.update_one(user_filter, {"$set": update_data})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Update success"}

@app.post("/api/user/{phone}/history")
async def add_history(phone: str, payload: HistoryRequest):
    if collection_users is None: raise HTTPException(status_code=503)
    
    user_filter = {
        "$or": [{"phone": phone}, {"email": phone}, {"facebook_id": phone}]
    }
    
    collection_users.update_one(user_filter, {"$addToSet": {"history": payload.restaurant_id}})
    return {"message": "Added history"}

@app.delete("/api/user/{phone}/history")
async def delete_history(phone: str, restaurant_id: Optional[str] = None):
    if collection_users is None: raise HTTPException(status_code=503)
    
    user_filter = {
        "$or": [{"phone": phone}, {"email": phone}, {"facebook_id": phone}]
    }
    
    if restaurant_id:
         collection_users.update_one(user_filter, {"$pull": {"history": restaurant_id}})
         return {"message": "Removed item from history"}
    else:
         collection_users.update_one(user_filter, {"$set": {"history": []}})
         return {"message": "Cleared all history"}

@app.post("/api/user/{phone}/bookmark")
async def toggle_bookmark(phone: str, payload: BookmarkRequest):
    if collection_users is None: raise HTTPException(status_code=503)
    
    user_filter = {
        "$or": [{"phone": phone}, {"email": phone}, {"facebook_id": phone}]
    }
    
    user = collection_users.find_one(user_filter)
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    bookmarks = user.get("bookmarks", [])
    if payload.restaurant_id in bookmarks:
        collection_users.update_one(user_filter, {"$pull": {"bookmarks": payload.restaurant_id}})
        return {"status": "removed"}
    else:
        collection_users.update_one(user_filter, {"$addToSet": {"bookmarks": payload.restaurant_id}})
        return {"status": "added"}

@app.get("/api/restaurant/{restaurant_id}")
async def get_restaurant_details(restaurant_id: str):
    if collection_quan_an is None: raise HTTPException(status_code=503)
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
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server DB")

    try:
        tags = payload.tags or {}
        size = max(1, min(int(payload.count or 6), 50))

        # --- MAPPING FRONTEND KEYS TO DATABASE KEYS ---
        # Maps the UI category to the list of possible fields in result.json
        key_map = {
            "price_range": ["tags.giá tiền"],
            "cuisine_origin": [
                "tags.miền Bắc", "tags.miền Trung", "tags.miền Tây", "tags.miền Nam", 
                "tags.Tây Nguyên", "tags.nước ngoài"
            ],
            "main_dishes": [
                "tags.món ăn nước", "tags.món khô", "tags.sợi", "tags.món rời", 
                "tags.món nếp",          # Added for Sticky Rice/Xôi
                "tags.bánh bột gạo", "tags.bánh bột mì", 
                "tags.hải sản", "tags.thịt gia súc", "tags.thịt gia cầm", "tags.món chay",
                "tags.thức uống",        # Added for Drinks
                "tags.đồ ăn ngọt",       # Added for Desserts/Sweet Soup
                "tags.không phải trái cây", # Added for Matcha/Cacao etc
                "tags.đậu - hạt"         # Added for nuts/beans
            ],
            "occasion": ["tags.thời điểm/dịp"],  # Added for Occasion filter
            "place": ["tags.không gian", "tags.vật chất", "tags.âm thanh"],
            "speciality_vn": ["tags.speciality_vn"]
        }

        and_clauses: List[Dict[str, Any]] = []

        # 1. Ensure restaurant has images
        and_clauses.append({
            "$or": [
                {"places_images": {"$ne": []}}, 
                {"menu_images": {"$ne": []}},
                {"thumbnail": {"$exists": True}}
            ]
        })

        # 2. Build Query based on tags
        for k, v in tags.items():
            # Get list of possible DB paths for this UI key
            db_paths = key_map.get(k, [f"tags.{k}"]) 
            
            if isinstance(v, list):
                values = [x for x in v if isinstance(x, str) and x.strip()]
                if values:
                    # Logic: For each selected tag value (e.g. "Hà Nội"), 
                    # check if it exists in ANY of the mapped DB paths.
                    # This creates a complex $and of $ors
                    for val in values:
                        or_conditions = [{path: val} for path in db_paths]
                        and_clauses.append({"$or": or_conditions})

            elif isinstance(v, str):
                vv = v.strip()
                if vv:
                    or_conditions = [{path: vv} for path in db_paths]
                    and_clauses.append({"$or": or_conditions})
                    
            elif isinstance(v, bool):
                # For boolean flags like speciality_vn
                or_conditions = [{path: v} for path in db_paths]
                and_clauses.append({"$or": or_conditions})

        # 3. Geo & Pipeline Logic (Keep existing)
        pipeline = []
        geo = payload.geo or {}
        
        if geo and "center" in geo and "maxKm" in geo:
            center = geo["center"]
            max_km = float(geo["maxKm"])
            # MongoDB expects [long, lat]
            pipeline.append({
                "$geoNear": {
                    "near": { "type": "Point", "coordinates": [center["lng"], center["lat"]] },
                    "distanceField": "dist.calculated",
                    "maxDistance": max_km * 1000, 
                    "spherical": True
                }
            })

        if and_clauses:
            pipeline.append({"$match": {"$and": and_clauses}})

        pipeline.append({"$sample": {"size": size}})

        docs = list(collection_quan_an.aggregate(pipeline))
        return [convert_document(d) for d in docs]

    except Exception as e:
        print(f"Error in filter_random: {e}")
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

@app.post("/api/search")
async def search_restaurants(payload: SearchRequest):
    """Search restaurants by name, reviews content, and tags using tokenized
    substring matching with scoring. For each token:
      - name match: +6 points
      - tags match: +3 points
      - reviews match: +1 point
    Results are sorted by total score (desc) and limited to the requested size.
    """
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server DB")
    
    try:
        query = payload.query.strip()
        if not query:
            return {"results": [], "count": 0}
        
        # Tokenize query by spaces
        tokens = [t.strip() for t in query.split() if t.strip()]
        if not tokens:
            return {"results": [], "count": 0}
        
        # Build OR conditions for each token across name, reviews, and tags
        or_conditions = []
        
        for token in tokens:
            token_conditions = []
            
            # Search in name
            token_conditions.append({"name": {"$regex": token, "$options": "i"}})
            
            # Search in reviews content
            token_conditions.append({"reviews.content": {"$regex": token, "$options": "i"}})
            
            # Search in all tag values (tags is an object with various keys)
            # We use $expr to check if any value in tags object matches
            # Simpler approach: use dot notation for known tag fields or search all with $where
            # For performance, we'll search specific tag paths we know exist
            tag_paths = [
                "tags.sợi", "tags.món ăn nước", "tags.thịt gia súc", "tags.thịt gia cầm",
                "tags.trứng", "tags.độ cay", "tags.thức uống", "tags.giá tiền",
                "tags.món rời", "tags.miền Nam", "tags.miền Bắc", "tags.miền Trung",
                "tags.miền Tây", "tags.Tây Nguyên", "tags.nước ngoài",
                "tags.món khô", "tags.món nếp", "tags.bánh bột gạo", "tags.bánh bột mì",
                "tags.hải sản", "tags.món chay", "tags.đồ ăn ngọt",
                "tags.không phải trái cây", "tags.đậu - hạt", "tags.thời điểm/dịp",
                "tags.không gian", "tags.vật chất", "tags.âm thanh"
            ]
            
            for tag_path in tag_paths:
                token_conditions.append({tag_path: {"$regex": token, "$options": "i"}})
            
            # At least one condition must match for this token
            or_conditions.append({"$or": token_conditions})
        
        # All tokens must match (AND logic across tokens)
        query_filter = {"$and": or_conditions} if len(or_conditions) > 1 else or_conditions[0]
        
        # Fetch a reasonable batch of candidates, then score and sort in Python.
        # Use a multiplier to avoid missing good results when the requested limit is small.
        candidate_limit = max(int(payload.limit) * 10, 100)
        cursor = collection_quan_an.find(query_filter).limit(candidate_limit)

        # Helper to flatten tags into a list of strings
        def flatten_tags(tags_obj):
            values = []
            if isinstance(tags_obj, dict):
                for v in tags_obj.values():
                    if isinstance(v, list):
                        values.extend([str(x) for x in v if isinstance(x, (str, int, float))])
                    elif isinstance(v, (str, int, float)):
                        values.append(str(v))
            return values

        # Helper to normalize and check substring (case-insensitive)
        def contains_token(haystack: str, token: str) -> bool:
            try:
                return token.lower() in haystack.lower()
            except Exception:
                return False

        scored = []
        for doc in cursor:
            name_val = str(doc.get("name", ""))
            tags_flat = flatten_tags(doc.get("tags", {}))
            reviews_list = doc.get("reviews", [])

            # Prepare review contents (handle list of dicts or strings)
            review_texts = []
            if isinstance(reviews_list, list):
                for r in reviews_list:
                    if isinstance(r, dict):
                        review_texts.append(str(r.get("content", "")))
                    else:
                        review_texts.append(str(r))

            score = 0
            for tok in tokens:
                # Name match +6
                if contains_token(name_val, tok):
                    score += 6
                # Tags match +3 (if any tag value contains token)
                if any(contains_token(t, tok) for t in tags_flat):
                    score += 3
                # Reviews match +1 (if any review contains token)
                if any(contains_token(rv, tok) for rv in review_texts):
                    score += 1

            converted = convert_document(doc)
            # Handle thumbnail fallback
            if "thumbnail" not in converted and "places_images" in converted and converted["places_images"]:
                converted["thumbnail"] = converted["places_images"][0]
            elif "thumbnail" not in converted:
                converted["thumbnail"] = "https://placehold.co/150x150"

            converted["_score"] = score
            scored.append(converted)

        # Sort by score (desc), then by name (asc) for stability
        scored.sort(key=lambda d: (-d.get("_score", 0), d.get("name", "")))

        # Apply final limit and strip internal score if desired
        final = scored[: int(payload.limit)]
        for d in final:
            # keep _score for debugging if frontend ignores unknown fields
            pass

        return {"results": final, "count": len(final)}
    
    except Exception as e:
        print(f"Error in search: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")
    
# ==============================================================================
# 6. QUESTIONS DATA (Câu hỏi trắc nghiệm)
# ==============================================================================

try:
    # FIX: Use os.path to find the file relative to app.py
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, 'questions.json')
    
    with open(json_path, 'r', encoding='utf-8') as f: 
        QUESTIONS_DB = json.load(f)
    print(f"✅ Loaded {len(QUESTIONS_DB)} questions.")
except FileNotFoundError:
    print(f"❌ ERROR: questions.json not found at {json_path}")
    QUESTIONS_DB = []
except Exception as e:
    print(f"❌ Error loading questions: {e}")
    QUESTIONS_DB = []

CATEGORY_SCORES = {
    1: 41.4, # Món ăn/uống
    5: 25.3, # Giá tiền
    0: 11.0, # Đặc điểm
    3: 9.1,  # Nguồn gốc
    4: 6.6,  # Không gian
    2: 4.5,  # Nguyên liệu
    6: 2.2   # Thời điểm
}

# --- ADD THESE HELPER FUNCTIONS ---
def normalize_text(text):
    if isinstance(text, str):
        return unicodedata.normalize('NFC', text).strip()
    return text

def get_tag_score(tag):
    tag = normalize_text(tag) # Normalize input
    for idx, criterion_list in enumerate(DETERMINING_CRITERIA):
        # Normalize list items for comparison
        normalized_list = [normalize_text(t) for t in criterion_list]
        if tag in normalized_list:
            return CATEGORY_SCORES.get(idx, 0)
    return 0

def get_restaurant_tags(restaurant):
    tags_obj = restaurant.get("tags", {})
    all_tags = set()
    if not tags_obj: return all_tags
    for v in tags_obj.values():
        if isinstance(v, list): 
            all_tags.update([normalize_text(t) for t in v]) # Normalize
        elif isinstance(v, str): 
            all_tags.add(normalize_text(v)) # Normalize
    return all_tags

def get_question_category_index(q_obj):
    all_tags = []
    yes_obj = q_obj.get('yes', {})
    no_obj = q_obj.get('no', {})
    
    if 'yes_tag' in yes_obj: all_tags.extend(yes_obj['yes_tag'])
    if 'no_tag' in yes_obj: all_tags.extend(yes_obj['no_tag'])
    if 'yes_tag' in no_obj: all_tags.extend(no_obj['yes_tag'])
    if 'no_tag' in no_obj: all_tags.extend(no_obj['no_tag'])
    
    for tag in all_tags:
        norm_tag = normalize_text(tag) # Normalize tag from question
        for idx, criterion_list in enumerate(DETERMINING_CRITERIA):
            # Normalize tags in criteria
            normalized_criteria = [normalize_text(t) for t in criterion_list]
            if norm_tag in normalized_criteria:
                return idx
    return -1

def calculate_place_score(place, request):
    """Calculates total score for a place based on the 4 tag lists."""
    place_tags = get_restaurant_tags(place)
    score = 0.0
    
    # 1. Exact Match (Yes) -> Full Score
    for tag in request.yes_tags:
        if tag in place_tags:
            score += get_tag_score(tag)
            
    # 2. Partial Match (Maybe Yes) -> Half Score
    for tag in request.maybe_yes_tags:
        if tag in place_tags:
            score += (get_tag_score(tag) / 2.0)
            
    # 3. Negative Match (No) -> Minus Score
    for tag in request.no_tags:
        if tag in place_tags:
            score -= get_tag_score(tag)
            
    # 4. Partial Negative (Maybe No) -> Minus Half Score
    for tag in request.maybe_no_tags:
        if tag in place_tags:
            score -= (get_tag_score(tag) / 2.0)
            
    return score

def get_question_tags(q_obj):
    """Collects all tags involved in a question to calculate impact."""
    tags = set()
    # Collect tags from 'yes' branch
    yes_obj = q_obj.get('yes', {})
    if 'yes_tag' in yes_obj: tags.update(yes_obj['yes_tag'])
    if 'no_tag' in yes_obj: tags.update(yes_obj['no_tag'])
    
    # Collect tags from 'no' branch
    no_obj = q_obj.get('no', {})
    if 'yes_tag' in no_obj: tags.update(no_obj['yes_tag'])
    if 'no_tag' in no_obj: tags.update(no_obj['no_tag'])
    
    return list(tags)

# --- NEW API MODELS ---
class QuestionModeRequest(BaseModel):
    yes_tags: List[str] = []
    maybe_yes_tags: List[str] = [] # NEW
    no_tags: List[str] = []
    maybe_no_tags: List[str] = []  # NEW
    asked_ids: List[int] = []

QUESTIONS_MAP = {q['id']: q for q in QUESTIONS_DB}

# --- UPDATED ENDPOINT ---
@app.post("/api/question-mode/next")
async def get_next_question(payload: QuestionModeRequest):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="DB not connected")

    # 1. Fetch simplified data for ALL places
    cursor = collection_quan_an.find({}, {"tags": 1, "_id": 1})
    all_places = list(cursor)

    if not all_places:
        return {"next_question": None, "remaining_count": 0}

    # [CHANGE 1] Shuffle to randomize tie-breaking order
    random.shuffle(all_places) 

    # 2. Calculate Score for ALL places
    scored_places = []
    for place in all_places:
        s = calculate_place_score(place, payload)
        scored_places.append((place, s))
    
    # 3. Sort by score descending and take TOP 100
    scored_places.sort(key=lambda x: x[1], reverse=True)
    top_100_places = [x[0] for x in scored_places[:100]]
    
    # 4. Filter Available Questions
    available_questions = [q for q in QUESTIONS_DB if q['id'] not in payload.asked_ids]
    
    if not available_questions:
        return {"next_question": None, "remaining_count": len(all_places)}

    # --- LOGIC: FIXED SEQUENCE FOR Q1 & Q2 ---
    turn = len(payload.asked_ids)
    fixed_order_map = {0: 1, 1: 5} # Turn 0->Food, Turn 1->Price

    if turn in fixed_order_map:
        target_idx = fixed_order_map[turn]
        candidates = [q for q in available_questions if get_question_category_index(q) == target_idx]
        if candidates:
            return {
                "remaining_count": len(all_places),
                "next_question": random.choice(candidates)
            }

    # --- [CHANGE 2] CHECK IF PRICE WAS ALREADY ASKED ---
    # We check the history (payload.asked_ids). If a category 5 (Price) question exists,
    # we set a flag to SKIP future price questions.
    price_already_asked = False
    for pid in payload.asked_ids:
        prev_q = QUESTIONS_MAP.get(pid)
        if prev_q and get_question_category_index(prev_q) == 5:
            price_already_asked = True
            break

    # --- LOGIC: MAX IMPACT ALGORITHM ---
    best_question = None
    max_affect = -1.0
    
    for q in available_questions:
        q_cat_index = get_question_category_index(q)

        # [CHANGE 2 implementation] Skip Price questions if we already asked one
        if price_already_asked and q_cat_index == 5:
            continue

        q_tags = get_question_tags(q)
        total_affect = 0.0
        
        # Calculate affect: Sum(|score|) for each place in top 100
        for place in top_100_places:
            place_tags = get_restaurant_tags(place)
            for tag in q_tags:
                if tag in place_tags:
                    total_affect += get_tag_score(tag)
        
        # Determine best
        if total_affect > max_affect:
            max_affect = total_affect
            best_question = q
    
    # FALLBACK: If algorithm filtered everything out (or all 0 impact)
    if best_question is None:
        # If we filtered out price and that's all that was left, allow them back in random
        if not available_questions:
             return {"next_question": None, "remaining_count": 0}
        best_question = random.choice(available_questions)
            
    return {
        "remaining_count": len(all_places),
        "next_question": best_question
    }


# --- UPDATED: get_results_batch ---
@app.post("/api/question-mode/results")
async def get_results_batch(payload: QuestionModeRequest):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="DB not connected")

    all_places_simple = list(collection_quan_an.find({}, {"tags": 1, "_id": 1}))
    
    if not all_places_simple:
        return {"results": [], "remaining_count": 0}

    # [CHANGE 1] Randomize initial order before scoring
    random.shuffle(all_places_simple)

    # Calculate Score
    scored_places = []
    for place in all_places_simple:
        s = calculate_place_score(place, payload)
        scored_places.append((place, s))
        
    # Sort Descending by Score
    scored_places.sort(key=lambda x: x[1], reverse=True)
    
    # [CHANGE 3] Take Top 10, then Randomly select 4
    top_10_candidates = [x[0] for x in scored_places[:10]]
    
    # Pick 4 random from the top 10 (or fewer if less than 10 exist)
    sample_size = min(len(top_10_candidates), 4)
    final_selection = random.sample(top_10_candidates, sample_size)
    
    top_ids = [d["_id"] for d in final_selection]

    # Fetch full details for the selected IDs
    full_docs_map = {d["_id"]: d for d in collection_quan_an.find({"_id": {"$in": top_ids}})}
    
    results = []
    for simple_doc in final_selection:
        if simple_doc["_id"] in full_docs_map:
            d = convert_document(full_docs_map[simple_doc["_id"]])
            
            # Handle Thumbnail Logic
            if "thumbnail" not in d and "places_images" in d and d["places_images"]:
                d["thumbnail"] = d["places_images"][0]
            elif "thumbnail" not in d:
                d["thumbnail"] = "https://placehold.co/150x150"
            
            results.append(d)

    return {
        "results": results, 
        "remaining_count": len(all_places_simple)
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)