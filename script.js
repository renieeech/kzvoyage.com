const CONFIG = {
  BRAND: "Voyage",
  EMAIL: "contact@kzvoyage.com",
  FORM_ACTION: "https://formspree.io/f/xbddgpby",
};

// --- helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function setEmailLinks() {
  const mailto = `mailto:${CONFIG.EMAIL}`;
  const a1 = $("#contactEmailLink");
  const a2 = $("#footerEmailLink");
  if (a1) { a1.href = mailto; a1.textContent = CONFIG.EMAIL; }
  if (a2) { a2.href = mailto; a2.textContent = CONFIG.EMAIL; }
}

function initYear() {
  const el = $("#year");
  if (el) el.textContent = String(new Date().getFullYear());
}

// --- Menu overlay (Genesis-like)
function initMenu() {
  const menuBtn = $("#menuBtn");
  const closeBtn = $("#closeBtn");
  const overlay = $("#menuOverlay");
  if (!menuBtn || !closeBtn || !overlay) return;

  const open = () => {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("lock");
  };

  const close = () => {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("lock");
  };

  menuBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  $$(".menuLink", overlay).forEach((a) => {
    a.addEventListener("click", () => close());
  });
}

// --- Reveal on scroll
function initReveal() {
  const nodes = $$(".reveal");
  if (!nodes.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });

  nodes.forEach((n) => io.observe(n));
}

// --- Testimonials carousel
function initCarousel() {
  const track = $("#carTrack");
  const prev = $("#carPrev");
  const next = $("#carNext");
  if (!track || !prev || !next) return;

  const stories = [
    {
      name: "Builder A",
      role: "Founder · AI product",
      text: "The platform removed operational drag—finance, legal, hiring—so I focused on shipping and distribution."
    },
    {
      name: "Builder B",
      role: "Operator · Growth",
      text: "Clear milestones. Fast decisions. High ownership. The feedback loops were practical and brutally helpful."
    },
    {
      name: "Builder C",
      role: "Founder · B2B agent",
      text: "We validated the wedge quickly, then scaled channels with repeatable systems instead of ad-hoc tactics."
    },
  ];

  track.innerHTML = stories.map(s => `
    <article class="story">
      <div class="avatar" aria-hidden="true"></div>
      <div>
        <div class="storyTitle">${escapeHtml(s.name)}</div>
        <div class="storyRole">${escapeHtml(s.role)}</div>
        <div class="storyText">${escapeHtml(s.text)}</div>
      </div>
    </article>
  `).join("");

  let idx = 0;
  const max = stories.length;

  const render = () => {
    track.style.transform = `translateX(${-idx * 100}%)`;
  };

  prev.addEventListener("click", () => {
    idx = (idx - 1 + max) % max;
    render();
  });

  next.addEventListener("click", () => {
    idx = (idx + 1) % max;
    render();
  });

  // swipe (simple)
  let startX = null;
  track.addEventListener("touchstart", (e) => startX = e.touches[0].clientX, { passive: true });
  track.addEventListener("touchend", (e) => {
    if (startX == null) return;
    const endX = e.changedTouches[0].clientX;
    const dx = endX - startX;
    if (Math.abs(dx) > 40) {
      idx = dx > 0 ? (idx - 1 + max) % max : (idx + 1) % max;
      render();
    }
    startX = null;
  }, { passive: true });

  render();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}

// --- Multi-step form + conditional fields + Formspree AJAX submit
function initForm() {
  const form = $("#applyForm");
  if (!form) return;

  const steps = $$(".formStep", form);
  const backBtn = $("#backBtn");
  const nextBtn = $("#nextBtn");
  const submitBtn = $("#submitBtn");
  const status = $("#submitStatus");
  const progressBar = $("#progressBar");
  const stepText = $("#stepText");

  const bizDesc = $("#bizDescField");
  const teamDesc = $("#teamDescField");

  let current = 1;
  const total = steps.length;

  function showStep(n) {
    current = n;
    steps.forEach((s) => {
      const sn = Number(s.dataset.step);
      s.hidden = sn !== current;
    });

    // buttons
    backBtn.disabled = current === 1;
    const isLast = current === total;
    nextBtn.hidden = isLast;
    submitBtn.hidden = !isLast;

    // progress
    const pct = Math.round((current / total) * 100);
    progressBar.style.width = `${pct}%`;
    stepText.textContent = `Step ${current} of ${total}`;

    // clear status
    status.textContent = "";
  }

  function validateStep(n) {
    const step = steps.find(s => Number(s.dataset.step) === n);
    if (!step) return true;

    // only validate visible/required inputs inside this step
    const required = $$("[required]", step);
    for (const el of required) {
      // if element is inside a hidden conditional field, skip
      if (el.closest("[hidden]")) continue;

      if (el.type === "radio") {
        const name = el.name;
        const checked = form.querySelector(`input[type="radio"][name="${CSS.escape(name)}"]:checked`);
        if (!checked) {
          el.focus();
          return false;
        }
        continue;
      }

      if (!el.value || !String(el.value).trim()) {
        el.focus();
        return false;
      }
    }
    return true;
  }

  // conditional fields
  function wireConditional(name, onYesEl) {
    const radios = $$(`input[type="radio"][name="${name}"]`, form);
    radios.forEach(r => {
      r.addEventListener("change", () => {
        const checked = form.querySelector(`input[type="radio"][name="${name}"]:checked`);
        const isYes = checked && checked.value === "Yes";
        onYesEl.hidden = !isYes;

        // if hiding, clear textarea
        if (!isYes) {
          const t = $("textarea", onYesEl);
          if (t) t.value = "";
        }
      });
    });
  }

  if (bizDesc) wireConditional("started_business", bizDesc);
  if (teamDesc) wireConditional("has_team", teamDesc);

  backBtn.addEventListener("click", () => showStep(Math.max(1, current - 1)));
  nextBtn.addEventListener("click", () => {
    if (!validateStep(current)) {
      status.textContent = "Please complete required fields before continuing.";
      return;
    }
    showStep(Math.min(total, current + 1));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateStep(current)) {
      status.textContent = "Please complete required fields before submitting.";
      return;
    }

    if (!CONFIG.FORM_ACTION) {
      status.textContent = "Form endpoint is not configured.";
      return;
    }

    status.textContent = "Submitting…";
    submitBtn.disabled = true;
    backBtn.disabled = true;

    try {
      // Use multipart/form-data to support optional file upload
      const fd = new FormData(form);

      const res = await fetch(CONFIG.FORM_ACTION, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: fd,
      });

      if (!res.ok) {
        // Common: file upload on free plan may fail
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      status.textContent = "Submitted! We’ll get back to you soon.";
      form.reset();
      // reset conditionals + go back to step 1
      if (bizDesc) bizDesc.hidden = true;
      if (teamDesc) teamDesc.hidden = true;
      showStep(1);

    } catch (err) {
      status.textContent =
        "Submission failed. If you attached a file, try using a pitch deck link instead, then submit again.";
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      backBtn.disabled = false;
    }
  });

  showStep(1);
}

// boot
setEmailLinks();
initYear();
initMenu();
initReveal();
initCarousel();
initForm();
