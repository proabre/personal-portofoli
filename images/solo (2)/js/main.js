/* =========================================================
   Solo — vanilla JavaScript. No jQuery, no plugins.
   One function per feature, guard clauses, IntersectionObserver.
   ========================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navbar: solid on scroll ---------- */
  function initNavScroll() {
    var nav = document.getElementById("mainNav");
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile nav: close on link click ---------- */
  function initMobileNav() {
    var menu = document.getElementById("navMenu");
    if (!menu || !window.bootstrap) return;
    var links = menu.querySelectorAll("a[href^='#']");
    links.forEach(function (link) {
      link.addEventListener("click", function () {
        if (menu.classList.contains("show")) {
          var instance = window.bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false });
          instance.hide();
        }
      });
    });
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.dataset.delay ? parseInt(el.dataset.delay, 10) : 0;
          setTimeout(function () { el.classList.add("in"); }, delay);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    // Stagger cards within a row for a nicer cascade
    items.forEach(function (el, i) {
      var siblings = el.parentElement ? el.parentElement.children.length : 1;
      if (el.closest(".row") && siblings > 1) { el.dataset.delay = (i % 4) * 70; }
      io.observe(el);
    });
  }

  /* ---------- Count-up metrics ---------- */
  function initCountUp() {
    var counters = document.querySelectorAll(".count");
    if (!counters.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach(function (c) { c.textContent = c.dataset.count; });
      return;
    }
    var run = function (el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      var dur = 1500, start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString();
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* ---------- Portfolio filtering ---------- */
  function initFilter() {
    var bar = document.querySelector(".filterbar");
    var items = document.querySelectorAll(".work-item");
    if (!bar || !items.length) return;
    var buttons = bar.querySelectorAll(".filter-btn");

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      var filter = btn.dataset.filter;

      buttons.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });

      items.forEach(function (item) {
        var show = filter === "all" || item.dataset.category === filter;
        item.classList.toggle("hide", !show);
      });
    });
  }

  /* ---------- Lightbox (portfolio) ---------- */
  function initLightbox() {
    var lb = document.getElementById("lightbox");
    var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
    if (!lb || !triggers.length) return;

    var img = lb.querySelector("#lb-img");
    var catEl = lb.querySelector(".lb-cat");
    var titleEl = lb.querySelector(".lb-title");
    var current = 0;
    var lastFocus = null;

    var render = function () {
      var t = triggers[current];
      img.setAttribute("src", t.getAttribute("href"));
      img.setAttribute("alt", t.querySelector("img") ? t.querySelector("img").alt : "");
      catEl.textContent = t.dataset.cat || "";
      titleEl.textContent = t.dataset.title || "";
    };
    var open = function (index) {
      current = index;
      render();
      lastFocus = document.activeElement;
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add("open"); });
      document.body.style.overflow = "hidden";
      lb.querySelector("[data-lb-close]").focus();
      document.addEventListener("keydown", onKey);
    };
    var close = function () {
      lb.classList.remove("open");
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      var done = function () { lb.hidden = true; lb.removeEventListener("transitionend", done); };
      lb.addEventListener("transitionend", done);
      if (prefersReduced) done();
      if (lastFocus) lastFocus.focus();
    };
    var move = function (dir) {
      current = (current + dir + triggers.length) % triggers.length;
      render();
    };
    var onKey = function (e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "Tab") {
        // simple focus trap
        var f = lb.querySelectorAll("button");
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    triggers.forEach(function (t, i) {
      t.addEventListener("click", function (e) { e.preventDefault(); open(i); });
    });
    lb.querySelector("[data-lb-close]").addEventListener("click", close);
    lb.querySelector("[data-lb-prev]").addEventListener("click", function () { move(-1); });
    lb.querySelector("[data-lb-next]").addEventListener("click", function () { move(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  }

  /* ---------- Pricing billing toggle ---------- */
  function initPricingToggle() {
    var toggle = document.querySelector(".billing-toggle");
    if (!toggle) return;
    var opts = toggle.querySelectorAll(".billing-opt");
    var amounts = document.querySelectorAll(".price-amt");

    toggle.addEventListener("click", function (e) {
      var btn = e.target.closest(".billing-opt");
      if (!btn) return;
      var mode = btn.dataset.billing;
      opts.forEach(function (o) {
        var active = o === btn;
        o.classList.toggle("is-active", active);
        o.setAttribute("aria-pressed", active ? "true" : "false");
      });
      amounts.forEach(function (a) {
        var val = mode === "annual" ? a.dataset.annual : a.dataset.monthly;
        if (val) a.textContent = val;
      });
    });
  }

  /* ---------- Testimonials slider ---------- */
  function initSlider() {
    var root = document.querySelector("[data-slider]");
    if (!root) return;
    var track = root.querySelector("[data-slider-track]");
    var slides = root.querySelectorAll(".slide");
    var dotsWrap = root.querySelector("[data-slider-dots]");
    var prev = root.querySelector("[data-slider-prev]");
    var next = root.querySelector("[data-slider-next]");
    if (!track || slides.length < 2) return;

    var index = 0, timer = null, DURATION = 6000;

    // Build dots
    var dots = [];
    slides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.setAttribute("role", "tab");
      d.setAttribute("aria-label", "Testimonial " + (i + 1));
      if (i === 0) d.classList.add("is-active");
      d.addEventListener("click", function () { go(i); reset(); });
      dotsWrap.appendChild(d);
      dots.push(d);
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (d, di) {
        d.classList.toggle("is-active", di === index);
        d.setAttribute("aria-selected", di === index ? "true" : "false");
      });
    }
    function start() {
      if (prefersReduced) return;
      timer = setInterval(function () { go(index + 1); }, DURATION);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function reset() { stop(); start(); }

    prev.addEventListener("click", function () { go(index - 1); reset(); });
    next.addEventListener("click", function () { go(index + 1); reset(); });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(index - 1); reset(); }
      else if (e.key === "ArrowRight") { go(index + 1); reset(); }
    });

    go(0);
    start();
  }

  /* ---------- Contact form validation ---------- */
  function initContactForm() {
    var form = document.querySelector(".contact-form");
    if (!form) return;
    var status = form.querySelector(".form-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) {
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        if (status) { status.hidden = false; status.classList.add("error"); status.textContent = "Please fix the highlighted fields and try again."; }
        return;
      }
      if (status) {
        status.hidden = false;
        status.classList.remove("error");
        status.textContent = "Thanks — your enquiry is in. We'll reply within one business day.";
      }
      form.reset();
      form.classList.remove("was-validated");
    });
  }

  /* ---------- Newsletter (footer) ---------- */
  function initNewsletter() {
    var form = document.querySelector(".footer-sub");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type='email']");
      if (input && input.checkValidity()) {
        input.value = "";
        input.placeholder = "You're subscribed ✓";
      } else if (input) {
        input.focus();
      }
    });
  }

  /* ---------- Back to top ---------- */
  function initBackToTop() {
    var btn = document.getElementById("toTop");
    if (!btn) return;
    btn.hidden = false; // reveal the always-rendered control; CSS opacity handles visibility
    var onScroll = function () {
      btn.classList.toggle("show", window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
    onScroll();
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNavScroll();
    initMobileNav();
    initReveal();
    initCountUp();
    initFilter();
    initLightbox();
    initPricingToggle();
    initSlider();
    initContactForm();
    initNewsletter();
    initBackToTop();
  });
})();
