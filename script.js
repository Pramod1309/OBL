const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const revealItems = [...document.querySelectorAll(".reveal")];

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "stroke-width": 2.2
      }
    });
  }
}

window.addEventListener("load", initIcons);

function setHeaderState() {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 20);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

function setMenuState(isOpen) {
  document.body.classList.toggle("nav-open", isOpen);
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  }
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    setMenuState(!document.body.classList.contains("nav-open"));
  });
}

if (nav) {
  nav.addEventListener("click", (event) => {
    const menuItem = event.target.closest("a, button");
    if (!menuItem) return;
    if (menuItem.matches(".nav-action")) {
      event.preventDefault();
    }
    setMenuState(false);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
  }
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => {
  if (reduceMotion) {
    item.classList.add("in-view");
    return;
  }

  item.classList.add("can-animate");
  if (item.getBoundingClientRect().top < window.innerHeight * 0.92) {
    requestAnimationFrame(() => item.classList.add("in-view"));
    return;
  }

  revealObserver.observe(item);
});

const ticker = document.querySelector(".ticker-track");
if (ticker) {
  ticker.innerHTML += ticker.innerHTML;
}

const heroCarousel = document.querySelector("[data-hero-carousel]");
const heroSlider = document.querySelector("[data-hero-slider]");
let heroSlideIndex = 0;
let heroTimer = null;
let heroPaused = false;

function showHeroSlide(index) {
  if (!heroSlider) return;
  const slideCount = heroSlider.children.length;
  heroSlideIndex = (index + slideCount) % slideCount;
  heroSlider.style.transform = `translateX(-${heroSlideIndex * 100}%)`;
}

function stopHeroSlider() {
  if (!heroTimer) return;
  clearInterval(heroTimer);
  heroTimer = null;
}

function startHeroSlider() {
  if (!heroSlider || reduceMotion || heroPaused || heroSlider.children.length < 2 || heroTimer) return;
  heroTimer = setInterval(() => showHeroSlide(heroSlideIndex + 1), 3000);
}

if (heroCarousel && heroSlider) {
  if (reduceMotion) {
    heroSlider.style.transition = "none";
  } else {
    startHeroSlider();
  }

  heroCarousel.addEventListener("click", () => {
    heroPaused = !heroPaused;
    heroCarousel.classList.toggle("is-paused", heroPaused);
    heroCarousel.setAttribute("aria-pressed", String(heroPaused));
    if (heroPaused) {
      stopHeroSlider();
    } else {
      startHeroSlider();
    }
  });

  heroCarousel.addEventListener("keydown", (event) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    heroCarousel.click();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopHeroSlider();
    } else {
      startHeroSlider();
    }
  });
}

const contactForm = document.querySelector("#contact-form");
const formNote = document.querySelector(".form-note");

function getContactEndpoint() {
  if (!contactForm) return "";
  const configuredEndpoint = contactForm.dataset.endpoint.trim();
  if (configuredEndpoint) return configuredEndpoint;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:5000/api/enquiries";
  }
  return "";
}

function savePendingEnquiry(payload) {
  const key = "oblPendingEnquiries";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push({
    ...payload,
    savedAt: new Date().toISOString()
  });
  localStorage.setItem(key, JSON.stringify(existing));
}

async function submitEnquiry(payload) {
  const endpoint = getContactEndpoint();
  if (!endpoint) {
    savePendingEnquiry(payload);
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Unable to submit enquiry");
  }
}

if (contactForm && formNote) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector("button[type='submit']");
    const formData = new FormData(contactForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      school: String(formData.get("school") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      interest: String(formData.get("interest") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };

    if (submitButton) {
      submitButton.disabled = true;
    }
    formNote.textContent = "Sending your query...";

    try {
      await submitEnquiry(payload);
      formNote.textContent = "Thank you for your attention. We will be in touch with you.";
      contactForm.reset();
    } catch (error) {
      savePendingEnquiry(payload);
      formNote.textContent = "Thank you for your attention. We will be in touch with you.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}
