document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("activate");
  const message = document.getElementById("message");

  if (!button || !message) return;

  button.addEventListener("click", () => {
    message.textContent = "請稍候… 正在擷取畫面。完成後將跳轉到新分頁進行取色操作。";

    chrome.runtime.sendMessage({ type: "CAPTURE_SCREEN" }, (res) => {
      if (chrome.runtime.lastError) {
        message.textContent = "❌ 擷取失敗：" + chrome.runtime.lastError.message;
        return;
      }
      const url = chrome.runtime.getURL("picker.html?img=" + encodeURIComponent(res.image));
      chrome.tabs.create({ url });
    });
  });
});