/* Kastriot Tanaj — site behaviour.
   Mobile nav, homepage scroll-spy, contact and newsletter form enhancement,
   cookie consent controls, and the Meta Pixel conversion events. Everything
   here is optional — the site is fully usable with this file blocked. */
(() => {
  "use strict";

  /* ── Meta Pixel events ─────────────────────────────────────────────────── */
  /* Safe to call unconditionally: with PUBLIC_META_PIXEL_ID unset the component
     renders nothing and fbq is undefined. Consent is the pixel's own business —
     until the visitor accepts it sits in the 'revoke' state and sends nothing. */
  const track = (event, params, options) => {
    if (typeof window.fbq !== "function") return;
    if (options) window.fbq("track", event, params, options);
    else window.fbq("track", event, params);
  };

  const consentGranted = () => {
    try {
      return localStorage.getItem("cookie-consent") === "accepted";
    } catch (_) {
      return false;
    }
  };

  /* randomUUID needs a secure context, so keep a fallback for plain http —
     the server only checks the shape, and Meta only needs it to be unique. */
  const newEventId = () =>
    window.crypto?.randomUUID?.() ??
    `lead-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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

      if (typeof window.fbq === "function") {
        window.fbq("consent", granted ? "grant" : "revoke");
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

    // Leaving the narrow breakpoint clears the toggled state. Keep in step with
    // the nav collapse media query in site.css.
    window.matchMedia("(min-width: 1001px)").addEventListener("change", (e) => {
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

  /* ── Case-study sticky action bar ──────────────────────────────────────── */
  /* The bar only earns its place once the hero's own buttons have gone. It
     starts hidden in the markup, so a blocked script leaves the page with the
     floating WhatsApp button it always had rather than two overlapping calls. */
  const stickyBar = document.querySelector("[data-sticky-cta]");
  const stickyAfter = document.querySelector("[data-sticky-after]");

  if (stickyBar && stickyAfter && "IntersectionObserver" in window) {
    const stickyObserver = new IntersectionObserver(
      ([entry]) => {
        stickyBar.dataset.visible = String(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    stickyObserver.observe(stickyAfter);
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

    const LEAD_MESSAGES = {
      name: "Please tell me your name.",
      email: "That email doesn't look right.",
      message: "A sentence or two is plenty — the message came through empty.",
      captcha: "The spam check didn't pass. Reload the page and try once more.",
      too_large: "That message is longer than the form takes. Trim it a little and resend.",
      rate_limited: "That's a few tries in a row. Give it ten minutes and try again.",
      server: "Something broke on my side. Try again in a minute.",
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

      /* One id shared by two Leads — this browser's, fired on /thanks/, and the
         Conversions API's, sent from the server — so Meta counts the pair once
         instead of twice. The consent flag rides along because a server request
         carries no trace of what the visitor chose in the banner. */
      const eventId = newEventId();
      const body = new FormData(form);
      body.set("meta_event_id", eventId);
      body.set("meta_consent", consentGranted() ? "granted" : "denied");

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body,
        });

        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        try {
          sessionStorage.setItem("meta-lead-event", eventId);
        } catch (_) {}

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

    /* A no-JS post that failed comes back as ?error=… on whichever page holds
       the form — the homepage or /contact/. Say why, rather than returning the
       visitor to an untouched form with no explanation. */
    const failure = new URLSearchParams(location.search).get("error");
    if (failure) {
      showStatus("That didn't send.", LEAD_MESSAGES[failure] || LEAD_MESSAGES.server);
    }
  }
  /* ── Lead conversion ───────────────────────────────────────────────────── */
  /* Fired on /thanks/ rather than in the fetch callback above: it is the single
     destination both the JS and the no-JS path reach, and a page load can't be
     cut short the way a request racing a redirect can. Reloads are skipped so a
     refresh doesn't count a second lead. */
  if (location.pathname === "/thanks/") {
    const entries = performance.getEntriesByType?.("navigation");
    if (entries?.[0]?.type !== "reload") {
      // Absent when someone reaches /thanks/ without submitting anything; the
      // event still counts, it just has no server twin to be paired with.
      let eventId = null;
      try {
        eventId = sessionStorage.getItem("meta-lead-event");
        sessionStorage.removeItem("meta-lead-event");
      } catch (_) {}

      track("Lead", { content_name: "Contact form" }, eventId ? { eventID: eventId } : null);
    }
  }

  /* ── Newsletter subscribe ──────────────────────────────────────────────── */
  /* The same form can appear more than once on a page (footer of a post, plus
     the block on /newsletter/), so everything here is per-form. */
  const SUBSCRIBE_MESSAGES = {
    email: "That email doesn't look right.",
    rate_limited: "That's a few tries in a row. Give it ten minutes and try again.",
    captcha: "The spam check didn't pass. Reload the page and try once more.",
    mail: "I couldn't send the confirmation email just then. Try again in a minute.",
    link: "That link has expired. Drop your email in again and I'll send a fresh one.",
    server: "Something broke on my side. Try again in a minute.",
  };

  const newsletterForms = document.querySelectorAll("[data-newsletter-form]");

  newsletterForms.forEach((form) => {
    const section = form.closest(".newsletter");
    const status = section?.querySelector("[data-newsletter-status]");
    if (!status) return;

    const statusTitle = status.querySelector(".newsletter__status-title");
    const statusBody = status.querySelector(".newsletter__status-body");
    const emailField = form.elements.email;
    const errorSlot = form.querySelector('[data-error-for="email"]');

    // Validation moves here now that we know this file runs.
    form.setAttribute("novalidate", "");

    const showStatus = (title, body, isError) => {
      status.classList.toggle("newsletter__status--error", Boolean(isError));
      if (statusTitle) statusTitle.textContent = title;
      if (statusBody) statusBody.textContent = body || "";
      status.hidden = false;
    };

    const showFieldError = (message) => {
      emailField.setAttribute("aria-invalid", "true");
      if (!errorSlot) return;
      // The slot is given its id in the markup, so it is unique per form.
      emailField.setAttribute("aria-describedby", errorSlot.id);
      errorSlot.textContent = message;
      errorSlot.hidden = false;
    };

    const clearFieldError = () => {
      emailField.removeAttribute("aria-invalid");
      emailField.removeAttribute("aria-describedby");
      if (!errorSlot) return;
      errorSlot.hidden = true;
      errorSlot.textContent = "";
    };

    form.addEventListener("input", () => {
      if (emailField.getAttribute("aria-invalid") === "true") clearFieldError();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFieldError();
      status.hidden = true;

      const email = emailField.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        showFieldError(SUBSCRIBE_MESSAGES.email);
        emailField.focus();
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
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw Object.assign(new Error("subscribe failed"), { code: result.error });
        }

        // Nothing is subscribed yet — the confirmation click is what counts, so
        // the wording has to send them to their inbox rather than celebrate.
        form.hidden = true;
        showStatus(
          "Check your inbox.",
          "I've sent you a short email — click the link inside and you're on the list."
        );

        // Double opt-in, so this is the request rather than the confirmed
        // subscriber — the confirm route is a separate page load.
        track("CompleteRegistration", { content_name: "Newsletter" });
      } catch (error) {
        button.disabled = false;
        button.textContent = label;

        const code = error.code;
        if (code === "email") {
          showFieldError(SUBSCRIBE_MESSAGES.email);
          emailField.focus();
          return;
        }

        showStatus("That didn't go through.", SUBSCRIBE_MESSAGES[code] || SUBSCRIBE_MESSAGES.server, true);
      }
    });
  });

  /* A no-JS post that failed comes back as /newsletter/?error=… — surface it
     next to the form rather than leaving the visitor to guess. */
  if (newsletterForms.length) {
    const failure = new URLSearchParams(location.search).get("error");
    if (failure) {
      const first = newsletterForms[0].closest(".newsletter");
      const status = first?.querySelector("[data-newsletter-status]");
      if (status) {
        status.classList.add("newsletter__status--error");
        const title = status.querySelector(".newsletter__status-title");
        const body = status.querySelector(".newsletter__status-body");
        if (title) title.textContent = "That didn't go through.";
        if (body) body.textContent = SUBSCRIBE_MESSAGES[failure] || SUBSCRIBE_MESSAGES.server;
        status.hidden = false;
      }
    }
  }

  /* ── Outbound contact taps ─────────────────────────────────────────────── */
  /* WhatsApp, phone and email all hand the visitor to another app, so the click
     is the only signal this side ever gets. Delegated from the document because
     these links appear in the footer, the FAB and inside post bodies. */
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const href = target?.closest("a[href]")?.getAttribute("href") || "";

    let channel = null;
    if (href.includes("wa.me")) channel = "WhatsApp";
    else if (href.startsWith("tel:")) channel = "Phone";
    else if (href.startsWith("mailto:")) channel = "Email";

    if (channel) track("Contact", { content_name: channel });
  });
})();
