/* ========== IP COPY FUNCTION ========== */
const SERVER_IP = "prosperiamc.com";
const BALTOP_URL = "baltop.json"; // Change to your actual API endpoint, e.g. "/api/baltop"
const BALTOP_REFRESH_MS = 60000; // odświeżanie co 60 sekund
const MC_STATUS_URL = "https://api.mcsrvstat.us/3/prosperiamc.com";
const DISCORD_INVITE_URL = "https://discord.com/api/v9/invites/T3ed7sV3uz?with_counts=true";
const STATUS_REFRESH_MS = 60000;

function setStatusPill(pillId, text, stateClass) {
  const pill = document.getElementById(pillId);
  if (!pill) return;

  pill.textContent = text;
  pill.classList.remove("status-loading", "status-online", "status-offline", "status-error");
  pill.classList.add(stateClass);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function fetchMcStatus() {
  if (!document.getElementById("mc-status-pill")) return;

  try {
    const response = await fetch(MC_STATUS_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const isOnline = Boolean(data.online);

    setStatusPill("mc-status-pill", isOnline ? "Online" : "Offline", isOnline ? "status-online" : "status-offline");
    if (data.players) {
      const displayedOnline = Number(data.players.online || 0) + 2;
      setText("mc-online-count", `${displayedOnline}/${data.players.max}`);
    } else {
      setText("mc-online-count", "2/0");
    }
    setText("mc-version", data.version || "Unknown");

    if (isOnline && data.motd && Array.isArray(data.motd.clean) && data.motd.clean.length > 0) {
      setText("mc-motd", data.motd.clean.join(" "));
    } else {
      setText("mc-motd", isOnline ? "No MOTD data" : "Server currently offline");
    }
  } catch {
    setStatusPill("mc-status-pill", "Error", "status-error");
    setText("mc-online-count", "Unavailable");
    setText("mc-version", "Unavailable");
    setText("mc-motd", "Could not load status");
  }
}

async function fetchDiscordStatus() {
  if (!document.getElementById("discord-status-pill")) return;

  try {
    const response = await fetch(DISCORD_INVITE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const online = Number(data.approximate_presence_count || 0);
    const members = Number(data.approximate_member_count || 0);
    const guildName = data.guild && data.guild.name ? data.guild.name : "ProsperiaMC Discord";

    setStatusPill("discord-status-pill", online > 0 ? "Active" : "Idle", online > 0 ? "status-online" : "status-offline");
    setText("discord-guild-name", guildName);
    setText("discord-online", online.toString());
    setText("discord-members", members.toString());
  } catch {
    setStatusPill("discord-status-pill", "Error", "status-error");
    setText("discord-guild-name", "Unavailable");
    setText("discord-online", "Unavailable");
    setText("discord-members", "Unavailable");
  }
}

function copyIP() {
  const message = document.getElementById("copy-message");

  if (!navigator.clipboard) {
    message.textContent = "✗ Clipboard not available.";
    return;
  }

  navigator.clipboard.writeText(SERVER_IP).then(() => {
    message.textContent = "✓ Server IP pasted to clipboard.";
    message.style.opacity = "1";
    message.style.color = "#4ade80";

    setTimeout(() => {
      message.style.opacity = "0";
      setTimeout(() => {
        message.textContent = "";
        message.style.opacity = "1";
      }, 300);
    }, 2000);
  }).catch(() => {
    message.textContent = "✗ Nie udało się skopiować IP.";
    message.style.color = "#ff6b6b";
  });
}

function renderBaltop(rows) {
  const table = document.getElementById("baltop-table");
  if (!table) return;

  if (!rows || rows.length === 0) {
    table.innerHTML = `<tr><td colspan="3">Brak danych do wyświetlenia.</td></tr>`;
    return;
  }

  table.innerHTML = rows.slice(0, 10).map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${row.player}</td>
      <td>${row.balance}</td>
    </tr>
  `).join("");
}

async function fetchBaltop() {
  const note = document.querySelector(".leaderboard-note");
  if (note) note.textContent = "Ładowanie danych...";

  try {
    const response = await fetch(BALTOP_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const rows = Array.isArray(data) ? data : data.baltop || data.top || [];
    renderBaltop(rows);

    if (note) note.textContent = "Dane aktualne. Odświeżanie co 60 sekund.";
  } catch (error) {
    renderBaltop([]);
    if (note) note.textContent = `Błąd ładowania: ${error.message}`;
  }
}

/* ========== NAVBAR SCROLL EFFECT ========== */
const navbar = document.getElementById("navbar");
let lastScrollTop = 0;

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  if (scrollTop > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

/* ========== MOBILE MENU TOGGLE ========== */
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const navLinks = document.querySelector(".nav-links");

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    mobileMenuBtn.classList.toggle("active");
  });

  // Close menu when a link is clicked
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      mobileMenuBtn.classList.remove("active");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      navLinks.classList.remove("active");
      mobileMenuBtn.classList.remove("active");
    }
  });
}

/* ========== SMOOTH SCROLL ANIMATIONS ========== */
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all cards and section content for reveal animations
document.querySelectorAll(".hero, .card, .info-card, .progression-highlight, .store-cta, .section-header, .hero-buttons, .footer").forEach((el) => {
  el.classList.add("reveal");
  observer.observe(el);
});

/* ========== INITIALIZATION ========== */
document.addEventListener("DOMContentLoaded", () => {
  // Smooth scroll behavior for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      
      // Skip if it's a Discord link or doesn't point to an element
      if (href === "#" || href.startsWith("#") === false) {
        return;
      }

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });

  // Add CSS for reveal animations
  const style = document.createElement("style");
  style.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .copy-message {
      transition: opacity 0.3s ease;
      color: #4ade80;
      margin-top: 16px;
      font-size: 0.95rem;
      min-height: 1.2rem;
    }
  `;
  document.head.appendChild(style);

  // Fetch baltop data on load and refresh periodically
  if (document.getElementById("baltop-table")) {
    fetchBaltop();
    setInterval(fetchBaltop, BALTOP_REFRESH_MS);
  }

  // Fetch live embed statuses on load and refresh periodically
  if (document.getElementById("mc-status-pill") || document.getElementById("discord-status-pill")) {
    fetchMcStatus();
    fetchDiscordStatus();
    setInterval(() => {
      fetchMcStatus();
      fetchDiscordStatus();
    }, STATUS_REFRESH_MS);
  }
});

/* ========== WINDOW LOAD OPTIMIZATIONS ========== */
window.addEventListener("load", () => {
  // Trigger initial animations
  document.body.style.opacity = "1";
});

/* ========== BACK TO TOP BUTTON ========== */
const backToTopBtn = document.getElementById("back-to-top");

if (backToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}



/* ========== WIKI NAV SCROLL-SPY ========== */
(function () {
  const navItems = document.querySelectorAll(".pill-link");
  if (!navItems.length) return;

  const sectionIds = Array.from(navItems).map((a) => a.getAttribute("href").replace("#", ""));

  function updateActive() {
    let currentId = sectionIds[0];
    for (const id of sectionIds) {
      const section = document.getElementById(id);
      if (section && section.getBoundingClientRect().top <= 160) {
        currentId = id;
      }
    }
    navItems.forEach((item) => {
      const href = item.getAttribute("href").replace("#", "");
      item.classList.toggle("active", href === currentId);
    });
  }

  window.addEventListener("scroll", updateActive, { passive: true });
  updateActive();
})();