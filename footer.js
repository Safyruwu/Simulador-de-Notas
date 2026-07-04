// Inserta el footer en todas las páginas
function insertarFooter() {
  if (document.querySelector(".site-footer")) return;
  const year = new Date().getFullYear();
  const isHome = location.pathname.endsWith("index.html") || location.pathname === "/" || location.pathname.endsWith("\\");
  // En el home los links son redundantes con las tarjetas de arriba.
  // En las otras páginas, mostramos un atajo a Inicio + la otra herramienta.
  const linksHtml = isHome
    ? ""
    : `<nav class="site-footer-links" aria-label="Navegación">
        <a href="index.html">← Inicio</a>
      </nav>`;
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="site-footer-main">Hecho con ☕ por Safyruwu</div>
    ${linksHtml}
    <div class="site-footer-meta">${year} · v0.2</div>
  `;
  const container = document.querySelector(".container");
  if (container) container.appendChild(footer);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", insertarFooter);
} else {
  insertarFooter();
}
