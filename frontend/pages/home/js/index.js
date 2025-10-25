document.addEventListener("DOMContentLoaded", async () => {
  fetch("./html/camera.html")
    .then((response) => {
      if (!response.ok) throw new Error("Không thể tải camera.html");
      return response.text();
    })
    .then((html) => {
      document.getElementById("home").innerHTML = html;
      mng_plates();
      document.getElementById("sum").addEventListener("click", () => {
        mng_plates();
      });
      document.getElementsById("refresh-btn").addEventListener("click", () => {
        mng_plates();
      });
    })
    .catch((error) => {
      console.error("Lỗi khi load file:", error);
    });
});

async function mng_plates() {
  try {
    const main = await fetch("http://127.0.0.1:5000/dataNew");
    const data = await main.json();
    console.log(data);
    const tableBody = document.getElementById("recentVehiclesTable");
    tableBody.innerHTML = ""; // Xóa dữ liệu cũ

    data.forEach((item, index) => {
      const hasInfo =
        (item.information && item.information.trim() !== "") ||
        (item.error && item.error.trim() !== "");
      let formattedTime = "";
      if (item.time) {
        try {
          formattedTime = new Date(item.time).toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour12: false, // dùng 24h
          });
        } catch {
          formattedTime = item.time;
        }
      }
      createStatusBadge(item, index, formattedTime, hasInfo, tableBody);
    });
    document.querySelectorAll(".statue-select").forEach((select) => {
      const value = select.value;
      if (value === "vào") {
        select.style.backgroundColor = "green";
        select.style.color = "white";
      } else if (value === "ra") {
        select.style.backgroundColor = "red";
        select.style.color = "white";
      }
    });
    // hàm chỉnh sửa
    edit_home();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu mới:", error);
  }
}
// Khởi tạo camera 1
// Biến lưu trữ camera streams
let camera1Stream = null;
let camera2Stream = null;

// Khởi tạo trang
function edit_home() {
  const editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");
      const inputs = row.querySelectorAll(".edit_new,select.edit");
      const save_edits = row.querySelectorAll(".edit");
      inputs.forEach((input) => {
        input.removeAttribute("readonly");
        input.removeAttribute("disabled");

        input.style.backgroundColor = "#fff";
      });
      // thay đổi màu chữ cho select
      const select = row.querySelector("select.edit");
      select.style.color = "black";

      button.classList.add("hide");
      const saveButton = row.querySelector(".save-btn");
      saveButton.classList.remove("hide");
      saveButton.addEventListener("click", async () => {
        const data = {};
        save_edits.forEach((save_edit) => {
          data[save_edit.name] = save_edit.value;
        });
        try {
          const res = await fetch(`http://127.0.0.1:5000/api/home/edit`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const Data = await res.json();
          if (!Data.success) {
            alert(Data.message);
          }
          // Sau khi lưu, đặt lại trạng thái readonly
          inputs.forEach((input) => {
            input.setAttribute("readonly", true);
            input.style.backgroundColor = "transparent";
          });
          // Ẩn nút lưu và hiện lại nút sửa
          saveButton.classList.add("hide");
          button.classList.remove("hide");
          // Cập nhật lại bảng
          mng_plates();
        } catch (err) {
          console.error(err);
          alert("Lỗi khi cập nhật nhân viên");
        }
      });
    });
  });
}
// Tạo badge trạng thái
function createStatusBadge(item, index, formattedTime, hasInfo, tableBody) {
  const row = `
      <tr>
        <td>${index + 1}</td>
        <td class="hide"><input class="edit " name="_id" type="text" value="${
          item._id || ""
        }" readonly></td>
        <td class="hide"><input class="edit edit_new" name="trang_thai" type="text" value="${
          item.trang_thai || ""
        }" readonly></td>
        <td><input class="edit" name="time" type="text" value="${
          formattedTime || ""
        }" readonly></td>
        <td class="hide"></td>
        <td>khu vực : <input class="edit edit_new" name="khu_vuc" type="text" value="${
          item.khu_vuc || ""
        }" style="display:inline-block; width:100px;" readonly>
          biển số : <input class="edit edit_new" name="bien_so" type="number" value="${
            item.bien_so || ""
          }" style="display:inline-block; width:100px;" readonly></td>
        <td><input class="edit edit_new" name="${
          item.employee
            ? "employee"
            : item.information
            ? "information"
            : "unknown"
        }" type="text" value="${
    item.employee || item.information || ""
  }" style="${hasInfo ? "color: red; font-weight: bold;" : ""}" readonly></td>
        <td><input class="edit edit_new" name="chuc_vu" type="text" value="${
          item.chuc_vu || ""
        }" readonly></td>
        <td>
          <select class="form-select edit statue-select" style="display:inline-block; width:100px;padding:4px;" name="statue" disabled>
            <option style="background-color: green;" value="vào" ${
              item.statue === "vào" ? "selected" : ""
            }>Vào</option>
            <option style="background-color: red;" value="ra" ${
              item.statue === "ra" ? "selected" : ""
            }>Ra</option>
          </select>
        </td>
        <td>
          <input class="edit edit_new" name="error" type="text" value="${
            item.error || ""
          }" style="${
    hasInfo ? "color: red; font-weight: bold;" : ""
  }" readonly></td>
        <td>
          ${
            hasInfo
              ? `
            <button class="btn btn-warning edit-btn">Sửa</button>
            <button class="btn btn-warning save-btn hide">lưu</button>
            `
              : `
            <button class="btn btn-warning edit-btn hide">Sửa</button>
            `
          }
      </td>
      </tr>
    `;

  tableBody.insertAdjacentHTML("beforeend", row);
}
