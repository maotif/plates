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
        new_values = {}
        examination = {"information": new_data.get("information"), "bien_so": new_data.get("bien_so"), "khu_vuc": new_data.get("khu_vuc")}

        # ✅ Cập nhật trạng thái

        if "statue" in new_data:
            if new_data.get("statue") == "ra":
                new_values["trang_thai"] = False
                new_values["statue"] = "ra"
            elif new_data.get("statue") == "vào":
                new_values["trang_thai"] = True
                new_values["statue"] = "vào"

        # ✅ Cập nhật thông tin nhân viên nếu có
        if examination["information"]:
            # lấy thông tin nhân viên từ collection employees
            emp = employees.find_one({"employee": examination["information"],"bien_so": int(new_data.get("bien_so")),"khu_vuc": examination["khu_vuc"]})
            if emp:
                
                employees.update_one({"employee": examination["information"], "bien_so": int(new_data["bien_so"])}, {"$set": new_values, "$currentDate": {"time_cap_nhat": True}})
                # thay đổi thông tin information, chuc_vu theo thông tin nhân viên
                
                new_values["chuc_vu"] = emp["chuc_vu"]
                new_values["information"] = ""
                for field in ["khu_vuc", "bien_so", "chuc_vu", "employee"]:
                    if field in emp:
                        new_data[field] = emp[field]
            else:
                new_values["information"] = examination["information"]
                new_values["employee"] = ""
        # ✅ Cập nhật lỗi
        if "error" in new_data:
            if not new_data["error"]:  # None hoặc ""
                new_values["error"] = ""
            else:
                new_values["error"] = new_data["error"]
        # ✅ Cập nhật các trường khác (nếu có giá trị)
        for k, v in new_data.items():
            if k not in ["_id", "trang_thai", "error","time","information","employee"] and v not in [None, ""]:
                new_values[k] = v
        if not new_values:
            return {"success": False, "message": "Không có dữ liệu nào để cập nhật"}
        result = plates.update_one(
           query,
            {
                "$set": new_values,
                "$currentDate": {"time": True}
            }
        )

        if result.matched_count == 0:
            return {"success": False, "message": "Không tìm thấy bản ghi để cập nhật"}

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