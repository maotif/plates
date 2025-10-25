import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";
import { MongoClient } from "mongodb";
// import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// Tạo __dirname giống CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Kết nối MongoDB
const uri = "mongodb://localhost:27017"; // Địa chỉ MongoDB local
const client = new MongoClient(uri);

let staffCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("employees"); // 🔥 database
    staffCollection = db.collection("staff"); // 🔥 collection
    console.log("✅ Connected to MongoDB (employees.staff)");
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}

// QUAN LY NHAN VIEN
// Serve static files
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")));
app.use("/dist", express.static(path.join(__dirname, "../frontend/dist")));
app.use(
  "/quanly",
  express.static(path.join(__dirname, "../frontend/pages/quanly"))
);

// Route /quanly mở luôn HTML
app.get("/quanly", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/quanly/quanly.html"));
});

// ✅ API: Test Lấy tất cả nhân viên
app.get("/api/staff", async (req, res) => {
  try {
    const staffList = await staffCollection.find().toArray();
    res.json(staffList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
//
// Xóa nhân viên
app.get("/quanly/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await staffCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      // res.send(
      //   `<script>alert('Xóa nhân viên thành công'); window.location.href='/quanly';</script>`
      // );
      res.json({ success: true, message: "Xóa nhân viên thành công" });
    } else {
      // res.send(
      //   `<script>alert('Không tìm thấy nhân viên'); window.location.href='/quanly';</script>`
      // );
      res.json({ success: false, message: "Không tìm thấy nhân viên" });
    }
  } catch (err) {
    console.error(err);
    // res.send(
    //   `<script>alert('Lỗi server'); window.location.href='/quanly';</script>`
    // );
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});
// EDIT NHÂN VIÊN (PUT)
app.put("/quanly/edit/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // { name, rank, position, licensePlate }

  try {
    const result = await staffCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true, message: "Cập nhật thành công" });
    } else {
      res.json({
        success: false,
        message: "Không tìm thấy nhân viên hoặc không thay đổi gì",
      });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi cập nhật" });
  }
});
//
// ✅ Chạy server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB(); // Kết nối DB khi server khởi động
});
