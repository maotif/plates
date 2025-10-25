from pymongo import MongoClient
from datetime import datetime, timezone

# Kết nối
uri = "mongodb://localhost:27017"
connection = MongoClient(uri)

# Chọn database và collection
db = connection["plates"]
data = db["plates"]

parking = db["parking"]
out = db["plates_out"]
employees = db["employees"]

# Thêm một bản ghi

# result = collection.insert_one(data)
# thêm nhiều bản ghi result = collection.insert_many(data_list)
# Kiểm tra _id được thêm
# print("Inserted ID:", result.inserted_id)

# Lấy ra bản ghi vừa thêm
# doc = collection.find_one({"_id": result.inserted_id})
# print("Inserted document:", doc)
 # lấy nhiều 
# for doc in collection.find():
#     print(doc)
# lấy theo điều kiện
# for doc in collection.find({"color": "blue"}):
#     print(doc)

#xoá , xoá nhiều 
# collection.delete_many({"color": "blue"})
def error_status(doc, state):
    if state==True:
        doc["error"]= "xe đã vào trước đó"
        data.insert_one(doc)
    else:
        doc["error"]= "xe đã ra trước đó"
        data.insert_one(doc)

def save_plate(doc, newdoc,status):
    document_id = doc["_id"]
    query = {"_id": document_id}  
    
    newdoc["time"] = datetime.utcnow()
    newdoc["trang_thai"] = status
    if status==True:
        newdoc["statue"] = "vao"
        newdoc["error"] = ""
    else:
        newdoc["statue"] = "ra"
        newdoc["error"] = ""
        delete_query = {"bien_so": doc["bien_so"]}
    data.insert_one(newdoc)
    update_op = {
        "$set": {
            "trang_thai": status,
            "time_cap_nhat": datetime.utcnow() # Thêm trường thời gian cập nhật (tùy chọn)
        }
    }
    employees.update_one(query, update_op)

def noData_plate(line1,line2,trangthai):
    plate_number = int(line2)
    doc_new = {
        "khu_vuc": line1,
        "bien_so": plate_number,
        "time": datetime.utcnow(),
        "trang_thai": trangthai,
        "infomation": "người lạ",
        "error": ""
    }
    if trangthai==True:
        doc_new["statue"] = "vao"
    else:
        doc_new["statue"] = "ra"
    data.insert_one(doc_new)

def example_plate(line1,line2,trangthai):
    plate_number = int(line2)
    query = {"bien_so": plate_number}
    doc = employees.find_one(query)

    if doc:
        trang_thai = doc.get("trang_thai")
        new_doc = doc.copy()
        if "_id" in new_doc:
            del new_doc["_id"]
        new_doc["time"] = datetime.utcnow()
        if trang_thai==trangthai:
            if trangthai==True:
                error_status(new_doc, trang_thai)
                return True
            else:
                error_status(new_doc, trang_thai)
                return True
        else:
            save_plate(doc,new_doc, trangthai)
            return False

    else:
        query = {"bien_so": plate_number}
        parking_doc = parking.find_one(query)
        if parking_doc:
            if trangthai==True:
                return True
            else:
                noData_plate(line1,line2,trangthai)
                return False
        else:
            if trangthai==True:
                noData_plate(line1,line2,trangthai)
                return False
            else:
                print("Biển số không tồn tại trong hệ thống.")
                return True

def example_status(line1,line2,trangthai):
    plate_number = int(line2)
    query = {"bien_so": plate_number}
    doc = employees.find_one(query)

    if doc:
        new_doc = doc.copy()
        if "_id" in new_doc:
            del new_doc["_id"]
        new_doc["time"] = datetime.utcnow()
        trang_thai = doc.get("trang_thai")
        
        if trang_thai==trangthai:
            return True
        else:
            save_plate(doc,new_doc, trangthai)
            return False
    else:
        query = {"bien_so": plate_number}
        parking_doc = parking.find_one(query)
        if parking_doc:
            if trangthai==True:
                return True
            else:
                noData_plate(line1,line2,trangthai)
                return False
        else:
            if trangthai==True:
                noData_plate(line1,line2,trangthai)
                return False
            else:
                return True
            
