/* IT&MAINT — shared sidebar navigation: links every sidebar menu item to its real screen */
(function () {
  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? me.replace(/assets\/site-nav\.js.*$/, "") : "./";
  // order matters: first match wins
  var RULES = [
    [/command center|ศูนย์บัญชาการ|ศูนย์สั่งการ|แดชบอร์ด|หน้าหลัก|หน้าแรก/i, ""],
    [/\btv\b|จอแสดงผล|จอ tv/i, "pages/tv-display/"],
    [/ปฏิทิน/, "pages/master-calendar/"],
    [/ค่าเสื่อม|สินทรัพย์ถาวร/, "pages/fixed-assets-depreciation/"],
    [/ติดตามตำแหน่ง|tracking|gps/i, "pages/tracking/"],
    [/โอนย้าย|ยืม|จำหน่าย/, "pages/asset-movements/"],
    [/it asset|license|ไลเซนส์|itam/i, "pages/it-asset-license/"],
    [/\beam\b|ลำดับชั้น|lifecycle/i, "pages/eam-hierarchy/"],
    [/ตรวจนับ|stocktake/i, "pages/stocktake/"],
    [/\bdam\b|คลังดิจิทัล/i, "pages/dam/"],
    [/qr|barcode|พิมพ์ป้าย/i, "pages/qr-labels/"],
    [/audit|บันทึกการใช้งาน/i, "pages/audit-log/"],
    [/rest api|\bapi\b|token/i, "pages/api-tokens/"],
    [/ทะเบียนทรัพย์สิน/i, "pages/asset-register/"],
    [/แจ้งซ่อม|service desk/i, "pages/repair-requests/"],
    [/ใบสั่งงาน|ใบงาน|\bwo\b|cmms/i, "pages/wo/"],
    [/\bpm\b/i, "pages/pm-plans/"],
    [/predictive|\biot\b/i, "pages/predictive-iot/"],
    [/สอบเทียบ|calibration/i, "pages/calibration/"],
    [/\bpr\b|\bpo\b|จัดซื้อ|ขอซื้อ|สั่งซื้อ|สัญญา/i, "pages/purchasing-pr-po/"],
    [/อะไหล่|คลัง|สต็อก/, "pages/spare-parts/"],
    [/ต้นทุน|งบประมาณ|budget/i, "pages/cost-budget/"],
    [/rca|fmea|capa/i, "pages/rca-fmea/"],
    [/รายงาน|kpi|mtbf|mttr|dashboard/i, "pages/reports-kpi/"],
    [/ผู้ใช้|rbac|สิทธิ์|บทบาท/i, "pages/users-rbac/"],
    [/ข้อมูลหลัก|ฟิลด์/, "pages/master-data-custom-fields/"],
    [/แจ้งเตือน|cron|ตั้งค่า/i, "pages/settings-notify/"]
  ];
  var PLACEHOLDER = /^(#|#main|#top|javascript:.*)?$/i;
  var SIDE = ".x-side, aside.side, #side, #sidenav, #x-nav";

  function target(text) {
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(text)) return BASE + RULES[i][1];
    return null;
  }
  function wire() {
    document.querySelectorAll(SIDE).forEach(function (side) {
      if (side.classList.contains("x-drawer")) return;
      side.querySelectorAll("a").forEach(function (a) {
        if (a.dataset.navto) return;
        var href = a.getAttribute("href") || "";
        if (!PLACEHOLDER.test(href)) return;
        var t = target((a.textContent || "").replace(/\s+/g, " ").trim());
        if (!t) return;
        a.setAttribute("href", t);
        a.dataset.navto = t;
      });
      var logo = side.querySelector(".x-logo, .x-brand, .brand, .logo");
      if (logo && !logo.dataset.navto) {
        logo.dataset.navto = BASE;
        logo.style.cursor = "pointer";
      }
    });
  }
  // navigate even when a page's own script cancels the click
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-navto]");
    if (!el || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    location.href = el.dataset.navto;
  }, true);

    /* ---------- global actions (top bar etc.) ---------- */
  var PATH = location.pathname;
  var onPage = function (n) { return PATH.indexOf("/pages/" + n + "/") >= 0; };
  var isHome = !/\/pages\//.test(PATH);
  function txt(el) { return (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim(); }
  function go(rel) { location.href = BASE + rel; }
  function toast2(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;background:rgba(15,24,52,.96);color:#E6EEFF;border:1px solid rgba(99,179,255,.45);box-shadow:0 0 18px rgba(40,120,255,.35);padding:10px 16px;border-radius:12px;font:500 14px 'IBM Plex Sans Thai',sans-serif";
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200);
  }
  function exportTable(btn) {
    var scope = btn.closest(".x-card, section, main") || document;
    var tables = [].slice.call(scope.querySelectorAll("table")).concat([].slice.call(document.querySelectorAll("table")));
    var tb = tables.filter(function (t) { return t.offsetParent !== null || t.rows.length; })[0];
    if (!tb) { toast2("ไม่พบตารางข้อมูลสำหรับส่งออก"); return; }
    var rows = [].slice.call(tb.rows).filter(function (r) { return r.style.display !== "none" && !r.hidden; }).map(function (r) {
      return [].slice.call(r.cells).map(function (c) { return '"' + c.textContent.replace(/\s+/g, " ").trim().replace(/"/g, '""') + '"'; }).join(",");
    });
    var name = (document.title || "export").replace(/[^\wก-๙-]+/g, "_") + "_" + new Date().toISOString().slice(0, 10) + ".csv";
    var blob = new Blob(["\ufeff" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    toast2("ส่งออก " + (rows.length - 1) + " รายการแล้ว (" + name + ")");
  }
  var NOTI = [
    ["SLA ใกล้หมด", "WO-2569-0142 เครื่องอัดลม #2 เหลือ 45 นาที", "pages/wo/", "#FB7185"],
    ["PM ถึงรอบ", "6 แผน PM ครบกำหนดสัปดาห์นี้", "pages/pm-plans/", "#FDBA74"],
    ["อะไหล่ต่ำกว่าจุดสั่งซื้อ", "3 รายการ ต้องเปิด PR", "pages/spare-parts/", "#FDE047"],
    ["ไลเซนส์ใกล้หมดอายุ", "Microsoft 365 E3 หมดอายุใน 21 วัน", "pages/it-asset-license/", "#A78BFA"],
    ["สอบเทียบครบกำหนด", "เครื่องวัดแรงดัน PG-07 โรงงานระยอง", "pages/calibration/", "#22D3EE"]
  ];
  var panel;
  function toggleNoti(btn) {
    if (panel) { panel.remove(); panel = null; return; }
    panel = document.createElement("div");
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "การแจ้งเตือน");
    panel.style.cssText = "position:fixed;top:64px;right:16px;width:min(360px,calc(100vw - 32px));z-index:99998;background:rgba(12,20,46,.97);backdrop-filter:blur(12px);border:1px solid rgba(99,179,255,.35);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.5),0 0 24px rgba(40,120,255,.25);padding:12px;color:#E6EEFF;font:14px 'IBM Plex Sans Thai',sans-serif";
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px 10px"><b style="font-size:15px">การแจ้งเตือน</b><button type="button" data-x style="background:none;border:0;color:#9FB0D8;font-size:18px;cursor:pointer" aria-label="ปิด">✕</button></div>' +
      NOTI.map(function (n) { return '<a href="' + BASE + n[2] + '" style="display:flex;gap:10px;padding:10px;border-radius:12px;text-decoration:none;color:inherit;border:1px solid rgba(255,255,255,.04);margin-bottom:6px;background:rgba(255,255,255,.02)"><span style="width:8px;height:8px;border-radius:50%;margin-top:7px;flex:none;background:' + n[3] + ';box-shadow:0 0 8px ' + n[3] + '"></span><span><b style="display:block;font-weight:600">' + n[0] + '</b><span style="color:#9FB0D8;font-size:13px">' + n[1] + '</span></span></a>'; }).join("") +
      '<a href="' + BASE + 'pages/settings-notify/" style="display:block;text-align:center;padding:8px;color:#60A5FA;text-decoration:none">ตั้งค่าการแจ้งเตือน</a>';
    document.body.appendChild(panel);
    panel.querySelector("[data-x]").onclick = function () { panel.remove(); panel = null; };
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel) { panel.remove(); panel = null; } });
  document.addEventListener("click", function (e) {
    if (panel && !panel.contains(e.target) && !(e.target.closest && e.target.closest("[data-noti]"))) { panel.remove(); panel = null; }
    var el = e.target.closest && e.target.closest("button, a, [role=button]");
    if (!el || el.dataset.navto || (panel && panel.contains(el))) return;
    if (el.closest("dialog, .x-modal, [role=dialog], .x-drawer")) return;
    var t = txt(el), stop = function () { e.preventDefault(); e.stopImmediatePropagation(); };
    if (/^\+?\s*แจ้งซ่อม$/.test(t) && !onPage("repair-requests")) { stop(); go("pages/repair-requests/?new=1"); return; }
    if (/^ใบแจ้งซ่อม$/.test(t) && !onPage("repair-requests") && el.tagName === "BUTTON") { stop(); go("pages/repair-requests/"); return; }
    if (/^การแจ้งเตือน/.test(t) || (el.tagName === "BUTTON" && el.querySelector('use[href="#i-bell"]') && !t.replace(/\d+/g, "").trim())) {
      if (isHome && document.querySelector("#alerts, .x-noti, #notiPanel")) return;
      stop(); el.dataset.noti = 1; toggleNoti(el); return;
    }
    if (/^พิมพ์ป้าย/.test(t) && !onPage("qr-labels")) { stop(); go("pages/qr-labels/"); return; }
    if (/^(⬇\s*)?(ส่งออก( Excel| CSV)?|Excel|CSV)$/.test(t)) { stop(); exportTable(el); return; }
    if (/^(🖨\s*)?พิมพ์$/.test(t)) { stop(); window.print(); return; }
    if (/^(Audit Log|บันทึกการใช้งาน)$/.test(t) && !onPage("audit-log")) { stop(); go("pages/audit-log/"); return; }
    if (/^REST API( & Token)?$/.test(t) && !onPage("api-tokens")) { stop(); go("pages/api-tokens/"); return; }
  }, true);

  /* TV display: home button */
  function tvHome() {
    if (!onPage("tv-display") || document.getElementById("x-home-fab")) return;
    var a = document.createElement("a");
    a.id = "x-home-fab"; a.href = BASE; a.textContent = "⌂ หน้าแรก"; a.setAttribute("aria-label", "กลับหน้าแรก");
    a.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:99999;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 16px;border-radius:999px;background:linear-gradient(90deg,#2563EB,#7C3AED);color:#fff;text-decoration:none;font:600 15px 'IBM Plex Sans Thai',sans-serif;box-shadow:0 0 20px rgba(59,130,246,.55);opacity:.92";
    document.body.appendChild(a);
  }

  function start() {
    wire(); tvHome();
    var mo = new MutationObserver(function () { wire(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 4000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
