/* Local Lucide SVG component renderer for the standalone dashboard. */
(function () {
  const icons = {
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"></path><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"></path>',
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.8-3.8"></path>',
    "briefcase-business": '<rect width="20" height="14" x="2" y="7" rx="2"></rect><path d="M8 7V5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2"></path><path d="M2 12h20"></path><path d="M10 12v2h4v-2"></path>',
    "user-round-check": '<path d="M18 21a6 6 0 0 0-12 0"></path><circle cx="12" cy="7" r="4"></circle><path d="m16 11 2 2 4-4"></path>',
    "layout-dashboard": '<rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect>',
    sparkles: '<path d="m12 3-1.9 5.6L4.5 10.5l5.6 1.9L12 18l1.9-5.6 5.6-1.9-5.6-1.9z"></path><path d="m5 3 .6 1.8L7.5 5.5l-1.9.6L5 8l-.6-1.9-1.9-.6 1.9-.7z"></path><path d="m19 16 .5 1.5L21 18l-1.5.5L19 20l-.5-1.5L17 18l1.5-.5z"></path>',
    "circle-user-round": '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="9" r="3"></circle><path d="M6.8 19a6 6 0 0 1 10.4 0"></path>',
    "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6M8 13h8M8 17h6"></path>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"></path>',
    "book-open": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
    bookmark: '<path d="M5 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4z"></path>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>',
    "columns-3": '<rect width="5" height="18" x="3" y="3" rx="1"></rect><rect width="5" height="18" x="10" y="3" rx="1"></rect><rect width="5" height="18" x="17" y="3" rx="1"></rect>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>',
    "building-2": '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"></path><path d="M6 12H2v10h20V12h-4M10 6h4M10 10h4M10 14h4M10 18h4"></path>',
    target: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
    "calendar-check": '<path d="M8 2v4M16 2v4M3 10h18"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="m9 16 2 2 4-4"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
  };

  function iconSvg(name) {
    const markup = icons[name];
    if (!markup) return "";
    return `<svg class="lucide lucide-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${markup}</svg>`;
  }

  window.LucideIcons = {
    createIcon: iconSvg,
    renderAll(root) {
      (root || document).querySelectorAll("[data-lucide]").forEach((node) => {
        const svg = iconSvg(node.dataset.lucide);
        if (svg) node.outerHTML = svg;
      });
    },
  };

  document.addEventListener("DOMContentLoaded", () => window.LucideIcons.renderAll());
})();
