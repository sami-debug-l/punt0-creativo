const SITE = {
  businessName: "Punto Creativo",
  city: "Yapacaní",
  // Cambia este número (solo dígitos, con código país). Ej: "59171234567"
  whatsappNumber: "59174959647",
  whatsappMessage:
    "Hola Punto Creativo, quiero una cotización. Me interesa: (producto) · Cantidad: (n) · Medida: (opcional).",
};

function buildWhatsAppUrl() {
  const phone = String(SITE.whatsappNumber || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(SITE.whatsappMessage || "");
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${text}`;
}

function initWhatsAppLinks() {
  const url = buildWhatsAppUrl();
  const links = document.querySelectorAll("[data-whatsapp]");
  for (const a of links) {
    if (!(a instanceof HTMLAnchorElement)) continue;
    if (!url) {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
      continue;
    }
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
}

function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector("#menu");
  if (!(toggle instanceof HTMLButtonElement)) return;
  if (!(menu instanceof HTMLElement)) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!open);
  });

  menu.addEventListener("click", (e) => {
    // Si el usuario hace click sobre el texto/nodo hijo del link,
    // igualmente cerramos el menú encontrando el <a> más cercano.
    const target = e.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a");
    if (anchor) setOpen(false);
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    const open = toggle.getAttribute("aria-expanded") === "true";
    if (!open) return;
    if (target instanceof Node && (menu.contains(target) || toggle.contains(target))) return;
    setOpen(false);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

function initActiveNav() {
  const path = (window.location.pathname || "").toLowerCase();
  const file = path.split("/").pop() || "index.html";
  const current = file === "" ? "index.html" : file;

  const links = document.querySelectorAll(".nav-links a");
  for (const a of links) {
    if (!(a instanceof HTMLAnchorElement)) continue;
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (!href.endsWith(".html")) continue;
    const target = href.split("/").pop();
    const active = target === current;
    a.classList.toggle("is-active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

function initYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function initCarousels() {
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const carousels = document.querySelectorAll("[data-carousel]");

  for (const root of carousels) {
    if (!(root instanceof HTMLElement)) continue;

    const track = root.querySelector(".carousel-track");
    const dotsHost = root.querySelector("[data-carousel-dots]");
    const prevBtn = root.querySelector("[data-carousel-prev]");
    const nextBtn = root.querySelector("[data-carousel-next]");
    if (!(track instanceof HTMLElement)) continue;
    if (!(dotsHost instanceof HTMLElement)) continue;

    const intervalMsRaw = root.getAttribute("data-interval-ms") || "1500";
    const intervalMs = Math.max(800, Number(intervalMsRaw) || 1500);

    const imagesRaw = root.getAttribute("data-images") || "";
    const images = imagesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const usePlaceholders = images.length === 0;

    track.innerHTML = "";
    dotsHost.innerHTML = "";

    const slides = [];
    const dots = [];

    const sources = usePlaceholders ? ["_ph_1", "_ph_2", "_ph_3"] : images;

    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];

      const slide = document.createElement("div");
      slide.className = "carousel-slide";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-label", `Imagen ${i + 1} de ${sources.length}`);

      if (usePlaceholders) {
        slide.classList.add("is-placeholder");
        slide.style.setProperty("--ph", String(i + 1));
      } else {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = i === 0 ? "eager" : "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => {
          slide.classList.add("is-placeholder");
          img.remove();
        });
        slide.appendChild(img);
      }
      track.appendChild(slide);
      slides.push(slide);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Ir a imagen ${i + 1}`);
      dot.addEventListener("click", () => setIndex(i, true));
      dotsHost.appendChild(dot);
      dots.push(dot);
    }

    let index = 0;
    let timer = null;

    const setIndex = (nextIndex, userAction) => {
      index = (nextIndex + slides.length) % slides.length;
      for (let i = 0; i < slides.length; i++) {
        slides[i].classList.toggle("is-active", i === index);
        dots[i].classList.toggle("is-active", i === index);
      }
      if (userAction) restart();
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      if (prefersReduced) return;
      if (slides.length <= 1) return;
      stop();
      timer = window.setInterval(() => setIndex(index + 1, false), intervalMs);
    };

    const restart = () => {
      stop();
      start();
    };

    if (prevBtn instanceof HTMLElement) prevBtn.addEventListener("click", () => setIndex(index - 1, true));
    if (nextBtn instanceof HTMLElement) nextBtn.addEventListener("click", () => setIndex(index + 1, true));

    root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex(index - 1, true);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex(index + 1, true);
      }
    });

    let dragStartX = null;
    const dragThreshold = 40;
    const onDragEnd = (endX) => {
      if (dragStartX == null) return;
      const delta = endX - dragStartX;
      if (Math.abs(delta) >= dragThreshold) {
        setIndex(delta < 0 ? index + 1 : index - 1, true);
      }
      dragStartX = null;
    };

    root.addEventListener("pointerdown", (e) => {
      dragStartX = e.clientX;
    });
    root.addEventListener("pointerup", (e) => {
      onDragEnd(e.clientX);
    });
    root.addEventListener("pointercancel", () => {
      dragStartX = null;
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    setIndex(0, false);
    start();
  }
}

function initWorkGalleries() {
  const galleries = document.querySelectorAll(".gallery[data-max-items]");
  if (!galleries.length) return;

  for (const gallery of galleries) {
    if (!(gallery instanceof HTMLElement)) continue;
    const maxItems = Number(gallery.getAttribute("data-max-items"));
    if (!Number.isFinite(maxItems) || maxItems <= 0) continue;
    const works = Array.from(gallery.querySelectorAll(".work"));
    for (let i = 0; i < works.length; i++) {
      if (i >= maxItems) works[i].remove();
    }
  }
}

const REVIEWS_STORAGE_KEY = "pc_reviews_v1";
const MAX_STORED_REVIEWS = 40;

function loadReviewsFromStorage() {
  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === "object");
  } catch {
    return [];
  }
}

function saveReviewsToStorage(reviews) {
  try {
    window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch {
    return false;
  }
}

function formatReviewDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function createReviewCard(review) {
  const figure = document.createElement("figure");
  figure.className = "quote quote-opinion quote-user";
  figure.setAttribute("data-user-review", "true");

  const score = document.createElement("div");
  score.className = "quote-stars quote-score";
  score.textContent = `${review.rating}/5`;
  score.setAttribute("aria-hidden", "true");

  const quote = document.createElement("blockquote");
  quote.textContent = review.message;

  const figcaption = document.createElement("figcaption");
  const name = document.createElement("span");
  name.className = "quote-name";
  name.textContent = review.name;

  const role = document.createElement("span");
  role.className = "quote-role";
  const roleParts = [];
  if (review.business) roleParts.push(review.business);
  if (review.city) roleParts.push(review.city);
  role.textContent = roleParts.length ? roleParts.join(" - ") : "Cliente de Punto Creativo";

  figcaption.appendChild(name);
  figcaption.appendChild(role);

  figure.appendChild(score);
  figure.appendChild(quote);
  figure.appendChild(figcaption);

  const dateLabel = formatReviewDate(review.createdAt);
  if (dateLabel) {
    const date = document.createElement("div");
    date.className = "quote-date";
    date.textContent = dateLabel;
    figure.appendChild(date);
  }

  return figure;
}

function renderStoredReviews(listEl, reviews) {
  const oldNodes = listEl.querySelectorAll("[data-user-review='true']");
  for (const node of oldNodes) node.remove();

  if (!reviews.length) return;

  const fragment = document.createDocumentFragment();
  for (const review of reviews) {
    fragment.appendChild(createReviewCard(review));
  }
  listEl.prepend(fragment);
}

function initReviews() {
  const listEl = document.getElementById("reviews-list");
  const form = document.querySelector("[data-review-form]");
  const statusEl = document.querySelector("[data-review-status]");
  if (!(listEl instanceof HTMLElement)) return;
  if (!(form instanceof HTMLFormElement)) return;

  let reviews = loadReviewsFromStorage();
  renderStoredReviews(listEl, reviews);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) {
      if (statusEl) statusEl.textContent = "Revisa los campos obligatorios antes de publicar.";
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim().slice(0, 50);
    const business = String(formData.get("business") || "").trim().slice(0, 60);
    const city = String(formData.get("city") || "").trim().slice(0, 40);
    const message = String(formData.get("message") || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 400);
    const ratingRaw = Number(formData.get("rating") || 5);
    const rating = Math.min(5, Math.max(1, Number.isFinite(ratingRaw) ? Math.round(ratingRaw) : 5));

    if (name.length < 2 || message.length < 12) {
      if (statusEl) statusEl.textContent = "Tu reseña debe incluir nombre y un mensaje mas detallado.";
      return;
    }

    const review = {
      name,
      business,
      city,
      message,
      rating,
      createdAt: new Date().toISOString(),
    };

    reviews = [review, ...reviews].slice(0, MAX_STORED_REVIEWS);
    renderStoredReviews(listEl, reviews);

    const saved = saveReviewsToStorage(reviews);
    form.reset();
    const ratingInput = form.elements.namedItem("rating");
    if (ratingInput instanceof HTMLSelectElement) ratingInput.value = "5";

    if (statusEl) {
      statusEl.textContent = saved
        ? "Reseña publicada correctamente."
        : "Reseña publicada en pantalla, pero no se pudo guardar en este navegador.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initWhatsAppLinks();
  initMobileMenu();
  initActiveNav();
  initCarousels();
  initWorkGalleries();
  initReviews();
});

