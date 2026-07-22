document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    const target = id ? document.querySelector(id) : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const sc1Config = window.SC1_CONFIG || {};
const backendBaseUrl = (sc1Config.backendBaseUrl || "http://localhost:4000").replace(/\/$/, "");
const fightManagerUrl = sc1Config.fightManagerUrl || "http://localhost:5173";
const sc1LocalUrl = sc1Config.sc1LocalUrl || "http://127.0.0.1:8081";

const fightManagerLink = document.querySelector(".site-nav .nav-cta");
if (fightManagerLink instanceof HTMLAnchorElement) {
  fightManagerLink.href = fightManagerUrl;
}

const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.getElementById("primaryNav");
const menuCloseButton = document.querySelector(".menu-close");
const siteHeader = document.querySelector(".site-header");

if (siteHeader instanceof HTMLElement) {
  const desktopQuery = window.matchMedia("(min-width: 761px)");

  const syncHeaderState = () => {
    if (!desktopQuery.matches) {
      siteHeader.classList.remove("is-scrolled");
      return;
    }

    siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
  window.addEventListener("resize", syncHeaderState);
}

if (navToggle instanceof HTMLButtonElement && primaryNav instanceof HTMLElement) {
  const setMenuBodyLock = (isOpen) => {
    if (!window.matchMedia("(max-width: 760px)").matches) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = isOpen ? "hidden" : "";
  };

  const closeMenu = () => {
    primaryNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    setMenuBodyLock(false);
  };

  navToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    setMenuBodyLock(isOpen);
  });

  if (menuCloseButton instanceof HTMLButtonElement) {
    menuCloseButton.addEventListener("click", closeMenu);
  }

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 760px)").matches) {
        closeMenu();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 760px)").matches) {
      closeMenu();
      setMenuBodyLock(false);
    }
  });
}

const fileNotice = document.getElementById("fileNotice");
const fileNoticeLink = fileNotice?.querySelector("a");

if (fileNoticeLink instanceof HTMLAnchorElement) {
  fileNoticeLink.href = sc1LocalUrl;
}

if (window.location.protocol === "file:") {
  fileNotice?.removeAttribute("hidden");
}

const videoModal = document.getElementById("videoModal");
const videoModalPlayer = document.getElementById("videoModalPlayer");
const videoModalTitle = document.getElementById("videoModalTitle");
const closeVideoModal = document.getElementById("closeVideoModal");

function openVideoModal(videoId, title) {
  if (!videoModal || !videoModalPlayer || !videoModalTitle) {
    return;
  }

  videoModalTitle.textContent = title;
  videoModalPlayer.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1"
      title="${title}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  `;
  videoModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!videoModal || !videoModalPlayer) {
    return;
  }

  videoModal.hidden = true;
  videoModalPlayer.innerHTML = "";
  document.body.style.overflow = "";
}

document.querySelectorAll(".video-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    const videoId = button.getAttribute("data-video-id");
    const title = button.getAttribute("data-video-title") || "SC1 Video";

    if (!videoId) {
      return;
    }

    openVideoModal(videoId, title);
  });
});

closeVideoModal?.addEventListener("click", closeModal);
videoModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.hasAttribute("data-close-video")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && videoModal && !videoModal.hidden) {
    closeModal();
  }
});

const liveFightGrid = document.getElementById("liveFightGrid");

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatFightType(type, order) {
  if (type === "Co-Main Event") {
    return "Co-Main";
  }

  if (type === "Main Event" || type === "Main Card" || type === "Prelims") {
    return type;
  }

  return order === 1 ? "Main Event" : "Main Card";
}

async function loadLiveFightCard() {
  if (!liveFightGrid) {
    return;
  }

  try {
    const response = await fetch(`${backendBaseUrl}/api/public/fight-card`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const matches = Array.isArray(payload?.matches) ? payload.matches : [];

    if (matches.length === 0) {
      return;
    }

    const eventDate = payload?.event?.date ? new Date(payload.event.date) : null;

    liveFightGrid.innerHTML = matches
      .sort((a, b) => a.fight_order - b.fight_order)
      .map((match, index) => {
        const pill = formatFightType(match.fight_type, match.fight_order);
        const dateText = eventDate ? eventDate.toLocaleDateString() : `Fight #${match.fight_order}`;

        return `
          <article class="fight-card ${index === 0 ? "fight-card-featured" : ""}">
            <div class="fight-card-top">
              <span class="pill">${escapeHtml(pill)}</span>
              <span class="fight-date">${escapeHtml(dateText)}</span>
            </div>
            <h3>${escapeHtml(match.title || `Fight ${match.fight_order}`)}</h3>
            <p>${escapeHtml(`${match.weight_class || "Open"} bout scheduled by the SC1 matchmaker.`)}</p>
            <div class="fight-meta"></div>
          </article>
        `;
      })
      .join("");
  } catch {
    // Keep static fallback cards when backend is unavailable.
  }
}

void loadLiveFightCard();

const fighterCarousel = document.querySelector("[data-fighter-carousel]");

if (fighterCarousel instanceof HTMLElement) {
  const viewport = fighterCarousel.querySelector(".fighter-viewport");
  const track = fighterCarousel.querySelector(".fighter-track");

  if (viewport instanceof HTMLElement && track instanceof HTMLElement) {
    const cards = Array.from(track.querySelectorAll(".fighter-card"));
    let activeIndex = 0;
    let stride = 0;
    let autoRotateTimer = null;

    function setActiveCard(index) {
      const previousIndex = (index - 1 + cards.length) % cards.length;
      const nextIndex = (index + 1) % cards.length;

      cards.forEach((card, cardIndex) => {
        card.classList.toggle("is-active", cardIndex === index);
        card.classList.toggle("is-side", cardIndex === previousIndex || cardIndex === nextIndex);
      });
    }

    function updateTrackPosition(withAnimation = true) {
      if (cards.length === 0 || stride === 0) {
        return;
      }

      const firstCardWidth = cards[0].getBoundingClientRect().width;
      const viewportWidth = viewport.getBoundingClientRect().width;
      const centerOffset = (viewportWidth - firstCardWidth) / 2;

      track.style.transition = withAnimation ? "transform 0.45s ease" : "none";
      track.style.transform = `translateX(${centerOffset - activeIndex * stride}px)`;
      setActiveCard(activeIndex);
    }

    function measure() {
      if (cards.length === 0) {
        return;
      }

      const firstCardWidth = cards[0].getBoundingClientRect().width;
      const firstCardHeight = cards[0].getBoundingClientRect().height;
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;

      stride = firstCardWidth + gap;
      viewport.style.height = `${firstCardHeight}px`;
      updateTrackPosition(false);
    }

    function showNext() {
      if (cards.length === 0) {
        return;
      }

      activeIndex = (activeIndex + 1) % cards.length;
      updateTrackPosition();
    }

    function showPrevious() {
      if (cards.length === 0) {
        return;
      }

      activeIndex = (activeIndex - 1 + cards.length) % cards.length;
      updateTrackPosition();
    }

    function setActiveIndex(index) {
      if (cards.length === 0) {
        return;
      }

      activeIndex = Math.max(0, Math.min(index, cards.length - 1));
      updateTrackPosition();
    }

    function stopAutoRotate() {
      if (autoRotateTimer !== null) {
        window.clearInterval(autoRotateTimer);
        autoRotateTimer = null;
      }
    }

    function startAutoRotate() {
      stopAutoRotate();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || cards.length < 2) {
        return;
      }

      autoRotateTimer = window.setInterval(showNext, 5500);
    }

    cards.forEach((card, index) => {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        setActiveIndex(index);
      });
    });

    fighterCarousel.addEventListener("mouseenter", stopAutoRotate);
    fighterCarousel.addEventListener("mouseleave", startAutoRotate);
    window.addEventListener("resize", measure);

    measure();
    startAutoRotate();
  }
}
