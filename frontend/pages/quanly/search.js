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
          <option value="Enter">Enter</option>
          <option value="Out">Out</option>
        </select>
      </td>
      <td>
        <a href="#" class="do-search-btn" style="padding:5px">Search</a>
        <a href="#" class="cancel-search-btn" style="padding:5px">Clear</a>
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
        const res = await fetch("/quanly/search", {
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
            <td><img src="${escapeHtml(
              staff.avatar || ""
            )}" width="80" style="border-radius:8px;object-fit:cover"></td>
            <td>${escapeHtml(staff.rank || "")}</td>
            <td>${escapeHtml(staff.position || "")}</td>
            <td>${escapeHtml(staff.plateArea || "")}</td>
            <td>${escapeHtml(staff.plateNum || "")}</td>
            <td>${escapeHtml(staff.status || "")}</td>
            <td>
              <a href="#" class="edit-btn" style="padding:4px">Edit</a>
              <a href="#" class="delete-btn" style="padding:4px" data-id="${escapeHtml(
                staff._id || ""
              )}">Delete</a>
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
