document.addEventListener("DOMContentLoaded", () => {
  fetch("./html/camera.html")
    .then((response) => {
      if (!response.ok) throw new Error("Không thể tải camera.html");
      return response.text();
    })
    .then((html) => {
      document.getElementById("show_camera").innerHTML = html;
    })
    .catch((error) => {
      console.error("Lỗi khi load file:", error);
    });
});
document.addEventListener("DOMContentLoaded", () => {
  fetch("./html/table.html")
    .then((response) => {
      if (!response.ok) throw new Error("Không thể tải table.html");
      return response.text();
    })
    .then((html) => {
      document.getElementById("table").innerHTML = html;
    })
    .catch((error) => {
      console.error("Lỗi khi load file:", error);
    });
});
// Đặt hàm này ở file chính (main.js)
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-btn")) {
    const button = e.target;
    const row = button.closest("tr");

    // 🟢 chỉ chọn các input có class="edit"
    const editableInputs = row.querySelectorAll("input.edit");

    const isEditing = button.textContent.trim() === "sửa";

    if (isEditing) {
      // Khi bấm "Lưu" → khóa lại
      editableInputs.forEach((input) => input.setAttribute("readonly", true));
      button.textContent = "sửa";

      const data = {};
      row.querySelectorAll("input").forEach((input) => {
        data[input.name] = input.value;
      });

      console.log("Dữ liệu cần gửi lên backend:", data);
    } else {
      // Khi bấm "Sửa" → cho phép chỉnh sửa các ô có class edit
      editableInputs.forEach((input) => input.removeAttribute("readonly"));
      button.textContent = "xoá";
    }
  }
});
