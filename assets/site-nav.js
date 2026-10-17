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
    [/ทะเบียนทรัพย์สิน|qr|barcode/i, "pages/asset-register/"],
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

  function start() {
    wire();
    var mo = new MutationObserver(function () { wire(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 4000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
