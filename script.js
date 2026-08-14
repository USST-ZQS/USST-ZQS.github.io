(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const navLinks = document.querySelectorAll(".site-nav a");
  const cursorGlow = document.querySelector(".cursor-glow");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.getElementById("year").textContent = new Date().getFullYear();

  const updateHeader = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -9%", threshold: 0.08 },
  );

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  if (window.matchMedia("(pointer: fine)").matches) {
    let glowX = window.innerWidth / 2;
    let glowY = window.innerHeight / 2;
    let targetX = glowX;
    let targetY = glowY;

    window.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        cursorGlow.style.opacity = "1";
      },
      { passive: true },
    );

    const moveGlow = () => {
      glowX += (targetX - glowX) * 0.12;
      glowY += (targetY - glowY) * 0.12;
      cursorGlow.style.left = `${glowX}px`;
      cursorGlow.style.top = `${glowY}px`;
      requestAnimationFrame(moveGlow);
    };

    moveGlow();
  }

  const canvas = document.getElementById("agent-field");
  const context = canvas.getContext("2d", { alpha: true });
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let nodes = [];
  let animationFrame = 0;
  const pointer = { x: -1000, y: -1000, active: false };

  class AgentNode {
    constructor(index) {
      this.index = index;
      this.reset(true);
    }

    reset(initial = false) {
      const heroBias = Math.random() < 0.66;
      this.x = heroBias ? width * (0.47 + Math.random() * 0.53) : Math.random() * width;
      this.y = Math.random() * height;
      this.baseX = this.x;
      this.baseY = this.y;
      this.vx = (Math.random() - 0.5) * 0.16;
      this.vy = (Math.random() - 0.5) * 0.16;
      this.radius = Math.random() < 0.1 ? 2.2 : 0.8 + Math.random() * 1.1;
      this.phase = Math.random() * Math.PI * 2;
      this.isRoot = this.index % 17 === 0;
      if (!initial) this.x = width + 20;
    }

    update(time) {
      this.phase += 0.006;
      this.baseX += this.vx;
      this.baseY += this.vy;

      if (this.baseX < -35 || this.baseX > width + 35 || this.baseY < -35 || this.baseY > height + 35) {
        this.reset();
      }

      const drift = Math.sin(this.phase + time * 0.00015) * 5;
      this.x = this.baseX + drift;
      this.y = this.baseY + Math.cos(this.phase * 0.75) * 4;

      if (pointer.active) {
        const dx = pointer.x - this.x;
        const dy = pointer.y - this.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 180 && distance > 1) {
          const force = (180 - distance) / 180;
          this.x -= (dx / distance) * force * 12;
          this.y -= (dy / distance) * force * 12;
        }
      }
    }

    draw(time) {
      const pulse = this.isRoot ? 0.5 + Math.sin(time * 0.003 + this.phase) * 0.28 : 0.32;
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fillStyle = this.isRoot ? `rgba(199, 255, 74, ${pulse})` : "rgba(241, 238, 229, .38)";
      context.fill();

      if (this.isRoot) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius + 7 + Math.sin(time * 0.002 + this.phase) * 2, 0, Math.PI * 2);
        context.strokeStyle = "rgba(199, 255, 74, .16)";
        context.stroke();
      }
    }
  }

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const desiredCount = width < 800 ? 34 : Math.min(78, Math.round(width / 21));
    nodes = Array.from({ length: desiredCount }, (_, index) => new AgentNode(index));
  };

  const drawConnections = () => {
    const maxDistance = width < 800 ? 100 : 145;

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const first = nodes[i];
        const second = nodes[j];
        const dx = first.x - second.x;
        const dy = first.y - second.y;
        const distance = Math.hypot(dx, dy);

        if (distance >= maxDistance) continue;

        const alpha = (1 - distance / maxDistance) * (first.isRoot || second.isRoot ? 0.24 : 0.1);
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.strokeStyle = first.isRoot || second.isRoot
          ? `rgba(199, 255, 74, ${alpha})`
          : `rgba(241, 238, 229, ${alpha})`;
        context.lineWidth = 0.65;
        context.stroke();
      }
    }
  };

  const renderNetwork = (time = 0) => {
    context.clearRect(0, 0, width, height);
    nodes.forEach((node) => node.update(time));
    drawConnections();
    nodes.forEach((node) => node.draw(time));
    animationFrame = requestAnimationFrame(renderNetwork);
  };

  const renderStaticNetwork = () => {
    context.clearRect(0, 0, width, height);
    drawConnections();
    nodes.forEach((node) => node.draw(0));
  };

  canvas.addEventListener(
    "pointermove",
    (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    },
    { passive: true },
  );

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  const setMotionPreference = () => {
    cancelAnimationFrame(animationFrame);
    if (reduceMotion.matches) renderStaticNetwork();
    else renderNetwork();
  };

  resizeCanvas();
  setMotionPreference();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  reduceMotion.addEventListener("change", setMotionPreference);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(animationFrame);
    else setMotionPreference();
  });
})();
