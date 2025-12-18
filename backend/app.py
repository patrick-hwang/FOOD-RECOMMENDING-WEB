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
import json
import random
from criteria import DETERMINING_CRITERIA
import os
import unicodedata

# ==============================================================================
# 1. CẤU HÌNH (CONFIGURATION)
# ==============================================================================

# Connection String MongoDB của bạn
CONNECTION_STRING = "mongodb+srv://lequocvi2412_db_user:123456789#@cluster0.ujbl7hs.mongodb.net/?appName=Cluster0"
DATABASE_NAME = "du_lich_am_thuc"
COLLECTION_NAME = "restaurants"

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
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server DB")

    try:
        tags = payload.tags or {}
        size = max(1, min(int(payload.count or 6), 50))

        # --- MAPPING FRONTEND KEYS TO DATABASE KEYS ---
        # Maps the UI category to the list of possible fields in result.json
        key_map = {
            "price_range": ["tags.giá tiền"],
            "cuisine_origin": ["tags.miền Bắc", "tags.miền Trung", "tags.miền Tây", "tags.miền Nam", "tags.Tây Nguyên", "tags.nước ngoài"],
            "main_dishes": ["tags.món ăn nước", "tags.món khô", "tags.sợi", "tags.món rời", "tags.bánh bột gạo", "tags.bánh bột mì", "tags.hải sản", "tags.thịt gia súc", "tags.thịt gia cầm", "tags.món chay"],
            "place": ["tags.không gian", "tags.vật chất", "tags.âm thanh"], # New "Place" Category
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
    
    # Mapping: Turn Index -> Criteria Index
    # Turn 0 (Question 1) -> Index 1 (Món ăn/uống)
    # Turn 1 (Question 2) -> Index 5 (Giá tiền)
    fixed_order_map = {0: 1, 1: 5}

    if turn in fixed_order_map:
        target_idx = fixed_order_map[turn]
        candidates = [q for q in available_questions if get_question_category_index(q) == target_idx]
        
        if candidates:
            return {
                "remaining_count": len(all_places),
                "next_question": random.choice(candidates)
            }

    # --- LOGIC: MAX IMPACT ALGORITHM ---
    best_question = None
    max_affect = -1.0
    
    for q in available_questions:
        q_tags = get_question_tags(q)
        total_affect = 0.0
        
        # Calculate affect: Sum(|score|) for each place in top 100 that has the tag
        for place in top_100_places:
            place_tags = get_restaurant_tags(place)
            for tag in q_tags:
                if tag in place_tags:
                    total_affect += get_tag_score(tag)
        
        if get_question_category_index(q) == 5:  # Price
            total_affect *= 0.3  # Reduce impact for price questions

        if total_affect > max_affect:
            max_affect = total_affect
            best_question = q
    
    # FALLBACK: If algorithm fails to pick (e.g. all 0 impact), pick random
    if best_question is None:
        best_question = random.choice(available_questions)
            
    return {
        "remaining_count": len(all_places),
        "next_question": best_question
    }

@app.post("/api/question-mode/results")
async def get_results_batch(payload: QuestionModeRequest):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="DB not connected")

    all_places_simple = list(collection_quan_an.find({}, {"tags": 1, "_id": 1}))
    
    if not all_places_simple:
        return {"results": [], "remaining_count": 0}

    # Calculate Score
    scored_places = []
    for place in all_places_simple:
        s = calculate_place_score(place, payload)
        scored_places.append((place, s))
        
    # Sort Descending
    scored_places.sort(key=lambda x: x[1], reverse=True)
    
    # Take Top 4
    top_4_simple = [x[0] for x in scored_places[:4]]
    top_ids = [d["_id"] for d in top_4_simple]

    full_docs_map = {d["_id"]: d for d in collection_quan_an.find({"_id": {"$in": top_ids}})}
    
    results = []
    for simple_doc in top_4_simple:
        if simple_doc["_id"] in full_docs_map:
            d = convert_document(full_docs_map[simple_doc["_id"]])
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
    print("Khởi chạy API server tại http://127.0.0.1:8000")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)