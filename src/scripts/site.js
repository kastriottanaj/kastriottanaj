/* Kastriot Tanaj — site behaviour.
   Mobile nav, homepage scroll-spy, contact form enhancement, and cookie
   consent controls. Everything here is optional — the site is fully usable
   with this file blocked. */
(() => {
  "use strict";

  /* ── Cookie consent / Google Consent Mode v2 ──────────────────────────── */
  const consentPanel = document.querySelector("[data-cookie-consent]");
  const consentSettings = document.querySelector("[data-cookie-settings]");

  if (consentPanel) {
    const acceptButton = consentPanel.querySelector("[data-cookie-accept]");
    const rejectButton = consentPanel.querySelector("[data-cookie-reject]");

    const readChoice = () => {
      try {
        return localStorage.getItem("cookie-consent");
      } catch (_) {
        return null;
      }
    };

    const saveChoice = (choice) => {
      try {
        localStorage.setItem("cookie-consent", choice);
      } catch (_) {}
    };

    const updateConsent = (granted) => {
      const value = granted ? "granted" : "denied";
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          ad_storage: value,
          ad_user_data: value,
          ad_personalization: value,
          analytics_storage: value,
          functionality_storage: value,
          personalization_storage: value,
        });
      }
    };

    const closePanel = () => {
      consentPanel.hidden = true;
    };

    const choose = (choice) => {
      saveChoice(choice);
      updateConsent(choice === "accepted");
      closePanel();
    };

    acceptButton?.addEventListener("click", () => choose("accepted"));
    rejectButton?.addEventListener("click", () => choose("rejected"));
    consentSettings?.addEventListener("click", () => {
      consentPanel.hidden = false;
      acceptButton?.focus();
    });

    if (!readChoice()) consentPanel.hidden = false;
  }

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
    window.matchMedia("(min-width: 821px)").addEventListener("change", (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* ── Mark the section currently in view ────────────────────────────────── */
  /* Only same-page anchors take part. Real page links (/services/, /blog/) are
     marked server-side with aria-current="page" in Nav.astro. */
  const anchorLinks = Array.from(document.querySelectorAll('.nav__links a[href*="#"]')).filter(
    (link) => {
      const href = link.getAttribute("href") || "";
      const [path] = href.split("#");
      return path === "" || path === "/" ? location.pathname === "/" || path === "" : false;
    }
  );

  const sections = anchorLinks
    .map((link) => {
      const id = (link.getAttribute("href") || "").split("#")[1];
      return id ? document.getElementById(id) : null;
    })
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

        anchorLinks.forEach((link) => {
          const id = (link.getAttribute("href") || "").split("#")[1];
          if (bestId !== null && id === bestId) link.setAttribute("aria-current", "true");
          else if (link.getAttribute("aria-current") === "true") link.removeAttribute("aria-current");
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
    // Hand validation over to this script now that we know it runs. Without it
    // the browser's own required/type checks stay in charge.
    form.setAttribute("novalidate", "");

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
        const response = await fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });

        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        // Same destination the no-JS path lands on, so conversion tracking has
        // one URL to watch.
        window.location.assign("/thanks/");
      } catch (error) {
        console.error(error);
        button.disabled = false;
        button.textContent = label;
        showStatus(
          "That didn't send.",
          "Something went wrong on the way. Please reach me on LinkedIn and I'll pick it up there."
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
})();
