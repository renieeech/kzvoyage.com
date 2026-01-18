// ====== CONFIG (你只需要改这里) ======
const CONFIG = {
  BRAND: "Voyage",
  EMAIL: "contact@kzvoyage.com",

  // 表单提交方式（三选一）
  // 方案A（推荐）：Formspree，把 action 填成你的 endpoint，例如：https://formspree.io/f/xxxxxx
  FORM_ACTION: "",

  // 方案B：Google Form（把下面填成你的表单 POST 地址 + entry 字段映射，需要我也可以帮你配）
  GOOGLE_FORM_ACTION: "",

  // 方案C：不用提交，点击 submit 直接生成邮件（最稳，但体验一般）
  SUBMIT_VIA_EMAIL_ONLY: false,
};
// =====================================

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const navMobile = document.getElementById("navMobile");

if (navToggle && navMobile) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navMobile.style.display = expanded ? "none" : "block";
    navMobile.setAttribute("aria-hidden", String(expanded));
  });

  navMobile.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      navMobile.style.display = "none";
      navToggle.setAttribute("aria-expanded", "false");
      navMobile.setAttribute("aria-hidden", "true");
    });
  });
}

// Email links
function setEmailLink(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = CONFIG.EMAIL;
  el.href = `mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent("Voyage — Co-founder Application")}`;
}
setEmailLink("emailLink");
setEmailLink("emailLink2");

// Apply form handling
const form = document.getElementById("applyForm");
const toast = document.getElementById("toast");

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
}

function serializeForm(formEl) {
  const data = new FormData(formEl);
  const obj = {};
  for (const [k, v] of data.entries()) obj[k] = v;
  return obj;
}

function toMailBody(obj) {
  const lines = [
    "Voyage — Co-founder Application",
    "--------------------------------",
    `Name: ${obj.firstName || ""} ${obj.lastName || ""}`.trim(),
    `Email: ${obj.email || ""}`,
    `Country: ${obj.country || ""}`,
    `LinkedIn/CV: ${obj.linkedin || ""}`,
    "",
    `Current role: ${obj.role || ""}`,
    "Key achievements:",
    `${obj.achievements || ""}`,
    "",
    `Started a business before: ${obj.startedBefore || ""}`,
    `Has a team: ${obj.hasTeam || ""}`,
    "",
    "What are you building:",
    `${obj.oneLiner || ""}`,
    "",
    "Why now:",
    `${obj.whyNow || ""}`,
    "",
    "Distribution hypothesis:",
    `${obj.distribution || ""}`,
    "",
    "Leverage wanted:",
    `${obj.leverage || ""}`,
    "",
    "Anything else:",
    `${obj.notes || ""}`,
  ];
  return lines.join("\n");
}

async function postFormspree(actionUrl, formEl) {
  const res = await fetch(actionUrl, {
    method: "POST",
    body: new FormData(formEl),
    headers: { "Accept": "application/json" }
  });
  return res.ok;
}

if (form) {
  // set action if configured
  if (CONFIG.FORM_ACTION) form.action = CONFIG.FORM_ACTION;
  if (CONFIG.GOOGLE_FORM_ACTION) form.action = CONFIG.GOOGLE_FORM_ACTION;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const obj = serializeForm(form);

    // Option C: email only
    if (CONFIG.SUBMIT_VIA_EMAIL_ONLY || (!CONFIG.FORM_ACTION && !CONFIG.GOOGLE_FORM_ACTION)) {
      const subject = encodeURIComponent("Voyage — Co-founder Application");
      const body = encodeURIComponent(toMailBody(obj));
      window.location.href = `mailto:${CONFIG.EMAIL}?subject=${subject}&body=${body}`;
      showToast("Opening your email client…");
      return;
    }

    // Option A: Formspree
    if (CONFIG.FORM_ACTION) {
      try {
        const ok = await postFormspree(CONFIG.FORM_ACTION, form);
        if (ok) {
          form.reset();
          showToast("Submitted. Thank you — we’ll get back to you by email if there’s a fit.");
        } else {
          showToast("Submission failed. Please email us instead.");
        }
      } catch {
        showToast("Submission failed. Please email us instead.");
      }
      return;
    }

    // Option B: Google Form (needs entry mapping; leaving as a passthrough)
    if (CONFIG.GOOGLE_FORM_ACTION) {
      showToast("This Google Form setup needs field mapping. Email us for now.");
      const subject = encodeURIComponent("Voyage — Co-founder Application");
      const body = encodeURIComponent(toMailBody(obj));
      window.location.href = `mailto:${CONFIG.EMAIL}?subject=${subject}&body=${body}`;
      return;
    }
  });
}
