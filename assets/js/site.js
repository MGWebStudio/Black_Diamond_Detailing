/* ============================================================
   Black Diamond Detailing — interactions
   Lightweight, dependency-free, motion-aware.
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---- Current year ---- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Scroll-driven: nav state, progress bar, hero parallax ---- */
  const nav = $("#nav");
  const progress = $("#scroll-progress");
  const hero = $("#home");
  const heroContent = $("#hero-content");
  let ticking = false;

  const updateScroll = () => {
    const y = window.scrollY;

    if (nav) nav.classList.toggle("nav-scrolled", y > 40);

    if (progress) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }

    if (!prefersReduced && hero && heroContent) {
      const hb = hero.offsetHeight || 1;
      if (y < hb) {
        heroContent.style.transform = "translate3d(0," + (y * 0.22).toFixed(1) + "px,0)";
        heroContent.style.opacity = String(Math.max(0, 1 - (y / hb) * 0.95));
      }
    }
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScroll);
      ticking = true;
    }
  };
  updateScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  const menu = $("#mobile-menu");
  const menuBtn = $("#menu-btn");
  const menuClose = $("#menu-close");

  const openMenu = () => {
    if (!menu) return;
    menu.classList.add("is-open");
    document.body.classList.add("no-scroll");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
  };
  const closeMenu = () => {
    if (!menu) return;
    menu.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  };

  if (menuBtn) menuBtn.addEventListener("click", openMenu);
  if (menuClose) menuClose.addEventListener("click", closeMenu);
  $$(".mobile-link").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---- Scroll reveal ---- */
  const reveals = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => revObserver.observe(el));
  }

  /* ---- Animated counters ---- */
  const counters = $$(".counter");
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const fmt = (v) => (decimals ? v.toFixed(decimals) : String(Math.round(v)));
    if (prefersReduced) {
      el.textContent = fmt(target) + suffix;
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target) + suffix;
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
    } else {
      const cObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => cObserver.observe(el));
    }
  }

  /* ---- Scroll spy: active nav link ---- */
  const sections = $$("main section[id]");
  const navLinks = $$(".nav-link");
  const linkFor = (id) => navLinks.find((l) => l.getAttribute("href") === "#" + id);
  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove("is-active"));
            const link = linkFor(entry.target.id);
            if (link) link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---- Magnetic buttons (fine pointers only) ---- */
  if (finePointer && !prefersReduced) {
    $$(".btn-diamond, .btn-ghost").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = "translate(" + (x * 6).toFixed(1) + "px," + (y * 6 - 2).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ---- Cursor-follow spotlight on cards (fine pointers only) ---- */
  if (finePointer) {
    $$(".spotlight").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ---- Gallery lightbox ---- */
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightbox-img");
  const lightboxClose = $("#lightbox-close");
  let lastFocused = null;

  const openLightbox = (src) => {
    if (!lightbox || !lightboxImg) return;
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightbox.classList.remove("hidden");
    lightbox.classList.add("flex");
    document.body.classList.add("no-scroll");
    if (lightboxClose) lightboxClose.focus();
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.add("hidden");
    lightbox.classList.remove("flex");
    document.body.classList.remove("no-scroll");
    if (lightboxImg) lightboxImg.src = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };

  $$(".gallery-item").forEach((btn) => {
    btn.addEventListener("click", () => openLightbox(btn.dataset.full));
  });
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  /* ---- Global key handling ---- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      closeMenu();
    }
  });

  /* ---- Quote form → formatted email (no backend, like an email template) ---- */
  const SHOP_EMAIL = "307blackdiamonddetailing@gmail.com";
  const form = $("#quote-form");

  const setFieldError = (input, show) => {
    const field = input.closest(".field");
    if (field) field.classList.toggle("field-invalid", show);
    input.setAttribute("aria-invalid", show ? "true" : "false");
  };

  const showSuccess = () => {
    const body = $("#formBody");
    const success = $("#formSuccess");
    if (body) body.style.display = "none";
    if (success) {
      success.style.display = "block";
      success.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
    }
  };

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = $("#f-name");
      const phone = $("#f-phone");
      const email = $("#f-email");
      const vehicle = $("#f-vehicle");
      const service = $("#f-service");
      const message = $("#f-message");

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      let ok = true;
      if (!name.value.trim()) { setFieldError(name, true); ok = false; } else setFieldError(name, false);
      if (!phone.value.trim()) { setFieldError(phone, true); ok = false; } else setFieldError(phone, false);
      if (!emailOk) { setFieldError(email, true); ok = false; } else setFieldError(email, false);
      if (!ok) {
        const first = form.querySelector(".field.field-invalid input");
        if (first) first.focus();
        return;
      }

      const subject = "Detail quote request — " + name.value.trim();
      const lines = [
        "New quote request from the website:", "",
        "Name: " + name.value.trim(),
        "Phone: " + phone.value.trim(),
        "Email: " + email.value.trim(),
        "Vehicle: " + (vehicle.value.trim() || "(not provided)"),
        "Service: " + service.value,
        "",
        "Message:",
        (message.value.trim() || "(none provided)"),
        "",
        "(Tip: you can attach photos of your vehicle to this email before sending.)"
      ];
      const bodyText = lines.join("\r\n");

      window.location.href =
        "mailto:" + SHOP_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyText);

      showSuccess();
    });

    // Clear a field's error as soon as the visitor starts fixing it
    ["f-name", "f-phone", "f-email"].forEach((id) => {
      const el = $("#" + id);
      if (el) el.addEventListener("input", () => setFieldError(el, false));
    });
  }
})();
