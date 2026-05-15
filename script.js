const intro = document.querySelector("#intro");
const enterSite = document.querySelector("#enterSite");
const skipIntro = document.querySelector("#skipIntro");
const replayIntro = document.querySelector("#replayIntro");
const introValue = document.querySelector("#introValue");
const signupForm = document.querySelector("#signupForm");
const formStatus = document.querySelector("#formStatus");

let introTimer;

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const animateIntroValue = () => {
  if (!introValue) return;

  const duration = 1900;
  const start = performance.now();
  const target = 1000000;

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    introValue.textContent = formatMoney(Math.round(target * eased));

    if (progress < 1 && document.body.classList.contains("intro-active")) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const hideIntro = () => {
  clearTimeout(introTimer);
  intro?.classList.add("is-hidden");
  document.body.classList.remove("intro-active");
};

const startIntro = () => {
  clearTimeout(introTimer);
  intro?.classList.remove("is-hidden");
  document.body.classList.add("intro-active");
  introValue.textContent = "$0";

  if (intro) {
    intro.classList.add("is-restarting");
    intro.offsetHeight;
    intro.classList.remove("is-restarting");
  }

  setTimeout(animateIntroValue, 5600);
  introTimer = setTimeout(hideIntro, 12800);
};

enterSite?.addEventListener("click", hideIntro);
skipIntro?.addEventListener("click", hideIntro);
replayIntro?.addEventListener("click", startIntro);

signupForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(signupForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const goal = String(formData.get("goal") || "").trim();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailLooksValid || !goal) {
    formStatus.textContent = "Add your name, a valid email, and your main goal.";
    formStatus.style.color = "var(--gold)";
    return;
  }

  const lead = {
    name,
    email,
    goal,
    createdAt: new Date().toISOString(),
  };

  const leads = JSON.parse(localStorage.getItem("lockednBetaLeads") || "[]");
  leads.push(lead);
  localStorage.setItem("lockednBetaLeads", JSON.stringify(leads));

  signupForm.reset();
  formStatus.textContent = "You're on the LockedN beta list.";
  formStatus.style.color = "var(--green)";
});

startIntro();
