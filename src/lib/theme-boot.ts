// Plain module (no "use client") so the server layout can inline the string.
const KEY = "tr_theme";
/** Inline in <head> (see app/layout.tsx): applies the saved mode before first paint. */
export const THEME_BOOT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(KEY)});var l=t==="light"||(t!=="dark"&&matchMedia("(prefers-color-scheme: light)").matches);if(l)document.documentElement.setAttribute("data-theme","light");else document.documentElement.removeAttribute("data-theme");}catch(e){}})();`;

