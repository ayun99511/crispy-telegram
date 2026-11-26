
const $ = id => document.getElementById(id);

const STORAGE_KEY = "timewise_v3_tasks";
let tasks = [];

try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    tasks = Array.isArray(saved) ? saved : [];
} catch {
    tasks = [];
}

let currentFilter = "all";

// TANGGAL LOKAL
function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

const today = localDate();

// SAPAAN
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "Selamat malam!";

    if (hour >= 4 && hour < 11) greeting = "Selamat pagi! 🌤️";
    else if (hour >= 11 && hour < 15) greeting = "Selamat siang! ☀️";
    else if (hour >= 15 && hour < 18) greeting = "Selamat sore! 🌷";

    $("greeting").textContent = greeting;
}

function updateClock() {
    const now = new Date();

    $("clock").textContent = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    $("todayDate").textContent = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    updateGreeting();
}

updateClock();
setInterval(updateClock, 1000);

// SIMPAN DATA
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// TAMBAH DAN EDIT TUGAS
$("taskDate").value = today;

$("taskForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const id = $("taskId").value;
    const name = $("taskName").value.trim();
    const date = $("taskDate").value;
    const time = $("taskTime").value;
    const category = $("taskCategory").value;
    const priority = $("taskPriority").value;

    if (!name || !date || !time) return;

    if (id) {
        const task = tasks.find(t => t.id === id);

        if (task) {
            task.name = name;
            task.date = date;
            task.time = time;
            task.category = category;
            task.priority = priority;
        }
    } else {
        tasks.push({
            id: String(Date.now()) + Math.random().toString(16).slice(2),
            name,
            date,
            time,
            category,
            priority,
            completed: false
        });
    }

    saveData();
    resetForm();
    renderTasks();
});

// RESET FORM
function resetForm() {
    $("taskForm").reset();
    $("taskId").value = "";
    $("taskDate").value = localDate();
    $("formTitle").textContent = "＋ Tambah Kegiatan";
    $("saveButton").textContent = "Simpan Kegiatan";
    $("cancelEdit").hidden = true;
}

$("cancelEdit").addEventListener("click", resetForm);

// FORMAT TANGGAL
function formatDate(date) {
    const parts = date.split("-");
    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    ).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// MEMBUAT DAFTAR TUGAS
function renderTasks() {
    const list = $("taskList");
    list.innerHTML = "";

    let visibleTasks = [...tasks];

    if (currentFilter === "pending") {
        visibleTasks = visibleTasks.filter(t => !t.completed);
    }

    if (currentFilter === "done") {
        visibleTasks = visibleTasks.filter(t => t.completed);
    }

    visibleTasks.sort((a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time)
    );

    $("emptyState").style.display =
        visibleTasks.length === 0 ? "block" : "none";

    visibleTasks.forEach(task => {
        const item = document.createElement("div");
        item.className = "task-item" +
            (task.completed ? " completed" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Tandai tugas selesai");

        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;
            saveData();
            renderTasks();
        });

        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("strong");
        title.textContent = task.name;

        const description = document.createElement("p");
        description.textContent =
            `📅 ${formatDate(task.date)} · ⏰ ${task.time} · ${task.category} · ${task.priority}`;

        details.append(title, description);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            $("taskId").value = task.id;
            $("taskName").value = task.name;
            $("taskDate").value = task.date;
            $("taskTime").value = task.time;
            $("taskCategory").value = task.category;
            $("taskPriority").value = task.priority;

            $("formTitle").textContent = "✏️ Edit Kegiatan";
            $("saveButton").textContent = "Simpan Perubahan";
            $("cancelEdit").hidden = false;

            $("taskForm").scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Hapus";

        deleteButton.addEventListener("click", () => {
            if (confirm(`Hapus kegiatan "${task.name}"?`)) {
                tasks = tasks.filter(t => t.id !== task.id);
                saveData();
                renderTasks();
            }
        });

        actions.append(editButton, deleteButton);
        item.append(checkbox, details, actions);
        list.appendChild(item);
    });

    updateDashboard();
}

// DASHBOARD
function updateDashboard() {
    const todayTasks = tasks.filter(t => t.date === localDate());

    const total = todayTasks.length;
    const done = todayTasks.filter(t => t.completed).length;
    const pending = total - done;

    const percent = total
        ? Math.round(done / total * 100)
        : 0;

    $("totalTasks").textContent = total;
    $("doneTasks").textContent = done;
    $("pendingTasks").textContent = pending;
    $("productivity").textContent = percent + "%";

    $("progressPercent").textContent = percent + "%";
    $("progressBar").style.width = percent + "%";

    if (total === 0) {
        $("progressDescription").textContent =
            "Belum ada kegiatan untuk hari ini.";
    } else if (percent === 100) {
        $("progressDescription").textContent =
            "Hebat! Semua kegiatan hari ini selesai 🎉";
    } else {
        $("progressDescription").textContent =
            `${done} dari ${total} kegiatan hari ini selesai.`;
    }
}

// FILTER TUGAS
document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll(".filter").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        renderTasks();
    });
});

// MODE GELAP DAN TERANG
function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    $("themeToggle").textContent =
        theme === "dark" ? "☀️" : "🌙";

    localStorage.setItem("timewise_v3_theme", theme);
}

$("themeToggle").addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark")
        ? "light"
        : "dark";

    applyTheme(nextTheme);
});

applyTheme(
    localStorage.getItem("timewise_v3_theme") || "light"
);

// TAMPILKAN SEMUA DATA
renderTasks();
