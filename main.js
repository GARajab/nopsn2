// ================= CONFIG & DATA =================
const BINLOADER_URL = "http://127.0.0.1:9090";
const PAYLOAD_DIR = "payloads/";

// Payload Data Structure
const payloads = [
    // Keeping the original, alphabetical (or fixed) order here
    { name: "np-fake-signin-ps4.bin", desc: "Enable Fake Sign In For PS4", sizeKB: 101 },
    { name: "np-fake-signin-ps5.bin", desc: "Enable Fake Sign In For PS5", sizeKB: 120 },
    { name: "goldhen.bin", desc: "New Beta GoldHenV2.4b18.8", sizeKB: 291 },
    { name: "app2usb.bin", desc: "Moves games to USB storage", sizeKB: 22.0 },
    { name: "backup.bin", desc: "Creates system backup", sizeKB: 13.2 },
    { name: "disable-updates.bin", desc: "Blocks system updates", sizeKB: 7.6 },
    { name: "enable-browser.bin", desc: "Enables PS4 browser", sizeKB: 9.3 },
    { name: "enable-updates.bin", desc: "Restores system updates", sizeKB: 7.6 },
    { name: "fan-threshold.bin", desc: "Controls fan temperature", sizeKB: 7.8 },
    { name: "ftp.bin", desc: "Starts FTP server", sizeKB: 25.1 },
    { name: "history-blocker.bin", desc: "Blocks browser history", sizeKB: 9.4 },
    { name: "kernel-dumper.bin", desc: "Dumps kernel memory", sizeKB: 15.5 },
    { name: "restore.bin", desc: "Restores system settings", sizeKB: 9.5 },
    { name: "rif-renamer.bin", desc: "Renames license files", sizeKB: 8.2 },
    { name: "ftpsrv-ps4.bin", desc: "High Speed FTP Server PS4", sizeKB: 147 },
    { name: "ftpsrv-ps5.bin", desc: "High Speed FTP Server PS5", sizeKB: 209 },
    { name: "noPSN.elf", desc: "Test LB Game", sizeKB: 1 },
    
];

// Map for optional background images
const images = Object.fromEntries(
    payloads.map(p => [p.name, "images/" + p.name.replace(".bin", ".jpg")])
);

// ================= STATE =================
let selectedPayloadName = null;
let favorites = JSON.parse(localStorage.getItem("fav") || "[]");
let recent = JSON.parse(localStorage.getItem("recent") || "[]");

// ================= UTILS & ELEMENTS =================
const body = document.body;
const grid = document.getElementById("grid");
const searchInput = document.getElementById("search");
const themeBtn = document.getElementById('toggle-theme-btn');
const layoutBtn = document.getElementById('toggle-layout-btn');

// Toast element setup
const toast = document.createElement('div');
toast.className = 'toast';
document.body.appendChild(toast);

// Utility to show temporary message
function showToast(t) {
    toast.textContent = t;
    toast.style.cssText = `
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    background: var(--accent); color: white; padding: 12px 20px;
    border-radius: 8px; z-index: 1000; display: block; font-size: 14px;
  `;
    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

// PS4 Firmware detection
function detectFW() {
    const m = navigator.userAgent.match(/PlayStation 4\/([0-9.]+)/);
    return m ? m[1] : "Unknown";
}

// ================= BINLOADER =================
async function injectPayload(fileName) {
    // Clear any existing selection highlight immediately
    document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
    selectedPayloadName = null;

    showToast(`Injecting ${fileName}...`);
    try {
        const data = await fetch(PAYLOAD_DIR + fileName).then(r => r.arrayBuffer());
        await fetch(BINLOADER_URL, { method: "POST", body: data });
        showToast(`${fileName} sent successfully!`);

        // Update recent list (only the data, not the rendering order)
        recent = [fileName, ...recent.filter(f => f !== fileName)].slice(0, 5);
        localStorage.setItem("recent", JSON.stringify(recent));

        // Re-render to update the 'Recent' label on the card
        render();

    } catch (e) {
        console.error("Injection failed:", e);
        showToast("Injection failed. Check network (9090 port) or payload file.");
    }
}

// ================= HANDLERS =================
function handleCardClick(clickedCard, payloadName) {

    // 1. Immediately highlight the card being injected
    document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
    clickedCard.classList.add('selected');
    selectedPayloadName = payloadName;

    // 2. Trigger the injection
    injectPayload(payloadName);
}

function handleCardDoubleClick(payloadName) {
    // Toggle favorite state
    favorites = favorites.includes(payloadName)
        ? favorites.filter(f => f !== payloadName)
        : [...favorites, payloadName];
    localStorage.setItem("fav", JSON.stringify(favorites));
    render(); // Re-render to update the star/favorite label
    showToast(favorites.includes(payloadName) ? `${payloadName} added to favorites` : `${payloadName} removed from favorites`);
}

// --- Theme Toggle Logic (UPDATED FOR TEXT) ---
function toggleTheme() {
    body.classList.toggle('dark-mode');

    const isDarkMode = body.classList.contains('dark-mode');

    // Update button text visibility
    document.querySelector('.light-text').style.display = isDarkMode ? 'none' : 'inline';
    document.querySelector('.dark-text').style.display = isDarkMode ? 'inline' : 'none';

    // Update button title (tooltip)
    themeBtn.title = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

themeBtn.addEventListener('click', toggleTheme);

// Initialize theme based on system preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    if (!body.classList.contains('dark-mode')) {
        toggleTheme();
    }
}

// --- Layout Toggle Logic (UPDATED FOR TEXT) ---
function toggleLayout() {
    const isListView = grid.classList.toggle('list-view');

    // Update button text visibility
    document.querySelector('.grid-text').style.display = isListView ? 'none' : 'inline';
    document.querySelector('.list-text').style.display = isListView ? 'inline' : 'none';

    // Update button title (tooltip)
    layoutBtn.title = isListView ? 'Switch to Grid View' : 'Switch to List View';

    layoutBtn.classList.toggle('active', !isListView);
}

layoutBtn.addEventListener('click', toggleLayout);


// ================= RENDER =================
function render() {
    grid.innerHTML = "";

    const q = searchInput.value.toLowerCase();

    // Use the original 'payloads' array to maintain fixed order
    const listToRender = payloads;

    listToRender.forEach(p => {
        if (!p.name.toLowerCase().includes(q) && !p.desc.toLowerCase().includes(q)) return;

        const isFavorite = favorites.includes(p.name);
        const isRecent = recent.includes(p.name); // Still check for the label

        const card = document.createElement("div");
        card.className = `card ${p.name === selectedPayloadName ? 'selected' : ''}`;
        if (images[p.name]) card.style.backgroundImage = `url(${images[p.name]})`;

        card.innerHTML = `
      <div>
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
      </div>
      <div class="meta">
        ${p.sizeKB} KB 
        <span> • FW: ${detectFW()}</span>
        ${isRecent ? ' • Recent' : ''}
        ${isFavorite ? ' • ⭐ Favorite' : ''}
      </div>
    `;

        // Single Click: Triggers Injection
        card.onclick = () => {
            handleCardClick(card, p.name);
        };

        // Double Click: Toggles Favorite
        card.ondblclick = () => {
            handleCardDoubleClick(p.name);
        };

        grid.appendChild(card);
    });
}

// Initial event listener setup and rendering
searchInput.addEventListener('input', render);
render();
