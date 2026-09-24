(() => {
  "use strict";

  const config = window.WEDDING_CONFIG;
  const body = document.body;
  const openButton = document.getElementById("openInvitation");
  const invitation = document.getElementById("invitation");
  const envelopeScene = document.getElementById("envelopeScene");
  const music = document.getElementById("backgroundMusic");
  const musicToggle = document.getElementById("musicToggle");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const OPEN_DURATION = reducedMotion ? 80 : 3900;
  let invitationState = "CLOSED";
  let autoOpenTimer;
  let userInitiated = false;

  const text = (id, value) => {
    const el = document.getElementById(id);
    if (el && value != null) el.textContent = value;
  };

  function hydrateContent() {
    text("heroNameOne", config.couple.first);
    text("heroNameTwo", config.couple.second);
    text("heroDate", config.dateDisplay.full);
    text("dateDay", config.dateDisplay.day);
    text("dateMonth", config.dateDisplay.month);
    text("dateYear", config.dateDisplay.year);
    text("invitationMessage", config.invitationMessage);
    text("venueName", config.venue.name);
    text("ceremonyTime", config.ceremonyTime);
    text("dressCode", config.dressCode);
    document.getElementById("venueAddress").innerHTML = config.venue.address;
    document.getElementById("mapsLink").href = config.venue.mapsUrl;
    document.getElementById("storyImage").src = config.photos.story;

    document.getElementById("schedule").innerHTML = config.schedule.map(item => `
      <article class="timeline-item reveal">
        <time class="timeline-time">${item.time}</time>
        <div><h3>${item.title}</h3><p>${item.note}</p></div>
      </article>`).join("");
  }

  function startMusic() {
    if (!config.music.enabled || !config.music.src) return;
    music.src = config.music.src;
    musicToggle.hidden = false;
    if (userInitiated) {
      music.play().then(() => musicToggle.classList.remove("paused")).catch(() => musicToggle.classList.add("paused"));
    } else {
      musicToggle.classList.add("paused");
    }
  }

  function openInvitation(source = "manual") {
    if (invitationState !== "CLOSED") return;
    invitationState = "OPENING";
    userInitiated = source === "manual";
    clearTimeout(autoOpenTimer);
    body.classList.remove("is-closed");
    body.classList.add("is-opening");
    openButton.disabled = true;
    invitation.setAttribute("aria-hidden", "false");
    startMusic();

    window.setTimeout(() => {
      if (invitationState !== "OPENING") return;
      invitationState = "OPENED";
      body.classList.remove("is-opening");
      body.classList.add("is-opened");
      envelopeScene.setAttribute("aria-hidden", "true");
      observeReveals();
    }, OPEN_DURATION);
  }

  function updateCountdown() {
    const distance = Math.max(0, new Date(config.date).getTime() - Date.now());
    const days = Math.floor(distance / 86400000);
    const hours = Math.floor((distance / 3600000) % 24);
    const minutes = Math.floor((distance / 60000) % 60);
    const seconds = Math.floor((distance / 1000) % 60);
    text("days", String(days).padStart(3, "0"));
    text("hours", String(hours).padStart(2, "0"));
    text("minutes", String(minutes).padStart(2, "0"));
    text("seconds", String(seconds).padStart(2, "0"));
  }

  let revealObserver;
  function observeReveals() {
    const targets = document.querySelectorAll(".reveal:not(.in-view)");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach(el => el.classList.add("in-view"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.13, rootMargin: "0px 0px -5%" });
    }
    targets.forEach(el => revealObserver.observe(el));
  }

  openButton.addEventListener("click", () => openInvitation("manual"));
  autoOpenTimer = window.setTimeout(() => openInvitation("auto"), 5000);

  musicToggle.addEventListener("click", () => {
    if (music.paused) {
      music.play().then(() => {
        musicToggle.classList.remove("paused");
        musicToggle.setAttribute("aria-label", "ფონური მუსიკის შეჩერება");
      }).catch(() => {});
    } else {
      music.pause();
      musicToggle.classList.add("paused");
      musicToggle.setAttribute("aria-label", "ფონური მუსიკის ჩართვა");
    }
  });

  hydrateContent();
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  if (reducedMotion) observeReveals();
})();
