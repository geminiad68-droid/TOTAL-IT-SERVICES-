/* Site-wide theme: dark (default) or light, shared by every page via localStorage "itm-theme".
   Light mode is generated at runtime from each page's own dark styles, so every page stays in step. */
(function () {
  var KEY = "itm-theme", root = document.documentElement, theme = "dark";
  try { theme = localStorage.getItem(KEY) === "light" ? "light" : "dark"; localStorage.setItem("hark-theme", theme); } catch (e) {}
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  root.classList.toggle("is-light", theme === "light");
  window.itmTheme = theme;
  window.itmToggleTheme = function () {
    var next = (root.getAttribute("data-theme") === "light") ? "dark" : "light";
    try { localStorage.setItem(KEY, next); localStorage.setItem("hark-theme", next); } catch (e) {}
    location.reload();
  };

  /* ---------- colour helpers ---------- */
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2, d = mx - mn;
    if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < .5) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    if (!s) return [l * 255, l * 255, l * 255];
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
  }
  function parse(tok) {
    var m, t = tok.toLowerCase();
    if (t === "white") return [255, 255, 255, 1];
    if (t === "black") return [0, 0, 0, 1];
    if (t[0] === "#") {
      var x = t.slice(1);
      if (x.length === 3 || x.length === 4) x = x.split("").map(function (c) { return c + c; }).join("");
      return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16), x.length === 8 ? parseInt(x.slice(6, 8), 16) / 255 : 1];
    }
    if ((m = t.match(/^rgba?\(([^)]*)\)$/))) {
      var p = m[1].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
      var a = p[3] == null ? 1 : (p[3].indexOf("%") > 0 ? parseFloat(p[3]) / 100 : parseFloat(p[3]));
      return [parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2]), a];
    }
    if ((m = t.match(/^hsla?\(([^)]*)\)$/))) {
      var q = m[1].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
      var c = hsl2rgb((parseFloat(q[0]) % 360) / 360, parseFloat(q[1]) / 100, parseFloat(q[2]) / 100);
      return [c[0], c[1], c[2], q[3] == null ? 1 : (q[3].indexOf("%") > 0 ? parseFloat(q[3]) / 100 : parseFloat(q[3]))];
    }
    return null;
  }
  function out(r, g, b, a) {
    r = Math.round(clamp(r, 0, 255)); g = Math.round(clamp(g, 0, 255)); b = Math.round(clamp(b, 0, 255));
    return a >= 1 ? "rgb(" + r + "," + g + "," + b + ")" : "rgba(" + r + "," + g + "," + b + "," + (+a.toFixed(3)) + ")";
  }
  var COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^()]*\)|hsla?\([^()]*\)|\bwhite\b|\bblack\b/g;

  /* kind: text | bg | border | shadow | accent */
  function mapColor(c, kind) {
    var h = rgb2hsl(c[0], c[1], c[2]), H = h[0], S = h[1], L = h[2], A = c[3], n;
    if (kind === "text") {
      var warm = S > .4 && H > .07 && H < .5;
      if (L <= .5) { if (warm && L > .34) return hsl2rgb(H, S, .32).concat(A); return null; }
      n = S < .25 ? clamp(.92 - L, .1, .32) : clamp(.98 - L, .18, warm ? .3 : .36);
      return hsl2rgb(H, Math.min(S, S < .25 ? .3 : .6), n).concat(A);
    }
    if (kind === "accent") {
      if (L < .3 && A > .5) return mapColor(c, "bg");
      var warm2 = S > .4 && H > .07 && H < .5;
      if (L <= .55) { if (warm2 && L > .36 && A > .5) return hsl2rgb(H, S, .34).concat(A); return null; }
      return hsl2rgb(H, S, clamp(1.05 - L, .3, warm2 ? .34 : .45)).concat(A);
    }
    if (kind === "shadow") {
      if (S < .15 && L < .15) return [c[0], c[1], c[2], A * .35];
      if (L < .42) return mapColor(c, "bg");
      return null;
    }
    if (kind === "border") {
      if (L < .42) return hsl2rgb(H, Math.min(S, .45), clamp(.88 - L * .3, .74, .9)).concat(Math.max(A, .6));
      if (L > .5 && A < .6) return hsl2rgb(H, S, .45).concat(Math.min(1, A * 1.3));
      return null;
    }
    /* bg */
    if (S < .08 && L < .1 && A < .9) return null;              /* modal scrims stay dark */
    if (L < .42 && !(S > .45 && L > .38 && A > .5)) return hsl2rgb(H, Math.min(S, .55), clamp(.985 - L * .55, .8, .985)).concat(A);
    if (L > .85 && A < .2) return [30, 45, 90, Math.min(.12, A * 1.2)]; /* faint white washes become faint ink */
    return null;
  }
  function mapValue(v, kind) {
    var changed = false;
    var nv = v.replace(COLOR_RE, function (tok) {
      var c = parse(tok); if (!c) return tok;
      var m = mapColor(c, kind); if (!m) return tok;
      changed = true; return out(m[0], m[1], m[2], m[3]);
    });
    return changed ? nv : null;
  }
  var ACCENT = /^(blue|cyan|green|orange|red|violet|pink|yellow|teal|purple|indigo|amber|emerald|accent|primary|brand|warn|warning|ok|danger|success|info|err|error|good|bad|hi|lo|mid|a1|a2|c1|c2|neon|sky|lime|rose|gold|grad|g1|g2)$/;
  function varKind(name, value) {
    var t = name.replace(/^--/, "").toLowerCase().split(/[-_]/);
    function has(re) { return t.some(function (x) { return re.test(x); }); }
    if (has(/^(shadow|glow|elev\d*)$/)) return "shadow";
    if (has(/^(line\d*|border\d*|stroke|ring|divider|sep|bd|outline|grid)$/)) return "border";
    if (has(/^(text\d*|ink\d*|tx\d*|txt\d*|muted|mute|fg\d*|font|link|label|title|head|sub|dim|faint|hint|subtle|strong|heading|caption)$/)) return "text";
    if (has(/^(bg\d*|side|sidebar|card\d*|surface\d*|panel\d*|paper|base|bg2|row|hover|chip|glass|overlay|soft|track|solid|deep|dark|nav|top|header|input|field|modal|sheet|tile|pane|box|layer\d*|well|body|page|app|cell|th|td|thead|zebra|stripe)$/)) return "bg";
    if (has(ACCENT)) return "accent";
    var m = (value.match(COLOR_RE) || [])[0], c = m && parse(m);
    if (!c) return null;
    var h = rgb2hsl(c[0], c[1], c[2]);
    if (h[2] < .3) return "bg";
    if (h[2] > .7 && h[1] < .35) return "text";
    return "accent";
  }
  function propKind(p) {
    if (p.indexOf("--") === 0) return "var";
    if (p === "color" || p === "-webkit-text-fill-color" || p === "caret-color" || p === "text-decoration-color" || p === "fill" || p === "stroke" || p === "accent-color") return "text";
    if (p === "box-shadow" || p === "text-shadow" || p === "filter") return "shadow";
    if (/^(border|outline|column-rule)/.test(p)) return "border";
    if (/^background/.test(p)) return "bg";
    return null;
  }
  var ACCENT_BG = /var\(--[\w-]*(blue|cyan|green|orange|red|violet|pink|yellow|teal|purple|indigo|accent|primary|brand|grad|success|danger)/i;
  function hasAccentBg(style) {
    var v = (style.getPropertyValue("background-image") || "") + " " + (style.getPropertyValue("background-color") || "") + " " + (style.getPropertyValue("background") || "");
    if (ACCENT_BG.test(v)) return true;
    var toks = v.match(COLOR_RE) || [];
    return toks.some(function (tk) { var c = parse(tk); if (!c || c[3] < .5) return false; var h = rgb2hsl(c[0], c[1], c[2]); return h[1] > .35 && h[2] > .3 && h[2] < .75; });
  }
  function convertDecls(style) {
    var res = [], accentBg = null, props = [], seen = {};
    for (var j = 0; j < style.length; j++) {
      var q = style[j];
      if (!style.getPropertyValue(q) && q.indexOf("--") !== 0) {
        var sh = /^background/.test(q) ? "background" : /^border-(top|right|bottom|left)/.test(q) ? (style.getPropertyValue("border-" + RegExp.$1) ? "border-" + RegExp.$1 : "border") : /^border/.test(q) ? (style.getPropertyValue("border-color") ? "border-color" : "border") : /^outline/.test(q) ? "outline" : null;
        if (sh) q = sh;
      }
      if (!seen[q]) { seen[q] = 1; props.push(q); }
    }
    for (var i = 0; i < props.length; i++) {
      var p = props[i], v = style.getPropertyValue(p), k = propKind(p);
      if (!k || !v || /light-dark|color-mix/.test(v)) continue;
      if (k === "var") { k = varKind(p, v); if (!k) continue; }
      if (k === "text" && (p === "color" || p === "-webkit-text-fill-color")) {
        if (accentBg === null) accentBg = hasAccentBg(style);
        var c0 = parse((v.match(COLOR_RE) || [""])[0] || "");
        if (accentBg && c0 && rgb2hsl(c0[0], c0[1], c0[2])[2] > .85) continue; /* white text on a coloured button */
      }
      var nv = mapValue(v, k);
      if (nv) res.push([p, nv, style.getPropertyPriority(p)]);
    }
    return res;
  }
  var PFX = 'html[data-theme="light"]';
  function prefix(sel) {
    return sel.split(",").map(function (s) {
      s = s.trim();
      if (/^:root/.test(s)) return s.replace(/^:root/, PFX);
      if (/^html\b/.test(s)) return s.replace(/^html/, PFX);
      return PFX + " " + s;
    }).join(",");
  }
  function convertRules(rules, out) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.type === 1) {
        if (/data-theme|is-light|prefers-color-scheme/.test(r.selectorText)) continue;
        var d = convertDecls(r.style);
        if (d.length) out.push(prefix(r.selectorText) + "{" + d.map(function (x) { return x[0] + ":" + x[1] + (x[2] ? " !important" : ""); }).join(";") + "}");
      } else if (r.type === 4) {
        if (/prefers-color-scheme/.test(r.conditionText || r.media.mediaText)) continue;
        var inner = []; convertRules(r.cssRules, inner);
        if (inner.length) out.push("@media " + r.media.mediaText + "{" + inner.join("") + "}");
      } else if (r.cssRules && r.type !== 7) {
        var inner2 = []; try { convertRules(r.cssRules, inner2); } catch (e) {}
        out.push.apply(out, inner2);
      }
    }
  }

  /* ---------- inline styles (markup and anything scripts render later) ---------- */
  var done = new WeakMap();
  function fixInline(el) {
    if (!el.getAttribute) return;
    var s = el.getAttribute("style");
    if (!s || done.get(el) === s || !COLOR_RE.test(s)) { COLOR_RE.lastIndex = 0; return; }
    COLOR_RE.lastIndex = 0;
    var d = convertDecls(el.style);
    d.forEach(function (x) { el.style.setProperty(x[0], x[1], x[2]); });
    done.set(el, el.getAttribute("style"));
  }
  function fixTree(n) {
    if (n.nodeType !== 1) return;
    fixInline(n);
    var list = n.querySelectorAll ? n.querySelectorAll("[style]") : [];
    for (var i = 0; i < list.length; i++) fixInline(list[i]);
  }

  function buildLight() {
    var css = [];
    [].forEach.call(document.styleSheets, function (sh) {
      if (sh.ownerNode && sh.ownerNode.id === "itm-light") return;
      if (sh.href && /\/hark\.css(\?|$)/.test(sh.href)) return; /* already theme-aware */
      var rules; try { rules = sh.cssRules; } catch (e) { return; }
      if (rules) convertRules(rules, css);
    });
    css.push(PFX + "{--itm-light:1}" + PFX + " body{background-color:#eef2fb}" + PFX + " ::-webkit-scrollbar-thumb{background:#c5cde0}" + PFX + " button:disabled," + PFX + " .is-disabled," + PFX + " [aria-disabled=true]{opacity:.6!important;filter:none!important}" + PFX + " input::placeholder," + PFX + " textarea::placeholder{color:#64748b!important;opacity:1}" + PFX + " input[type=time]::-webkit-calendar-picker-indicator," + PFX + " input[type=date]::-webkit-calendar-picker-indicator{filter:none!important;opacity:.7}");
    var st = document.getElementById("itm-light") || document.createElement("style");
    st.id = "itm-light"; st.textContent = css.join("\n"); document.head.appendChild(st);
    fixTree(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === "attributes") fixInline(m.target);
        else m.addedNodes.forEach(fixTree);
      });
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
  }

  /* ---------- Chart.js colours in light mode ---------- */
  function fixChart(ch) {
    function fix(v) {
      if (typeof v !== "string") return v;
      var c = parse(v.trim()); if (!c) return v;
      var hh = rgb2hsl(c[0], c[1], c[2]);
      if (hh[2] < .25) { var m = hsl2rgb(hh[0], Math.min(Math.max(hh[1], .25), .55), .6); return out(m[0], m[1], m[2], Math.max(.7, c[3])); }
      if (hh[2] > .9 && hh[1] < .2) return "rgba(15,23,42,.12)";
      return v;
    }
    try {
      (ch.data.datasets || []).forEach(function (d) {
        ["backgroundColor", "borderColor"].forEach(function (k) { if (Array.isArray(d[k])) d[k] = d[k].map(fix); else if (d[k] != null) d[k] = fix(d[k]); });
      });
      var dl = ch.options && ch.options.plugins && ch.options.plugins.datalabels;
      if (dl && typeof dl.color === "string") { var c2 = parse(dl.color); if (c2 && rgb2hsl(c2[0], c2[1], c2[2])[2] > .8) dl.color = "#0F172A"; }
      var o = ch.options || {}, sc = o.scales;
      function ink(v) { if (v == null) return "#334155"; if (typeof v !== "string") return v; var c3 = parse(v); return c3 && rgb2hsl(c3[0], c3[1], c3[2])[2] > .45 ? "#334155" : v; }
      if (sc) Object.keys(sc).forEach(function (a) {
        var x = sc[a]; x.ticks = x.ticks || {}; x.ticks.color = ink(x.ticks.color);
        x.grid = x.grid || {}; if (typeof x.grid.color !== "function") x.grid.color = "rgba(15,23,42,.09)";
        if (x.title) x.title.color = ink(x.title.color);
        if (x.pointLabels) x.pointLabels.color = ink(x.pointLabels.color);
      });
      o.plugins = o.plugins || {};
      var lg = o.plugins.legend = o.plugins.legend || {}; lg.labels = lg.labels || {}; lg.labels.color = ink(lg.labels.color);
      if (o.plugins.title) o.plugins.title.color = ink(o.plugins.title.color);
      ch.update("none");
    } catch (e) {}
  }
  function fixCharts() {
    var C = window.Chart; if (!C || !C.instances) return;
    try { C.defaults.color = "#334155"; C.defaults.borderColor = "rgba(15,23,42,.09)"; } catch (e) {}
    Object.keys(C.instances).forEach(function (k) { var ch = C.instances[k]; if (ch && !ch.$itm) { ch.$itm = 1; fixChart(ch); } });
  }

  /* in-page theme switches (e.g. Settings → ธีม มืด/สว่าง) follow the site theme */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#theme button");
    if (!b) return;
    var want = /สว่าง|light/i.test(b.textContent) ? "light" : "dark";
    if (want !== theme) { e.preventDefault(); window.itmToggleTheme(); }
  }, true);
  function syncSeg() {
    var bs = document.querySelectorAll("#theme button");
    [].forEach.call(bs, function (b) { var on = (/สว่าง|light/i.test(b.textContent) ? "light" : "dark") === theme; b.setAttribute("aria-pressed", on ? "true" : "false"); b.classList.toggle("is-on", on); b.classList.toggle("on", on); });
  }

  /* ---------- toggle button on every page ---------- */
  function addButton() {
    var home = document.getElementById("themeBtn");
    var sun = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    var moon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    var label = theme === "light" ? "เปลี่ยนเป็นธีมมืด" : "เปลี่ยนเป็นธีมสว่าง";
    if (home) {
      var b = home.cloneNode(false); b.removeAttribute("hidden"); b.style.display = "";
      b.innerHTML = theme === "light" ? moon : sun; b.setAttribute("aria-label", label); b.title = label;
      b.addEventListener("click", window.itmToggleTheme); home.parentNode.replaceChild(b, home); return;
    }
    var btn = document.createElement("button");
    btn.type = "button"; btn.id = "itmThemeBtn"; btn.setAttribute("aria-label", label); btn.title = label;
    btn.innerHTML = theme === "light" ? moon : sun;
    btn.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;flex:none;border-radius:999px;cursor:pointer;border:1px solid " + (theme === "light" ? "rgba(40,70,160,.22)" : "rgba(110,150,255,.28)") + ";background:" + (theme === "light" ? "#ffffff" : "rgba(20,32,72,.62)") + ";color:" + (theme === "light" ? "#0F1A3A" : "#E8EEFF");
    btn.addEventListener("click", window.itmToggleTheme);
    var head = document.querySelector("header.x-top, header.top, header.x-head, header, .x-top, .topbar, .top");
    if (head) { head.appendChild(btn); }
    else { btn.style.position = "fixed"; btn.style.right = "16px"; btn.style.bottom = "16px"; btn.style.zIndex = "60"; document.body.appendChild(btn); }
  }

  function ready() {
    if (theme === "light") { try { buildLight(); } catch (e) { if (window.console) console.warn("light theme", e); } }
    addButton();
    syncSeg(); setTimeout(syncSeg, 300); setTimeout(syncSeg, 1200);
    if (theme === "light") { [200, 900, 2000, 4000].forEach(function (t) { setTimeout(fixCharts, t); }); }
    root.classList.remove("itm-hide");
  }
  if (theme === "light") {
    root.classList.add("itm-hide");
    var h = document.createElement("style"); h.textContent = "html.itm-hide body{visibility:hidden}";
    (document.head || root).appendChild(h);
    setTimeout(function () { root.classList.remove("itm-hide"); }, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
})();
