(() => {
  "use strict";

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  if (window.jQuery) {
    window.jQuery(() => {
      window.jQuery('[title]').tooltip();
    });
  }
})();
