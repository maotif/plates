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
    try:
        new_data["plateNum"] =int(new_data.get("plateNum"))
        document_id = new_data.get("_id")
        if not document_id:
            return {"success": False, "message": "Thiếu ID"}

        query = {"_id": ObjectId(document_id)}
        new_value = new_data.copy()

        if new_data.get("no_data"):
            emp = employees.find_one({"name": new_data["no_data"],"plateNum": int(new_data.get("plateNum")),"position": new_data["position"],"rank": new_data["rank"]})
            new_value["name"]=new_data.get("no_data")
            new_value.pop("no_data", None)

        else:
            emp = employees.find_one({"name": new_data["name"],"plateNum": int(new_data.get("plateNum")),"position": new_data["position"],"rank": new_data["rank"]})
            new_value["name"]=new_data.get("name")
            new_value.pop("no_data", None)
            
        if emp:
            query_emp = {"_id":emp.get("_id")}
            new_value.pop("_id", None)
            new_value.pop("note", None)
            print("empsave",new_value)
            employees.update_one(query_emp,{"$set":new_value})
            new_data["name"]=emp.get("name")
            new_data["no_data"]=""
        else:
            if "no_data" not in new_data and new_data.get("name"):
                new_data["no_data"] = new_data.get("name")
                new_data["name"] = ""
            elif "no_data" in new_data:
               new_data["name"] = ""
        new_data.pop("_id", None)
        plates.update_one(query,{"$set":new_data,"$currentDate": {"time": True}})
        return {"success": True, "message": "Cập nhật thành công", "updated": new_data}
    except Exception as e:
        return {"success": False, "message": str(e)}

def data_enter(sta,page,limit):
    print("🔍 Tìm kiếm dữ liệu vào...")
    now = datetime.now(timezone.utc)
    time_24h_ago = now - timedelta(hours=24)
    query = {}       
    query["status"] = sta
    query["time"] = {"$gte": time_24h_ago}
    try:
        page = max(1, int(page))
        limit = max(1, int(limit))
    except (ValueError, TypeError):
        page = 1
        limit = 2
    # tài liệu khớp
    skip_count = (page - 1) * limit
    total_docs = plates.count_documents(query)
    docs_cursor = plates.find(query) \
                        .sort("time", -1) \
                        .skip(skip_count) \
                        .limit(limit)
                        
    docs = list(docs_cursor)
    total_pages = (total_docs + limit - 1) // limit 
    
    for doc in docs:
        doc["_id"] = str(doc["_id"]) 
        if "time" in doc and isinstance(doc["time"], datetime):
            # Chuyển đổi datetime object sang chuỗi ISO để gửi về FE
            doc["time"] = doc["time"].isoformat() 
    
    return {
        "data": docs,
        "pagination": {
            "total_records": total_docs,
            "total_pages": total_pages,
            "current_page": page,
            "page_size": limit
        }
    }