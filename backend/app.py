import uvicorn
import certifi
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId
from pydantic import BaseModel

# --- 1. CẤU HÌNH ---
CONNECTION_STRING = "mongodb+srv://lequocvi2412_db_user:123456789#@cluster0.ujbl7hs.mongodb.net/?appName=Cluster0"
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
    # (Code của endpoint này giữ nguyên)
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
    # (Code của endpoint này giữ nguyên)
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

# --- 8. ENDPOINT MỚI ĐỂ LẤY TẤT CẢ ID ---
@app.get("/api/restaurants/all_ids")
async def get_all_restaurant_ids():
    """
    Lấy danh sách (string) của TẤT CẢ _id nhà hàng trong database.
    """
    if collection_quan_an is None:
        raise HTTPException(status_code=503, detail="Lỗi server: Không thể kết nối tới Database.")
        
    try:
        # find({}, {"_id": 1}) chỉ lấy trường _id, rất nhanh
        cursor = collection_quan_an.find({}, {"_id": 1})
        
        # Chuyển đổi ObjectId thành string
        id_list = [str(doc["_id"]) for doc in cursor]
        
        return id_list
            
    except Exception as e:
        print(f"Lỗi truy vấn all_ids: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi server: {e}")

# (Hàm main để chạy app)
if __name__ == "__main__":
    print("Khởi chạy API server tại http://127.0.0.1:8000")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)