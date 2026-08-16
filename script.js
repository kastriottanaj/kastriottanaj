/* Kastriot Tanaj — portfolio behaviour.
   Replaces the design file's DCLogic component state with plain DOM code. */
(() => {
  "use strict";

  /* ───────────────────────────────────────────────────────────────────────
     Where contact submissions go.

     Until this is set, the form validates and shows its confirmation but the
     message is NOT delivered anywhere. Point it at a form endpoint that
     accepts a POST (Formspree, Basin, a Netlify function, your own API) and
     submissions start going through for real.

     e.g. const ENDPOINT = "https://formspree.io/f/xxxxxxxx";
     ─────────────────────────────────────────────────────────────────────── */
  const ENDPOINT = "";

  /* ── Mobile navigation ─────────────────────────────────────────────────── */
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    const setMenu = (open) => {
      menu.dataset.open = String(open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Tapping a link closes the panel; Escape does too.
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });

    // Leaving the narrow breakpoint clears the toggled state.
    const wide = window.matchMedia("(min-width: 821px)");
    wide.addEventListener("change", (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* ── Mark the section currently in view ────────────────────────────────── */
  const navLinks = Array.from(document.querySelectorAll(".nav__links a"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const seen = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => seen.set(entry.target.id, entry.intersectionRatio));

        let bestId = null;
        let bestRatio = 0;
        seen.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        navLinks.forEach((link) => {
          const active = bestId !== null && link.getAttribute("href") === `#${bestId}`;
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-76px 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ── Contact form ──────────────────────────────────────────────────────── */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  if (form && status) {
    const showError = (name, message) => {
      const field = form.elements[name];
      const slot = form.querySelector(`[data-error-for="${name}"]`);
      if (!field || !slot) return;

      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", `${name}-error`);
      slot.id = `${name}-error`;
      slot.textContent = message;
      slot.hidden = false;
    };

    const clearErrors = () => {
      form.querySelectorAll("[data-error-for]").forEach((slot) => {
        slot.hidden = true;
        slot.textContent = "";
      });
      form.querySelectorAll("[aria-invalid]").forEach((field) => {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      });
    };

    const validate = () => {
      const problems = [];
      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const message = form.elements.message.value.trim();

      if (!name) problems.push(["name", "Please tell me your name."]);
      if (!email) problems.push(["email", "Please add an email so I can reply."]);
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        problems.push(["email", "That email doesn't look right."]);
      }
      if (!message) problems.push(["message", "A sentence or two is plenty."]);

      return problems;
    };

    const showStatus = (title, body) => {
      status.querySelector(".form-status__title").textContent = title;
      status.querySelector(".form-status__body").textContent = body;
      status.hidden = false;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearErrors();

      // Honeypot filled in → a bot. Show the confirmation, send nothing.
      if (form.elements.company.value) {
        form.hidden = true;
        showStatus("Thanks — got it.", "I'll reply within a couple of business days.");
        return;
      }

      const problems = validate();
      if (problems.length) {
        problems.forEach(([field, message]) => showError(field, message));
        form.elements[problems[0][0]].focus();
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      const label = button.textContent;
      button.disabled = true;
      button.textContent = "Sending…";

      try {
        if (ENDPOINT) {
          const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(form),
          });
          if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        }

        form.hidden = true;
        showStatus("Thanks — got it.", "I'll reply within a couple of business days.");
      } catch (error) {
        console.error(error);
        button.disabled = false;
        button.textContent = label;
        showStatus(
          "That didn't send.",
          "Something went wrong on the way. Please email me directly via LinkedIn and I'll pick it up there."
        );
      }
    });

    // Typing clears the message on the field being corrected.
    form.addEventListener("input", (event) => {
      const field = event.target;
      if (!field.name || field.getAttribute("aria-invalid") !== "true") return;

      const slot = form.querySelector(`[data-error-for="${field.name}"]`);
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
      if (slot) {
        slot.hidden = true;
        slot.textContent = "";
      }
    });
  }

  /* ── Footer year ───────────────────────────────────────────────────────── */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
