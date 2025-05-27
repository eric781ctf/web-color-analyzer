let analyzerMode = false;
let overlayBox = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.toggle === "analyzer") {
    analyzerMode = !analyzerMode;
    document.body.style.cursor = analyzerMode ? "crosshair" : "default";
    if (!analyzerMode && overlayBox) overlayBox.remove();
    sendResponse({ status: analyzerMode });
  }
});

document.body.addEventListener("click", function (e) {
  if (!analyzerMode) return;
  e.preventDefault();

  const el = e.target;
  const style = window.getComputedStyle(el);
  const bg = style.backgroundColor;
  const fg = style.color;

  const bgRGB = parseRGB(bg);
  const fgRGB = parseRGB(fg);

  const contrast = getContrast(bgRGB, fgRGB);
  const status = contrast >= 4.5 ? "✅ AA 合格" : "❌ 不合格";

  if (overlayBox) overlayBox.remove();
  overlayBox = showOverlay(el, bg, fg, contrast.toFixed(2), status);
});

function parseRGB(rgbStr) {
  const result = /rgb\((\d+), (\d+), (\d+)\)/.exec(rgbStr);
  return result ? result.slice(1, 4).map(Number) : [255, 255, 255];
}

function showOverlay(el, bg, fg, contrast, status) {
  const box = document.createElement("div");
  box.className = "color-analyzer-overlay";
  box.innerHTML = `
    <div><strong>背景色:</strong> ${bg}</div>
    <div><strong>文字色:</strong> ${fg}</div>
    <div><strong>對比比率:</strong> ${contrast}</div>
    <div><strong>結果:</strong> ${status}</div>
    <button id="copyBtn">📋 複製 HEX</button>
  `;
  document.body.appendChild(box);

  const rect = el.getBoundingClientRect();
  box.style.top = `${window.scrollY + rect.top - 80}px`;
  box.style.left = `${window.scrollX + rect.left}px`;

  const copyBtn = box.querySelector("#copyBtn");
  copyBtn.addEventListener("click", () => {
    const hex = rgbToHex(...parseRGB(fg));
    navigator.clipboard.writeText(hex);
    copyBtn.innerText = "✅ 已複製";
    setTimeout(() => (copyBtn.innerText = "📋 複製 HEX"), 1000);
  });

  return box;
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join("");
}

// === wcag.js ===
function luminance([r, g, b]) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(rgb1, rgb2) {
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}