(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktopMq = window.matchMedia("(min-width: 901px)");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* Mobile nav */
  const navToggle = document.getElementById("nav-toggle");
  const topnav = document.getElementById("topnav");
  if (navToggle && topnav) {
    const closeNav = () => {
      topnav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menu");
    };
    navToggle.addEventListener("click", () => {
      const open = !topnav.classList.contains("is-open");
      topnav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    topnav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  /* Lenis — um único loop via GSAP quando disponível */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      // touch nativo no mobile (menos jank)
      syncTouch: false
    });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  /* Cursor glow */
  const glow = document.getElementById("cursor-glow");
  if (glow && finePointer) {
    document.body.classList.add("has-pointer");
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      glow.classList.add("is-on");
    });
    function follow() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(follow);
    }
    follow();
  }

  /* Phone parallax (leve) — hero */
  const stage = document.getElementById("phone-stage");
  if (stage && !reduceMotion && finePointer) {
    const visual = stage.closest(".hero-visual");
    (visual || stage).addEventListener("pointermove", (e) => {
      const rect = stage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      stage.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 6}deg)`;
    });
    (visual || stage).addEventListener("pointerleave", () => {
      stage.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    });
  }

  /* Particles (muito leves; menos no mobile) */
  const canvas = document.getElementById("particles");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let dots = [];
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const dens = window.innerWidth < 900 ? 52000 : 28000;
      const max = window.innerWidth < 900 ? 22 : 48;
      const count = Math.min(max, Math.floor((w * h) / dens));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.35 + 0.1,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = w;
        if (d.x > w) d.x = 0;
        if (d.y < 0) d.y = h;
        if (d.y > h) d.y = 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 180, 210, ${d.a})`;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    resize();
    draw();
    window.addEventListener("resize", resize);
  }

  /* Reveal */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(".reveal").forEach((el) => {
      const delay = Number(el.getAttribute("data-delay") || 0) / 1000;
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%"
        }
      });
    });
  } else {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  /* Demo scroll-synced */
  const screens = Array.from(document.querySelectorAll(".demo-screen"));
  const captions = Array.from(document.querySelectorAll(".demo-caption"));
  const stepCount = Math.min(screens.length, captions.length);
  const phone = document.getElementById("demo-phone");
  const pin = document.getElementById("demo-pin");

  function setDemoStep(step) {
    const i = Math.max(0, Math.min(stepCount - 1, step));
    screens.forEach((el) => {
      el.classList.toggle("is-active", Number(el.dataset.step) === i);
    });
    captions.forEach((el) => {
      el.classList.toggle("is-active", Number(el.dataset.step) === i);
    });
  }

  if (pin && stepCount > 0 && desktopMq.matches && !reduceMotion && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: pin,
      start: "top top+=64",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        if (phone && phone.classList.contains("is-live")) return;
        const idx = Math.min(stepCount - 1, Math.floor(self.progress * stepCount));
        setDemoStep(idx);
      }
    });
  } else if (!desktopMq.matches) {
    setDemoStep(0);
  }

  /* Demo ao vivo no telefone (desktop default = app real) */
  const liveBtn = document.getElementById("btn-load-live");
  const liveFrame = document.getElementById("demo-live");

  function showLiveApp() {
    if (!liveFrame || !phone) return;
    liveFrame.hidden = false;
    liveFrame.src = "../?embed=1";
    phone.classList.add("is-live");
    if (liveBtn) liveBtn.textContent = "Ver slides LinkedIn";
  }

  function showSlides() {
    if (!liveFrame || !phone) return;
    phone.classList.remove("is-live");
    liveFrame.hidden = true;
    if (liveBtn) liveBtn.textContent = "Carregar demo no telefone";
    setDemoStep(0);
  }

  if (liveBtn && liveFrame && phone) {
    liveBtn.addEventListener("click", () => {
      if (phone.classList.contains("is-live")) showSlides();
      else showLiveApp();
    });
  }

  if (desktopMq.matches && liveFrame && phone) {
    showLiveApp();
  }
})();
