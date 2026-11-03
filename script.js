(() => {
  "use strict";

  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const one = (selector, root = document) => root.querySelector(selector);

  const syncBootstrapCarouselSlides = (carousel) => {
    if (!carousel.matches(".carousel[data-bs-ride='carousel']")) return;
    const slides = all(".carousel-inner > .carousel-item", carousel);
    if (!slides.length) return;
    slides.forEach((slide) => {
      slide.setAttribute("aria-hidden", String(!slide.classList.contains("active")));
    });
  };

  function setupBootstrapCarousels() {
    if (!window.bootstrap ||
        typeof window.bootstrap.Carousel !== "function" ||
        typeof window.bootstrap.Carousel.getOrCreateInstance !== "function") return;

    all(".carousel[data-bs-ride='carousel']").forEach((carousel) => {
      const toggle = one("[data-bs-carousel-toggle]", carousel);
      if (!toggle) return;

      const instance = window.bootstrap.Carousel.getOrCreateInstance(carousel);
      syncBootstrapCarouselSlides(carousel);
      carousel.addEventListener("slid.bs.carousel", () => {
        syncBootstrapCarouselSlides(carousel);
      });
      const reducedMotion = typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
      let userPaused = toggle.getAttribute("aria-pressed") === "true";
      const isReducedMotion = () => Boolean(reducedMotion && reducedMotion.matches);
      const pause = () => {
        if (typeof instance.pause === "function") instance.pause();
      };
      const cycle = () => {
        if (typeof instance.cycle === "function") instance.cycle();
      };
      const updateToggle = () => {
        const forcedPause = isReducedMotion();
        const paused = userPaused || forcedPause;
        toggle.disabled = forcedPause;
        toggle.setAttribute("aria-disabled", String(forcedPause));
        toggle.textContent = forcedPause
          ? "Carrossel pausado"
          : paused ? "Reproduzir carrossel" : "Pausar carrossel";
        toggle.setAttribute("aria-label", toggle.textContent);
        toggle.setAttribute("aria-pressed", String(paused));
      };

      if (isReducedMotion()) pause();
      updateToggle();
      toggle.addEventListener("click", () => {
        if (isReducedMotion()) return;
        userPaused = !userPaused;
        if (userPaused) pause();
        else cycle();
        updateToggle();
      });
      const handleMotionPreferenceChange = () => {
        if (isReducedMotion()) pause();
        else if (userPaused) pause();
        else cycle();
        updateToggle();
      };
      if (reducedMotion) {
        if (typeof reducedMotion.addEventListener === "function") {
          reducedMotion.addEventListener("change", handleMotionPreferenceChange);
        } else if (typeof reducedMotion.addListener === "function") {
          reducedMotion.addListener(handleMotionPreferenceChange);
        }
      }
    });
  }

  function setupMenus() {
    all("[data-nova-menu-button]").forEach((button) => {
      const targetId = button.getAttribute("aria-controls") || button.dataset.novaMenuTarget;
      const menu = targetId ? document.getElementById(targetId) : null;
      if (!menu) return;

      const setMenuState = (isOpen) => {
        button.setAttribute("aria-expanded", String(isOpen));
        button.setAttribute("aria-label", isOpen
          ? "Fechar menu de navegação"
          : "Abrir menu de navegação");
      };

      setMenuState(button.getAttribute("aria-expanded") === "true");
      button.addEventListener("click", () => {
        const isOpen = button.getAttribute("aria-expanded") === "true";
        setMenuState(!isOpen);
        menu.classList.toggle("hidden", isOpen);
        menu.classList.toggle("is-open", !isOpen);
      });
      all('a[href^="#"]', menu).forEach((link) => link.addEventListener("click", () => {
        setMenuState(false);
        menu.classList.add("hidden");
        menu.classList.remove("is-open");
      }));
    });
  }

  function setupCarousels() {
    all("[data-nova-carousel]").forEach((carousel) => {
      const slides = all("[data-nova-slide]", carousel);
      if (slides.length < 2) return;
      const controls = all("[data-nova-carousel-control]", carousel);
      const indicators = all("[data-nova-carousel-indicator]", carousel);
      const toggle = one("[data-nova-carousel-toggle]", carousel);
      const status = one("[data-nova-carousel-status]", carousel);
      let current = slides.findIndex((slide) => slide.classList.contains("is-active"));
      let timer;
      let pointerInside = false;
      let focusInside = false;
      let userPaused = toggle?.getAttribute("aria-pressed") === "true";
      const reducedMotion = typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
      const isReducedMotion = () => Boolean(reducedMotion && reducedMotion.matches);
      if (current < 0) current = 0;

      const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => {
          const active = i === current;
          slide.classList.toggle("is-active", active);
          slide.hidden = !active;
          slide.setAttribute("aria-hidden", String(!active));
        });
        indicators.forEach((indicator, i) => {
          const active = i === current;
          indicator.classList.toggle("is-active", active);
          indicator.setAttribute("aria-current", active ? "true" : "false");
        });
        if (status) {
          const title = one("h2, h3, h4, h5, h6", slides[current]);
          status.textContent = `Slide ${current + 1} de ${slides.length}${title ? `: ${title.textContent.trim()}` : ""}`;
        }
      };
      const stop = () => {
        if (timer) {
          window.clearInterval(timer);
          timer = undefined;
        }
      };
      const start = () => {
        stop();
        if (!pointerInside && !focusInside && !userPaused &&
            !document.hidden &&
            !isReducedMotion()) {
          timer = window.setInterval(() => show(current + 1), 5000);
        }
      };
      const updateToggle = () => {
        if (!toggle) return;
        const forcedPause = isReducedMotion();
        const paused = userPaused || forcedPause;
        toggle.disabled = forcedPause;
        toggle.setAttribute("aria-disabled", String(forcedPause));
        toggle.textContent = forcedPause
          ? "Carrossel pausado"
          : paused ? "Reproduzir carrossel" : "Pausar carrossel";
        toggle.setAttribute("aria-label", toggle.textContent);
        toggle.setAttribute("aria-pressed", String(paused));
      };

      controls.forEach((control) => control.addEventListener("click", () => {
        show(current + (control.dataset.novaCarouselControl === "prev" ? -1 : 1));
        if (userPaused) stop();
        else start();
      }));
      indicators.forEach((indicator, i) => indicator.addEventListener("click", () => {
        show(i);
        if (userPaused) stop();
        else start();
      }));
      toggle?.addEventListener("click", () => {
        if (isReducedMotion()) return;
        userPaused = !userPaused;
        updateToggle();
        userPaused ? stop() : start();
      });
      carousel.addEventListener("pointerenter", () => {
        pointerInside = true;
        stop();
      });
      carousel.addEventListener("pointerleave", () => {
        pointerInside = false;
        start();
      });
      carousel.addEventListener("focusin", () => {
        focusInside = true;
        stop();
      });
      carousel.addEventListener("focusout", (event) => {
        if (!carousel.contains(event.relatedTarget)) {
          focusInside = false;
          start();
        }
      });
      show(current);
      if (isReducedMotion()) stop();
      updateToggle();
      start();

      const handleMotionPreferenceChange = () => {
        if (isReducedMotion()) stop();
        else if (userPaused) stop();
        else start();
        updateToggle();
      };
      if (reducedMotion) {
        if (typeof reducedMotion.addEventListener === "function") {
          reducedMotion.addEventListener("change", handleMotionPreferenceChange);
        } else if (typeof reducedMotion.addListener === "function") {
          reducedMotion.addListener(handleMotionPreferenceChange);
        }
      }

      carousel._novaCarouselResume = () => start();
      carousel._novaCarouselPause = () => stop();
    });

    document.addEventListener("visibilitychange", () => {
      all("[data-nova-carousel]").forEach((carousel) => {
        if (document.hidden) carousel._novaCarouselPause?.();
        else carousel._novaCarouselResume?.();
      });
    });
  }

  function setupModals() {
    const getOpenModals = () => all("[data-nova-modal]").filter((modal) => modal.classList.contains("is-open"));
    const updateBodyLock = () => {
      document.body.classList.toggle("nova-modal-open", getOpenModals().length > 0);
    };
    const close = (modal, { restoreFocus = true } = {}) => {
      modal.hidden = true;
      modal.classList.remove("is-open");
      const opener = modal._novaOpener;
      if (opener?.isConnected) opener.setAttribute("aria-expanded", "false");
      updateBodyLock();
      if (restoreFocus && opener?.isConnected && !opener.disabled && opener.getClientRects().length) opener.focus();
    };
    all("[data-nova-modal-open]").forEach((opener) => {
      const id = opener.dataset.novaModalOpen || opener.getAttribute("aria-controls");
      const modal = id ? document.getElementById(id) : null;
      if (!modal) return;
      modal.setAttribute("data-nova-modal", "");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("tabindex", "-1");
      const title = one("[data-nova-modal-title]", modal) || one("h1, h2, h3, h4, h5, h6", modal);
      if (title) {
        if (!title.id) title.id = `${modal.id || "nova-modal"}-title`;
        modal.setAttribute("aria-labelledby", title.id);
      }
      opener.addEventListener("click", () => {
        modal._novaOpener = opener;
        modal.hidden = false;
        modal.classList.add("is-open");
        opener.setAttribute("aria-expanded", "true");
        updateBodyLock();
        const focusTarget = one("[data-nova-modal-close], button, [href], input", modal);
        if (focusTarget) focusTarget.focus();
        else modal.focus();
      });
      all("[data-nova-modal-close]", modal).forEach((button) => button.addEventListener("click", (event) => {
        const navigation = event.currentTarget.dataset.novaModalNavigation;
        if (!navigation) {
          close(modal);
          return;
        }
        event.preventDefault();
        close(modal, { restoreFocus: false });
        const target = document.querySelector(navigation);
        if (target) {
          window.location.hash = navigation.slice(1);
          window.requestAnimationFrame(() => {
            const heading = target.id ? document.getElementById(`${target.id}-title`) : null;
            const isFocusable = (element) => element &&
              typeof element.focus === "function" &&
              !element.hasAttribute("disabled") &&
              (element.hasAttribute("tabindex") || element.matches("a[href], area[href], button, input, select, textarea"));
            const focusTarget = isFocusable(heading) ? heading : isFocusable(target) ? target : null;
            if (focusTarget) focusTarget.focus({ preventScroll: true });
          });
        }
      }));
      modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.matches("[data-nova-modal-backdrop]")) close(modal);
      });
      modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          close(modal);
          return;
        }
        if (event.key !== "Tab") return;
        const focusable = all(
          'a[href], area[href], button:not([disabled]), input:not([disabled]), ' +
          'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          modal
        ).filter((element) => element.getClientRects().length);
        if (!focusable.length) {
          event.preventDefault();
          modal.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
      opener.setAttribute("aria-expanded", modal.classList.contains("is-open") ? "true" : "false");
    });
    updateBodyLock();
  }

  function setupForms() {
    all("[data-nova-contact-form]").forEach((form) => {
      let message = one("[data-nova-form-message]", form);
      if (!message) {
        message = document.createElement("div");
        message.dataset.novaFormMessage = "";
        form.appendChild(message);
      }
      message.setAttribute("aria-live", "polite");
      message.setAttribute("role", "status");
      message.hidden = true;
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        message.textContent = "";
        message.hidden = true;
        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          form.reportValidity();
          return;
        }
        message.textContent = "Demonstração de front-end: sua mensagem foi simulada e não foi enviada.";
        message.hidden = false;
        form.reset();
        form.classList.remove("was-validated");
      });
    });
  }

  const initialize = () => {
    setupBootstrapCarousels();
    setupMenus();
    setupCarousels();
    setupModals();
    setupForms();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
