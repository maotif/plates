// add.js
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("add-btn");
  const tbody = document.querySelector("table tbody");

  function createInputRow(existing = null) {
    // existing: nếu là object đã lưu (để hiển thị lại) - optional
    const tr = document.createElement("tr");

    // nếu existing có _id thì gắn data-id
    if (existing && existing._id) tr.dataset.id = existing._id;

    tr.innerHTML = `
      <td>#</td>
      <td><input name="name" type="text" class="form-control" value="${
        existing ? escapeHtml(existing.name || "") : ""
      }" /></td>
      <td>
        ${
          existing && existing.avatar
            ? `<img src="${existing.avatar}" width="80" style="display:block;margin-bottom:6px">`
            : ""
        }
        <input name="avatar" type="file" accept="image/*" />
      </td>
      <td><input name="rank" type="text" class="form-control" value="${
        existing ? escapeHtml(existing.rank || "") : ""
      }" /></td>
      <td><input name="position" type="text" class="form-control" value="${
        existing ? escapeHtml(existing.position || "") : ""
      }" /></td>
      <td>
        <div style="display:flex; gap:6px;">
          <input name="area" type="text" class="form-control" placeholder="Mã khu vực (VD: 59A1)" 
            value="${
              existing ? escapeHtml(existing.Plate?.area || "") : ""
            }" style="width:50%" />
          
        </div>
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          <input name="number" type="text" class="form-control" placeholder="Số xe (VD: 12345)" 
            value="${
              existing ? escapeHtml(existing.Plate?.number || "") : ""
            }" style="width:50%" />
          
        </div>
      </td>
      <td>
        <select name="status">
          <option value="Enter">Enter</option>
          <option value="Out">Out</option>
        </select>
      </td>
      <td>
        <a href="#" class="save-btn">Save</a>
        <a href="#" class="delete-btn">Delete</a>
      </td>
    `;
    return tr;
  }

  function escapeHtml(s = "") {
    return String(s).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }

  addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    // nếu đã có 1 row tạo mới đang tồn tại (chưa save) thì không tạo thêm
    const existingNew = tbody.querySelector("tr[data-new='true']");
    if (existingNew) {
      // Toggle ẩn/hiện khi bấm nhiều lần
      if (existingNew.style.display === "none") {
        existingNew.style.display = ""; // hiện lại
        existingNew.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        existingNew.style.display = "none"; // ẩn đi
      }
      return;
    }

    const newRow = createInputRow();
    newRow.dataset.new = "true";
    // insert trên cùng
    tbody.prepend(newRow);
    newRow.scrollIntoView({ behavior: "smooth", block: "center" });

    attachRowHandlers(newRow);
  });

  function attachRowHandlers(tr) {
    const saveBtn = tr.querySelector(".save-btn");
    const delBtn = tr.querySelector(".delete-btn");

    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // Lấy values và file
      const name = tr.querySelector('input[name="name"]').value.trim();
      const rank = tr.querySelector('input[name="rank"]').value.trim();
      const position = tr.querySelector('input[name="position"]').value.trim();
      const area = tr.querySelector('input[name="area"]').value.trim();
      const number = tr.querySelector('input[name="number"]').value.trim();

      const fileInput = tr.querySelector('input[name="avatar"]');
      const status = tr.querySelector('select[name="status"]').value;

      // Tạo FormData để gửi file
      const fd = new FormData();
      fd.append("name", name);
      fd.append("rank", rank);
      fd.append("position", position);
      fd.append("plateArea", area);
      fd.append("plateNum", number);
      fd.append("status", status);

      if (fileInput && fileInput.files && fileInput.files[0]) {
        fd.append("avatar", fileInput.files[0]);
      }

      try {
        const res = await fetch("/quanly/add", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(data.message || "Lỗi khi thêm nhân viên");
          return;
        }

        // Thay hàng input bằng hàng hiển thị bình thường (dùng dữ liệu trả về)
        const saved = data.staff; // mong server trả về staff object vừa lưu
        const displayRow = document.createElement("tr");
        // gán data-id (nếu _id là ObjectId, toString() an toàn)
        displayRow.dataset.id =
          saved._id && typeof saved._id === "object" && saved._id.toString
            ? saved._id.toString()
            : saved._id;

        displayRow.innerHTML = `
  <td></td>
  <td data-original="${escapeHtml(saved.name || "")}">${escapeHtml(
          saved.name || ""
        )}</td>
  <td class="avatar-cell">
    <div class="avatar-wrapper" style="position: relative; display: inline-block;">
      <img src="${escapeHtml(
        saved.avatar || ""
      )}" width="80" class="avatar-img" style="border-radius:8px; object-fit:cover;">
      <div class="change-overlay" 
          style="position:absolute; top:0; left:0; width:100%; height:100%; 
                  display:flex; align-items:center; justify-content:center; 
                  background: rgba(0,0,0,0.6); color:white; font-size:12px; 
                  opacity:0; transition:0.3s; cursor:pointer;">
        +
      </div>
    </div>
  </td>
  <td data-original="${escapeHtml(saved.rank || "")}">${escapeHtml(
          saved.rank || ""
        )}</td>
  <td data-original="${escapeHtml(saved.position || "")}">${escapeHtml(
          saved.position || ""
        )}</td>
  <td data-original="${escapeHtml(saved.plateArea || "")}">${escapeHtml(
          saved.plateArea || ""
        )}</td>
<td data-original="${escapeHtml(saved.plateNum || "")}">${escapeHtml(
          saved.plateNum || ""
        )}</td>
  <td data-original="${escapeHtml(saved.status || "None")}">${escapeHtml(
          saved.status || "None"
        )}</td>
  <td>
    <a href="#" class="edit-btn">Edit</a>
    <a href="#" class="delete-btn" data-id="${escapeHtml(
      displayRow.dataset.id || ""
    )}">Delete</a>
  </td>
`;

        // replace
        tr.replaceWith(displayRow);

        // nếu cần attach handlers giống quanly.js (edit/delete), gọi hàm xử lý từ quanly.js
        if (typeof window.attachQuanLyRowHandlers === "function") {
          window.attachQuanLyRowHandlers(displayRow);
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi mạng khi thêm nhân viên");
      }
    });

    delBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // nếu hàng chưa save: chỉ remove
      if (tr.dataset.new === "true") {
        tr.remove();
        return;
      }
      // nếu đã save (có id) -> gọi API xóa
      const id = tr.dataset.id;
      if (!id) {
        tr.remove();
        return;
      }
      if (!confirm("Bạn có chắc muốn xóa nhân viên này không?")) return;
      try {
        const res = await fetch(`/quanly/delete/${id}`, { method: "GET" });
        const data = await res.json();
        if (data.success) {
          tr.remove();
        } else {
          alert(data.message || "Xóa thất bại");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi xóa nhân viên");
      }
    });
  }

  // Reusable handlers (replace the old window.attachQuanLyRowHandlers)
  window.attachQuanLyRowHandlers = (row) => {
    if (!row) return;
    const editBtn = row.querySelector(".edit-btn");
    const deleteBtn = row.querySelector(".delete-btn");

    // Helper escape (nếu chưa có)
    function escapeHtml(s = "") {
      return String(s).replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }[m])
      );
    }

    // (Reuse the edit/delete logic from your quanly.js)
    if (editBtn) {
      editBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        // delegate to existing quanly.js handler if present
        // your main quanly.js has a robust handler; if not, we do a simple fallback
        const handlerExists = false; // leave false -> simple fallback below
        if (handlerExists) return;

        // Simple fallback: toggle inputs for name/rank/position/area/number
        const tr = editBtn.closest("tr");
        const isEditing = editBtn.textContent === "Save";
        const editCols = {
          name: 1,
          avatar: 2,
          rank: 3,
          position: 4,
          plateArea: 5,
          plateNum: 6,
          status: 7,
        };
        if (!isEditing) {
          editBtn.textContent = "Save";
          Object.entries(editCols).forEach(([k, idx]) => {
            const td = tr.children[idx];

            td.innerHTML = `<input class="form-control" value="${escapeHtml(
              td.textContent.trim()
            )}" />`;
          });
        } else {
          // collect and PUT (basic)
          const updated = {};
          Object.entries(editCols).forEach(([k, idx]) => {
            updated[k] = tr.children[idx].querySelector("input").value.trim();
            tr.children[idx].textContent = updated[k];
          });
          editBtn.textContent = "Edit";
          try {
            await fetch(`/quanly/edit/${tr.dataset.id}`, {
              method: "PUT",
              body: new FormData(
                Object.entries(updated).reduce((fd, [k, v]) => {
                  const form = new FormData();
                  return fd;
                }, new FormData())
              ),
            });
          } catch (err) {
            console.error(err);
          }
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = deleteBtn.dataset.id;
        // if (!confirm("Bạn có chắc muốn xóa nhân viên này không?")) return;
        try {
          const res = await fetch(`/quanly/delete/${id}`, { method: "GET" });
          const data = await res.json();
          if (data.success) deleteBtn.closest("tr").remove();
          else alert(data.message || "Xóa thất bại");
        } catch (err) {
          console.error(err);
          alert("Lỗi khi xóa");
        }
      });
    }
  };

  // Nếu bảng đã có sẵn rows khi load, attach handlers cho mỗi row (nếu muốn)
  document.querySelectorAll("table tbody tr").forEach((r) => {
    window.attachQuanLyRowHandlers(r);
  });
});
