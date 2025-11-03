// search.js
document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("search-btn");
  const tbody = document.querySelector("table tbody");

  function createSearchRow() {
    const tr = document.createElement("tr");
    tr.dataset.search = "true";
    tr.innerHTML = `
      <td><i class="m-r-10 mdi mdi-account-search" style="font-size:21px"></i></td>
      <td><input name="name" type="text" class="form-control" placeholder="Tên nhân viên" /></td>
      <td></td>
      <td><input name="rank" type="text" class="form-control" placeholder="Cấp bậc" /></td>
      <td><input name="position" type="text" class="form-control" placeholder="Chức vụ" /></td>
      <td><input name="plateArea" type="text" class="form-control" placeholder="Mã khu vực" /></td>
      <td><input name="plateNum" type="text" class="form-control" placeholder="Số xe" /></td>
      <td>
        <select name="status" class="form-control">
          <option value="All">Tất cả</option>
          <option value="Vào">Vào</option>
          <option value="Ra">Ra</option>
        </select>
      </td>
      <td>
        <a href="#" class="btn btn-primary do-search-btn" style="padding:8px 16px; margin-bottom:4px">Tìm kiếm</a>
        <a href="#" class="btn btn-danger cancel-search-btn" style="padding:8px 16px; margin-bottom:4px">Clear</a>
      </td>
    `;
    return tr;
  }

  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // Nếu đã có hàng search rồi thì toggle ẩn/hiện
    const existing = tbody.querySelector("tr[data-search='true']");
    if (existing) {
      existing.style.display = existing.style.display === "none" ? "" : "none";
      return;
    }

    const row = createSearchRow();
    tbody.prepend(row);
    row.scrollIntoView({ behavior: "smooth", block: "center" });

    attachSearchHandlers(row);
  });

  function attachSearchHandlers(tr) {
    const doSearchBtn = tr.querySelector(".do-search-btn");
    const cancelBtn = tr.querySelector(".cancel-search-btn");

    doSearchBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const formData = {
        name: tr.querySelector('input[name="name"]').value.trim(),
        rank: tr.querySelector('input[name="rank"]').value.trim(),
        position: tr.querySelector('input[name="position"]').value.trim(),
        plateArea: tr.querySelector('input[name="plateArea"]').value.trim(),
        plateNum: tr.querySelector('input[name="plateNum"]').value.trim(),
        status: tr.querySelector('select[name="status"]').value,
      };

      try {
        const res = await fetch("http://127.0.0.1:5001/quanly/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!data.success) {
          alert(data.message || "Không tìm thấy nhân viên phù hợp");
          return;
        }

        // Xóa hết các dòng cũ (trừ dòng search)
        tbody
          .querySelectorAll("tr:not([data-search='true'])")
          .forEach((r) => r.remove());

        // Hiển thị kết quả
        data.results.forEach((staff, index) => {
          const newRow = document.createElement("tr");
          newRow.dataset.id = staff._id;
          newRow.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(staff.name || "")}</td>
            <td><img src="http://127.0.0.1:5001${escapeHtml(
              staff.avatar || ""
            )}" width="80" style="border-radius:8px;object-fit:cover;  width: 80px; height: 80px;"></td>
            <td>${escapeHtml(staff.rank || "")}</td>
            <td>${escapeHtml(staff.position || "")}</td>
            <td>${escapeHtml(staff.plateArea || "")}</td>
            <td>${escapeHtml(staff.plateNum || "")}</td>
            <td>${escapeHtml(staff.status || "")}</td>
            <td>
              <a href="#" class="btn btn-primary edit-btn" style="padding:8px 16px">Sửa</a>
              <a href="#" class="btn btn-danger delete-btn" style="padding:8px 16px" data-id="${escapeHtml(
                staff._id || ""
              )}">Xóa</a>
            </td>
          `;
          tbody.appendChild(newRow);

          // gọi lại hàm attachQuanLyRowHandlers để gắn edit/delete
          if (typeof window.attachQuanLyRowHandlers === "function") {
            window.attachQuanLyRowHandlers(newRow);
          }
        });
      } catch (err) {
        console.error(err);
        alert("Lỗi khi tìm kiếm");
      }
    });

    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Xóa hết nội dung trong các ô input và reset select
      tr.querySelectorAll("input").forEach((input) => (input.value = ""));
      tr.querySelector('select[name="status"]').value = "All";
    });
  }

  function escapeHtml(s = "") {
    return String(s).replace(/[&<>"']/g, (m) => {
      return (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m] || m
      );
    });
  }
});
