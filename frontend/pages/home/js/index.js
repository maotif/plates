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
      document.getElementById("enter").addEventListener("click", () => {
        page = 1;
        sta = 1;
        mng_Nb(sta, page);
        // lấy id
        const clk = document.getElementById("pagination-controls");
        clk.classList.remove("hide");
      });
      document.getElementById("out").addEventListener("click", () => {
        page = 1;
        sta = 2;
        mng_Nb(sta, page);
        const clk = document.getElementById("pagination-controls");
        clk.classList.remove("hide");
      });
    })
    .catch((error) => {
      console.error("Lỗi khi load file:", error);
    });
});
async function mng_Nb(sta, page) {
  try {
    const data_to_send = {
      status: sta === 1 ? "Enter" : "Out",
      pageNB: page,
      limit: 2,
    };
    const res = await fetch(`http://127.0.0.1:5000/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data_to_send),
    });
    const responseData = await res.json();
    const data = responseData.data;
    const pagination = responseData.pagination;
    const tableBody = document.getElementById("recentVehiclesTable");
    tableBody.innerHTML = ""; // Xóa dữ liệu cũ

    const startIndex = (pagination.current_page - 1) * pagination.page_size;
    data.forEach((item, index) => {
      const rowNumber = startIndex + index + 1;
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

      createStatusBadge(item, rowNumber - 1, formattedTime, hasInfo, tableBody);
    });
    // hàm phân trang
    renderPagination(sta, pagination);
    // màu select
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
    edit_home(sta);
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu mới:", error);
  }
}
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
    edit_home(0);
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu mới:", error);
  }
}
// Khởi tạo camera 1
// Biến lưu trữ camera streams
let camera1Stream = null;
let camera2Stream = null;

// Khởi tạo trang
function edit_home(sta) {
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
          if (sta == 0) {
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
          } else {
            data["value_sta"] = sta;
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
            mng_Nb(sta);
          }
        } catch (err) {
          console.error(err);
          alert("Lỗi khi cập nhật nhân viên");
        }
      });
    });
  });
}
//  phân trang
function renderPagination(sta, pagination) {
  const container = document.getElementById("pagination-controls");
  if (!container) return; // Đảm bảo container tồn tại
  container.innerHTML = ""; // Xóa nút cũ

  const { total_pages, current_page, page_size } = pagination;
  if (total_pages <= 1) return;

  // 1. Tính toán các nút số cần hiển thị (logic 3 nút)
  let startPage, endPage;

  if (total_pages <= 3) {
    // Tổng số trang <= 3, hiển thị tất cả
    startPage = 1;
    endPage = total_pages;
  } else if (current_page === 1) {
    // Trang đầu tiên: 1 2 3 (hoặc 1 2)
    startPage = 1;
    endPage = Math.min(3, total_pages);
  } else if (current_page === total_pages) {
    // Trang cuối cùng: total_pages-2, total_pages-1, total_pages
    startPage = Math.max(1, total_pages - 2);
    endPage = total_pages;
  } else {
    // Các trang ở giữa: N-1, N, N+1
    startPage = current_page - 1;
    endPage = current_page + 1;
  }

  // Đảm bảo không bị âm và không vượt quá giới hạn
  startPage = Math.max(1, startPage);
  endPage = Math.min(total_pages, endPage);

  // 2. Tạo Nút Mũi Tên Trái (Previous)
  const prevDisabled = current_page === 1;
  container.innerHTML += `
        <button class="btn btn-sm btn-outline-secondary mx-1 page-btn" 
                data-page="${current_page - 1}" 
                data-sta="${sta}"
                data-limit="${page_size}"
                ${prevDisabled ? "disabled" : ""}>
            &laquo;
        </button>
    `;

  // 3. Tạo các Nút Số
  for (let i = startPage; i <= endPage; i++) {
    const activeClass =
      i === current_page ? "btn-primary" : "btn-outline-primary";
    container.innerHTML += `
            <button class="btn btn-sm mx-1 page-btn ${activeClass}" 
                    data-page="${i}"
                    data-sta="${sta}"
                    data-limit="${page_size}">
                ${i}
            </button>
        `;
  }

  // 4. Tạo Nút Mũi Tên Phải (Next)
  const nextDisabled = current_page === total_pages;
  container.innerHTML += `
        <button class="btn btn-sm btn-outline-secondary mx-1 page-btn" 
                data-page="${current_page + 1}" 
                data-sta="${sta}"
                data-limit="${page_size}"
                ${nextDisabled ? "disabled" : ""}>
            &raquo;
        </button>
    `;

  // 5. Gắn Sự kiện Click cho tất cả nút phân trang
  document.querySelectorAll(".page-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const newPage = parseInt(event.currentTarget.getAttribute("data-page"));

      const currentSta = parseInt(event.currentTarget.getAttribute("data-sta"));

      if (!isNaN(newPage) && newPage !== current_page) {
        // Gọi lại hàm load dữ liệu chính với trang mới
        mng_Nb(sta, newPage);
      }
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
          <select class="form-select edit statue-select" style="display:inline-block; width:100px;padding:4px;" name="status" disabled>
            <option style="background-color: green;" value="Enter" ${
              item.status === "Enter" ? "selected" : ""
            }>Vào</option>
            <option style="background-color: red;" value="Out" ${
              item.status === "Out" ? "selected" : ""
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
