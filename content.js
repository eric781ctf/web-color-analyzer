// 是否啟動分析模式
let analyzerMode = false;
// 畫面上顯示的資訊框
let overlayBox = null;

// 監聽來自 background/popup 的訊息，切換分析模式
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.toggle === "analyzer") {
    analyzerMode = !analyzerMode; // 切換模式
    document.body.style.cursor = analyzerMode ? "crosshair" : "default"; // 改變游標
    if (!analyzerMode && overlayBox) overlayBox.remove(); // 關閉時移除資訊框
    sendResponse({ status: analyzerMode }); // 回傳目前狀態
  }
});

// 點擊頁面時，若啟動分析模式則分析顏色
document.body.addEventListener("click", function (e) {
  if (!analyzerMode) return; // 未啟動則不處理
  e.preventDefault(); // 阻止預設行為

  const el = e.target; // 取得被點擊的元素
  const style = window.getComputedStyle(el); // 取得元素的計算後樣式
  const bg = style.backgroundColor; // 背景色
  const fg = style.color; // 文字色

  const bgRGB = parseRGB(bg); // 解析為 RGB 陣列
  const fgRGB = parseRGB(fg);

  const contrast = getContrast(bgRGB, fgRGB); // 計算對比比率
  const status = contrast >= 4.5 ? "✅ AA 合格" : "❌ 不合格"; // 判斷是否通過 AA

  if (overlayBox) overlayBox.remove(); // 移除舊的資訊框
  overlayBox = showOverlay(el, bg, fg, contrast.toFixed(2), status); // 顯示新的資訊框
});

// 將 rgb() 字串轉為 [r, g, b] 陣列
function parseRGB(rgbStr) {
  const result = /rgb\((\d+), (\d+), (\d+)\)/.exec(rgbStr);
  return result ? result.slice(1, 4).map(Number) : [255, 255, 255];
}

// 顯示資訊框於指定元素上方
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

  // 計算位置，顯示在元素上方
  const rect = el.getBoundingClientRect();
  box.style.top = `${window.scrollY + rect.top - 80}px`;
  box.style.left = `${window.scrollX + rect.left}px`;

  // 複製 HEX 按鈕功能
  const copyBtn = box.querySelector("#copyBtn");
  copyBtn.addEventListener("click", () => {
    const hex = rgbToHex(...parseRGB(fg));
    navigator.clipboard.writeText(hex);
    copyBtn.innerText = "✅ 已複製";
    setTimeout(() => (copyBtn.innerText = "📋 複製 HEX"), 1000);
  });

  return box;
}

// 將 RGB 轉為 HEX 字串
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join("");
}

// === wcag.js ===
// 計算相對亮度
function luminance([r, g, b]) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// 計算兩色對比比率
function getContrast(rgb1, rgb2) {
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}