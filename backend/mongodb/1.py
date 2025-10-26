import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

# 🔹 Đường dẫn file gốc (đặt đúng vị trí file plates.employees.json của bạn)
input_file = Path("plates.employees.json")
output_file = Path("plates.employees.generated.json")

# 🔹 Đọc dữ liệu gốc
with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# 🔹 Tạo danh sách mới
new_data = []
for item in data[:10]:  # lấy 10 bản ghi đầu hoặc mới nhất
    # Sinh thời gian ngẫu nhiên trong ±1 giờ
    offset_minutes = random.randint(-60, 60)
    random_time = datetime.now(timezone.utc) + timedelta(minutes=offset_minutes)

    # Sinh ghi chú theo trạng thái
    status = item.get("status", "")
    if status.lower() == "enter":
        note = random.choice(["", "Xe đã vào trước đó"])
    elif status.lower() == "out":
        note = random.choice(["", "Xe đã ra trước đó"])
    else:
        note = ""

    # Thêm trường mới
    item["note"] = note
    item["time"] = {"$date": random_time.isoformat()}
    item["no_data"] = random.choice(("người lạ", ""))

    new_data.append(item)

# 🔹 Ghi ra file mới (không ghi đè)
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print(f"✅ Tạo file mới: {output_file.resolve()}")
