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

@app.delete("/api/user/{phone}/history")
async def delete_history(phone: str, restaurant_id: Optional[str] = None):
    if collection_users is None: raise HTTPException(status_code=503)
    if restaurant_id:
         collection_users.update_one({"phone": phone}, {"$pull": {"history": restaurant_id}})
         return {"message": "Removed item from history"}
    else:
         collection_users.update_one({"phone": phone}, {"$set": {"history": []}})
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

def has_tag(restaurant, tag):
    """Check if restaurant object has a specific tag in any of its tag categories"""
    tags_obj = restaurant.get("tags", {})
    if not tags_obj: return False
    
    # Flatten values
    all_tags = []
    for v in tags_obj.values():
        if isinstance(v, list): all_tags.extend(v)
        elif isinstance(v, str): all_tags.append(v)
    
    return tag in all_tags

# --- NEW API MODELS ---
class QuestionModeRequest(BaseModel):
    yes_tags: List[str] = []
    no_tags: List[str] = []
    asked_ids: List[int] = []

# ... (Keep imports and configurations at the top)

# --- 1. ADD THIS HELPER FUNCTION (Algorithm Logic) ---
def get_restaurant_tags(restaurant):
    """Helper: Flatten tags into a single set for fast lookup"""
    tags_obj = restaurant.get("tags", {})
    all_tags = set()
    if not tags_obj: return all_tags
    for v in tags_obj.values():
        if isinstance(v, list): all_tags.update(v)
        elif isinstance(v, str): all_tags.add(v)
    return all_tags

# --- NEW ALGORITHM IMPLEMENTATION ---
def filter_restaurants_algo(all_places, yes_tags, no_tags):
    """
    Implementation of the specific filtering logic requested.
    """
    yes_set = set(yes_tags)
    no_set = set(no_tags)
    result_quan = []

    for quan_an in all_places:
        place_tags = get_restaurant_tags(quan_an)
        select_this = True
        
        for criterion in DETERMINING_CRITERIA:
            criterion_set = set(criterion)
            selected_tags = []

            # Check if there are any YES tags relevant to this specific criterion
            # This corresponds to "if yes_tags.size() > 0" in the context of the criterion
            relevant_yes_tags = [t for t in criterion if t in yes_set]

            # --- YES LOGIC ---
            if len(relevant_yes_tags) > 0:
                # User has preferences in this category, enforce them strict
                for tag in criterion:
                    if tag in yes_set:
                        if tag in place_tags:
                            selected_tags.append(tag)
                        else:
                            # User wanted this tag, but place doesn't have it -> Fail
                            select_this = False
            else:
                # User has no preference in this category, keep all valid tags
                for tag in criterion:
                    if tag in place_tags:
                        selected_tags.append(tag)
            
            # --- NO LOGIC ---
            # Remove tags that are in the NO set
            # "for tag in selected_tags: if tag in no_tags: erase"
            selected_tags = [t for t in selected_tags if t not in no_set]
            
            # --- EMPTY CHECK ---
            # "if selected_tags.empty(): select_this = False"
            if not selected_tags:
                select_this = False
                
            # Optimization: Break early if failed
            if not select_this:
                break
        
        if select_this:
            result_quan.append(quan_an)
            
    return result_quan

# --- 2. REPLACE THE OLD "/api/question-mode/next" ENDPOINT ---
# app.py (Add this helper function and update the endpoint)

# --- HELPER: CATEGORY WEIGHTING ---
def get_category_weight(question_tags):
    """
    Returns a weight score based on user preference order:
    1. Món ăn/uống (Index 1) - Highest
    2. Nguyên liệu (Index 2)
    3. Đặc điểm (Index 0)
    4. Origin (Index 3)
    5. Giá tiền (Index 5)
    6. Others (Place, Occasion) - Lowest
    """
    # Mapping Index in DETERMINING_CRITERIA to Weight
    # Higher number = Higher priority
    weights = {
        1: 60, # Món ăn/uống
        2: 50, # Nguyên liệu
        0: 40, # Đặc điểm
        3: 30, # Origin
        5: 20, # Giá tiền
        4: 10, # Place
        6: 10  # Occasion
    }
    
    # Find which category the tag belongs to
    for tag in question_tags:
        for idx, criterion_list in enumerate(DETERMINING_CRITERIA):
            if tag in criterion_list:
                return weights.get(idx, 0)
    return 0

# --- UPDATED ENDPOINT ---
@app.post("/api/question-mode/next")
async def get_next_question(payload: QuestionModeRequest):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="DB not connected")

    # 1. Fetch simplified data
    cursor = collection_quan_an.find({}, {"tags": 1, "_id": 1})
    all_places = list(cursor)

    # 2. Run Filter Algorithm
    filtered_places = filter_restaurants_algo(all_places, payload.yes_tags, payload.no_tags)
    remaining_count = len(filtered_places)

    if remaining_count == 0:
        return {"next_question": None, "remaining_count": 0}

    # 3. Priority Logic: Math Score (Primary) + Category Weight (Secondary)
    best_question = None
    max_priority = -float('inf')      # Primary: Splitting power (Math)
    max_cat_weight = -float('inf')    # Secondary: User preference
    
    available_questions = [q for q in QUESTIONS_DB if q['id'] not in payload.asked_ids]

    if not available_questions:
        return {"next_question": None, "remaining_count": remaining_count}

    n = remaining_count
    
    for q in available_questions:
        q_yes_tags = q.get('yes', {}).get('yes_tag', [])
        
        # A. Calculate Math Priority (How evenly it splits the data)
        cnt = 0
        if q_yes_tags:
            q_tags_set = set(q_yes_tags)
            for place in filtered_places:
                place_tags = get_restaurant_tags(place)
                if not place_tags.isdisjoint(q_tags_set):
                    cnt += 1
        
        # Priority formula: closer to n/2 is better
        if cnt < n:
            priority = cnt
        else:
            priority = n - cnt
            
        # B. Calculate Category Weight
        cat_weight = get_category_weight(q_yes_tags)

        # C. Comparison Logic
        # Case 1: Better Math Score -> Take it
        if priority > max_priority:
            max_priority = priority
            max_cat_weight = cat_weight
            best_question = q
        # Case 2: Equal Math Score -> Check Category Weight
        elif priority == max_priority:
            if cat_weight > max_cat_weight:
                max_cat_weight = cat_weight
                best_question = q
    
    return {
        "remaining_count": remaining_count,
        "next_question": best_question
    }

# --- 3. ADD THIS NEW ENDPOINT FOR FETCHING RESULTS ---
@app.post("/api/question-mode/results")
async def get_results_batch(payload: QuestionModeRequest):
    """
    Called only when showing results (after 5 questions).
    Fetches FULL details (images, address) for 4 random filtered places.
    """
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="DB not connected")

    # 1. Filter using simplified data first
    all_places_simple = list(collection_quan_an.find({}, {"tags": 1, "_id": 1}))
    filtered_simple = filter_restaurants_algo(all_places_simple, payload.yes_tags, payload.no_tags)
    
    if not filtered_simple:
        return {"results": [], "remaining_count": 0}

    # 2. Pick 4 random IDs
    sample_size = min(4, len(filtered_simple))
    selected_docs = random.sample(filtered_simple, sample_size)
    selected_ids = [d["_id"] for d in selected_docs]

    # 3. Fetch FULL details for just these 4 IDs
    full_docs = list(collection_quan_an.find({"_id": {"$in": selected_ids}}))
    
    results = []
    for d in full_docs:
        d = convert_document(d)
        # Normalize thumbnail for frontend
        if "thumbnail" not in d and "places_images" in d and d["places_images"]:
            d["thumbnail"] = d["places_images"][0]
        elif "thumbnail" not in d:
            d["thumbnail"] = "https://placehold.co/150x150"
        results.append(d)

    return {
        "results": results, 
        "remaining_count": len(filtered_simple)
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)