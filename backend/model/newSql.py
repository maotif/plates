from pymongo import MongoClient
from datetime import datetime, timezone

# Kết nối
uri = "mongodb://localhost:27017"
connection = MongoClient(uri)

# Chọn database và collection
db = connection["plates"]
plates = db["plates"]

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
    if state=="Enter":
        doc["error"]= "xe đã vào trước đó"
        plates.insert_one(doc)
    else:
        doc["error"]= "xe đã ra trước đó"
        plates.insert_one(doc)

def save_plate(doc, newdoc,status):
    document_id = doc["_id"]
    query = {"_id": document_id}  
    
    newdoc["time"] = datetime.utcnow()
    newdoc["error"]=""
    newdoc["no_data"]="người lạ"
    doc["status"] = status

    plates.insert_one(newdoc)
    employees.update_one(query, doc)

def noData_plate(line1,line2,status):
    plate_number = int(line2)
    doc_new = {
        "name":"",
        "avatar":"",
        "rank":"",
        "position":"",
        "plateArea": line1,
        "plateNum": plate_number,
        "time": datetime.utcnow(),
        "status": status,
        "no_data": "người lạ",
        "note": ""
    }

    plates.insert_one(doc_new)

def example_plate(line1,line2,status):
    plate_number = int(line2)
    query = {"plateNum": plate_number}
    if status is True:
        trang_thai = "Enter"
    else:
        trang_thai = "Out"

    doc = employees.find_one(query)

    if doc:
        sta = doc.get("status")
        new_doc = doc.copy()
        if "_id" in new_doc:
            del new_doc["_id"]
        new_doc["time"] = datetime.utcnow()
        if trang_thai==sta:
            error_status(new_doc, trang_thai)
            return True
        else:
            save_plate(doc,new_doc, trang_thai)
            return False

    else:
        no_plateData = plates.find_one(query, sort=[("time", -1)])
        if no_plateData:
            sta = no_plateData.get("status")
            if sta==trang_thai:
                error_status(no_plateData, trang_thai)
                return True
            else:
                noData_plate(line1,line2,trang_thai)
                return False
        else:
            noData_plate(line1,line2,trang_thai)
            return False

def example_status(line1,line2,status):
    plate_number = int(line2)
    query = {"plateNum": plate_number}
    doc = employees.find_one(query)
    trang_thai = None
    if status is True:
        trang_thai == "Enter"
    else :
        trang_thai == "Out"

    if doc:
        new_doc = doc.copy()
        if "_id" in new_doc:
            del new_doc["_id"]
        new_doc["time"] = datetime.utcnow()
        Sta = doc.get("status")
        
        if trang_thai==Sta:
            return True
        else:
            save_plate(doc,new_doc, trang_thai)
            return False
    else:
        no_plateData = plates.find_one(query, sort=[("time", -1)])
        if no_plateData:
            Sta = no_plateData.get("status")
            if Sta==trang_thai:
                return True
            else:
                noData_plate(line1,line2,trang_thai)
                return False
        else:
            noData_plate(line1,line2,trang_thai)
            return False
 
            
