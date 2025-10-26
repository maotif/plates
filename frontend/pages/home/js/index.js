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
        (item.no_data && item.no_data.trim() !== "") ||
        (item.note && item.note.trim() !== "");
      let formattedTime = "";
      if (item.time) {
        try {
          // 1. Thêm 'Z' vào cuối chuỗi để JavaScript nhận diện đây là thời gian UTC
          const timeAsUTC = item.time + "Z";

          formattedTime = new Date(timeAsUTC).toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour12: false, // dùng 24h

            // 2. PHẢI CÓ: Các tùy chọn định dạng đầy đủ
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        } catch (e) {
          // Nếu chuyển đổi thất bại, giữ nguyên giá trị gốc
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
        <td>
          ${formattedTime || ""}
        </td>
        <td> khu vực : <input class="edit edit_new " name="plateArea" type="text" value="${
          item.plateArea || ""
        }" style="display:inline-block; width:20%; padding:0" readonly>
          biển số : <input class="edit edit_new" name="plateNum" type="number" value="${
            item.plateNum || ""
          }" style="display:inline-block; width:35%;" readonly></td>
        <td style="width:200px"><input class="edit edit_new" name="${
          item.name ? "name" : item.no_data ? "no_data" : "unknown"
        }" type="text" value="${item.name || item.no_data || ""}" style="${
    hasInfo ? "color: red; font-weight: bold;" : ""
  }" readonly></td>
        <td >
  <div class="d-flex justify-content-between" style="gap: 4%;">
    <input class="form-control edit edit_new"
           name="position"
           type="text"
           value="${item.position || ""}"
           readonly
           style="width: 48%;">
    <input class="form-control edit edit_new"
           name="rank"
           type="text"
           value="${item.rank || ""}"
           readonly
           style="width: 48%;">
  </div>
</td>
        <td>
          <select class="form-select edit statue-select" style="display:inline-block; width:100px;padding:4px;" name="statue" disabled>
            <option style="background-color: green;" value="Enter" ${
              item.statue === "Enter" ? "selected" : ""
            }>Vào</option>
            <option style="background-color: red;" value="Out" ${
              item.statue === "Out" ? "selected" : ""
            }>Ra</option>
          </select>
        </td>
        <td>
          <input class="edit edit_new" name="note" type="text" value="${
            item.note || ""
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
