from bson import ObjectId
from pymongo import MongoClient
import requests
from datetime import datetime, timedelta, timezone

# Kết nối MongoDB
uri = "mongodb://localhost:27017"
connection = MongoClient(uri)

# Chọn database và collection
db = connection["plates"]
plates = db["plates"]      # ← đổi tên rõ ràng
parking = db["parking"]
out = db["plates_out"]
employees = db["employees"]

def get_latest_10_data():
    """Lấy 10 bản ghi mới nhất trong bảng data"""
    # Sắp xếp theo thời gian giảm dần (mới nhất trước), giới hạn 10 bản ghi
    docs = list(plates.find().sort("time", -1).limit(10))

    # Chuyển ObjectId và datetime sang string để JSON hoá dễ dàng
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        if "time" in doc:
            doc["time"] = doc["time"].isoformat()
    
    return docs

def edit_home(new_data):
    print("data",new_data)
    try:
        document_id = new_data.get("_id")
        if not document_id:
            return {"success": False, "message": "Thiếu ID"}

        query = {"_id": ObjectId(document_id)}
        emp = employees.find_one({"name": new_data["no_data"],"plateNum": int(new_data.get("plateNum")),"position": new_data["position"],"rank": new_data["rank"]})
        new_value = new_data.copy()
        if emp:
            query_emp = {"_id":emp.get("_id")}
            new_value["name"]=new_data.get("no_data")
            new_value.pop("no_data", None)
            new_value.pop("_id", None)
            new_value.pop("note", None)
            employees.update_one(query_emp,{"$set":new_value})
        plates.update_one(query,{"$set":new_data,"$currentDate": {"time": True}})
        return {"success": True, "message": "Cập nhật thành công", "updated": new_values}
    except Exception as e:
        print("❌ Lỗi khi cập nhật:", e)
        return {"success": False, "message": str(e)}

def data_enter(status):
    print("🔍 Tìm kiếm dữ liệu vào...")
    now = datetime.now(timezone.utc)
    time_24h_ago = now - timedelta(hours=24)
    query = {
        "trang_thai": status,
        # "time_cap_nhat": {"$gte": time_24h_ago}
    }
    docs_cursor = plates.find(query).sort("time", -1)
    
    docs = list(docs_cursor)
    print(f"✅ Tìm thấy {len(docs)} bản ghi vào trong 24h qua với trạng thái {status}.")
    # biến tính số trang
    total_docs = len(docs)
    total_pages = (total_docs // 10) + (1 if total_docs % 10 > 0 else 0)    

    for doc in docs:
        doc["_id"] = str(doc["_id"])  # Chuyển ObjectId thành chuỗi để dễ đọc
        if "time" in doc:
            doc["time"] = doc["time"].isoformat()  # Chuyển datetime thành chuỗi ISO

    return docs