/* =============================================================
   main.js — Portfolio behaviour
   HTML Email Signature Developer
   -------------------------------------------------------------
   Vanilla JavaScript, no dependencies, no build step, loaded with
   `defer`.

   Everything here is progressive enhancement: with JavaScript
   disabled the page is fully readable, every section is visible,
   every link works, and navigation falls back to plain anchors.
   Nothing renders *because* of this file.

   Modules:
      1. Mobile navigation
      2. Scrollspy
      3. Reveal on scroll
      4. Copy email address

   Note: the email deliverables in this repository contain no
   JavaScript at all — email clients strip it. This file governs
   the portfolio website only.
   ============================================================= */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* -----------------------------------------------------------
     1. MOBILE NAVIGATION
     Toggles the collapsed panel below the 860px breakpoint.
     aria-expanded is the single source of truth for state; CSS
     reads it for the hamburger-to-X morph.
     ----------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var menu = document.querySelector("[data-nav-menu]");

    if (!toggle || !menu) return;

    // The button is inert markup until JS is running, so it stays
    // hidden from assistive tech until it actually does something.
    toggle.removeAttribute("hidden");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
    }

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    // Close after choosing a destination
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    // Escape closes and returns focus to the control that opened it
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // A click outside the header dismisses the panel
    document.addEventListener("click", function (event) {
      if (!isOpen()) return;
      if (event.target.closest(".nav")) return;
      setOpen(false);
    });

    // Resizing past the breakpoint must not leave a stranded panel
    var desktop = window.matchMedia("(min-width: 861px)");
    var onBreakpoint = function (event) {
      if (event.matches) setOpen(false);
    };

    if (typeof desktop.addEventListener === "function") {
      desktop.addEventListener("change", onBreakpoint);
    } else if (typeof desktop.addListener === "function") {
      desktop.addListener(onBreakpoint); // Safari < 14
    }
  }

  /* -----------------------------------------------------------
     2. SCROLLSPY
     Marks the nav link for the section currently in view.
     aria-current communicates it to assistive tech; CSS draws it.
     ----------------------------------------------------------- */
  function initScrollspy() {
    if (!("IntersectionObserver" in window)) return;

    var links = Array.prototype.slice.call(
      document.querySelectorAll("[data-nav-menu] a[href^='#']")
    );

    if (!links.length) return;

    var sections = links
      .map(function (link) {
        var id = link.getAttribute("href").slice(1);
        var section = id ? document.getElementById(id) : null;
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    function setCurrent(activeLink) {
      links.forEach(function (link) {
        if (link === activeLink) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    var visible = new Set();
    var lastLink = sections[sections.length - 1].link;

    function atBottom() {
      var scrolled = window.scrollY + window.innerHeight;
      return Math.ceil(scrolled) >= document.documentElement.scrollHeight - 2;
    }

    // Single decision point. Both the observer and the scroll listener
    // route through here, so neither can overwrite the other's result.
    function update() {
      // The final section can never scroll far enough to sit in the
      // detection band — the document runs out first — so it would
      // otherwise never become current. At the bottom of the page it is,
      // by definition, the section being read. This check comes first.
      if (atBottom()) {
        setCurrent(lastLink);
        return;
      }

      if (!visible.size) return;

      // Several sections can occupy the band at once — typically the one
      // being scrolled out of and the one arriving beneath it. The active
      // section is the one that started most recently, i.e. the greatest
      // `top`. Picking the smallest `top` would highlight the section
      // already scrolled past.
      var active = null;
      var activeY = -Infinity;

      visible.forEach(function (element) {
        var y = element.getBoundingClientRect().top;
        if (y > activeY) {
          activeY = y;
          active = element;
        }
      });

      var match = sections.filter(function (pair) {
        return pair.section === active;
      })[0];

      if (match) setCurrent(match.link);
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            visible.add(entry.target);
          } else {
            visible.delete(entry.target);
          }
        });
        update();
      },
      {
        // Band across the upper-middle of the viewport, offset for
        // the 64px fixed navbar
        rootMargin: "-72px 0px -55% 0px",
        threshold: 0
      }
    );

    sections.forEach(function (pair) {
      observer.observe(pair.section);
    });

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* -----------------------------------------------------------
     3. REVEAL ON SCROLL
     The `js-reveal` class on <html> is what makes [data-reveal]
     elements start hidden. It is only added when the browser can
     observe them AND the user has not requested reduced motion,
     so content can never get stuck invisible.
     ----------------------------------------------------------- */
  function initReveal() {
    if (prefersReducedMotion.matches) return;
    if (!("IntersectionObserver" in window)) return;

    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    document.documentElement.classList.add("js-reveal");

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // reveal once, then stop
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    targets.forEach(function (target) {
      observer.observe(target);
    });
  }

  /* -----------------------------------------------------------
     4. COPY EMAIL ADDRESS
     The button is hidden by default and only revealed when the
     async Clipboard API exists, so no one is offered a control
     that cannot work. The address stays visible as a mailto:
     link either way.
     ----------------------------------------------------------- */
  function initCopyEmail() {
    var button = document.querySelector("[data-copy]");
    if (!button) return;
    if (!navigator.clipboard || !navigator.clipboard.writeText) return;

    var value = button.getAttribute("data-copy");
    var label = button.querySelector("[data-copy-label]");
    var status = document.querySelector("[data-copy-status]");
    var original = label ? label.textContent : "";
    var timer = null;

    button.classList.add("is-available");

    button.addEventListener("click", function () {
      navigator.clipboard.writeText(value).then(
        function () {
          if (label) label.textContent = "Copied";
          if (status) status.textContent = "Email address copied to clipboard";
          button.classList.add("is-copied");

          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            if (label) label.textContent = original;
            if (status) status.textContent = "";
            button.classList.remove("is-copied");
          }, 2000);
        },
        function () {
          // Clipboard write can be refused by permissions policy.
          // Say so rather than showing a false success.
          if (label) label.textContent = "Press Ctrl/Cmd + C";
          if (status) status.textContent = "Copy failed — select the address and copy manually";
        }
      );
    });
  }

  /* ----------------------------------------------------------- */
  initNav();
  initScrollspy();
  initReveal();
  initCopyEmail();
})();
