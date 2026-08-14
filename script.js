(() => {
  "use strict";

  document.documentElement.classList.add("js");
  document.getElementById("year").textContent = new Date().getFullYear();

  const menuButton = document.querySelector(".menu-button");
  const navigation = document.querySelector(".site-nav");
  const navigationLinks = [...document.querySelectorAll(".site-nav a")];

  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "打开导航菜单");
    navigation.classList.remove("open");
    document.body.classList.remove("menu-open");
  };

  menuButton.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.setAttribute("aria-label", willOpen ? "关闭导航菜单" : "打开导航菜单");
    navigation.classList.toggle("open", willOpen);
    document.body.classList.toggle("menu-open", willOpen);
  });

  navigationLinks.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const revealTargets = document.querySelectorAll(
    ".section-heading, .interest-list, .update-list, .publication, .project-list article, .background-grid, .honor-list, .contact",
  );

  revealTargets.forEach((target) => target.classList.add("reveal"));

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -35px" },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));

  const sections = navigationLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

      if (!current) return;
      navigationLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${current.target.id}`);
      });
    },
    { rootMargin: "-18% 0px -66%", threshold: [0, 0.1, 0.5] },
  );

  sections.forEach((section) => sectionObserver.observe(section));
})();
