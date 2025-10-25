from flask import Flask, Response, send_from_directory, request, jsonify
import cv2
from test_new_model import process_frame, CameraStream  
from pymongo import MongoClient
from datetime import datetime
from flask_cors import CORS
from api import get_latest_10_data 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# mở camera
# rtsp_url = "http://192.168.1.27:8080/video"
# stream = CameraStream(rtsp_url)
# rtsp_url2 = "http://192.168.1.27:8080/video"
# stream2 = CameraStream(rtsp_url2)

# def generate_frames(stream):
#     while True:
#         ret, frame = stream.read()
#         if not ret:
#             continue

#         # xử lý frame bằng plate.py
#         frame, detected_plates, has_plate = process_frame(frame, 0.3)

#         # encode sang JPEG để stream
#         ret, buffer = cv2.imencode('.jpg', frame)
#         frame = buffer.tobytes()

#         yield (b'--frame\r\n'
#                b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

# @app.route("/video")
# def video():
#     return Response(generate_frames(stream), mimetype="multipart/x-mixed-replace; boundary=frame")
# @app.route("/video2")
# def video2():
#     return Response(generate_frames(stream2), mimetype="multipart/x-mixed-replace; boundary=frame")

# kết nối MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["employees"] # Database employees
collection = db["staff"] # collection staff

# SEARCH
@app.route("/search", methods=["POST"])
def search_employee():
    data = request.json  # frontend sẽ gửi JSON { name, position, xe }
    query = {}
    if data.get("name"):
        query["name"] = {"$regex": data["name"], "$options": "i"}  # tìm gần đúng
    if data.get("position"):
        query["position"] = {"$regex": data["position"], "$options": "i"}
    if data.get("xe"):
        query["xe"] = {"$regex": data["xe"], "$options": "i"}

    results = list(collection.find(query, {"_id": 0}))  # bỏ _id
    return jsonify(results)
# Backend này nhận JSON từ frontend, tìm trong MongoDB và trả kết quả.
#
#  History
# Lấy lịch sử plates của một biển số xe
@app.route("/plates-history")
def plates_history():
    # Lấy biển số từ query string
    xe = request.args.get("xe")  # ← đổi từ "plate" thành "xe"
    if not xe:
        return jsonify({"error": "Thiếu biển số"}), 400

    plates_db = client["plates"]
    collection = plates_db["list_plates"]

    # Tìm tất cả bản ghi có biển số trùng
    history = list(collection.find({"plate": xe}))

    formatted = []
    for h in history:
        formatted.append({
            "id": str(h["_id"]),
            "plate": h["plate"],
            "time_added": h["time"].isoformat(),  # gửi ISO string để JS đọc được
            "result": h.get("result", None)
        })

    # sort theo thời gian mới nhất
    formatted.sort(key=lambda x: x["time_added"], reverse=True)

    return jsonify(formatted)

# 
# ADD
@app.route("/add_employee",methods =["POST"])
def add_employee():
    data = request.json
    if not data.get("name") or not data.get("position") or not data.get("xe"):
        return jsonify({"error":"Thiết dữ liệu"}),400
    
    new_employee = {
        "name":data["name"],
        "position":data["position"],
        "xe":data["xe"],
        "time_added":datetime.utcnow()
    }
    try:
        result = collection.insert_one(new_employee)
        return jsonify({"success": True, "id": str(result.inserted_id)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# #route show infomation
@app.route("/info")
def info():
    return send_from_directory(app.static_folder, "info.html")

############### Lưu biển số mới nhất #################
latest_result = None  # danh sách lưu các biển số nhận dạng được gần nhất

@app.route("/update_plate", methods=["POST"])
def update_plate():
    """Nhận biển số từ test_new_model.py"""
    global latest_result
    data = request.json
    plate = data.get("plate")
    if not plate:
        return jsonify({"error": "Thiếu dữ liệu"}), 400

        # ✅ Tìm trong MongoDB nhân viên có trường xe trùng biển số
    found = collection.find_one({"xe": plate})

    if found:
        found["_id"] = str(found["_id"])  # chuyển ObjectId sang string để JSON hóa
        found["time"] = datetime.utcnow().isoformat()
        found["status"] = "nhân viên"
        latest_result = found
    else:
        # Không tìm thấy → thêm bản ghi "người lạ"
        latest_result = {
            "plate": plate,
            "status": "người lạ",
            "time": datetime.utcnow().isoformat()
        }

    # Giới hạn lưu tối đa 20 bản ghi gần nhất
    
    return jsonify({"status": "ok"})

@app.route("/latest_plates")
def latest_plates():
    if latest_result is None:
        return jsonify({"plate": None, "status": "chưa có dữ liệu"})
    """Trả về danh sách biển số mới nhất để frontend cập nhật"""
    return jsonify(latest_result) 

@app.route("/dataNew" , methods=["GET"])
def data_new():
    data_result = get_latest_10_data()
    if data_result is None:
        return jsonify("không có data")
    return jsonify(data_result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
