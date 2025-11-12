import os
import certifi
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

# --- 1. CẤU HÌNH ---
# Prefer environment variables in production; fall back to hardcoded string for local dev
CONNECTION_STRING = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://lequocvi2412_db_user:123456789#@cluster0.ujbl7hs.mongodb.net/?appName=Cluster0",
)
DATABASE_NAME = "du_lich_am_thuc"
COLLECTION_NAME = "quan_an"

# --- 2. KHỞI TẠO APP & BIẾN TOÀN CỤC ---
app = FastAPI()
db = None
collection_quan_an = None

# --- 3. SỰ KIỆN STARTUP (Kết nối DB khi khởi động) ---
@app.on_event("startup")
def startup_db_client():
    global db, collection_quan_an
    try:
        if "abcde.mongodb.net" in CONNECTION_STRING:
            print("LỖI NGHIÊM TRỌNG: Bạn chưa thay đổi CONNECTION_STRING mẫu!")
            return
        print("Đang kết nối tới MongoDB Atlas...")
        ca = certifi.where()
        client = MongoClient(CONNECTION_STRING, tlsCAFile=ca, server_api=ServerApi('1'))
        client.admin.command('ping')
        print("✅ Kết nối MongoDB thành công!")
        db = client[DATABASE_NAME]
        collection_quan_an = db[COLLECTION_NAME]
    except Exception as e:
        print(f"LỖI KẾT NỐI MONGODB: {e}")

# --- 4. CẤU HÌNH CORS (Cho phép React gọi) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 5. DATA MODELS (Cho việc Update) ---
class NewReview(BaseModel):
    comment: str

class FilterRandomRequest(BaseModel):
    tags: Dict[str, Any] | None = None
    count: int = 3
    geo: Dict[str, Any] | None = None  # { center: {lat,lng}, maxKm: number }

class SpecialityVNUpdate(BaseModel):
    ids: List[str] | None = None            # Danh sách id nhà hàng (string ObjectId)
    names_contains: List[str] | None = None # Cập nhật theo tên chứa chuỗi (không phân biệt hoa thường)
    value: bool = True                      # true = đặc sản VN, false = không

# --- 6. HÀM HELPER (Chuyển đổi ObjectId) ---
def convert_document(document):
    if "_id" in document:
        document["id"] = str(document["_id"])
        del document["_id"]
    return document

# --- 7. API ENDPOINT (Các endpoint hiện có) ---
@app.get("/api/restaurant/{restaurant_id}")
async def get_restaurant_details(restaurant_id: str):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server: Không thể kết nối tới Database.")
    try:
        obj_id = ObjectId(restaurant_id)
        restaurant = collection_quan_an.find_one({"_id": obj_id})
        if restaurant:
            return convert_document(restaurant)
        else:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhà hàng")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

@app.patch("/api/restaurant/{restaurant_id}/add_review")
async def add_review_to_restaurant(restaurant_id: str, review: NewReview):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server: Không thể kết nối tới Database.")
    try:
        obj_id = ObjectId(restaurant_id)
        result = collection_quan_an.update_one(
            {"_id": obj_id},
            {"$push": {"review": review.comment}}
        )
        if result.matched_count == 1:
            return {"message": "Thêm review thành công"}
        else:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhà hàng để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

@app.delete("/api/restaurant/{restaurant_id}")
async def delete_restaurant(restaurant_id: str):
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server: Không thể kết nối tới Database.")
    try:
        obj_id = ObjectId(restaurant_id)
        result = collection_quan_an.delete_one({"_id": obj_id})
        if result.deleted_count == 1:
            return {"message": f"Xóa nhà hàng (ID: {restaurant_id}) thành công"}
        else:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhà hàng để xóa")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

# --- 8.1. ENDPOINT LỌC NGẪU NHIÊN THEO TAG (AND) ---
@app.post("/api/filter-random")
async def filter_random(payload: FilterRandomRequest):
    """
    Lọc nhà hàng theo TẤT CẢ tag được chọn (AND), sau đó trả về ngẫu nhiên `count` bản ghi.

    Body mẫu:
    {
        "tags": {"price_range": "rẻ", "cuisine_origin": "Việt", "main_dishes": ["lẩu", "gà"]},
        "count": 3
    }
    """
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server: Không thể kết nối tới Database.")

    try:
        tags = payload.tags or {}
        size = max(1, min(int(payload.count or 3), 50))

        key_map = {
            # Budget
            "price_range": "tags.price_range",
            "price": "tags.price_range",
            "budget": "tags.price_range",
            # Origin
            "cuisine_origin": "tags.cuisine_origin",
            "origin": "tags.cuisine_origin",
            "country": "tags.cuisine_origin",
            # Food type / main dishes
            "main_dishes": "tags.main_dishes",
            "foodType": "tags.main_dishes",
            # Specialities
            "specialities": "tags.specialities",
            "speciality": "tags.specialities",
            "features": "tags.specialities",
            # Vietnamese speciality boolean
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

        # If geo provided, prefer $geoNear as first stage
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
                # If $geoNear fails (e.g., no index), fall back to plain match
                if query_obj:
                    pipeline.append({"$match": query_obj})
        else:
            # No geo: regular match
            if and_clauses:
                pipeline.append({"$match": {"$and": and_clauses}})

        pipeline.append({"$sample": {"size": size}})

        docs = list(collection_quan_an.aggregate(pipeline))
        return [convert_document(d) for d in docs]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

# --- 8. ENDPOINT MỚI ĐỂ LẤY TẤT CẢ ID ---
@app.get("/api/restaurants/all_ids")
async def get_all_restaurant_ids():
    """
    Lấy danh sách (string) của TẤT CẢ _id nhà hàng trong database.
    """
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server: Không thể kết nối tới Database.")
        
    try:
        cursor = collection_quan_an.find({}, {"_id": 1})
        id_list = [str(doc["_id"]) for doc in cursor]
        return id_list
            
    except Exception as e:
        print(f"Lỗi truy vấn all_ids: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

# --- 9. ADMIN: Đặt cờ 'tags.speciality_vn' cho nhiều quán ---
@app.post("/api/admin/set_speciality_vn")
async def admin_set_speciality_vn(payload: SpecialityVNUpdate):
    """
    CẬP NHẬT HÀNG LOẠT cờ đặc sản VN.
    Nguy hiểm: không có auth, chỉ dùng trong môi trường dev/test!

    Body ví dụ:
    {
      "ids": ["653a...", "653b..."],
      "names_contains": ["sen", "lẩu"],
      "value": true
    }
    """
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server: Không thể kết nối tới Database.")

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
            # tạo regex không phân biệt hoa thường cho mỗi chuỗi
            for kw in payload.names_contains:
                if isinstance(kw, str) and kw.strip():
                    or_filters.append({"name": {"$regex": kw.strip(), "$options": "i"}})

        if not or_filters:
            raise HTTPException(status_code=400, detail="Cần cung cấp 'ids' hoặc 'names_contains'.")

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

# (Hàm main để chạy app)
if __name__ == "__main__":
    print("Khởi chạy API server tại http://127.0.0.1:8000")
    # Local dev: run with Uvicorn. In production (e.g., Render), use either
    #   uvicorn backend.app:app --host 0.0.0.0 --port $PORT
    # or gunicorn with uvicorn workers:
    #   gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:$PORT backend.app:app
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)