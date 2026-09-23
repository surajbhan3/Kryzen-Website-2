const $ = (s) => document.querySelector(s);
const storage = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};
let lang = storage.get("kryzen-language") === "en" ? "en" : "hi";
const T = (h, e) => (lang === "hi" ? h : e);
const money = (n) => "₹" + new Intl.NumberFormat("en-IN").format(n);
let c = {
  product: "nvph65",
  thickness: "2.0",
  span: 32,
  bay: 60,
  cover: "none",
  fog: false,
  drip: false,
  disinfection: false,
  dripper: "arrow",
  transport: "help",
  construction: "help",
  insurance: false,
  lab: false,
  dpr: false,
  crop: "",
  plan: "booking99",
};
try {
  c = { ...c, ...JSON.parse(storage.get("kryzen-draft") || "{}") };
} catch {}
let cart = {},
  teamFilter = { members: 0, state: "", rating: 0 },
  selectedTeam = c.selectedTeam || null;
let authMode = "login";
const products = [
  [
    "nvph65",
    "6.5 मी. पॉलीहाउस",
    "6.5 m Polyhouse",
    "प्राकृतिक वेंटिलेशन",
    "Naturally ventilated",
  ],
  [
    "square",
    "स्क्वायर नेटहाउस",
    "Square Nethouse",
    "जालीदार संरचना",
    "Net-covered structure",
  ],
  [
    "tunnelnet",
    "टनल नेटहाउस",
    "Tunnel Nethouse",
    "टनल आकार की संरचना",
    "Tunnel-shaped structure",
  ],
  [
    "fanpad",
    "फैन-पैड पॉलीहाउस",
    "Fan-pad Polyhouse",
    "नियंत्रित वातावरण",
    "Controlled environment",
  ],
];
if (!products.some((product) => product[0] === c.product)) {
  c.product = "nvph65";
  c.maxStep = 0;
}
c.irrigation =
  c.irrigation ||
  (c.drip ? (c.dripper === "inline" ? "inline" : "outline") : "none");
c.cabinSize = c.cabinSize || (c.disinfection ? "4x4" : "none");
c.shadowNet = c.shadowNet || "aluminium";
c.airFans = !!c.airFans;
c.gutterFunnel = !!c.gutterFunnel;
c.ventOpener =
  c.ventOpener === true || c.ventOpener === "geared" ? "geared" : "manual";
function syncFarmOptions() {
  c.drip = c.irrigation !== "none";
  c.dripper = c.drip ? c.irrigation : "outline";
  c.disinfection = c.cabinSize !== "none";
}
syncFarmOptions();
const spanStep = () =>
  ["nvph65", "nvph5", "fanpad"].includes(c.product) ? 8 : 6;
const bayStep = () =>
  ["nvph65", "nvph5", "fanpad"].includes(c.product) ? 4 : 6;
const bayOptions = () =>
  c.product === "polytunnel"
    ? [4.5, 5.5]
    : Array.from({ length: 276 / bayStep() }, (_, i) => (i + 1) * bayStep());
function normalizeDimensions() {
  const snap = (value, step, max) =>
    Math.min(
      max,
      Math.max(step, Math.round((Number(value) || step) / step) * step)
    );
  const span = snap(c.span, spanStep(), 144),
    bay = bayOptions().reduce((nearest, value) =>
      Math.abs(value - (Number(c.bay) || 0)) <
      Math.abs(nearest - (Number(c.bay) || 0))
        ? value
        : nearest
    );
  if (span !== c.span || bay !== c.bay) c.maxStep = 0;
  c.span = span;
  c.bay = bay;
}
normalizeDimensions();
c.construction = "help";
c.plan = "booking99";
if (c.dripper === "flat") c.dripper = "outline";
const dripperName = () =>
  c.dripper === "inline"
    ? T("इनलाइन ड्रिपर", "Inline dripper")
    : c.dripper === "outline"
    ? T("आउटलाइन ड्रिपर", "Outline dripper")
    : T("एरो ड्रिपर", "Arrow dripper");
// Migrate saved progress from the former six-step flow.
if (c.flowVersion !== 2) {
  const previousStep = Number(c.maxStep || 0);
  c.maxStep = Math.max(
    0,
    Math.min(4, previousStep >= 3 ? previousStep - 1 : previousStep)
  );
  c.flowVersion = 2;
  storage.set("kryzen-draft", JSON.stringify(c));
}
const pages = ["configure", "materials", "addons", "construction", "billing"];
const names = () => [
  T("सिस्टम चुनें", "Configure"),
  T("सामग्री", "Materials"),
  T("अतिरिक्त सेवाएं", "Add-ons"),
  T("निर्माण टीम", "Construction"),
  T("अंतिम बिल", "Final bill"),
];
const product = () => products.find((p) => p[0] === c.product) || products[0];
const area = () => c.span * c.bay;
const save = () => storage.set("kryzen-draft", JSON.stringify(c));
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
const pName = () => T(product()[1], product()[2]);
const route = () => location.hash.slice(1) || "configure";
function toggleLanguage() {
  lang = lang === "hi" ? "en" : "hi";
  storage.set("kryzen-language", lang);
  render();
}
function go(p) {
  if (route() === "billing" && p === "progress" && c.gstInvoice) {
    const name = $("#invoice-company-name"),
      gst = $("#invoice-gst-number");
    if (!name?.reportValidity() || !gst?.reportValidity()) return;
  }
  if (p === "materials" && route() === "configure" && !configureVerified)
    return openConfigureLogin();
  if (p === "order") p = "construction";
  if (c.construction === "own" && p === "construction") p = "billing";
  const i = pages.indexOf(p);
  const current = pages.indexOf(route());
  if (i > Number(c.maxStep || 0)) {
    if (
      i > current + 1 &&
      !(current === 2 && i === 4 && c.construction === "own")
    )
      return toast(
        T("पहले पिछला चरण पूरा करें।", "Complete the previous step first.")
      );
    if (current === 2) {
      if (c.transport === "help" && !/^[1-9][0-9]{5}$/.test(c.pin || ""))
        return toast(
          T(
            "डिलीवरी का सही 6 अंकों का पिनकोड डालें।",
            "Enter a valid six-digit delivery pincode."
          )
        );
    }
    c.maxStep = i;
    save();
  }
  location.hash = p;
  render();
  window.scrollTo(0, 0);
}
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").style.display = "block";
  setTimeout(() => ($("#toast").style.display = "none"), 4000);
}
function change(k, v) {
  c[k] = v;
  if (["irrigation", "cabinSize"].includes(k)) syncFarmOptions();
  if (["product", "span", "bay"].includes(k)) normalizeDimensions();
  if (
    [
      "product",
      "thickness",
      "span",
      "bay",
      "cover",
      "fog",
      "drip",
      "dripper",
      "disinfection",
      "irrigation",
      "cabinSize",
      "shadowNet",
      "airFans",
      "gutterFunnel",
      "ventOpener",
    ].includes(k)
  ) {
    c.maxStep = 0;
    selectedTeam = null;
    c.selectedTeam = null;
  } else if (
    ["construction", "transport", "insurance", "lab", "dpr"].includes(k)
  ) {
    c.maxStep = Math.min(c.maxStep || 0, 2);
    selectedTeam = null;
    c.selectedTeam = null;
  }
  if (!c.drip) c.dripper = "arrow";
  if (!c.dpr) c.crop = "";
  save();
  render();
}
function choices(key, opts) {
  return `<div class="choices">${opts
    .map(
      ([v, h, e]) =>
        `<button class="choice ${
          String(c[key]) === String(v) ? "on" : ""
        }" aria-pressed="${
          String(c[key]) === String(v)
        }" onclick='change(${JSON.stringify(key)},${JSON.stringify(v)})'>${T(
          h,
          e
        )}</button>`
    )
    .join("")}</div>`;
}
function field(label, content) {
  return `<div class="field"><label>${label}${content}</label></div>`;
}
const houseIcon = `<svg class="icon" viewBox="0 0 44 32" fill="none" aria-hidden="true"><path d="M3 29V12L22 3l19 9v17H3Zm0-17h38M13 8v21M31 8v21M3 21h38M22 3v26" stroke="currentColor" stroke-width="1.5"/></svg>`;
function diagram() {
  return `<div class="diagram"><svg viewBox="0 0 290 132" role="img" aria-label="${T(
    "आकार का सांकेतिक नक्शा",
    "Schematic footprint"
  )}"><defs><pattern id="grid" width="30" height="15" patternUnits="userSpaceOnUse"><path d="M30 0H0V15" fill="none" stroke="#709583" stroke-width=".6"/></pattern></defs><rect x="40" y="16" width="210" height="80" fill="url(#grid)" stroke="#c6e59a"/><path d="M40 108h210M29 16v80" stroke="#9bbaa7"/><text x="145" y="128" text-anchor="middle" fill="#d5e7d9" font-size="13">${
    c.span
  } m · ${T(
    "स्पैन",
    "span"
  )}</text><text x="17" y="57" transform="rotate(-90 17 57)" text-anchor="middle" fill="#d5e7d9" font-size="12">${
    c.bay
  } m · ${T("बे", "bay")}</text></svg><small>${T(
    "सांकेतिक नक्शा • पैमाने पर नहीं",
    "Schematic footprint • not to scale"
  )}</small></div>`;
}
function help() {
  return `<section class="helpbox"><div class="help-intro"><div class="help-portrait" role="img" aria-label="Smiling support representative"></div><div><span class="eyebrow">${T(
    "हम आपकी मदद के लिए हैं",
    "Here to help"
  )}</span><h3>${T(
    "मिलकर आपका फार्म बनाएं",
    "Let’s plan your farm"
  )}</h3></div></div><p>${T(
    "चुनाव से ऑर्डर तक, हिन्दी या English में सहायता पाएं।",
    "Get help choosing and ordering your system in Hindi or English."
  )}</p><a href="tel:+919870424425">☎ +91 9870 424 425</a><span class="help-hours">09:00 am – 06:00 pm IST</span><button type="button" class="primary dark help-video" onclick="openAuth('callback')">${T(
    "वीडियो सहायता से अपना सिस्टम ऑर्डर करें",
    "Get video help to order your system"
  )} →</button></section>`;
}
function marketChart(id, title, affects, color, values) {
  const low = Math.min(...values),
    high = Math.max(...values),
    min = Math.floor(low - 2),
    max = Math.ceil(high + 2);
  const x = (i) => 12 + (i * 222) / (values.length - 1),
    y = (v) => 132 - ((v - min) / (max - min)) * 112;
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const last = values[values.length - 1],
    change = (last / values[values.length - 2] - 1) * 100;
  const average = values.map(
    (_, i) =>
      values.slice(Math.max(0, i - 2), i + 1).reduce((a, b) => a + b, 0) /
      Math.min(i + 1, 3)
  );
  return `<article class="market-card"><div class="market-heading"><strong>${title}</strong><span class="market-symbol">${id.toUpperCase()} · 1W</span></div><p class="market-affects">${affects}</p><div class="market-quote"><strong>${last.toFixed(
    1
  )}<small> eX-Pune</small></strong><span class="${
    change >= 0 ? "market-up" : "market-down"
  }">${change >= 0 ? "+" : ""}${change.toFixed(
    2
  )}% <small>WoW</small></span></div><svg viewBox="0 0 280 160" role="img" aria-label="${title}: illustrative weekly index, ${values.join(
    ", "
  )}"><defs><linearGradient id="market-fill-${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${color}" stop-opacity=".24"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${Array.from(
    { length: 5 },
    (_, i) => {
      const v = min + ((max - min) * i) / 4;
      return `<path d="M12 ${y(
        v
      )}H234" stroke="#294035" stroke-dasharray="2 4"/><text x="242" y="${
        y(v) + 3
      }" fill="#91aa9d" font-size="9">${v.toFixed(0)}</text>`;
    }
  ).join("")}${values
    .map((v, i) => `<path d="M${x(i)} 20V132" stroke="#20372e"/>`)
    .join(
      ""
    )}<polygon points="12,132 ${points} 234,132" fill="url(#market-fill-${id})"/><polyline points="${average
    .map((v, i) => `${x(i)},${y(v)}`)
    .join(
      " "
    )}" fill="none" stroke="#e5be73" stroke-width="1.3" stroke-dasharray="4 3"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>${values
    .map(
      (v, i) =>
        `<circle cx="${x(i)}" cy="${y(
          v
        )}" r="2.5" fill="${color}" stroke="#10251c"><title>Week ${
          i + 1
        }: ${v.toFixed(1)}</title></circle>`
    )
    .join("")}${[0, 3, 6, 9, 12]
    .map(
      (i) =>
        `<text x="${x(
          i
        )}" y="151" fill="#91aa9d" font-size="9" text-anchor="middle">W${
          i + 1
        }</text>`
    )
    .join(
      ""
    )}</svg><div class="market-legend"><span style="--series-color:${color}">${T(
    "साप्ताहिक",
    "Weekly"
  )}</span><span class="average">${T(
    "3-सप्ताह औसत",
    "3-week MA"
  )}</span></div><div class="market-range"><span>LOW <b>${low.toFixed(
    1
  )}</b></span><span>HIGH <b>${high.toFixed(
    1
  )}</b></span><span>BASE <b>100</b></span></div></article>`;
}
function marketGraphs() {
  return `<section class="market-watch">${marketChart(
    "gi",
    T("जीआई पाइप दर सूचकांक", "GI pipe rate index"),
    T("प्रभाव: स्ट्रक्चर", "Affects Structure"),
    "#63dba7",
    [
      100, 102.4, 99.1, 103.6, 101.2, 105.8, 104.1, 100.9, 103.5, 107.2, 105.4,
      103.8, 106.1,
    ]
  )}${marketChart(
    "plastic",
    T("प्लास्टिक दर सूचकांक", "Plastic rate index"),
    T(
      "प्रभाव: पॉलीफिल्म, एप्रन और इन्सेक्ट नेट",
      "Affects Polyfilm, apron and insect net"
    ),
    "#79b9fb",
    [
      100, 97.8, 101.3, 104.5, 102.1, 106.7, 103.2, 108.4, 105.6, 110.3, 107.5,
      111.2, 108.6,
    ]
  )}</section>`;
}
function materialTotals(rows) {
  let subtotalPaise = 0,
    gstPaise = 0;
  const complete = rows.every(
    (item) =>
      Number.isFinite(item.quantity) &&
      Number.isFinite(item.rate) &&
      Number.isFinite(item.gstPercent)
  );
  if (!complete)
    return {
      count: rows.length,
      subtotal: null,
      gst: null,
      rounding: null,
      total: null,
    };
  rows.forEach((item) => {
    const linePaise = Math.round(item.quantity * item.rate * 100);
    subtotalPaise += linePaise;
    gstPaise += Math.round((linePaise * item.gstPercent) / 100);
  });
  const beforeRounding = subtotalPaise + gstPaise;
  const roundedPaise = Math.round(beforeRounding / 100) * 100;
  return {
    count: rows.length,
    subtotal: subtotalPaise / 100,
    gst: gstPaise / 100,
    rounding: (roundedPaise - beforeRounding) / 100,
    total: roundedPaise / 100,
  };
}
function summaryAmount(value) {
  return value == null
    ? "—"
    : "₹" +
        new Intl.NumberFormat("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
}
function selectedAddonCosts() {
  const costs = [];
  const estimate = c.transportEstimate;
  if (
    c.transportSelected &&
    estimate &&
    estimate.pin === c.pin &&
    Number.isFinite(estimate.cost)
  )
    costs.push({
      name: T("परिवहन", "Transport"),
      amount: estimate.cost,
      detail: `${estimate.km} km × ₹15`,
    });
  if (c.insurance)
    costs.push({
      name: T("ट्रांजिट बीमा", "Transit insurance"),
      amount: 1500,
      detail: T("प्रति वाहन", "Per vehicle"),
    });
  if (c.lab)
    costs.push({
      name: T("थर्ड-पार्टी लैब रिपोर्ट", "Third-party lab report"),
      amount: 2500,
    });
  if (c.dpr)
    costs.push({
      name: T("विस्तृत प्रोजेक्ट प्लान", "Detailed Project Plan"),
      amount: 0,
    });
  return costs;
}
function selectTransport(required) {
  if (required && (!c.transportEstimate || c.transportEstimate.pin !== c.pin))
    return;
  c.transportSelected = required;
  change("transport", required ? "help" : "own");
}
function summary(next = "materials") {
  const showCosts = next !== "materials";
  const rows = showCosts ? materialPreviewRows() : [];
  const totals = materialTotals(rows);
  const addonCosts = ["construction", "billing", "progress"].includes(next)
    ? selectedAddonCosts()
    : [];
  const groups = new Map();
  rows.forEach((item) => {
    if (!groups.has(item.reason)) groups.set(item.reason, []);
    groups.get(item.reason).push(item);
  });
  return `<aside class="project-sidebar"><div class="summary"><div class="inner"><h2>${T(
    "आपके प्रोजेक्ट का सारांश!",
    "Your project at a glance!"
  )}</h2>${diagram()}<dl><dt>${T(
    "संरचना",
    "Structure"
  )}</dt><dd>${pName()}</dd><dt>${T("जमीन पर कवर", "Ground cover")}</dt><dd>${
    c.cover === "weedmat"
      ? T("वीडमैट", "Weedmat")
      : c.cover === "mulch"
      ? T("मल्चिंग", "Mulching")
      : T("कवर नहीं चाहिए", "No ground cover")
  }</dd><dt>${T("ड्रिपर का प्रकार", "Dripper type")}</dt><dd>${
    !c.drip ? T("शामिल नहीं", "Not included") : dripperName()
  }</dd><dt>${T("कीटाणुशोधन केबिन", "Disinfection Cabin")}</dt><dd>${
    c.disinfection
      ? c.cabinSize === "3x3"
        ? "3 m × 3 m"
        : "4 m × 4 m"
      : T("नहीं चाहिए", "Not required")
  }</dd><dt>${T("कुल क्षेत्रफल", "Total area")}</dt><dd>${area().toLocaleString(
    "en-IN"
  )} m²</dd></dl>${
    showCosts
      ? `<div class="total"><dl class="material-group-costs">${Array.from(
          groups,
          ([reason, items]) =>
            `<dt>${esc(reason)}<small>${items.length} ${T(
              "आइटम",
              "items"
            )}</small></dt><dd>${summaryAmount(
              materialTotals(items).subtotal
            )}</dd>`
        ).join("")}${addonCosts
          .map(
            (item) =>
              `<dt>${esc(item.name)}${
                item.detail ? `<small>${esc(item.detail)}</small>` : ""
              }</dt><dd>${summaryAmount(item.amount)}</dd>`
          )
          .join("")}</dl><dl class="material-cost-breakdown"><dt>${T(
          "कुल कीमत",
          "Total price"
        )}</dt><dd>${summaryAmount(totals.subtotal)}</dd><dt>${T(
          "कुल GST",
          "Total GST price"
        )}</dt><dd>${summaryAmount(totals.gst)}</dd><dt>${T(
          "राउंडिंग ऑफ",
          "Rounding off"
        )}</dt><dd>${totals.rounding > 0 ? "+" : ""}${summaryAmount(
          totals.rounding
        )}</dd><dt class="material-grand-total">${T(
          "कुल सामग्री लागत",
          "Total material cost"
        )}</dt><dd class="material-grand-total">${summaryAmount(
          totals.total
        )}</dd>${
          next === "progress"
            ? `<dt class="per-area-label">${T(
                "प्रति वर्ग मीटर लागत",
                "Cost per sq. metre"
              )}</dt><dd class="per-area-cost"><strong>${summaryAmount(
                totals.total != null && area() > 0
                  ? totals.total / area()
                  : null
              )}<span> / m²</span></strong><small>${T(
                "कुल लागत / कुल क्षेत्रफल",
                "Total cost / Total area"
              )}<br>${summaryAmount(totals.total)} / ${area().toLocaleString(
                "en-IN"
              )} m²</small><p>${T(
                "उद्योग की सर्वोत्तम कीमत — भारत के किसी भी निर्माता से 18% सस्ती।",
                "Industry’s best price — 18% cheaper than any manufacturer in India."
              )}</p></dd>`
            : ""
        }${
          addonCosts.length && totals.total != null
            ? `<dt class="material-grand-total">${T(
                "सेवाओं सहित अनुमानित कुल",
                "Estimated total with services"
              )}</dt><dd class="material-grand-total">${summaryAmount(
                totals.total +
                  addonCosts.reduce((sum, item) => sum + item.amount, 0)
              )}</dd>`
            : ""
        }</dl>${
          addonCosts.length
            ? `<p class="summary-preview-note">${T(
                "सेवाओं पर लागू GST और वाहन संख्या की पुष्टि बाकी है।",
                "Applicable service GST and vehicle count await confirmation."
              )}</p>`
            : ""
        }${
          materialPreview
            ? `<p class="summary-preview-note">${T(
                "नमूना सूची की अनुमानित लागत। वास्तविक कोटेशन नहीं।",
                "Sample-list totals. Not an actual quotation."
              )}</p>`
            : ""
        }</div>`
      : ""
  }</div><div class="footer">✓ ${T(
    "पारदर्शी विवरण · टीम की सहायता",
    "Transparent specifications · Assisted ordering"
  )}</div></div>${help()}${marketGraphs()}</aside>`;
}
function accountTerms() {
  return `<section class="panel account-terms"><h2>${T(
    "नियम और शर्तें",
    "Terms and Conditions"
  )}</h2><ol class="project-terms"><li><strong>${T(
    "सामग्री बुकिंग",
    "Material booking"
  )}</strong><p>${T(
    "₹99 देकर सामग्री बुक करें। बाकी भुगतान डिस्पैच पर करें।",
    "Book your material for ₹99. Pay the remaining amount on dispatch."
  )}</p></li><li><strong>${T(
    "डिस्पैच की जानकारी",
    "Dispatch details"
  )}</strong><p>${T(
    "डिस्पैच की जानकारी के लिए हमारी टीम आपसे संपर्क करेगी।",
    "Our team will contact you to coordinate dispatch details."
  )}</p></li><li><strong>${T("परिवहन", "Transportation")}</strong><p>${T(
    "परिवहन लागत पिनकोड के बीच अनुमानित सड़क दूरी पर आधारित है। सही पते के अनुसार दूरी बदल सकती है।",
    "Transport estimates use road distance between pincodes. The exact delivery address may change the final distance."
  )}</p></li><li><strong>${T(
    "निर्माण टीम",
    "Construction team"
  )}</strong><p>${T(
    "चुनी गई निर्माण टीम की जानकारी सामग्री डिस्पैच होने के बाद साझा की जाएगी।",
    "Details of your selected construction team will be shared after the material is dispatched."
  )}</p></li><li><strong>${T(
    "इनवॉइस और प्रमाणपत्र",
    "Invoices and certificates"
  )}</strong><p>${T(
    "जारी होने पर इनवॉइस और लागू प्रमाणपत्र मेरे ऑर्डर में डाउनलोड के लिए उपलब्ध होंगे।",
    "Issued invoices and applicable certificates will be available to download under My Orders."
  )}</p></li></ol></section>`;
}

function brands() {
  return `<section class="brands"><div class="eyebrow">${T(
    "जिन ब्रांड्स के साथ हम काम करते हैं",
    "Brands we work with"
  )}</div><p class="brandlabel">${T(
    "जीआई पाइप",
    "GI PIPES"
  )}</p><div class="brandrow">${[
    "TATA",
    "JTL",
    "Jindal Steels",
    "SURYA",
    "Hi-Tech",
    "ArcelorMittal",
  ]
    .map((x) => `<span>${x}</span>`)
    .join("")}</div><p class="brandlabel">${T(
    "पॉलीफिल्म",
    "POLYFILM"
  )}</p><div class="brandrow"><span>GreenPro</span><span>SunCool</span><span>Ginegar</span></div><p class="brandlabel">${T(
    "फॉगिंग और ड्रिप",
    "FOGGING & DRIP"
  )}</p><div class="brandrow"><span>NETAFIM</span><span>Jain Irrigation</span><span>Sahyadri Pipes</span></div><p class="muted">${T(
    "आपूर्ति किए जाने वाले ब्रांड अंतिम कोटेशन में दिए जाएंगे।",
    "Supplied brands will be specified in your final quotation."
  )}</p></section>`;
}
function about() {
  return `<section class="about-hero"><div><h1><em>Trusted by 1.5 Million+</em><br>Farmers &amp; Corporates</h1><p>Supporting businesses across regions, and stages of growth.</p></div><img src="./assets/product-nvph65.png" alt="Polyhouse structure" width="600" height="400"></section><section class="panel about-section"><h2>Who we are</h2><p>Kryzen brings protected-cultivation materials, farm planning and construction support together. From choosing your structure to preparing for dispatch, our platform helps you plan and source the materials for your project.</p><a class="smalllink" href="#configure">Build your system →</a></section><section class="about-section"><h2>Team</h2><div class="about-card-grid">${[
    [
      "Planning & support",
      "Helping you select a structure and materials for your farm.",
    ],
    [
      "Sourcing & fulfilment",
      "Coordinating material requirements and dispatch details.",
    ],
    [
      "Construction coordination",
      "Helping you connect with a construction team for your project.",
    ],
  ]
    .map(
      ([title, copy]) =>
        `<article class="panel"><h3>${title}</h3><p>${copy}</p></article>`
    )
    .join(
      ""
    )}</div></section><section class="panel about-section"><h2>Press &amp; media</h2><p>For company information, interviews and media enquiries, contact our team.</p><a class="smalllink" href="mailto:contact@kryzen.com">contact@kryzen.com ↗</a></section><section class="panel about-section"><h2>Client Testimonials</h2><p>Customer stories and testimonials will be shared here.</p></section>`;
}
function faq() {
  return (
    heading(
      "अक्सर पूछे जाने वाले सवाल",
      "FAQ’s",
      "अपने प्रोजेक्ट से जुड़े सवालों के जवाब।",
      "Answers to common questions about your project."
    ) +
    `<section class="panel faq-list">${[
      [
        "How do I choose my structure?",
        "Open Build your system, choose a structure and dimensions, then select the services you need.",
      ],
      [
        "Can I buy individual materials?",
        "Yes. Open Buy materials to select individual items and quantities.",
      ],
      [
        "How much is the booking payment?",
        "The booking option is ₹99, with the remaining payment due on dispatch. The payment gateway is not yet connected in this preview.",
      ],
      [
        "How is transport estimated?",
        "Enter your delivery pincode to estimate road distance from factory pincode 412803 at ₹15 per km. The final distance depends on the exact addresses.",
      ],
      [
        "Where can I find my documents?",
        "My Account → My Orders shows quotation and invoice downloads, and applicable certificates when issued.",
      ],
      [
        "When will I receive construction team details?",
        "If a construction team is included, its details are shared after dispatch.",
      ],
    ]
      .map(
        ([question, answer]) =>
          `<details><summary>${question}</summary><p>${answer}</p></details>`
      )
      .join("")}</section>`
  );
}
function career() {
  return (
    heading(
      "करियर",
      "Career",
      "हमारे साथ काम करें।",
      "Help farmers and businesses build their next project."
    ) +
    `<section class="panel"><h2>Work with Kryzen</h2><p>Interested in farm planning, sourcing, fulfilment or customer support? Contact our team to enquire about opportunities.</p><p>Share your area of interest and experience with us.</p><a class="secondary career-contact" href="mailto:contact@kryzen.com?subject=Career%20enquiry">Enquire about opportunities →</a></section>`
  );
}
function whyChooseUs() {
  return (
    heading(
      "हमें क्यों चुनें?",
      "Why choose us?",
      "योजना से डिस्पैच तक सहायता।",
      "Support from planning through dispatch."
    ) +
    `<div class="about-card-grid">${[
      [
        "Plan your system",
        "Compare structures, dimensions and farm options in one place.",
      ],
      [
        "See your material list",
        "Review specifications, quantities and the cost breakdown before booking.",
      ],
      [
        "Choose the support you need",
        "Select transportation, insurance, lab reports and construction support for your project.",
      ],
      [
        "Keep your project together",
        "Find quotations, order records and issued documents in My Account.",
      ],
    ]
      .map(
        ([title, copy]) =>
          `<section class="panel"><h2>${title}</h2><p>${copy}</p></section>`
      )
      .join(
        ""
      )}</div><a class="secondary career-contact" href="#configure">Build your system →</a>`
  );
}
// Sample testimonials for layout review; replace with approved customer feedback.
const footerReviews = [
  [
    "Ramesh Patil",
    "Pune, Maharashtra",
    "Choosing the structure felt simple. The material list helped me understand the project. I could plan my next steps with more clarity.",
  ],
  [
    "Sunita Shinde",
    "Satara, Maharashtra",
    "I could compare the farm options in one place. The quantity breakdown was easy to follow. It helped me prepare for our farm project.",
  ],
  [
    "Mahesh Desai",
    "Nashik, Maharashtra",
    "The step-by-step layout was useful. I could review the dimensions before moving ahead. Keeping the quotation together made planning easier.",
  ],
  [
    "Kavita Reddy",
    "Hyderabad, Telangana",
    "The ground-cover and irrigation choices were clear. I could choose what suited our plan. The summary helped me review the selection.",
  ],
  [
    "Suresh Patel",
    "Anand, Gujarat",
    "I liked seeing the materials and quantities together. Comparing options took less effort. The project details were easy to revisit.",
  ],
  [
    "Anita Sharma",
    "Jaipur, Rajasthan",
    "The individual-material page was helpful. I could adjust quantities and see the pricing tiers. It made the purchasing plan easier to understand.",
  ],
  [
    "Vijay Kumar",
    "Mysuru, Karnataka",
    "The dimension diagram helped explain the layout. I could see the span and length clearly. That made discussions with our team easier.",
  ],
  [
    "Meena Yadav",
    "Indore, Madhya Pradesh",
    "Our requirements stayed organised in one place. The optional services were easy to compare. We could focus on planning the farm.",
  ],
  [
    "Harpreet Singh",
    "Ludhiana, Punjab",
    "The quotation view was clear and compact. I could check each item before proceeding. Having the records together was useful.",
  ],
  [
    "Prakash Jadhav",
    "Kolhapur, Maharashtra",
    "The farm options helped us explore different setups. We could update our choices quickly. The material summary made the plan easier to share.",
  ],
];
let footerReviewIndex = 0;
function footerReviewSlide() {
  const [name, location, quote] = footerReviews[footerReviewIndex];
  return `<span class="review-sample">${T(
    "नमूना समीक्षा",
    "Sample review"
  )} · ${footerReviewIndex + 1} / ${
    footerReviews.length
  }</span><blockquote>${esc(quote)}</blockquote><strong>${esc(
    name
  )}</strong><span class="review-location">${esc(location)}</span>`;
}
function moveFooterReview(direction) {
  footerReviewIndex =
    (footerReviewIndex + direction + footerReviews.length) %
    footerReviews.length;
  const slide = $("#footer-review-slide");
  if (slide) slide.innerHTML = footerReviewSlide();
}
function footerReviewCarousel() {
  return `<section class="footer-reviews" aria-roledescription="carousel" aria-label="${T(
    "ग्राहक समीक्षा के नमूने",
    "Sample customer reviews"
  )}"><button type="button" aria-label="${T(
    "पिछली समीक्षा",
    "Previous review"
  )}" onclick="moveFooterReview(-1)">‹</button><div id="footer-review-slide" aria-live="polite">${footerReviewSlide()}</div><button type="button" aria-label="${T(
    "अगली समीक्षा",
    "Next review"
  )}" onclick="moveFooterReview(1)">›</button></section>`;
}
function clientCarousel() {
  return `<section class="clientale"><h2>Clientale</h2><p>${T(
    "क्लाइंट लोगो के लिए नमूना स्थान",
    "Placeholder client logos"
  )}</p><div class="client-logo-window"><div class="client-logo-track">${[
    false,
    true,
  ]
    .map(
      (copy) =>
        `<div class="client-logo-group" ${
          copy ? 'aria-hidden="true"' : ""
        }>${Array.from(
          { length: 25 },
          (_, i) =>
            `<div class="client-logo"><img src="./assets/clients/client-${
              i + 1
            }.svg" alt="${
              copy ? "" : `Client logo placeholder ${i + 1}`
            }" width="140" height="80" loading="lazy"></div>`
        ).join("")}</div>`
    )
    .join("")}</div></div></section>`;
}
const purchaseSampleNames = [
  "Amit Patil",
  "Rajesh Sharma",
  "Suresh Reddy",
  "Vijay Singh",
  "Prakash Jadhav",
  "Ramesh Patel",
  "Sanjay Kumar",
  "Nitin Deshmukh",
  "Mahesh Yadav",
  "Harpreet Singh",
  "Ganesh Pawar",
  "Dinesh Mehta",
  "Rohit Verma",
  "Sunil Nair",
  "Ashok Rao",
  "Sachin More",
  "Kiran Joshi",
  "Deepak Kulkarni",
  "Manoj Gupta",
  "Anil Chavan",
];
const purchaseSamplePlaces = [
  "Pune, Maharashtra",
  "Nashik, Maharashtra",
  "Satara, Maharashtra",
  "Indore, Madhya Pradesh",
  "Jaipur, Rajasthan",
  "Ahmedabad, Gujarat",
  "Surat, Gujarat",
  "Hyderabad, Telangana",
  "Mysuru, Karnataka",
  "Bengaluru, Karnataka",
  "Ludhiana, Punjab",
  "Nagpur, Maharashtra",
  "Kolhapur, Maharashtra",
  "Bhopal, Madhya Pradesh",
  "Lucknow, Uttar Pradesh",
  "Coimbatore, Tamil Nadu",
  "Kochi, Kerala",
  "Vijayawada, Andhra Pradesh",
  "Bhubaneswar, Odisha",
  "Patna, Bihar",
];
const purchaseSamples = Array.from({ length: 100 }, (_, i) => ({
  name: purchaseSampleNames[i % 20],
  place: purchaseSamplePlaces[((i % 20) + Math.floor(i / 20) * 3) % 20],
  span: [24, 32, 40, 48, 56][i % 5],
  bay: [24, 40, 48, 60][Math.floor(i / 5) % 4],
  minutes: 3 + ((i * 7) % 57),
}));
let purchaseQueue = [],
  purchaseTimer = null,
  purchaseHideTimer = null;
function nextPurchaseSample() {
  if (!purchaseQueue.length) {
    purchaseQueue = purchaseSamples.slice();
    for (let i = purchaseQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [purchaseQueue[i], purchaseQueue[j]] = [
        purchaseQueue[j],
        purchaseQueue[i],
      ];
    }
  }
  return purchaseQueue.pop();
}
function dismissPurchaseSample() {
  clearTimeout(purchaseHideTimer);
  document.querySelector(".purchase-notification")?.remove();
}
function schedulePurchaseSample() {
  purchaseTimer = setTimeout(() => {
    purchaseTimer = null;
    if (!document.hidden && !document.querySelector("dialog[open]")) {
      const item = nextPurchaseSample();
      dismissPurchaseSample();
      const popup = document.createElement("aside");
      popup.className = "purchase-notification";
      popup.setAttribute("aria-label", "Demo purchase activity");
      popup.innerHTML = `<button type="button" aria-label="Close notification" onclick="dismissPurchaseSample()">×</button><small>${T(
        "नमूना गतिविधि · वास्तविक खरीद नहीं",
        "Demo activity · Not an actual purchase"
      )}</small><strong>Mr. ${esc(item.name)}</strong><p>${T(
        "स्थान",
        "From"
      )} ${esc(item.place)}</p><p>${T("खरीदा", "Purchased")} ${item.span} m × ${
        item.bay
      } m ${T("पॉलीहाउस", "polyhouse")}</p><span>${item.minutes} ${T(
        "मिनट पहले",
        "min ago"
      )}</span>`;
      document.body.appendChild(popup);
      purchaseHideTimer = setTimeout(dismissPurchaseSample, 12000);
    }
    schedulePurchaseSample();
  }, 180000 + Math.floor(Math.random() * 120001));
}
function startPurchaseSamples() {
  if (purchaseTimer === null) schedulePurchaseSample();
}
function detailedFooter() {
  return `<footer class="site-footer">${clientCarousel()}<div class="footer-promise"><div><h2><em>Powered By</em> In-House Technology</h2><p>Technology that connects sourcing, fulfilment, and business growth.</p></div>${footerReviewCarousel()}</div><div class="footer-grid"><div><img src="./assets/kryzen-logo.svg" alt="Kryzen" width="150" height="44"><p>Kryzen Biotech Private Limited</p><p>CIN: U01100PN2019PTC186207<br>GST: 27AAHCK7659R1ZF</p><a href="mailto:contact@kryzen.com">contact@kryzen.com</a><br><a href="tel:+919870424425">+91 9870 424 425</a></div><div><strong>${T(
    "पते",
    "Locations"
  )}</strong><p><b>${T(
    "कॉर्पोरेट कार्यालय",
    "Corporate office"
  )}</b><br>M319, City Avenue, Pune-Bangalore Highway, Wakad, 411057</p><p><b>${T(
    "अनुभव केंद्र",
    "Experience centre"
  )}</b><br>#98, At. Po. Degaon, Pune-Bangalore Highway, Tal Wai, Satara, 412803</p><p><b>${T(
    "निर्माण इकाई",
    "Manufacturing"
  )}</b><br>#817, At. Po. Degaon, Pune-Bangalore Highway, Tal Wai, Satara, 412803</p></div><div><strong>${T(
    "कंपनी",
    "Company"
  )}</strong><a href="#about">About us</a><a href="#faq">FAQ’s</a><a href="#career">Career</a><a href="#whychooseus">Why choose us?</a><a href="https://kryzen.com/gallery/" target="_blank" rel="noopener">Photo gallery</a><a href="https://kryzen.com/terms-and-conditions/" target="_blank" rel="noopener">Terms & conditions</a><a href="https://kryzen.com/privacy-policy/" target="_blank" rel="noopener">Privacy policy</a><a href="https://kryzen.com/refund-policy/" target="_blank" rel="noopener">Refund policy</a></div><div><strong>${T(
    "उत्पाद",
    "Products"
  )}</strong><a href="https://kryzen.com/polytunnel/" target="_blank" rel="noopener">Polytunnel</a><a href="https://kryzen.com/nethouse/" target="_blank" rel="noopener">Nethouse / Shadehouse</a><a href="https://kryzen.com/naturally-ventilated-polyhouse/" target="_blank" rel="noopener">Naturally ventilated polyhouse</a><a href="https://kryzen.com/fan-pad-polyhouse/" target="_blank" rel="noopener">Fan & pad polyhouse</a></div></div><div class="footer-brands"><span>${T(
    "हम जिन ब्रांड्स के साथ काम करते हैं",
    "Brands we work with"
  )}</span>${[
    "TATA",
    "JTL",
    "Jindal",
    "SURYA",
    "Hi-Tech",
    "ArcelorMittal",
    "GreenPro",
    "SunCool",
    "Ginegar",
    "NETAFIM",
    "Jain Irrigation",
  ]
    .map((x) => `<b>${x}</b>`)
    .join(
      ""
    )}</div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Kryzen Biotech Pvt. Ltd.</span><span>${T(
    "सोम–शनि: सुबह 9:00 – शाम 6:00",
    "Mon–Sat: 09:00am – 06:00pm"
  )}</span></div></footer>`;
}
function optionDescription(key) {
  const descriptions = {
    weedmat: [
      "जमीन ढकने और खरपतवार रोकने के लिए बुनी हुई चटाई।",
      "Woven ground cover to help control weeds.",
    ],
    mulch: [
      "फसल की क्यारियों को ढकने और नमी बनाए रखने के लिए फिल्म।",
      "Film for covering crop beds and retaining moisture.",
    ],
    none: ["जमीन के लिए कोई कवर शामिल नहीं है।", "Leave the ground uncovered."],
    arrow: [
      "पौधों या ग्रो बैग में पानी देने के लिए एरो स्टेक।",
      "Arrow stakes for watering individual plants or grow bags.",
    ],
    outline: [
      "पाइप के बाहर लगे ड्रिपर से पौधों को पानी दें।",
      "External drippers deliver water at individual plant locations.",
    ],
    inline: [
      "पाइप में लगे ड्रिपर से फसल की कतारों में पानी दें।",
      "Built-in drippers distribute water along crop rows.",
    ],
    fog: [
      "बारीक फुहार से खेत में नमी बनाए रखने में मदद।",
      "Fine mist to help maintain humidity around crops.",
    ],
    drip: [
      "पौधों की जड़ों तक सीधे पानी पहुंचाएं।",
      "Deliver water directly to the plant root zone.",
    ],
    disinfection: [
      "फार्म के प्रवेश पर स्वच्छता के लिए समर्पित केबिन।",
      "A dedicated cabin for hygiene at the farm entrance.",
    ],
  };
  return T(...descriptions[key]);
}
function photoChoices(key, options) {
  return `<div class="photo-choices">${options
    .map(
      ([value, hi, en, file]) =>
        `<button type="button" class="photo-choice farm-option ${
          c[key] === value ? "on" : ""
        }" aria-pressed="${
          c[key] === value
        }" onclick="change('${key}','${value}')"><img src="./assets/${file}" alt="" width="240" height="130" loading="lazy" class="farm-option-image"><span class="photo-choice-label"><span class="farm-option-title">${T(
          hi,
          en
        )}</span><span class="selection-mark" aria-hidden="true">${
          c[key] === value ? "✓" : "+"
        }</span></span><span class="farm-option-description">${optionDescription(
          value
        )}</span></button>`
    )
    .join("")}</div><hr class="option-divider">`;
}
function irrigationOption(key, hi, en, file) {
  return `<div class="irrigation-option farm-option ${
    c[key] ? "selected" : ""
  }"><img class="farm-option-image" src="./assets/${file}" alt="" width="240" height="130" loading="lazy"><h3 class="farm-option-title">${T(
    hi,
    en
  )}</h3><p class="farm-option-description">${optionDescription(
    key
  )}</p>${choices(key, [
    [true, "चाहिए", "Required"],
    [false, "नहीं चाहिए", "Not required"],
  ])}</div>`;
}
function farmOptions() {
  const yesNo = [
    [true, "चाहिए", "Required"],
    [false, "नहीं चाहिए", "Not required"],
  ];
  const options = [
    [
      "cover",
      "जमीन पर कवर",
      "Ground cover",
      [
        ["weedmat", "वीडमैट", "Weedmat"],
        ["mulch", "मल्चिंग", "Mulching"],
        ["none", "नहीं चाहिए", "Not required"],
      ],
    ],
    ["fog", "फॉगिंग सिस्टम", "Fogging System", yesNo],
    [
      "irrigation",
      "सिंचाई",
      "Irrigation",
      [
        ["inline", "इनलाइन", "Inline"],
        ["outline", "आउटलाइन", "Outline"],
        ["none", "नहीं चाहिए", "Not required"],
      ],
    ],
    [
      "shadowNet",
      "शैडो नेट",
      "Shadow net",
      [
        ["aluminium", "एल्युमिनियम नेट", "Aluminium net"],
        ["black", "ब्लैक नेट", "Black net"],
        ["white", "व्हाइट नेट", "White net"],
      ],
    ],
    [
      "cabinSize",
      "कीटाणुशोधन केबिन",
      "Disinfection cabin",
      [
        ["4x4", "4 m × 4 m", "4 m × 4 m"],
        ["3x3", "3 m × 3 m", "3 m × 3 m"],
        ["none", "नहीं चाहिए", "Not required"],
      ],
    ],
    ["airFans", "एयर सर्कुलेशन फैन", "Air Circulation fans", yesNo],
    ["gutterFunnel", "गटर फ़नल", "Gutter Funnel", yesNo],
    [
      "ventOpener",
      "वेंट ओपनर",
      "Vent opener",
      [
        ["manual", "मैनुअल", "Manual"],
        ["geared", "गियर्ड", "Geared"],
      ],
    ],
  ];
  const images = {
    cover: "item-42.png",
    fog: "fogger.png",
    irrigation: "flat-drip.png",
    shadowNet: "item-96.png",
    cabinSize: "disinfection-cabin.svg",
    airFans: "fanpad-equipment.png",
    gutterFunnel: "option-placeholder.svg",
    ventOpener: "option-placeholder.svg",
  };
  return `<div class="farm-options">${options
    .map(
      ([key, hi, en, values], i) =>
        `<section class="farm-option-row"><img class="farm-option-photo" src="./assets/${
          images[key]
        }" alt="${
          images[key] === "option-placeholder.svg"
            ? T("नमूना चित्र", "Placeholder image")
            : T(hi, en)
        }" width="200" height="120" loading="lazy"><h3><span>${
          i + 1
        }.</span> ${T(hi, en)}</h3>${choices(key, values)}</section>`
    )
    .join("")}</div>`;
}
function configure() {
  return `<div class="heading"><div><h1>${T(
    "आपकी जमीन। आपका पॉलीहाउस।",
    "Your land. Your polyhouse."
  )}</h1><p>${T(
    "सिस्टम चुनें, आकार बताएं और अपनी सामग्री सूची देखें।",
    "Choose a system, set your dimensions and explore your materials."
  )}</p></div><span class="pill">✓ ${T(
    "चुनने से निर्माण तक सहायता",
    "Support from selection to construction"
  )}</span></div><div class="layout"><main><section class="panel"><div class="sectiontitle"><span class="number">01</span><h2>${T(
    "कौन-सा सिस्टम चाहिए?",
    "Choose your structure"
  )}</h2></div><div class="productgrid configure-products">${products
    .map(
      (p) =>
        `<button class="product ${
          c.product === p[0] ? "selected" : ""
        }" aria-pressed="${c.product === p[0]}" onclick="change('product','${
          p[0]
        }')">${c.product === p[0] ? '<span class="tick">✓</span>' : ""}${
          p[0] === "nvph65"
            ? `<span class="preferred-ribbon">${T(
                "सबसे पसंदीदा",
                "Most preferred"
              )}</span>`
            : ""
        }${productPhoto(p[0], T(p[1], p[2]))}<strong>${T(
          p[1],
          p[2]
        )}</strong><small>${T(p[3], p[4])}</small></button>`
    )
    .join("")}</div><p class="muted" style="margin-top:17px">${T(
    "6.5 मीटर संरचना की ऊंचाई है। तस्वीरें प्रकार समझाने के लिए हैं।",
    "6.5 m refers to structure height. Photos illustrate structure types."
  )}</p><hr class="option-divider"><div class="sectiontitle"><span class="number">02</span><h2>${T(
    "आकार चुनें",
    "Choose dimensions"
  )}</h2></div><div class="dimension-layout"><div class="dimension-footprint">${diagram()}</div><div class="fieldgrid">${field(
    T("स्पैन / चौड़ाई", "Span / width"),
    `<select aria-label="Span" onchange="change('span',+this.value)">${Array.from(
      { length: 144 / spanStep() },
      (_, i) => (i + 1) * spanStep()
    )
      .map(
        (n) =>
          `<option ${c.span === n ? "selected" : ""} value="${n}">${n} ${T(
            "मीटर",
            "metres"
          )}</option>`
      )
      .join("")}</select><small>${T(
      `${spanStep()} मीटर के गुणक में। इसमें 4 मीटर हॉकी क्षेत्र शामिल है — दोनों ओर 2 मीटर।`,
      `In multiples of ${spanStep()} metres. Includes 4 m of hockey area — 2 m on each side.`
    )}</small>`
  )}${field(
    T("बे / लंबाई", "Bay / length"),
    `<select aria-label="Bay" onchange="change('bay',+this.value)">${bayOptions()
      .map(
        (n) =>
          `<option ${c.bay === n ? "selected" : ""} value="${n}">${n} ${T(
            "मीटर",
            "metres"
          )}</option>`
      )
      .join("")}</select><small>${
      c.product === "polytunnel"
        ? T("4.5 या 5.5 मीटर चुनें।", "Choose 4.5 or 5.5 metres.")
        : T(
            `${bayStep()} मीटर के गुणक में। इसमें 4 मीटर हॉकी क्षेत्र शामिल है — दोनों ओर 2 मीटर।`,
            `In multiples of ${bayStep()} metres. Includes 4 m of hockey area — 2 m on each side.`
          )
    }</small>`
  )}</div></div><div class="area"><img class="area-photo" src="./assets/product-nvph65.png" alt="${T(
    "पॉलीहाउस",
    "Polyhouse"
  )}" width="132" height="88"><div class="area-details"><span>${T(
    "आपका कुल क्षेत्रफल",
    "Your total growing area"
  )}</span><div><strong>${area().toLocaleString(
    "en-IN"
  )} m²</strong> <small> / ${Math.round(area() * 10.7639).toLocaleString(
    "en-IN"
  )} sq ft</small></div></div></div><hr class="option-divider"><div class="sectiontitle"><span class="number">03</span><h2>${T(
    "अपने खेत की जरूरतें चुनें",
    "Make it work for your farm"
  )}</h2></div>${farmOptions()}${navButtons(
    null,
    "materials"
  )}</section></main>${summary()}</div>`;
}
const sample = [
  [
    "COL-BIG-76-2-6500",
    "बड़ा कॉलम",
    "Big column",
    "76 × 2.0 × 6500 mm",
    14,
    "nos",
  ],
  [
    "COL-SM-76-2-4500",
    "छोटा कॉलम",
    "Small column",
    "76 × 2.0 × 4500 mm",
    64,
    "nos",
  ],
  [
    "BOTTOM-60-2-6000",
    "बिग बॉटम",
    "Big bottom",
    "60 × 2.0 × 6000 mm",
    42,
    "nos",
  ],
  [
    "ARC-BIG-42-2-5500",
    "बड़ा आर्क",
    "Big arc",
    "42 × 2.0 × 5500 mm",
    56,
    "nos",
  ],
  [
    "FOUND-60-2-1000",
    "फाउंडेशन पाइप",
    "Foundation pipe",
    "60 × 2.0 × 1000 mm",
    78,
    "nos",
  ],
  ["FILM-250-55", "पॉलीफिल्म", "Polyfilm", "250 micron · 5.5 m", 332, "m"],
  ["WEED-42-100", "वीडमैट", "Weedmat", "4.2 m · 100 GSM", 470, "m"],
];
function heading(h, e, subh, sube) {
  return `<div class="heading"><div><h1>${T(h, e)}</h1><p>${T(
    subh,
    sube
  )}</p></div></div>`;
}
function navButtons(back, next) {
  return `<div class="footerbuttons">${
    back
      ? `<button type="button" class="secondary" onclick="go('${back}')">← ${T(
          "पीछे",
          "Back"
        )}</button>`
      : ""
  }<button type="button" class="primary dark" onclick="go('${next}')">${T(
    "आगे बढ़ें",
    "Continue"
  )} →</button></div>`;
}
const imageMap = {
  "COL-BIG-76-2-6500": 45,
  "COL-SM-76-2-4500": 47,
  "BOTTOM-60-2-6000": 49,
  "ARC-BIG-42-2-5500": 67,
  "FOUND-60-2-1000": 84,
  "FILM-250-55": 74,
  "WEED-42-100": 42,
};
function productPhoto(id, alt) {
  return `<img class="product-photo" src="./assets/product-${id}.png" alt="${esc(
    alt
  )}" width="300" height="150">`;
}
function itemPhoto(id, alt) {
  const src =
    typeof id === "number"
      ? `item-${id}.png`
      : imageMap[id]
      ? `item-${imageMap[id]}.png`
      : /\.(svg|png)$/.test(id)
      ? id
      : id + ".png";
  return `<img class="item-photo" src="./assets/${src}" alt="${esc(
    alt
  )}" width="76" height="76" loading="lazy">`;
}
function selectedMaterials() {
  const net = ["square", "tunnelnet"].includes(c.product),
    nv = ["nvph65", "nvph5"].includes(c.product);
  let rows = nv
    ? sample
        .slice(0, 5)
        .map((x) => ({
          name: T(x[1], x[2]),
          spec: x[3]
            .replace("2.0", c.thickness)
            .replace("6500", c.product === "nvph5" ? "5000" : "6500"),
          img: imageMap[x[0]],
          ref: x[4],
          unit: x[5],
        }))
    : [
        {
          name: T("स्ट्रक्चर पाइप और फिटिंग", "Structure pipes & fittings"),
          spec: `${pName()} · ${c.thickness} mm`,
          img: 49,
        },
      ];
  rows.push({
    name: net
      ? T("इन्सेक्ट / शेड नेट", "Insect / shade net")
      : T("पॉलीफिल्म", "Polyfilm"),
    spec: net
      ? pName()
      : T(
          "कवर का आकार डिजाइन के अनुसार",
          "Cover dimensions per approved design"
        ),
    img: net ? 96 : 74,
    ref: net ? null : 332,
    unit: "m",
  });
  if (c.cover !== "none")
    rows.push({
      name:
        c.cover === "weedmat"
          ? T("वीडमैट", "Weedmat")
          : T("मल्चिंग फिल्म", "Mulching film"),
      spec:
        c.cover === "weedmat"
          ? "4.2 m · 100 GSM"
          : T("मल्चिंग • बेड लेआउट के अनुसार", "Mulching · per bed layout"),
      img: c.cover === "weedmat" ? 42 : "mulch",
      ref: c.cover === "weedmat" ? 470 : null,
      unit: "m",
    });
  if (c.fog)
    rows.push({
      name: T("फॉगिंग सिस्टम", "Fogging system"),
      spec: T("नोजल, लाइन और फिटिंग", "Nozzles, lines & fittings"),
      img: "fogger",
    });
  if (c.drip)
    rows.push({
      name: dripperName(),
      spec: T("सिंचाई की चुनी गई व्यवस्था", "Your selected irrigation system"),
      img: c.dripper === "arrow" ? "arrow-drip" : "flat-drip",
    });
  if (c.disinfection)
    rows.push({
      name: T("कीटाणुशोधन केबिन", "Disinfection Cabin"),
      spec: c.cabinSize === "3x3" ? "3 m × 3 m" : "4 m × 4 m",
      img: "disinfection-cabin.svg",
    });
  rows.push({
    name: T("शैडो नेट", "Shadow net"),
    spec:
      c.shadowNet === "black"
        ? T("ब्लैक नेट", "Black net")
        : c.shadowNet === "white"
        ? T("व्हाइट नेट", "White net")
        : T("एल्युमिनियम नेट", "Aluminium net"),
    img: 96,
    unit: "m",
    reason: T("शैडो नेट", "Shadow net"),
  });
  for (const [key, hi, en, img] of [
    [
      "airFans",
      "एयर सर्कुलेशन फैन",
      "Air Circulation fans",
      "fanpad-equipment",
    ],
    ["gutterFunnel", "गटर फ़नल", "Gutter Funnel", 49],
    ["ventOpener", "वेंट ओपनर", "Vent opener", 49],
  ]) {
    if (c[key])
      rows.push({
        name: T(hi, en),
        spec:
          key === "ventOpener"
            ? c.ventOpener === "geared"
              ? T("गियर्ड", "Geared")
              : T("मैनुअल", "Manual")
            : T(
                "चुने गए फार्म विकल्प के अनुसार",
                "As selected in farm options"
              ),
        img,
        unit: "nos",
        reason: T(hi, en),
      });
  }
  if (c.product === "fanpad")
    rows.push({
      name: T("फैन और कूलिंग पैड", "Fans & cooling pads"),
      spec: T("क्षमता डिजाइन के अनुसार", "Capacity per approved design"),
      img: "fanpad-equipment",
    });
  return rows.map((row) => {
    let reason = pName(),
      description = T(
        "चुनी गई संरचना का फ्रेम बनाने के लिए पाइप और फिटिंग।",
        "Pipes and fittings forming the selected structure frame."
      );
    const structural = {
      45: [
        "छत और फ्रेम को सहारा देने वाला मुख्य कॉलम।",
        "Main upright column supporting the roof and frame.",
      ],
      47: [
        "संरचना के किनारों को सहारा देने वाला कॉलम।",
        "Side column supporting the structure perimeter.",
      ],
      49: [
        "फ्रेम को जोड़ने और सहारा देने वाला निचला सदस्य।",
        "Lower frame member connecting and supporting the structure.",
      ],
      67: [
        "छत का आकार बनाने वाला घुमावदार सदस्य।",
        "Curved roof member forming the roof profile.",
      ],
      84: [
        "फ्रेम को नींव से जोड़ने वाला पाइप।",
        "Foundation pipe anchoring the frame to its base.",
      ],
      74: [
        "संरचना की छत और किनारों को ढकने वाली फिल्म।",
        "Film covering the roof and sides of the structure.",
      ],
      96: [
        "चुनी गई संरचना के लिए जालीदार कवर।",
        "Net covering for the selected structure.",
      ],
    };
    if (structural[row.img]) description = T(...structural[row.img]);
    if (row.img === 42 || row.img === "mulch") {
      reason =
        c.cover === "mulch"
          ? T("मल्चिंग सिस्टम", "Mulching System")
          : T("वीडमैट सिस्टम", "Weedmat System");
      description = optionDescription(c.cover);
    }
    if (row.img === "fogger") {
      reason = T("फॉगर सिस्टम", "Fogger System");
      description = optionDescription("fog");
    }
    if (["arrow-drip", "flat-drip"].includes(row.img)) {
      reason = T("ड्रिप सिस्टम", "Drip System");
      description = optionDescription(c.dripper);
    }
    if (row.img === "disinfection-cabin.svg") {
      reason = T("कीटाणुशोधन केबिन", "Disinfection Cabin");
      description = optionDescription("disinfection");
    }
    if (row.img === "fanpad-equipment")
      description = T(
        "फैन-पैड सिस्टम के लिए पंखे और कूलिंग पैड।",
        "Fans and cooling pads for the selected fan-pad system."
      );
    return {
      description,
      reason,
      hsn: null,
      gstPercent: null,
      rate: null,
      isiVerified: false,
      isiLogo: null,
      ...row,
    };
  });
}
function materialType(unit) {
  const labels = {
    nos: ["यूनिट", "Unit"],
    unit: ["यूनिट", "Unit"],
    kg: ["किग्रा", "Kgs"],
    kgs: ["किग्रा", "Kgs"],
    pack: ["पैक", "Packs"],
    packs: ["पैक", "Packs"],
    m: ["मीटर", "Metres"],
  };
  return labels[unit] ? T(...labels[unit]) : T("पुष्टि बाकी", "Pending");
}
function materialTags(item) {
  return `<div class="material-tags"><span class="tag material-hsn">HSN ${
    item.hsn ? esc(item.hsn) : "—"
  }</span>${
    item.isiVerified && item.isiLogo
      ? `<img class="isi-logo" src="${esc(
          item.isiLogo
        )}" alt="ISI" width="32" height="28">`
      : ""
  }</div>`;
}
// Layout-only preview; selectedMaterials remains the actual configuration list.
let materialPreview = true;
function materialPreviewRows() {
  const actual = selectedMaterials();
  if (!materialPreview) return actual;
  // Illustrative commercial values for the layout preview only, not a quotation.
  const sampleValues = {
    45: { unit: "nos", quantity: 14, rate: 2450 },
    47: { unit: "nos", quantity: 64, rate: 1680 },
    49: { unit: "nos", quantity: 42, rate: 1120 },
    67: { unit: "nos", quantity: 56, rate: 890 },
    84: { unit: "nos", quantity: 78, rate: 320 },
    74: { unit: "m", quantity: 332, rate: 125 },
    96: { unit: "m", quantity: 280, rate: 48 },
    42: { unit: "m", quantity: 470, rate: 36 },
    mulch: { unit: "m", quantity: 240, rate: 18 },
    fogger: { unit: "nos", quantity: 48, rate: 95 },
    "arrow-drip": { unit: "nos", quantity: 600, rate: 12 },
    "flat-drip": { unit: "m", quantity: 800, rate: 9 },
    "disinfection-cabin.svg": { unit: "nos", quantity: 1, rate: 18500 },
    "fanpad-equipment": { unit: "nos", quantity: 4, rate: 24500 },
  };
  return Array.from({ length: 120 }, (_, index) => {
    const item = actual[index % actual.length];
    return { ...item, ...sampleValues[item.img], gstPercent: 18, ref: null };
  });
}
function materialQuantity(item, showReference) {
  const quantity = item.quantity ?? (showReference ? item.ref : null);
  const units = {
    nos: T("यूनिट", "Units"),
    unit: T("यूनिट", "Units"),
    m: T("मीटर", "mtrs"),
    kg: T("किग्रा", "Kgs"),
    kgs: T("किग्रा", "Kgs"),
    pack: T("पैक", "Packs"),
    packs: T("पैक", "Packs"),
  };
  const unit = units[item.unit] || "";
  return `<span class="material-quantity">${
    quantity == null ? T("पुष्टि बाकी", "Pending") : esc(quantity)
  }</span>${unit ? `<small class="material-unit">${unit}</small>` : ""}${
    quantity != null && item.quantity == null
      ? `<small>${T("संदर्भ", "Reference")}</small>`
      : ""
  }`;
}
function materialRate(item, showReference = false) {
  const rate =
    item.rate == null ? T("पुष्टि बाकी", "Pending") : money(item.rate);
  const quantity = item.quantity ?? (showReference ? item.ref : null);
  const total =
    item.rate != null && quantity != null
      ? Math.round(item.rate * quantity * 100) / 100
      : null;
  return `<span class="material-rate">${rate} (${
    item.gstPercent == null
      ? T("GST बाकी", "GST pending")
      : esc(item.gstPercent) + "%"
  })</span>${
    total == null
      ? ""
      : `<strong class="material-line-total" title="${T(
          "दर × मात्रा, GST से पहले",
          "Rate × quantity, before GST"
        )}">${money(total)}</strong>`
  }`;
}

function materials() {
  const rows = materialPreviewRows();
  const groups = new Map();
  rows.forEach((item) => {
    if (!groups.has(item.reason)) groups.set(item.reason, []);
    groups.get(item.reason).push(item);
  });
  let itemNumber = 0;
  const exact =
    c.product === "nvph65" &&
    c.thickness === "2.0" &&
    c.span === 32 &&
    c.bay === 60;
  return (
    heading(
      "आपकी सामग्री सूची",
      "Your material list",
      "आपकी पिछली पसंद के अनुसार सामग्री।",
      "Materials based on your configuration."
    ) +
    `<div class="layout"><main><div class="panel materials-panel"><div class="spread"><h2>${pName()} · ${
      c.span
    } × ${c.bay} m</h2><span class="tag">${T(
      "मात्रा लॉक है",
      "Locked quantities"
    )}</span></div><div class="material-list-toolbar"><strong>${
      rows.length
    } ${T("आइटम", "items")}</strong></div>${
      materialPreview
        ? `<p class="material-preview-caption">${T(
            "नमूना आइटम, मात्रा, इकाइयां, दरें और GST केवल लेआउट के लिए हैं। वास्तविक कोटेशन नहीं।",
            "Sample items, quantities, units, rates and GST for layout preview only. Not an actual quotation."
          )}</p>`
        : ""
    }<div class="tablewrap" role="region" aria-label="${T(
      "सामग्री सूची",
      "Material list"
    )}" tabindex="0"><table class="materials-table"><thead><tr><th scope="col">${T(
      "सामग्री / विवरण",
      "ITEM / SPECIFICATION"
    )}</th><th scope="col">${T("मात्रा", "QUANTITY")}</th><th scope="col">${T(
      "दर (GST %)",
      "RATE (GST %)"
    )}</th></tr></thead>${Array.from(
      groups,
      ([reason, items]) =>
        `<tbody><tr class="material-group-heading"><th scope="rowgroup" colspan="3">${esc(
          reason
        )} <span>${items.length} ${T("आइटम", "items")}</span></th></tr>${items
          .map(
            (x) =>
              `<tr><td><div class="material-cell">${itemPhoto(
                x.img,
                x.name
              )}<div><div class="material-title-line"><strong class="material-name"><span class="material-number">${String(
                ++itemNumber
              ).padStart(3, "0")}</span>${esc(x.name)}</strong>${materialTags(
                x
              )}</div><small class="material-spec">${esc(
                x.spec
              )}</small></div></div></td><td data-label="${T(
                "मात्रा",
                "Quantity"
              )}">${materialQuantity(
                x,
                !materialPreview && exact
              )}</td><td data-label="${T(
                "दर (GST %)",
                "Rate (GST %)"
              )}">${materialRate(x, !materialPreview && exact)}</td></tr>`
          )
          .join("")}</tbody>`
    ).join("")}</table></div>${navButtons(
      "configure",
      "addons"
    )}</div></main>${summary("addons")}</div>`
  );
}
let transportBusy = false,
  transportError = "",
  transportRequest = 0;
const transportLocations = new Map();
function updateDeliveryPin(value) {
  c.pin = value.replace(/\D/g, "").slice(0, 6);
  c.transportEstimate = null;
  c.transportSelected = false;
  transportRequest++;
  transportBusy = false;
  transportError = "";
  c.maxStep = Math.min(c.maxStep || 0, 2);
  save();
  $("#transport-result").innerHTML = "";
  const button = $("#calculate-transport");
  button.disabled = false;
  button.textContent = T("परिवहन लागत निकालें", "Calculate transport cost");
}
async function transportJson(url) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw Error("Unavailable");
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
async function postcodeLocation(pin) {
  if (transportLocations.has(pin)) return transportLocations.get(pin);
  const data = await transportJson("https://api.zippopotam.us/IN/" + pin),
    place = data.places?.[0];
  if (!place || !place.latitude || !place.longitude)
    throw Error("Unknown pincode");
  const point = { lat: Number(place.latitude), lon: Number(place.longitude) };
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon))
    throw Error("Invalid coordinates");
  transportLocations.set(pin, point);
  return point;
}
async function calculateTransport() {
  const pin = String(c.pin || "").trim();
  if (!/^[1-9][0-9]{5}$/.test(pin)) {
    transportError = T(
      "सही 6 अंकों का पिनकोड डालें।",
      "Enter a valid six-digit delivery pincode."
    );
    render();
    return;
  }
  const request = ++transportRequest;
  transportBusy = true;
  transportError = "";
  c.transportEstimate = null;
  c.transportSelected = false;
  save();
  render();
  try {
    const [origin, destination] = await Promise.all([
      postcodeLocation("412803"),
      postcodeLocation(pin),
    ]);
    let km = 0;
    if (pin !== "412803") {
      const coordinates =
        origin.lon +
        "," +
        origin.lat +
        ";" +
        destination.lon +
        "," +
        destination.lat;
      const data = await transportJson(
        "https://router.project-osrm.org/route/v1/driving/" +
          coordinates +
          "?overview=false&steps=false"
      );
      const distance = data.routes?.[0]?.distance;
      if (data.code !== "Ok" || !Number.isFinite(distance) || distance <= 0)
        throw Error("No route");
      km = Math.round(distance / 100) / 10;
    }
    if (request !== transportRequest || pin !== c.pin) return;
    c.transportEstimate = {
      origin: "412803",
      pin,
      km,
      rate: 15,
      cost: Math.round(km * 1500) / 100,
    };
    save();
  } catch {
    if (request === transportRequest)
      transportError = T(
        "दूरी नहीं मिली। पिनकोड और इंटरनेट जांचकर दोबारा कोशिश करें।",
        "Could not calculate distance. Check the pincode and connection, then try again."
      );
  } finally {
    if (request === transportRequest) {
      transportBusy = false;
      if (route() === "addons") render();
    }
  }
}
function transportResult() {
  if (transportError)
    return `<p role="alert" class="transport-error">${transportError}</p>`;
  const e = c.transportEstimate;
  if (!e || e.pin !== c.pin || e.origin !== "412803") return "";
  return `<div class="transport-estimate"><span>${T(
    "मैन्युफैक्चरिंग फैक्ट्री",
    "Manufacturing factory"
  )} · 412803 → ${esc(e.pin)}</span><div><strong>${
    e.km
  } km</strong><span> × ₹15/km</span><strong class="transport-cost">${money(
    e.cost
  )}</strong></div><small>${T(
    "पिनकोड स्थानों के बीच अनुमानित सड़क दूरी। सही पते के अनुसार दूरी बदल सकती है।",
    "Estimated road distance between pincode locations. Final distance depends on the exact addresses."
  )}</small><div class="transport-selection"><button type="button" class="choice ${
    c.transportSelected ? "on" : ""
  }" aria-pressed="${!!c.transportSelected}" onclick="selectTransport(true)">${T(
    "परिवहन चुनें",
    "Select transport"
  )}</button><button type="button" class="choice ${
    c.transport === "own" ? "on" : ""
  }" aria-pressed="${
    c.transport === "own"
  }" onclick="selectTransport(false)">${T(
    "नहीं चाहिए",
    "Not required"
  )}</button></div></div>`;
}
function addons() {
  return (
    heading(
      "जरूरत के अनुसार सेवाएं",
      "A little help, where you need it",
      "परिवहन और अतिरिक्त सेवाएं चुनें।",
      "Calculate transportation and choose additional services."
    ) +
    `<div class="layout"><main><section class="panel addons-panel"><h2>${T(
      "परिवहन",
      "Transportation"
    )}</h2><p>${T(
      "मैन्युफैक्चरिंग फैक्ट्री: 412803 • परिवहन दर ₹15 प्रति किमी",
      "Manufacturing factory: 412803 • Transport rate ₹15 per km"
    )}</p><form class="transport-calculator" onsubmit="event.preventDefault();calculateTransport()"><div class="field"><label for="delivery-pin">${T(
      "डिलीवरी पिनकोड",
      "Delivery pin code"
    )}</label><input id="delivery-pin" inputmode="numeric" autocomplete="postal-code" maxlength="6" pattern="[1-9][0-9]{5}" required value="${esc(
      c.pin || ""
    )}" placeholder="${T(
      "डिलीवरी पिनकोड",
      "Delivery pin code"
    )}" oninput="updateDeliveryPin(this.value);this.value=c.pin"></div><button id="calculate-transport" class="primary dark" type="submit" ${
      transportBusy ? "disabled" : ""
    }>${
      transportBusy
        ? T("दूरी निकाली जा रही है…", "Calculating…")
        : T("परिवहन लागत निकालें", "Calculate transport cost")
    }</button></form><div id="transport-result" aria-live="polite" aria-busy="${transportBusy}">${transportResult()}</div><hr class="option-divider"><h2>${T(
      "अतिरिक्त सेवाएं",
      "Additional services"
    )}</h2><div class="service-grid">${[
      [
        "insurance",
        "ट्रांजिट बीमा",
        "Transit insurance",
        2500,
        1500,
        "service-insurance.svg",
      ],
      [
        "lab",
        "थर्ड-पार्टी लैब रिपोर्ट",
        "Third-party lab report",
        9999,
        2500,
        "service-lab.svg",
      ],
      [
        "dpr",
        "विस्तृत प्रोजेक्ट प्लान पाएं",
        "Get Detailed Project Plan",
        999,
        0,
        "service-plan.svg",
      ],
    ]
      .map(
        ([key, hi, en, original, price, image]) =>
          `<article class="service-card ${
            c[key] ? "selected" : ""
          }"><img src="./assets/${image}" alt="" width="240" height="140" loading="lazy"><span class="service-name">${T(
            hi,
            en
          )}</span><span class="service-price"><s aria-label="${T(
            "पुरानी कीमत",
            "Original price"
          )}">${money(original)}</s><strong>${money(price)}</strong></span>${
            key === "insurance"
              ? `<small>${T("प्रति वाहन", "Per vehicle")}</small>`
              : ""
          }<button type="button" class="secondary service-toggle" aria-pressed="${!!c[
            key
          ]}" onclick="change('${key}',${!c[key]})">${
            c[key] ? T("हटाएं", "Remove") : T("जोड़ें", "Add")
          }</button></article>`
      )
      .join("")}</div>${navButtons(
      "materials",
      "construction"
    )}</section></main>${summary("construction")}</div>`
  );
}
const teamNames = [
  "Vishwas",
  "Sanjay",
  "Prakash",
  "Ramesh",
  "Suresh",
  "Ganesh",
  "Rajesh",
  "Vijay",
  "Mahesh",
  "Santosh",
  "Anil",
  "Deepak",
  "Manoj",
  "Ajay",
  "Sunil",
  "Nitin",
  "Sachin",
  "Rahul",
  "Amit",
  "Dinesh",
  "Mukesh",
  "Kiran",
  "Rohit",
  "Hemant",
  "Yogesh",
  "Pankaj",
  "Vinod",
  "Ashok",
  "Sudhir",
  "Mohan",
];
const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];
const teams = teamNames.map((n, i) => ({
  name: n,
  members: [5, 10, 3, 25, 50][i % 5],
  state: ["Maharashtra", "Karnataka", "Gujarat", "Madhya Pradesh", "Telangana"][
    i % 5
  ],
  city: ["Pune", "Bengaluru", "Surat", "Indore", "Hyderabad"][i % 5],
  rating: [4.5, 4, 5, 3.8, 4.7][i % 5],
  projects: 125 + i * 7,
  rate: 65 + (i % 3) * 5,
  days: [12, 18, 10, 24, 16][i % 5],
  busy: i % 4 === 2,
  photo: i % 5,
}));
let teamPage = 1;
function changeTeamPage(page) {
  teamPage = page;
  render();
  document.querySelector(".filters")?.scrollIntoView({ block: "start" });
}
function proceedWithoutTeam() {
  selectedTeam = null;
  c.selectedTeam = null;
  save();
  go("billing");
}
function construction() {
  let list = teams.filter(
    (t) =>
      t.members >= teamFilter.members &&
      (!teamFilter.state || t.state === teamFilter.state) &&
      t.rating >= teamFilter.rating
  );
  const pageCount = Math.max(1, Math.ceil(list.length / 10));
  teamPage = Math.min(teamPage, pageCount);
  const visible = list.slice((teamPage - 1) * 10, teamPage * 10);
  return (
    heading(
      "अपने प्रोजेक्ट की टीम चुनें",
      "Meet your construction team",
      "शुरू होने के दिन से अनुमानित समय और टीम की उपलब्धता देखें।",
      "Compare availability and estimated completion from the start date."
    ) +
    `<div class="layout"><main><div class="filters"><select aria-label="Team size" onchange="teamFilter.members=+this.value;teamPage=1;render()"><option value="0">${T(
      "टीम के सदस्य",
      "Team members"
    )}</option>${[1, 3, 5, 10, 25, 50]
      .map(
        (n) =>
          `<option value="${n}" ${
            teamFilter.members === n ? "selected" : ""
          }>${n}+</option>`
      )
      .join(
        ""
      )}</select><select aria-label="State" onchange="teamFilter.state=this.value;teamPage=1;render()"><option value="">${T(
      "सभी राज्य",
      "All states"
    )}</option>${states
      .map(
        (s) =>
          `<option ${teamFilter.state === s ? "selected" : ""}>${s}</option>`
      )
      .join(
        ""
      )}</select><select aria-label="Rating" onchange="teamFilter.rating=+this.value;teamPage=1;render()"><option value="0">${T(
      "सभी रेटिंग",
      "All ratings"
    )}</option>${[3, 4, 5]
      .map(
        (n) =>
          `<option value="${n}" ${
            teamFilter.rating === n ? "selected" : ""
          }>${n} ★ +</option>`
      )
      .join("")}</select></div>${
      list.length
        ? visible
            .map(
              (t) =>
                `<article class="team ${
                  t.busy ? "team-busy" : ""
                }"><div class="team-photo" style="--photo:${
                  t.photo
                }" role="img" aria-label="${T(
                  "निर्माण टीम लीडर",
                  "Construction team leader"
                )}"></div><div class="team-body"><div><div class="team-title"><h3>${T(
                  "श्री",
                  "Mr."
                )} ${t.name} + ${t.members}</h3><span class="tag">★ ${
                  t.rating
                }</span></div><span class="muted team-location">${t.city}, ${
                  t.state
                }</span></div><div class="team-facts"><span>${t.projects} ${T(
                  "प्रोजेक्ट",
                  "projects"
                )}</span><span>${t.days} ${T(
                  "दिन में पूरा",
                  "days from start"
                )}</span></div><div class="spread"><div class="team-pricing"><strong>${money(
                  area() * t.rate
                )}</strong><span>${money(t.rate)} / m²</span></div>${
                  t.busy
                    ? `<span class="busy-badge">${T(
                        "दूसरे काम पर व्यस्त",
                        "Busy on another job"
                      )}</span>`
                    : `<button class="primary team-book" aria-pressed="${
                        selectedTeam === t.name
                      }" onclick="selectedTeam='${
                        t.name
                      }';c.selectedTeam=selectedTeam;save();render()">${
                        selectedTeam === t.name
                          ? T("चुना गया ✓", "Selected ✓")
                          : T("टीम चुनें", "Select team")
                      }</button>`
                }</div></div></article>`
            )
            .join("")
        : `<div class="panel empty">${T(
            "इन फिल्टर के लिए टीम नहीं मिली।",
            "No teams match these filters."
          )}</div>`
    }${
      list.length
        ? `<nav class="team-pagination" aria-label="${T(
            "टीम सूची के पेज",
            "Team list pages"
          )}"><span>${(teamPage - 1) * 10 + 1}–${Math.min(
            teamPage * 10,
            list.length
          )} / ${list.length}</span>${Array.from(
            { length: pageCount },
            (_, i) =>
              `<button type="button" class="choice ${
                teamPage === i + 1 ? "on" : ""
              }" ${
                teamPage === i + 1 ? 'aria-current="page"' : ""
              } aria-label="${T("पेज", "Page")} ${
                i + 1
              }" onclick="changeTeamPage(${i + 1})">${i + 1}</button>`
          ).join("")}</nav>`
        : ""
    }<div class="panel navigation-panel"><div class="footerbuttons team-navigation"><button type="button" class="secondary" onclick="go('addons')">← ${T(
      "पीछे",
      "Back"
    )}</button><button type="button" class="secondary" onclick="proceedWithoutTeam()">${T(
      "टीम के बिना आगे बढ़ें",
      "Proceed without team"
    )}</button><button type="button" class="primary dark" onclick="go('billing')">${T(
      "आगे बढ़ें",
      "Continue"
    )} →</button></div></div></main>${summary("billing")}</div>`
  );
}
function rupeesInWords(amount) {
  if (!Number.isFinite(amount) || amount < 0) return "—";
  const ones = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const words = (n) => {
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + words(n % 10) : "");
    for (const [value, label] of [
      [10000000, "Crore"],
      [100000, "Lakh"],
      [1000, "Thousand"],
      [100, "Hundred"],
    ]) {
      if (n >= value)
        return (
          words(Math.floor(n / value)) +
          " " +
          label +
          (n % value ? " " + words(n % value) : "")
        );
    }
  };
  const paise = Math.round(amount * 100);
  return (
    "Rupees " +
    words(Math.floor(paise / 100)) +
    (paise % 100 ? " and " + words(paise % 100) + " Paise" : "") +
    " Only"
  );
}
function nextInvoiceId(rows = []) {
  let number = Number(storage.get("kryzen-invoice-sequence") || 10000000);
  const used = new Set(rows.map((row) => String(row.id)));
  do {
    number = number >= 99999999 ? 10000000 : number + 1;
  } while (used.has(String(number)));
  storage.set("kryzen-invoice-sequence", String(number));
  return String(number);
}
function savedTransactions() {
  try {
    const parsed = JSON.parse(storage.get("kryzen-transactions") || "[]");
    const original = Array.isArray(parsed) ? parsed : [];
    const rows = original.filter((row) => {
      const lastAction = Date.parse(row.lastActionAt || row.createdAt);
      return (
        orderCategory(row) !== "quotations" ||
        !Number.isFinite(lastAction) ||
        Date.now() - lastAction < 10 * 86400000
      );
    });
    let changed = rows.length !== original.length;
    if (
      c.performaInvoice &&
      original.some((row) => row.id === c.performaInvoice.id) &&
      !rows.some((row) => row.id === c.performaInvoice.id)
    ) {
      delete c.performaInvoice;
      save();
    }
    for (const row of rows) {
      if (!/^[0-9]{8}$/.test(String(row.id))) {
        const oldId = row.id;
        row.id = nextInvoiceId(rows);
        changed = true;
        if (c.performaInvoice?.id === oldId) {
          c.performaInvoice.id = row.id;
          save();
        }
      }
    }
    if (changed) storage.set("kryzen-transactions", JSON.stringify(rows));
    return rows;
  } catch {
    return [];
  }
}

function rememberTransaction(invoice) {
  const transactions = savedTransactions();
  const existing = transactions.findIndex((row) => row.id === invoice.id);
  const materialTotal = materialTotals(materialPreviewRows()).total;
  const services = selectedAddonCosts().reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const transaction = {
    id: invoice.id,
    createdAt: invoice.createdAt,
    lastActionAt:
      existing >= 0
        ? transactions[existing].lastActionAt ||
          transactions[existing].createdAt
        : new Date().toISOString(),
    product: c.product,
    span: c.span,
    bay: c.bay,
    total: materialTotal == null ? null : materialTotal + services,
    gst: materialTotals(materialPreviewRows()).gst,
    bookingAmount: 99,
    status: "unpaid",
    paidAmount: 0,
    insurance: !!c.insurance,
    teamIncluded: !!selectedTeam,
    team: selectedTeam ? teams.find((t) => t.name === selectedTeam) : null,
    quotationItems: materialPreviewRows().map((item) => ({
      name: item.name,
      spec: item.spec,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      gstPercent: item.gstPercent,
    })),
    sample: materialPreview,
    configuration: Object.fromEntries(
      Object.entries(c).filter(
        ([key]) => !["performaInvoice", "maxStep"].includes(key)
      )
    ),
  };
  if (existing < 0) transactions.unshift(transaction);
  else if (transactions[existing].status === "unpaid")
    transactions[existing] = { ...transactions[existing], ...transaction };
  storage.set("kryzen-transactions", JSON.stringify(transactions));
}
function bookMaterialNow() {
  if (
    c.gstInvoice &&
    (!$("#invoice-company-name")?.reportValidity() ||
      !$("#invoice-gst-number")?.reportValidity())
  )
    return;
  const invoice = ensurePerformaInvoice();
  touchQuotation(invoice.id);
  rememberTransaction(invoice);
  $("#booking-payment-status").textContent = T(
    "पेमेंट गेटवे अभी जुड़ा नहीं है। कोई भुगतान नहीं लिया गया और बुकिंग अभी पुष्ट नहीं हुई है।",
    "The payment gateway is not connected yet. No payment has been taken and the booking is not confirmed."
  );
}
function transactionBankDetails() {
  return `<div class="payment-bank"><div class="payment-bank-heading"><h3>${T(
    "बैंक ट्रांसफर विवरण",
    "Bank transfer details"
  )}</h3><span>NEFT / RTGS / SWIFT</span></div><dl><dt>${T(
    "खाताधारक",
    "Account holder"
  )}</dt><dd>KRYZEN TECHNOLOGIES PRIVATE LIMITED</dd><dt>${T(
    "खाते का प्रकार",
    "Account type"
  )}</dt><dd>${T("चालू खाता", "Current account")}</dd><dt>${T(
    "खाता संख्या",
    "Account number"
  )}</dt><dd class="bank-number">756505002274</dd><dt>${T(
    "IFSC कोड",
    "IFSC code"
  )}</dt><dd class="bank-number">ICIC0007565</dd></dl></div>`;
}
function ensurePerformaInvoice() {
  savedTransactions();
  const transactionKey = JSON.stringify(
    [
      "product",
      "thickness",
      "span",
      "bay",
      "cover",
      "fog",
      "drip",
      "dripper",
      "disinfection",
      "irrigation",
      "cabinSize",
      "shadowNet",
      "airFans",
      "gutterFunnel",
      "ventOpener",
      "pin",
      "transportSelected",
      "transportEstimate",
      "insurance",
      "lab",
      "dpr",
    ].map((key) => c[key] ?? null)
  );
  if (
    !c.performaInvoice ||
    !/^[0-9]{8}$/.test(c.performaInvoice.id) ||
    c.performaInvoice.transactionKey !== transactionKey
  ) {
    c.performaInvoice = {
      id: nextInvoiceId(savedTransactions()),
      createdAt: new Date().toISOString(),
      transactionKey,
    };
    save();
  }
  rememberTransaction(c.performaInvoice);
  return c.performaInvoice;
}
function invoiceBuyerDetails() {
  if (
    !c.gstInvoice ||
    !c.companyName?.trim() ||
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(c.companyGst || "")
  )
    return "";
  return `<div class="invoice-buyer"><strong>${T(
    "बिल प्राप्तकर्ता",
    "Bill to"
  )}</strong><div>${esc(c.companyName)}</div><div>GSTIN: ${esc(
    c.companyGst
  )}</div></div>`;
}
function updateGstDetails(key, input) {
  c[key] =
    key === "companyGst"
      ? input.value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 15)
      : input.value;
  if (key === "companyGst") input.value = c[key];
  save();
  const buyer = $("#invoice-buyer-slot");
  if (buyer) buyer.innerHTML = invoiceBuyerDetails();
}
function gstInvoiceForm() {
  return `<section class="gst-invoice-options"><label class="check"><input type="checkbox" ${
    c.gstInvoice ? "checked" : ""
  } onchange="change('gstInvoice',this.checked)"><span>${T(
    "मुझे अपनी फर्म या कंपनी के लिए GST इनवॉइस चाहिए।",
    "I want GST invoice for my firm or company."
  )}</span></label>${
    c.gstInvoice
      ? `<div class="fieldgrid"><div class="field"><label for="invoice-company-name">${T(
          "कंपनी का नाम",
          "Company name"
        )}</label><input id="invoice-company-name" autocomplete="organization" maxlength="160" required value="${esc(
          c.companyName || ""
        )}" oninput="updateGstDetails('companyName',this)"></div><div class="field"><label for="invoice-gst-number">${T(
          "GST नंबर",
          "GST number"
        )}</label><input id="invoice-gst-number" minlength="15" maxlength="15" pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]" required value="${esc(
          c.companyGst || ""
        )}" placeholder="27AALCK2275P1ZT" oninput="updateGstDetails('companyGst',this)"></div></div>`
      : ""
  }</section>`;
}
function invoiceReceipt() {
  const invoice = ensurePerformaInvoice();
  const rows = materialPreviewRows(),
    totals = materialTotals(rows);
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(invoice.createdAt));
  return `<section class="invoice-receipt" aria-label="Performa Invoice"><header class="invoice-company"><img src="./assets/kryzen-logo.svg" alt="Kryzen" width="110" height="36"><div><strong>Kryzen Technologies Private Limited</strong><p>Address #317,318,319, City Avenue, Wakad, PCMC, Pune, Maharashtra 411057</p><p>CIN: <b>U62099PN2024PTC233510</b> | GST: <b>27AALCK2275P1ZT</b></p></div></header><div class="invoice-title"><h2>Performa Invoice</h2><span>Date: ${date}</span></div><p class="invoice-id">PI ID : <strong>${esc(
    invoice.id
  )}</strong></p><div id="invoice-buyer-slot">${invoiceBuyerDetails()}</div>${
    materialPreview
      ? '<p class="invoice-preview">Sample items and prices for preview · Not a final tax invoice.</p>'
      : ""
  }<table class="invoice-table"><colgroup><col class="invoice-col-number"><col class="invoice-col-item"><col class="invoice-col-hsn"><col class="invoice-col-qty"><col class="invoice-col-unit"><col class="invoice-col-rate"><col class="invoice-col-tax"></colgroup><thead><tr>${[
    "Sr. No.",
    "Item",
    "HSN",
    "Qty",
    "Unit",
    "Rate",
    "GST Price",
  ]
    .map((label) => `<th scope="col">${label}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((item, index) => {
      const hasPrice =
        Number.isFinite(item.quantity) &&
        Number.isFinite(item.rate) &&
        Number.isFinite(item.gstPercent);
      const gst = hasPrice
        ? Math.round(
            (Math.round(item.quantity * item.rate * 100) * item.gstPercent) /
              100
          ) / 100
        : null;
      return `<tr><td>${index + 1}</td><td>${esc(item.name)}</td><td>${
        item.hsn ? esc(item.hsn) : "—"
      }</td><td>${
        item.quantity == null ? "—" : esc(item.quantity)
      }</td><td>${materialType(item.unit)}</td><td>${summaryAmount(
        item.rate
      )}</td><td>${summaryAmount(gst)}</td></tr>`;
    })
    .join(
      ""
    )}</tbody></table><dl class="invoice-totals"><dt>Total price</dt><dd>${summaryAmount(
    totals.subtotal
  )}</dd><dt>GST</dt><dd>${summaryAmount(
    totals.gst
  )}</dd><dt>Rounding off</dt><dd>${
    totals.rounding > 0 ? "+" : ""
  }${summaryAmount(
    totals.rounding
  )}</dd><dt class="invoice-grand-total">Total amount</dt><dd class="invoice-grand-total">${summaryAmount(
    totals.total
  )}</dd></dl><p class="invoice-words"><strong>Amount in words:</strong> ${rupeesInWords(
    totals.total
  )}</p><p class="invoice-email">Final invoice will be emailed to you at “${esc(
    c.email || "user email id"
  )}”.</p></section>`;
}
function billing() {
  return (
    heading(
      "भुगतान और रसीद",
      "Payment & receipt",
      "₹99 देकर अपनी सामग्री बुक करें। बाकी भुगतान डिस्पैच पर करें।",
      "Book your material for ₹99. Pay the rest on dispatch."
    ) +
    `<div class="layout"><main><section class="panel billing-panel">${invoiceReceipt()}<hr class="option-divider">${gstInvoiceForm()}<section class="payment-process" aria-labelledby="payment-heading"><h2 id="payment-heading">${T(
      "प्रक्रिया आगे बढ़ाने के लिए भुगतान करें",
      "Make payment to process"
    )}</h2><div class="booking-payment"><strong class="payment-amount">₹99</strong><h3>${T(
      "सिर्फ ₹99 देकर अपनी सामग्री बुक करें",
      "Book your material by paying just ₹99"
    )}</h3><p>${T(
      "बाकी भुगतान डिस्पैच पर करें।",
      "Pay the rest on dispatch."
    )}</p><p>${T(
      "डिस्पैच की जानकारी के लिए हमारी टीम आपसे संपर्क करेगी।",
      "Our team will get in touch with you for dispatch details."
    )}</p><button type="button" class="primary dark" onclick="bookMaterialNow()">${T(
      "अभी अपनी सामग्री बुक करें",
      "Book your material now"
    )} →</button><p id="booking-payment-status" role="status"></p></div></section><div class="navigation-panel"><div class="footerbuttons"><button type="button" class="secondary" onclick="go('${
      c.construction === "own" ? "addons" : "construction"
    }')">← ${T("पीछे", "Back")}</button></div></div></section></main>${summary(
      "progress"
    )}</div>`
  );
}
function progress() {
  return (
    heading(
      "आपके ऑर्डर की प्रगति",
      "Your order, step by step",
      "निर्माण से डिलीवरी तक जानकारी यहीं मिलेगी।",
      "Follow manufacturing, payment and delivery in one place."
    ) +
    `<div class="layout"><main><div class="panel"><div class="note">${T(
      "उदाहरण टाइमलाइन। अभी कोई वास्तविक ऑर्डर नहीं जुड़ा है।",
      "Example timeline. No real order is linked yet."
    )}</div><progress value="0" max="6" aria-label="Order progress"></progress><ul class="timeline">${[
      [
        T("भुगतान सत्यापन", "Payment verification"),
        T(
          "बुकिंग की रकम सत्यापित होने का इंतजार",
          "Awaiting verified booking payment"
        ),
      ],
      [
        T("निर्माण शुरू", "Manufacturing"),
        T(
          "आपकी सामग्री तैयार की जा रही है",
          "Your materials are being prepared"
        ),
      ],
      [
        T("गुणवत्ता जांच", "Quality check"),
        T("सामग्री और मात्रा की जांच", "Material and quantity checks"),
      ],
      [
        T("डिस्पैच के लिए तैयार", "Ready for dispatch"),
        T("बाकी भुगतान जमा करें", "Clear the remaining payment"),
      ],
      [
        T("डिस्पैच हो गया", "Dispatched"),
        T(
          "वाहन और ट्रैकिंग विवरण यहां दिखेंगे",
          "Vehicle and tracking details will appear here"
        ),
      ],
      [
        T("डिलीवरी", "Delivered"),
        T("डिलीवरी की पुष्टि", "Delivery confirmation"),
      ],
    ]
      .map(([h, p]) => `<li><strong>${h}</strong><p>${p}</p></li>`)
      .join("")}</ul><button class="primary dark" onclick="go('billing')">${T(
      "बिल और बाकी भुगतान देखें",
      "View bill & balance"
    )}</button></div></main>${help()}</div>`
  );
}
let accountTab = "settings",
  accountOrderFilter = "quotations";
function orderCategory(order) {
  if (
    order.paymentVerified &&
    Number.isFinite(order.total) &&
    order.total > 0 &&
    order.paidAmount >= order.total
  )
    return "completed";
  if (order.paymentVerified && order.paidAmount >= 99) return "processing";
  return "quotations";
}
function setAccountTab(tab) {
  accountTab = tab;
  render();
}
function orderTeam(order) {
  if (!order.teamIncluded) return "";
  if (!["dispatched", "delivered"].includes(order.fulfilmentStatus))
    return `<p class="order-team-notice">${T(
      "निर्माण टीम शामिल है। टीम की जानकारी सामग्री डिस्पैच होने के बाद साझा की जाएगी।",
      "Construction team included. Team details will be shared after material dispatch."
    )}</p>`;
  const team = order.team;
  return team
    ? `<div class="order-team-card"><div class="team-photo" style="--photo:${
        Number.isInteger(team.photo) && team.photo >= 0 && team.photo <= 4
          ? team.photo
          : 0
      }" role="img" aria-label="${T(
        "निर्माण टीम लीडर",
        "Construction team leader"
      )}"></div><div><strong>${T("निर्माण टीम", "Construction team")}: ${esc(
        team.name
      )}</strong><p>${esc(team.members)} ${T("सदस्य", "members")} · ${esc(
        team.city || ""
      )}</p><p>${T("संपर्क नंबर", "Contact number")}: <strong>${esc(
        team.phone || T("साझा किया जाना बाकी", "To be shared")
      )}</strong>${
        order.demoOrder && team.phone
          ? ` <small>${T("(नमूना नंबर)", "(sample number)")}</small>`
          : ""
      }</p><p>${T("संभावित आरंभ तिथि", "Tentative start date")}: <strong>${
        team.startDate
          ? esc(
              new Date(team.startDate + "T12:00:00").toLocaleDateString(
                "en-IN",
                { day: "2-digit", month: "short", year: "numeric" }
              )
            )
          : T("पुष्टि बाकी", "To be confirmed")
      }</strong></p></div></div>`
    : `<p>${T(
        "टीम की जानकारी साझा होने का इंतजार है।",
        "Awaiting construction team details."
      )}</p>`;
}
function touchQuotation(id) {
  const rows = savedTransactions();
  const order = rows.find((row) => row.id === id);
  if (order && orderCategory(order) === "quotations") {
    order.lastActionAt = new Date().toISOString();
    storage.set("kryzen-transactions", JSON.stringify(rows));
  }
}
function deleteOngoingOrder(id) {
  const rows = savedTransactions();
  const order = rows.find((row) => row.id === id);
  if (!order || orderCategory(order) !== "quotations") return;
  if (
    !window.confirm(
      T("यह जारी कोटेशन हटाएं?", "Delete this ongoing quotation?")
    )
  )
    return;
  storage.set(
    "kryzen-transactions",
    JSON.stringify(rows.filter((row) => row.id !== id))
  );
  if (c.performaInvoice?.id === id) {
    delete c.performaInvoice;
    save();
  }
  render();
}
function modifyAccountOrder(id) {
  const order = savedTransactions().find((row) => row.id === id);
  if (!order || orderCategory(order) !== "quotations") return;
  touchQuotation(id);
  if (order.kind === "individual") {
    cart = { ...(order.individualCart || {}) };
    for (const key of Object.keys(individualQuantities))
      delete individualQuantities[key];
    individualOrderId = order.id;
    storage.set("kryzen-individual-cart", JSON.stringify(cart));
    storage.set("kryzen-individual-order-id", order.id);
    go("catalogue");
    return;
  }
  const configuration = order.configuration || {
    product: order.product,
    span: order.span,
    bay: order.bay,
    insurance: order.insurance,
  };
  c = { ...c, ...configuration, maxStep: 4 };
  selectedTeam = order.teamIncluded ? order.team?.name || null : null;
  c.selectedTeam = selectedTeam;
  const transactionKey = JSON.stringify(
    [
      "product",
      "thickness",
      "span",
      "bay",
      "cover",
      "fog",
      "drip",
      "dripper",
      "disinfection",
      "irrigation",
      "cabinSize",
      "shadowNet",
      "airFans",
      "gutterFunnel",
      "ventOpener",
      "pin",
      "transportSelected",
      "transportEstimate",
      "insurance",
      "lab",
      "dpr",
    ].map((key) => c[key] ?? null)
  );
  c.performaInvoice = {
    id: order.id,
    createdAt: order.createdAt,
    transactionKey,
  };
  save();
  go("billing");
}
function seedAccountExamples() {
  if (storage.get("kryzen-order-examples-v1")) return;
  const rows = savedTransactions();
  for (let i = 0; i < 4; i++) {
    const completed = i >= 2;
    const total = 180000 + i * 45000;
    rows.push({
      id: nextInvoiceId(rows),
      createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
      product: i % 2 ? "nvph5" : "nvph65",
      span: 32,
      bay: 60,
      total,
      bookingAmount: 99,
      paidAmount: completed ? total : 99,
      paymentVerified: true,
      status: completed ? "completed" : "processing",
      fulfilmentStatus: completed ? "delivered" : "manufacturing",
      demoOrder: true,
      sample: true,
      insurance: true,
      teamIncluded: true,
      team: { name: "Sample construction team", members: 5, city: "Pune" },
      quotationItems: [
        {
          name: "Sample structure material",
          spec: "Layout demonstration",
          quantity: 100,
          unit: "nos",
          rate: total / 118,
          gstPercent: 18,
        },
      ],
    });
  }
  storage.set("kryzen-transactions", JSON.stringify(rows));
  storage.set("kryzen-order-examples-v1", "true");
}
function seedDispatchedTeamExample() {
  if (storage.get("kryzen-team-order-example-v1")) return;
  const rows = savedTransactions();
  const example = rows.find(
    (row) => row.demoOrder && orderCategory(row) === "completed"
  );
  if (!example) return;
  const start = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  rows.push({
    ...example,
    id: nextInvoiceId(rows),
    createdAt: new Date().toISOString(),
    fulfilmentStatus: "dispatched",
    teamIncluded: true,
    team: {
      name: "Vishwas Construction Team",
      members: 5,
      city: "Pune",
      photo: 0,
      phone: "+91 00000 00000",
      startDate: start,
    },
  });
  storage.set("kryzen-transactions", JSON.stringify(rows));
  storage.set("kryzen-team-order-example-v1", "true");
}
function sampleDocumentAvailable(order, kind) {
  return (
    order.demoOrder &&
    (["invoice", "quotation"].includes(kind) ||
      (orderCategory(order) === "completed" &&
        ["insurance", "fitness"].includes(kind)))
  );
}
function sampleOrderDocument(order, kind) {
  const title = {
    invoice: "Invoice",
    quotation: "Quotation",
    insurance: "Insurance certificate",
    fitness: "Fitness certificate",
  }[kind];
  return `<!doctype html><html><head><meta charset="utf-8"><title>Sample ${title}</title><style>body{font:16px Arial;margin:40px;line-height:1.6}aside{border:2px solid #a65b00;padding:16px}table{border-collapse:collapse;width:100%}td,th{padding:8px;border:1px solid #ccc}</style></head><body><h1>Sample ${title}</h1><aside>DEMONSTRATION ONLY — not an issued invoice, insurance policy or fitness certification. No coverage, inspection or payment is certified by this document.</aside><p>Order: ${esc(
    order.id
  )}</p><p>Project total: ${summaryAmount(order.total)}</p>${
    ["invoice", "quotation"].includes(kind)
      ? `<table><tr><th>Item</th><th>Qty</th><th>Rate</th><th>GST %</th></tr>${order.quotationItems
          .map(
            (item) =>
              `<tr><td>${esc(item.name)}</td><td>${
                item.quantity
              }</td><td>${summaryAmount(item.rate)}</td><td>${
                item.gstPercent
              }%</td></tr>`
          )
          .join("")}</table>`
      : "<p>This sample demonstrates the document download flow. An authorized provider must issue the actual certificate.</p>"
  }</body></html>`;
}
function orderDocuments(order, index) {
  return `<div class="order-actions">${
    orderCategory(order) === "quotations"
      ? `<button class="secondary" onclick="modifyAccountOrder(savedTransactions()[${index}].id)">${T(
          "ऑर्डर बदलें",
          "Modify order"
        )}</button><button class="secondary delete-quotation" onclick="deleteOngoingOrder(savedTransactions()[${index}].id)">${T(
          "कोटेशन हटाएं",
          "Delete quotation"
        )}</button>`
      : ""
  }${[
    ["invoice", "इनवॉइस डाउनलोड करें", "Download invoice"],
    ["quotation", "कोटेशन डाउनलोड करें", "Download quotation"],
    ["insurance", "बीमा प्रमाणपत्र", "Insurance certificate"],
    ["fitness", "फिटनेस प्रमाणपत्र", "Fitness certificate"],
  ]
    .map(([key, hi, en]) => {
      const available =
        !!order.documents?.[key] ||
        sampleDocumentAvailable(order, key) ||
        (key === "quotation" && !!order.quotationItems?.length);
      return `<button class="secondary" ${available ? "" : "disabled"} title="${
        available
          ? T(hi, en)
          : T("जारी होने के बाद उपलब्ध", "Available when issued")
      }" onclick="downloadOrderDocument(savedTransactions()[${index}].id,'${key}')">${T(
        hi,
        en
      )}</button>`;
    })
    .join("")}</div>`;
}
function downloadOrderDocument(id, kind) {
  const order = savedTransactions().find((row) => row.id === id);
  if (!order) return;
  touchQuotation(id);
  if (sampleDocumentAvailable(order, kind)) {
    const url = URL.createObjectURL(
      new Blob([sampleOrderDocument(order, kind)], {
        type: "text/html;charset=utf-8",
      })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = order.id + "-sample-" + kind + ".html";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (order.documents?.[kind]) {
    const url = new URL(order.documents[kind], location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol))
      return;
    const link = document.createElement("a");
    link.href = url.href;
    link.download = "";
    link.click();
    return;
  }
  if (kind !== "quotation" || !order.quotationItems?.length) return;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Quotation ${esc(
    order.id
  )}</title><style>body{font:14px Arial;margin:32px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left}</style></head><body><h1>Kryzen Technologies Private Limited</h1><h2>Quotation ${esc(
    order.id
  )}</h2>${
    order.sample
      ? "<p>Sample quotation for layout review. Not a final commercial quotation.</p>"
      : ""
  }<table><thead><tr><th>Item</th><th>Specification</th><th>Quantity</th><th>Unit</th><th>Rate</th><th>GST %</th></tr></thead><tbody>${order.quotationItems
    .map(
      (item) =>
        `<tr><td>${esc(item.name)}</td><td>${esc(item.spec)}</td><td>${esc(
          item.quantity ?? "—"
        )}</td><td>${esc(item.unit || "—")}</td><td>${summaryAmount(
          item.rate
        )}</td><td>${esc(item.gstPercent ?? "—")}</td></tr>`
    )
    .join("")}</tbody></table><p>Estimated project total: ${summaryAmount(
    order.total
  )}</p></body></html>`;
  const url = URL.createObjectURL(
    new Blob([html], { type: "text/html;charset=utf-8" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = order.id.replace(/[^a-z0-9-]/gi, "") + "-quotation.html";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const dispatchScreenshots = new Map();
function seedReadyOrder() {
  if (storage.get("kryzen-ready-order-v1")) return;
  const rows = savedTransactions();
  const order = rows.find(
    (row) => row.demoOrder && orderCategory(row) === "processing"
  );
  if (!order) return;
  order.fulfilmentStatus = "ready";
  storage.set("kryzen-transactions", JSON.stringify(rows));
  storage.set("kryzen-ready-order-v1", "true");
}
function dispatchBalance(order) {
  return Math.max(
    0,
    Math.round(
      (order.total - (order.paymentVerified ? order.paidAmount : 0)) * 100
    ) / 100
  );
}
function selectDispatchScreenshot(input, id) {
  const file = input.files?.[0];
  if (!file) return;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  ) {
    input.value = "";
    toast(
      T(
        "10 MB तक की PNG, JPG या WebP इमेज चुनें।",
        "Choose a PNG, JPG or WebP image up to 10 MB."
      )
    );
    return;
  }
  const previous = dispatchScreenshots.get(id);
  if (previous) URL.revokeObjectURL(previous.url);
  dispatchScreenshots.set(id, {
    name: file.name,
    url: URL.createObjectURL(file),
  });
  render();
}
function dispatchPayment(order, index) {
  const proof = dispatchScreenshots.get(order.id);
  return `<details class="dispatch-payment" ${proof ? "open" : ""}><summary>${T(
    "डिस्पैच भुगतान करें",
    "Make dispatch payment"
  )} · ${summaryAmount(
    dispatchBalance(order)
  )}</summary><dl class="transaction-amounts"><dt>${T(
    "कुल राशि",
    "Total amount"
  )}</dt><dd>${summaryAmount(order.total)}</dd><dt>${T(
    "बुकिंग भुगतान घटाएं",
    "Less booking payment"
  )}</dt><dd>−${summaryAmount(
    order.paymentVerified ? order.paidAmount : 0
  )}</dd><dt><strong>${T(
    "डिस्पैच के लिए भुगतान बाकी",
    "Dispatch payment due"
  )}</strong></dt><dd><strong>${summaryAmount(
    dispatchBalance(order)
  )}</strong></dd></dl>${transactionBankDetails()}<div class="dispatch-proof"><label for="dispatch-proof-${index}">${T(
    "भुगतान का स्क्रीनशॉट जोड़ें",
    "Add payment screenshot"
  )}</label><input id="dispatch-proof-${index}" type="file" accept="image/png,image/jpeg,image/webp" onchange="selectDispatchScreenshot(this,savedTransactions()[${index}].id)"><small>PNG / JPG / WebP · ${T(
    "अधिकतम 10 MB",
    "Up to 10 MB"
  )}</small>${
    proof
      ? `<img class="dispatch-proof-preview" src="${esc(proof.url)}" alt="${T(
          "चुना गया भुगतान स्क्रीनशॉट",
          "Selected payment screenshot"
        )}"><p>${esc(proof.name)}</p><p role="status">${T(
          "स्क्रीनशॉट इस सेशन में चुना गया है। अपलोड सेवा अभी जुड़ी नहीं है; भुगतान सत्यापित नहीं हुआ है।",
          "Screenshot selected for this session. Upload service is not connected; payment has not been verified."
        )}</p>`
      : ""
  }</div></details>`;
}
function orderGstAmount(order) {
  if (Number.isFinite(order.gst)) return order.gst;
  const lines = order.quotationItems;
  if (
    !lines?.length ||
    lines.some(
      (item) =>
        !Number.isFinite(item.quantity) ||
        !Number.isFinite(item.rate) ||
        !Number.isFinite(item.gstPercent)
    )
  )
    return null;
  return (
    lines.reduce(
      (sum, item) =>
        sum +
        Math.round(
          (Math.round(item.quantity * item.rate * 100) * item.gstPercent) / 100
        ),
      0
    ) / 100
  );
}
function dispatchPaymentDeadline(order) {
  const date = new Date(order.orderDate || order.createdAt);
  if (!Number.isFinite(date.getTime())) return "—";
  date.setUTCDate(date.getUTCDate() + 4);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
function accountOrders() {
  const all = savedTransactions(),
    rows = all.filter((order) => orderCategory(order) === accountOrderFilter);
  return `<section class="panel account-orders-panel"><div class="account-filters">${[
    ["quotations", "जारी कोटेशन", "Ongoing quotations"],
    ["processing", "प्रक्रिया में ऑर्डर", "In-process orders"],
    ["completed", "पूरे भुगतान वाले ऑर्डर", "Completed orders"],
  ]
    .map(
      ([key, hi, en]) =>
        `<button class="choice ${
          accountOrderFilter === key ? "on" : ""
        }" aria-pressed="${
          accountOrderFilter === key
        }" onclick="accountOrderFilter='${key}';render()">${T(hi, en)} <span>${
          all.filter((order) => orderCategory(order) === key).length
        }</span></button>`
    )
    .join("")}</div><p class="muted">${T(
    "बुकिंग भुगतान प्राप्त होने पर ऑर्डर प्रक्रिया में जाता है। पूरा भुगतान प्राप्त होने पर पूर्ण दिखता है।",
    "Orders move to in-process after booking payment, and completed after full payment is received."
  )}</p>${
    accountOrderFilter === "quotations"
      ? `<p class="quotation-expiry-note">${T(
          "यदि 10 दिनों तक कोई कार्रवाई नहीं की जाती है, तो कोटेशन अपने आप हटा दिया जाएगा।",
          "The quotation will be automatically deleted after 10 days if no action is taken."
        )}</p>`
      : ""
  }${
    rows.length
      ? rows
          .map((order) => {
            const p = products.find((p) => p[0] === order.product);
            const ready =
              orderCategory(order) === "processing" &&
              order.fulfilmentStatus === "ready";
            return `<article class="transaction-card ${
              ready ? "dispatch-ready-card" : ""
            }">${
              ready
                ? `<span class="dispatch-ribbon">${T(
                    "ऑर्डर डिस्पैच के लिए तैयार है",
                    "Order ready for dispatch"
                  )}</span>`
                : ""
            }<div class="order-card-header"><h3>${
              order.kind === "individual"
                ? T("अलग सामग्री ऑर्डर", "Individual material order")
                : `${p ? T(p[1], p[2]) : T("प्रोजेक्ट", "Project")} · ${esc(
                    order.span
                  )} × ${esc(order.bay)} m`
            }</h3><div class="order-total"><strong>${summaryAmount(
              order.total
            )}</strong><small>Inc. GST : (${summaryAmount(
              orderGstAmount(order)
            )})</small></div></div>${
              ready
                ? `<div class="dispatch-deadline"><strong>${T(
                    "डिस्पैच भुगतान इस तारीख से पहले करें",
                    "Make dispatch payment before"
                  )}: ${dispatchPaymentDeadline(
                    order
                  )}</strong><p class="dispatch-warning"><span aria-hidden="true">⚠</span> ${T(
                    "इस तारीख तक भुगतान प्राप्त न होने पर ऑर्डर रद्द कर दिया जाएगा।",
                    "If payment is not realised by this date, it will result in cancellation of the order."
                  )}</p></div>`
                : ""
            }<p class="invoice-id">PI ID : ${esc(
              order.id
            )} <span aria-hidden="true">|</span> ${
              orderCategory(order) === "quotations"
                ? T("कोटेशन की तारीख", "Date of quotation")
                : T("ऑर्डर की तारीख", "Date of Order")
            }: ${esc(
              new Date(order.orderDate || order.createdAt).toLocaleDateString(
                "en-IN",
                { timeZone: "Asia/Kolkata" }
              )
            )}</p><p>${T(
              "प्राप्त भुगतान",
              "Payment received"
            )}: ${summaryAmount(
              order.paymentVerified ? order.paidAmount : 0
            )}</p>${
              order.demoOrder
                ? `<p class="order-sample-label">${T(
                    "नमूना ऑर्डर",
                    "Sample order"
                  )}</p>`
                : ""
            }${orderTeam(order)}${
              ready ? dispatchPayment(order, all.indexOf(order)) : ""
            }<div class="order-card-footer">${orderDocuments(
              order,
              all.indexOf(order)
            )}</div></article>`;
          })
          .join("")
      : `<p class="account-empty">${T(
          "इस श्रेणी में अभी कोई ऑर्डर नहीं है।",
          "No orders in this category yet."
        )}</p>`
  }</section>`;
}
function accountSettings() {
  const fields = [
    ["customerName", "नाम", "Name", "text", "name"],
    ["email", "ईमेल", "Email", "email", "email"],
    ["companyName", "कंपनी का नाम", "Company name", "text", "organization"],
    ["companyGst", "GST नंबर", "GST number", "text", "off"],
    ["addressLine1", "पता लाइन 1", "Address line 1", "text", "address-line1"],
    ["addressLine2", "पता लाइन 2", "Address line 2", "text", "address-line2"],
    ["addressState", "राज्य", "State", "text", "address-level1"],
    ["addressPin", "पिन कोड", "Pin code", "text", "postal-code"],
  ];
  return `<section class="panel"><h2>${T(
    "खाता सेटिंग",
    "Account settings"
  )}</h2><form onsubmit="saveAccountSettings(event)"><fieldset class="account-type"><legend>${T(
    "मैं हूं",
    "I am"
  )}</legend>${[
    ["farmer", "किसान", "I am a farmer"],
    [
      "construction-company",
      "पॉलीहाउस निर्माण कंपनी",
      "Polyhouse construction company",
    ],
  ]
    .map(
      ([value, hi, en]) =>
        `<label><input type="radio" name="accountType" value="${value}" ${
          (c.accountType || "farmer") === value ? "checked" : ""
        }>${T(hi, en)}</label>`
    )
    .join("")}</fieldset><div class="fieldgrid">${fields
    .map(
      ([key, hi, en, type, auto]) =>
        `<div class="field"><label for="setting-${key}">${T(
          hi,
          en
        )}</label><input id="setting-${key}" name="${key}" type="${type}" autocomplete="${auto}" value="${esc(
          c[key] || ""
        )}" maxlength="${
          key === "companyGst" ? 15 : key === "addressPin" ? 6 : 160
        }" ${
          key === "companyGst"
            ? 'pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]" oninput="this.value=this.value.toUpperCase()"'
            : key === "addressPin"
            ? 'inputmode="numeric" pattern="[1-9][0-9]{5}"'
            : ""
        }></div>`
    )
    .join("")}</div><button type="submit" class="primary dark">${T(
    "जानकारी सेव करें",
    "Save details"
  )}</button><p id="settings-status" role="status"></p></form></section>`;
}
function saveAccountSettings(event) {
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  for (const key of [
    "customerName",
    "email",
    "companyName",
    "companyGst",
    "addressLine1",
    "addressLine2",
    "addressState",
    "addressPin",
  ])
    c[key] = $("#setting-" + key).value.trim();
  c.accountType = event.target.querySelector(
    'input[name="accountType"]:checked'
  ).value;
  delete c.pan;
  save();
  $("#settings-status").textContent = T(
    "जानकारी इस डिवाइस पर सेव हो गई।",
    "Details saved on this device."
  );
}
async function logOutAccount(button) {
  if (button) button.disabled = true;
  try {
    if (!CONFIGURE_OTP_TEST_MODE) {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw Error("Logout failed");
    }
    configureVerified = false;
    configureAuth = null;
    const dialog = $("#auth");
    if (dialog?.open) dialog.close();
    accountTab = "settings";
    go("configure");
    toast(T("आप लॉग आउट हो गए हैं।", "You have been logged out."));
  } catch {
    toast(
      T(
        "लॉग आउट नहीं हो सका। दोबारा कोशिश करें।",
        "Could not log out. Please try again."
      )
    );
  } finally {
    if (button) button.disabled = false;
  }
}

function account() {
  seedAccountExamples();
  seedDispatchedTeamExample();
  seedReadyOrder();
  return (
    `<div class="account-page-heading">${heading(
      "मेरा खाता",
      "My account",
      "आपके ऑर्डर, दस्तावेज और जानकारी एक जगह।",
      "Your orders, documents and details in one place."
    )}<button type="button" class="secondary account-logout" onclick="logOutAccount(this)">${T(
      "लॉग आउट",
      "Log out"
    )}</button></div>` +
    `<nav class="account-menu" aria-label="${T(
      "खाता मेनू",
      "Account menu"
    )}">${[
      ["settings", "खाता सेटिंग", "Account settings"],
      ["orders", "मेरे ऑर्डर", "My orders"],
      ["terms", "नियम और शर्तें", "Terms and Conditions"],
    ]
      .map(
        ([tab, hi, en]) =>
          `<button class="choice ${
            accountTab === tab ? "on" : ""
          }" aria-pressed="${
            accountTab === tab
          }" onclick="setAccountTab('${tab}')">${T(hi, en)}</button>`
      )
      .join("")}</nav><p class="account-local-note">${T(
      "इस डिवाइस पर सेव किए गए रिकॉर्ड। लाइव भुगतान और दस्तावेज सेवा जुड़ना बाकी है।",
      "Records saved on this device. Live payment and document services are not connected yet."
    )}</p>${
      accountTab === "settings"
        ? accountSettings()
        : accountTab === "terms"
        ? accountTerms()
        : accountOrders()
    }`
  );
}

const individualMaterials = sample.map((row, index) => ({
  id: row[0],
  hi: row[1],
  en: row[2],
  spec: row[3],
  unit: row[5],
  base: [2450, 1680, 1120, 890, 320, 125, 36][index],
  gstPercent: 18,
}));
const individualQuantities = {};
let individualOrderId = storage.get("kryzen-individual-order-id") || null;
try {
  const draft = JSON.parse(storage.get("kryzen-individual-cart") || "{}");
  cart = Object.fromEntries(
    Object.entries(draft).filter(
      ([id, n]) =>
        individualMaterials.some((item) => item.id === id) &&
        Number.isInteger(n) &&
        n > 0 &&
        n <= 9999
    )
  );
} catch {}
function individualRate(item, quantity) {
  return (
    Math.round(
      item.base * (quantity >= 100 ? 0.9 : quantity >= 10 ? 0.95 : 1) * 100
    ) / 100
  );
}
function individualRows() {
  return individualMaterials
    .filter((item) => cart[item.id])
    .map((item) => ({
      id: item.id,
      name: T(item.hi, item.en),
      spec: item.spec,
      unit: item.unit,
      quantity: cart[item.id],
      rate: individualRate(item, cart[item.id]),
      gstPercent: item.gstPercent,
    }));
}
function changeIndividualQuantity(id, value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 9999)
    return toast(
      T("1 से 9999 तक मात्रा चुनें।", "Choose a quantity from 1 to 9999.")
    );
  individualQuantities[id] = number;
  render();
}
function addCart(id) {
  if (!individualMaterials.some((item) => item.id === id)) return;
  cart[id] = individualQuantities[id] || cart[id] || 1;
  storage.set("kryzen-individual-cart", JSON.stringify(cart));
  render();
}
function removeIndividualItem(id) {
  delete cart[id];
  storage.set("kryzen-individual-cart", JSON.stringify(cart));
  render();
}
function bookIndividualMaterials() {
  const lines = individualRows(),
    totals = materialTotals(lines);
  if (!lines.length || totals.total < 99) return;
  const orders = savedTransactions();
  let index = orders.findIndex(
    (order) =>
      order.id === individualOrderId &&
      order.kind === "individual" &&
      orderCategory(order) === "quotations"
  );
  const previous = index >= 0 ? orders[index] : null;
  const now = new Date().toISOString();
  const order = {
    id: previous?.id || nextInvoiceId(orders),
    kind: "individual",
    createdAt: previous?.createdAt || now,
    lastActionAt: now,
    total: totals.total,
    subtotal: totals.subtotal,
    gst: totals.gst,
    rounding: totals.rounding,
    bookingAmount: 99,
    paidAmount: 0,
    paymentVerified: false,
    status: "unpaid",
    teamIncluded: false,
    insurance: false,
    sample: true,
    quotationItems: lines,
    individualCart: { ...cart },
  };
  if (index >= 0) orders[index] = order;
  else orders.unshift(order);
  individualOrderId = order.id;
  storage.set("kryzen-transactions", JSON.stringify(orders));
  storage.set("kryzen-individual-order-id", order.id);
  $("#individual-booking-status").textContent = T(
    "ऑर्डर मेरे खाते में सेव हो गया। पेमेंट गेटवे अभी जुड़ा नहीं है; कोई भुगतान नहीं लिया गया।",
    "Order saved in My Account. The payment gateway is not connected; no payment has been taken."
  );
}
function catalogue() {
  const rows = individualRows(),
    totals = materialTotals(rows);
  return (
    heading(
      "अलग से सामग्री खरीदें",
      "Individual materials",
      "अपनी जरूरत की सामग्री और मात्रा चुनें।",
      "Choose the materials and quantities you need."
    ) +
    `<p class="catalogue-preview">${T(
      "नमूना मूल्य और GST · लाइव कैटलॉग जुड़ना बाकी है।",
      "Sample prices and GST · Live catalogue pending."
    )}</p><div class="layout individual-layout"><main><div class="individual-grid">${individualMaterials
      .map((item) => {
        const quantity = individualQuantities[item.id] || cart[item.id] || 1;
        return `<article class="individual-card">${itemPhoto(
          item.id,
          T(item.hi, item.en)
        )}<h3>${T(item.hi, item.en)}</h3><p>${esc(
          item.spec
        )}</p><div class="individual-tiers">${[1, 10, 100]
          .map(
            (n) =>
              `<div class="${
                (quantity >= 100 ? 100 : quantity >= 10 ? 10 : 1) === n
                  ? "active"
                  : ""
              }"><span>${T(
                n + " खरीदें",
                "Buy " + n + " at"
              )}</span><strong>${money(individualRate(item, n))}</strong></div>`
          )
          .join("")}</div><small>${T(
          "प्रति इकाई दर · GST अलग",
          "Per-unit rate · GST extra"
        )} · ${materialType(
          item.unit
        )}</small><div class="individual-controls"><button type="button" aria-label="${T(
          "मात्रा घटाएं",
          "Decrease quantity"
        )} ${esc(T(item.hi, item.en))}" onclick="changeIndividualQuantity('${
          item.id
        }',${quantity - 1})" ${
          quantity === 1 ? "disabled" : ""
        }>−</button><input type="number" min="1" max="9999" value="${quantity}" aria-label="${esc(
          T(item.hi, item.en)
        )} quantity" onchange="changeIndividualQuantity('${
          item.id
        }',this.value)"><button type="button" aria-label="${T(
          "मात्रा बढ़ाएं",
          "Increase quantity"
        )} ${esc(T(item.hi, item.en))}" onclick="changeIndividualQuantity('${
          item.id
        }',${quantity + 1})" ${
          quantity === 9999 ? "disabled" : ""
        }>+</button></div><button type="button" class="primary dark" onclick="addCart('${
          item.id
        }')">ADD${
          cart[item.id] ? " · " + cart[item.id] : ""
        }</button></article>`;
      })
      .join(
        ""
      )}</div></main><aside class="project-sidebar"><section class="summary"><div class="inner"><h2>${T(
      "आपकी सामग्री",
      "Your materials"
    )}</h2>${
      rows.length
        ? `<ul class="individual-cart">${rows
            .map(
              (item) =>
                `<li><div><strong>${esc(item.name)}</strong><small>${
                  item.quantity
                } ${materialType(item.unit)} × ${money(
                  item.rate
                )}</small></div><button type="button" aria-label="${T(
                  "हटाएं",
                  "Remove"
                )} ${esc(item.name)}" onclick="removeIndividualItem('${
                  item.id
                }')">×</button></li>`
            )
            .join("")}</ul>`
        : `<p>${T(
            "शुरू करने के लिए सामग्री जोड़ें।",
            "Add materials to get started."
          )}</p>`
    }<div class="total"><dl><dt>${T(
      "कुल कीमत",
      "Total price"
    )}</dt><dd>${summaryAmount(
      totals.subtotal
    )}</dd><dt>GST</dt><dd>${summaryAmount(totals.gst)}</dd><dt>${T(
      "राउंडिंग ऑफ",
      "Rounding off"
    )}</dt><dd>${summaryAmount(totals.rounding)}</dd><dt><strong>${T(
      "कुल राशि",
      "Total amount"
    )}</strong></dt><dd><strong>${summaryAmount(
      totals.total
    )}</strong></dd></dl></div><button type="button" class="primary" onclick="bookIndividualMaterials()" ${
      !rows.length || totals.total < 99 ? "disabled" : ""
    }>${T("₹99 देकर बुक करें", "Book with ₹99")} →</button><p>${T(
      "बाकी भुगतान डिस्पैच पर करें।",
      "Pay the rest on dispatch."
    )}</p>${
      rows.length && totals.total < 99
        ? `<p>${T(
            "₹99 की बुकिंग के लिए कम से कम ₹99 की सामग्री जोड़ें।",
            "Add at least ₹99 of materials to book with ₹99."
          )}</p>`
        : ""
    }<p id="individual-booking-status" role="status"></p><a href="#account">${T(
      "मेरे ऑर्डर देखें",
      "View my orders"
    )} →</a></div></section>${help()}</aside></div>`
  );
}

// Temporary local UI testing; set false to use server-verified WhatsApp OTP.
const CONFIGURE_OTP_TEST_MODE = true;
let configureAuth = null;
let configureVerified = false;
function openConfigureLogin() {
  configureAuth = {
    mode: "signup",
    name: "",
    phone: "",
    challenge: null,
    busy: false,
    error: "",
    retryAt: 0,
  };
  drawConfigureLogin();
  const dialog = $("#auth");
  dialog.onclose = () => {
    configureAuth = null;
  };
  dialog.showModal();
}
function drawConfigureLogin() {
  const state = configureAuth;
  if (!state) return;
  const otp = !!state.challenge;
  $("#auth").setAttribute("aria-labelledby", "configure-login-title");
  $(
    "#auth"
  ).innerHTML = `<button type="button" class="close" aria-label="Close" onclick="document.querySelector('#auth').close()">×</button><h2 id="configure-login-title">${T(
    "अपनी प्रगति और जानकारी सेव करने के लिए लॉगिन करें",
    "Login to save your progress and information"
  )}</h2>${
    otp
      ? `<p>${
          CONFIGURE_OTP_TEST_MODE
            ? T(
                "टेस्ट मोड: कोई भी 4 अंक डालें। WhatsApp संदेश नहीं भेजा जाएगा।",
                "Test mode: enter any four digits. No WhatsApp message is sent."
              )
            : T(
                "WhatsApp पर भेजा गया 4 अंकों का OTP डालें।",
                "Enter the four-digit OTP sent to your WhatsApp."
              )
        }</p>`
      : ""
  }<form id="configure-auth-form">${
    otp
      ? `<p class="auth-phone">+91 ${esc(
          state.phone
        )}</p><div class="field"><label for="configure-otp">OTP</label><input id="configure-otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{4}" minlength="4" maxlength="4" placeholder="0000" required ${
          state.busy ? "disabled" : ""
        }></div>`
      : `${
          state.mode === "signup"
            ? `<div class="field"><label for="configure-name">${T(
                "नाम",
                "Name"
              )}</label><input id="configure-name" autocomplete="name" minlength="2" maxlength="100" value="${esc(
                state.name
              )}" required ${state.busy ? "disabled" : ""}></div>`
            : ""
        }<div class="field"><label for="configure-phone">${T(
          "मोबाइल नंबर",
          "Mobile number"
        )} (+91)</label><input id="configure-phone" type="tel" inputmode="numeric" autocomplete="tel-national" pattern="[6-9][0-9]{9}" maxlength="10" value="${esc(
          state.phone
        )}" placeholder="9876543210" required ${
          state.busy ? "disabled" : ""
        }></div>`
  }<p class="auth-error" role="alert">${esc(
    state.error
  )}</p><button type="submit" class="primary dark" ${
    state.busy ? "disabled" : ""
  }>${
    state.busy
      ? T("कृपया प्रतीक्षा करें…", "Please wait…")
      : otp
      ? T("सत्यापित करें और आगे बढ़ें", "Verify & continue")
      : T("WhatsApp पर OTP भेजें", "Send OTP on WhatsApp")
  }</button></form><button type="button" class="smalllink" ${
    state.busy ? "disabled" : ""
  } onclick="switchConfigureLogin()">${
    otp
      ? T("नंबर बदलें / नया OTP भेजें", "Change number / request new OTP")
      : state.mode === "signup"
      ? T("पहले से खाता है?", "Already have an account?")
      : T("नया खाता बनाएं", "Create an account")
  }</button>`;
  $("#configure-auth-form").onsubmit = submitConfigureLogin;
}
function switchConfigureLogin() {
  const state = configureAuth;
  if (!state || state.busy) return;
  if (state.challenge) state.challenge = null;
  else {
    state.phone = $("#configure-phone").value.trim();
    if (state.mode === "signup") {
      state.name = $("#configure-name").value.trim();
    }
    state.mode = state.mode === "signup" ? "login" : "signup";
  }
  state.error = "";
  drawConfigureLogin();
}
async function authPost(path, body) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 422
      )
        throw Error(
          T(
            "जानकारी या OTP सही नहीं है या उसकी अवधि समाप्त हो गई है।",
            "The details or OTP are invalid or expired."
          )
        );
      if (response.status === 429)
        throw Error(
          T(
            "बहुत अधिक प्रयास। थोड़ी देर बाद कोशिश करें।",
            "Too many attempts. Please try again later."
          )
        );
      throw Error(
        T(
          "WhatsApp OTP सेवा अभी उपलब्ध नहीं है।",
          "The WhatsApp OTP service is not available yet."
        )
      );
    }
    try {
      return await response.json();
    } catch {
      throw Error(
        T(
          "OTP सेवा से सही उत्तर नहीं मिला।",
          "The OTP service did not return a valid response."
        )
      );
    }
  } catch (error) {
    if (error.name === "AbortError" || error instanceof TypeError)
      throw Error(
        T(
          "कनेक्शन नहीं हो सका। दोबारा कोशिश करें।",
          "Could not connect. Please try again."
        )
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
async function submitConfigureLogin(event) {
  event.preventDefault();
  const state = configureAuth;
  if (!state || state.busy) return;
  if (!$("#configure-auth-form").reportValidity()) return;
  const verifying = !!state.challenge;
  let code = "";
  if (verifying) {
    code = $("#configure-otp").value.trim();
    if (!/^[0-9]{4}$/.test(code)) return;
  } else {
    state.phone = $("#configure-phone").value.trim();
    if (!/^[6-9][0-9]{9}$/.test(state.phone)) return;
    if (state.mode === "signup") {
      state.name = $("#configure-name").value.trim();
      if (state.name.length < 2) {
        state.error = T("अपना पूरा नाम डालें।", "Enter your name.");
        drawConfigureLogin();
        return;
      }
    }
    if (Date.now() < state.retryAt) {
      state.error = T(
        "नया OTP भेजने से पहले थोड़ी देर प्रतीक्षा करें।",
        "Please wait before requesting another OTP."
      );
      drawConfigureLogin();
      return;
    }
  }
  if (CONFIGURE_OTP_TEST_MODE) {
    if (!verifying) {
      state.challenge = "local-test";
      state.error = "";
      drawConfigureLogin();
      $("#configure-otp")?.focus();
    } else {
      configureVerified = true;
      save();
      $("#auth").close();
      configureAuth = null;
      go("materials");
    }
    return;
  }
  state.busy = true;
  state.error = "";
  drawConfigureLogin();
  try {
    if (!verifying) {
      const result = await authPost("/api/auth/otp/request", {
        phone: "+91" + state.phone,
        channel: "whatsapp",
        locale: lang,
        mode: state.mode,
        ...(state.mode === "signup" ? { name: state.name } : {}),
      });
      if (configureAuth !== state) return;
      if (typeof result.challengeId !== "string" || !result.challengeId)
        throw Error(
          T(
            "OTP भेजने की पुष्टि नहीं मिली।",
            "The service did not confirm the OTP request."
          )
        );
      state.challenge = result.challengeId;
      state.retryAt =
        Date.now() +
        Math.max(30, Number(result.resendAfterSeconds) || 30) * 1000;
    } else {
      const result = await authPost("/api/auth/otp/verify", {
        challengeId: state.challenge,
        code,
        configuration: { ...c },
      });
      if (configureAuth !== state) return;
      if (result.verified !== true || result.progressSaved !== true)
        throw Error(
          T(
            "सत्यापन और प्रगति सेव होने की पुष्टि नहीं मिली।",
            "Verification and saved progress were not confirmed."
          )
        );
      configureVerified = true;
      if (typeof result.user?.email === "string") c.email = result.user.email;
      save();
      $("#auth").close();
      configureAuth = null;
      go("materials");
      return;
    }
  } catch (error) {
    if (configureAuth === state) state.error = error.message;
  } finally {
    if (configureAuth === state) {
      state.busy = false;
      drawConfigureLogin();
      if (state.challenge) $("#configure-otp")?.focus();
    }
  }
}
function openAuth(mode) {
  authMode = mode;
  const d = $("#auth");
  d.innerHTML = `<button class="close" aria-label="Close" onclick="document.querySelector('#auth').close()">×</button><div class="eyebrow">KRYZEN • WHATSAPP</div><h2 style="margin-top:15px">${
    mode === "callback"
      ? T("हमारी टीम से बात करें", "Talk to our team")
      : T("अपना चुनाव सेव करें", "Save your farm plan")
  }</h2><p>${T(
    "नाम और WhatsApp नंबर से शुरू करें।",
    "Start with your name and WhatsApp number."
  )}</p><form id="authform"><div class="field"><label for="customername">${T(
    "आपका नाम",
    "Your name"
  )}</label><input id="customername" autocomplete="name" required minlength="2"></div><div class="field"><label for="phone">${T(
    "WhatsApp नंबर",
    "WhatsApp number"
  )}</label><input id="phone" type="tel" autocomplete="tel-national" inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" placeholder="98765 43210" required></div><div class="field"><label for="pin">${T(
    "खेत का पिनकोड",
    "Farm pincode"
  )}</label><input id="pin" inputmode="numeric" pattern="[1-9][0-9]{5}" maxlength="6" value="${esc(
    c.pin || ""
  )}" required></div><label class="check"><input type="checkbox" id="contactconsent"><span>${T(
    "इस प्रोजेक्ट के बारे में कॉल या WhatsApp पर सहायता चाहिए।",
    "I would like a call or WhatsApp assistance for this project."
  )}</span></label><button class="primary dark" type="submit">${T(
    "WhatsApp पर OTP पाएं",
    "Get OTP on WhatsApp"
  )} →</button></form><div class="note">${T(
    "समीक्षा संस्करण: OTP सेवा अभी जुड़ी नहीं है। आपकी निजी जानकारी भेजी या सेव नहीं होगी।",
    "Review version: OTP service is not connected. Personal details will not be sent or saved."
  )}</div><button class="smalllink" onclick="document.querySelector('#auth').close();go('${
    mode === "quote" ? "materials" : "account"
  }')">${T(
    "बिना साइन इन के उदाहरण देखें",
    "Explore the preview without signing in"
  )}</button>`;
  d.showModal();
  $("#authform").onsubmit = (e) => {
    e.preventDefault();
    toast(
      T(
        "OTP सेवा अभी उपलब्ध नहीं है। कॉल बटन से टीम से संपर्क करें।",
        "OTP service is not connected yet. Use the call button to contact the team."
      )
    );
  };
}
const promotions = [
  {
    image: "product-nvph65.png",
    theme: "scale",
    title: "India’s biggest protected cultivation manufacturer!",
    accent: "Built for bigger possibilities",
  },
  {
    image: "product-fanpad.png",
    theme: "spotlight",
    title: "We are a Shark Tank proven business.",
    detail: "Watch us on Shark Tank!",
    accent: "In the spotlight",
  },
  {
    image: "item-49.png",
    theme: "quality",
    title: "Get every product with a fitness certificate and warranty.",
    accent: "Confidence in every component",
  },
  {
    image: "product-nvph5.png",
    theme: "complete",
    title: "One-stop solution: from material to construction.",
    detail: "No middleman. Direct benefit transfer.",
    accent: "Your farm. Our complete support.",
  },
  {
    image: "product-polytunnel.png",
    theme: "design",
    title: "All designs approved by NHB and IIT.",
    accent: "Designed with confidence",
  },
];
let cleanupPromotions = () => {};
let promotionIndex = 0;
let promotionPaused = false;
function promotionSlider() {
  return `<section class="mobile-promotions" aria-roledescription="carousel" aria-label="${T(
    "Kryzen की विशेषताएं",
    "Kryzen promotions"
  )}"><div class="promotion-track" tabindex="0" aria-label="${T(
    "बैनर देखने के लिए स्वाइप करें",
    "Swipe to explore banners"
  )}">${promotions
    .map(
      (promo, i) =>
        `<article class="promotion-slide promotion-${
          promo.theme
        }" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${
          promotions.length
        }" lang="en"><picture><source media="(max-width: 740px)" srcset="./assets/${
          promo.image
        }"><img class="promotion-image" alt="" width="3840" height="1000" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="></picture><div class="promotion-copy"><span class="promotion-eyebrow">${
          promo.accent
        }</span><h2>${promo.title}</h2>${
          promo.detail ? `<p>${promo.detail}</p>` : ""
        }</div><span class="promotion-number" aria-hidden="true">0${
          i + 1
        }</span></article>`
    )
    .join(
      ""
    )}</div><div class="promotion-controls"><span class="promotion-count" aria-live="off"></span><div class="promotion-dots">${promotions
    .map(
      (_, i) =>
        `<button type="button" data-slide="${i}" aria-label="${T(
          "बैनर",
          "Banner"
        )} ${i + 1}"></button>`
    )
    .join(
      ""
    )}</div><button class="promotion-toggle" type="button"></button></div></section>`;
}
function setupPromotions() {
  cleanupPromotions();
  const root = document.querySelector(".mobile-promotions");
  if (!root) return;
  const track = root.querySelector(".promotion-track");
  const dots = [...root.querySelectorAll("[data-slide]")];
  const toggle = root.querySelector(".promotion-toggle");
  const mobile = window.matchMedia("(max-width: 740px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let touching = false;
  function updateControls() {
    dots.forEach((dot, i) =>
      dot.setAttribute("aria-current", String(i === promotionIndex))
    );
    root.querySelector(".promotion-count").textContent = `${
      promotionIndex + 1
    } / ${promotions.length}`;
    toggle.textContent = promotionPaused ? "▶" : "Ⅱ";
    toggle.setAttribute(
      "aria-label",
      promotionPaused
        ? T("बैनर चलाएं", "Play banners")
        : T("बैनर रोकें", "Pause banners")
    );
    toggle.setAttribute("aria-pressed", String(promotionPaused));
    toggle.hidden = reduced.matches;
  }
  function show(index, smooth = true) {
    promotionIndex = (index + promotions.length) % promotions.length;
    track.scrollTo({
      left: promotionIndex * track.clientWidth,
      behavior: smooth && !reduced.matches ? "smooth" : "instant",
    });
    updateControls();
  }
  dots.forEach((dot, i) =>
    dot.addEventListener("click", () => {
      promotionPaused = true;
      show(i);
    })
  );
  toggle.addEventListener("click", () => {
    promotionPaused = !promotionPaused;
    updateControls();
  });
  track.addEventListener(
    "scroll",
    () => {
      if (!track.clientWidth) return;
      promotionIndex = Math.round(track.scrollLeft / track.clientWidth);
      updateControls();
    },
    { passive: true }
  );
  track.addEventListener("pointerdown", () => {
    touching = true;
  });
  track.addEventListener("pointerup", () => {
    touching = false;
  });
  track.addEventListener("pointercancel", () => {
    touching = false;
  });
  track.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    promotionPaused = true;
    show(promotionIndex + (event.key === "ArrowRight" ? 1 : -1));
  });
  const resize = () => show(promotionIndex, false);
  window.addEventListener("resize", resize);
  reduced.addEventListener("change", updateControls);
  const timer = window.setInterval(() => {
    if (
      mobile.matches &&
      !reduced.matches &&
      !promotionPaused &&
      !touching &&
      !document.hidden &&
      !root.matches(":focus-within")
    )
      show(promotionIndex + 1);
  }, 6000);
  show(promotionIndex, false);
  cleanupPromotions = () => {
    window.clearInterval(timer);
    window.removeEventListener("resize", resize);
    reduced.removeEventListener("change", updateControls);
  };
}
function render() {
  document.documentElement.lang = lang;
  document.title = T(
    "Kryzen | अपना पॉलीहाउस बनाएं",
    "Kryzen | Build your polyhouse"
  );
  let r = route();
  if (r === "order") {
    r = "construction";
    location.hash = r;
  }
  if (r === "construction" && c.construction === "own") {
    r = "billing";
    location.hash = r;
  }
  if (pages.indexOf(r) > Number(c.maxStep || 0)) {
    r = pages[Math.min(Number(c.maxStep || 0), pages.length - 1)];
    location.hash = r;
  }
  const view =
    {
      configure,
      materials,
      addons,
      construction,
      billing,
      progress,
      account,
      catalogue,
      about,
      faq,
      career,
      whychooseus: whyChooseUs,
    }[r] || configure;
  $(
    "#app"
  ).innerHTML = `<div class="announcement" role="region" aria-label="${T(
    "हमारी विशेषता",
    "Our promise"
  )}"><div class="announcement-window"><div class="announcement-track">${[
    false,
    true,
  ]
    .map(
      (copy) =>
        `<div class="announcement-group"${
          copy ? ' aria-hidden="true"' : ""
        }><strong lang="en">India's first and only 100% transparent protected cultivation system supplier!</strong><span aria-hidden="true">✦</span><strong lang="en">Book order by paying only Rs. 99 and pay rest on time of dispatch</strong><span aria-hidden="true">✦</span><strong lang="en">India's only manufacturer with 100% third party fitness certificate provider.</strong><span aria-hidden="true">✦</span><strong lang="en">Delivery across India with 100% invoice insurance.</strong><span aria-hidden="true">✦</span><strong lang="hi">भारत का पहला और एकमात्र 100% पारदर्शी संरक्षित खेती प्रणाली आपूर्तिकर्ता!</strong><span aria-hidden="true">✦</span></div>`
    )
    .join(
      ""
    )}</div></div></div><header><div class="brand"><a href="#configure" class="logo" aria-label="Kryzen"><img src="./assets/kryzen-logo.svg" alt="Kryzen" width="150" height="44"></a><div class="brand-stat" lang="en"><strong>435+ Acres</strong><small>Material supplied</small></div></div><nav class="nav"><a class="desktop" href="#configure">${T(
    "सिस्टम बनाएं",
    "Build your system"
  )}</a><a class="desktop" href="#catalogue">${T(
    "अलग सामग्री",
    "Buy materials"
  )}</a><a class="about-nav" href="#about">About us</a><button class="lang" onclick="toggleLanguage()">${
    lang === "hi" ? "English" : "हिन्दी"
  } ⇄</button><button class="account-button" type="button" onclick="go('account')" aria-label="${T(
    "मेरा खाता",
    "My account"
  )}" title="${T(
    "मेरा खाता",
    "My account"
  )}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2" stroke-linecap="round"/></svg></button></nav></header><div class="topnotice"><span>${T(
    "सीधे सामग्री खरीदें। अपनी पसंद का फार्म बनाएं।",
    "Buy materials directly. Build the farm you have in mind."
  )}</span><span>${T(
    "कीमतें अपडेट की गईं: ",
    "Prices updated as per "
  )}${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date())}</span></div>${promotionSlider()}${
    r === "configure"
      ? `<div class="wholesale-hero"><span>${T(
          "थोक दरें",
          "Wholesale rates"
        )}</span><strong>${T(
          "सीधे निर्माता से",
          "directly from manufacturer"
        )}</strong><small>${T(
          "बिचौलियों के मार्जिन के बिना पारदर्शी सामग्री खरीद",
          "Transparent material buying without middleman margins"
        )}</small></div>`
      : ""
  }${
    pages.includes(r)
      ? `<nav class="stepbar" aria-label="Purchase steps">${pages
          .map(
            (p, i) =>
              `<div style="${
                p === "construction" && c.construction === "own"
                  ? "display:none"
                  : ""
              }" class="step ${r === p ? "active" : ""}" ${
                r === p ? 'aria-current="step"' : ""
              }><span>${i + 1}</span>${names()[i]}</div>`
          )
          .join("")}</nav>`
      : ""
  }<div class="wrap">${view()}</div>${detailedFooter()}<a class="supportfloat" href="tel:+919870424425">☎ ${T(
    "मदद चाहिए?",
    "Need help?"
  )}</a>`;
  setupPromotions();
  startPurchaseSamples();
}
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo(0, 0);
});
render();
if (document.modelContext?.registerTool) {
  document.modelContext.registerTool({
    name: "read_farm_configuration",
    description:
      "Read the current device-local farm configuration. Does not create a quotation or order.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: () => ({ ...c, areaM2: area(), livePricingAvailable: false }),
  });
}
