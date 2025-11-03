// // add.js
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
      <td><input name="name" type="text" class="form-control" placeholder="Tên nhân viên" value="${
        existing ? escapeHtml(existing.name || "") : ""
      }" /></td>
      <td>
        <div class="avatar-wrapper" style="position: relative; display: inline-block; width: 80px; height: 80px;">
          <img 
            src="${
              existing && existing.avatar
                ? existing.avatar
                : "http://127.0.0.1:5001/assets/images/users/guest.jpg"
            }" 
            class="avatar-preview" 
            style="width:100%; height:100%; object-fit: cover; border-radius:8px; border:1px solid #ccc;"
          >
          <div class="change-overlay" 
            style="position: absolute; top:0; left:0; width:100%; height:100%;
                  display:flex; align-items:center; justify-content:center;
                  background: rgba(0,0,0,0.6); color:white; font-size:20px;
                  opacity:0; transition:0.3s; cursor:pointer; border-radius:8px;">
            +
          </div>
          <input name="avatar" type="file" accept="image/*" style="display:none;">
        </div>
      </td>
      <td><input name="rank" type="text" class="form-control" placeholder="Cấp bậc"  value="${
        existing ? escapeHtml(existing.rank || "") : ""
      }" /></td>
      <td><input name="position" type="text" class="form-control" placeholder="Chức vụ" value="${
        existing ? escapeHtml(existing.position || "") : ""
      }" /></td>
      <td>
        <div style="display:flex;">
          <input name="area" type="text" class="form-control" placeholder="Mã khu vực (59A1)"
            value="${existing ? escapeHtml(existing.Plate?.area || "") : ""}" />

        </div>
      </td>
      <td>
        <div style="display:flex;">
          <input name="number" type="text" class="form-control" placeholder="Số xe (12345)"
            value="${
              existing ? escapeHtml(existing.Plate?.number || "") : ""
            }" />

        </div>
      </td>
      <td>
        <select name="status">
          <option value="Vào">Vào</option>
          <option value="Ra">Ra</option>
        </select>
      </td>
      <td>
        <a href="#" class="btn btn-success save-btn" style="padding:8px 16px; margin-bottom:4px">Lưu</a>
        <a href="#" class="btn btn-danger delete-btn" style="padding:8px 16px;  margin-bottom:4px">Xóa</a>
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
    // Xử lý ảnh preview
    const avatarWrapper = tr.querySelector(".avatar-wrapper");
    if (avatarWrapper) {
      const overlay = avatarWrapper.querySelector(".change-overlay");
      const fileInput = avatarWrapper.querySelector('input[name="avatar"]');
      const imgPreview = avatarWrapper.querySelector(".avatar-preview");

      // Hover effect
      avatarWrapper.addEventListener(
        "mouseenter",
        () => (overlay.style.opacity = "1")
      );
      avatarWrapper.addEventListener(
        "mouseleave",
        () => (overlay.style.opacity = "0")
      );

      // Click để mở chọn file
      overlay.addEventListener("click", () => fileInput.click());

      // Khi chọn file -> preview liền
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            imgPreview.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }
    // Nút Save và Xóa
    const saveBtn = tr.querySelector(".save-btn");
    const delBtn = tr.querySelector(".delete-btn");
    // Nếu click SAVE
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
        const res = await fetch("http://127.0.0.1:5001/quanly/add", {
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
      <img src="http://127.0.0.1:5001${escapeHtml(
        saved.avatar || ""
      )}" width="80" class="avatar-img" style="border-radius:8px; object-fit:cover; width: 80px; height: 80px;">
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
    <a href="#" class="btn btn-primary edit-btn" style="padding:8px 16px; margin-bottom:4px">Sửa</a>
    <a href="#" class="btn btn-danger delete-btn" style="padding:8px 16px; margin-bottom:4px" data-id="${escapeHtml(
      displayRow.dataset.id || ""
    )}">Xóa</a>
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
        const res = await fetch(`http://127.0.0.1:5001/quanly/delete/${id}`, {
          method: "GET",
        });
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
            await fetch(`http://127.0.0.1:5001/quanly/edit/${tr.dataset.id}`, {
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
          const res = await fetch(`http://127.0.0.1:5001/quanly/delete/${id}`, {
            method: "GET",
          });
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
// ---------------------------------------------------------
