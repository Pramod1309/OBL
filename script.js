const header = document.querySelector("[data-header]");
const nav = document.querySelector(".main-nav");
const navLinks = [...document.querySelectorAll(".nav-link")];
const revealItems = [...document.querySelectorAll(".reveal")];
const countItems = [...document.querySelectorAll("[data-count]")];

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
  header.classList.toggle("scrolled", window.scrollY > 20);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

nav.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  document.body.classList.remove("nav-open");
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

function animateCount(item) {
  const target = Number(item.dataset.count);
  const duration = 1100;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    item.textContent = Math.round(target * eased).toLocaleString("en-IN");
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

countItems.forEach((item) => countObserver.observe(item));

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -50% 0px" }
);

sections.forEach((section) => navObserver.observe(section));

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

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const name = String(formData.get("name") || "there").trim();
  formNote.textContent = `Thank you, ${name}. Your enquiry is ready. Connect this form to your preferred email or CRM to receive submissions.`;
  contactForm.reset();
});
