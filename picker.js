function getLuminance(r, g, b) {
  const [R, G, B] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function getContrast(l1, l2) {
  const [a, b] = [l1, l2].sort((x, y) => y - x);
  return ((a + 0.05) / (b + 0.05)).toFixed(2);
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const imgData = urlParams.get("img");
  const canvas = document.getElementById("screenshot");
  const ctx = canvas.getContext("2d");
  const info = document.getElementById("info");
  const resultTable = document.getElementById("resultTable");

  let pinCount = 1;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  };
  img.src = imgData;

  canvas.addEventListener("mousemove", (e) => {
    const [r, g, b] = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
    const hex = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join("")}`;
    info.innerHTML = `<div><strong>預覽 RGB:</strong> (${r}, ${g}, ${b})</div><div><strong>HEX:</strong> ${hex}</div>`;
  });

  canvas.addEventListener("click", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join("");
    const lum = getLuminance(r, g, b);
    const contrastBlack = getContrast(lum, 0);
    const contrastWhite = getContrast(lum, 1);

    navigator.clipboard.writeText(hex);

    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "red";
    ctx.fillText(pinCount, x + 6, y - 6);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${pinCount}</td>
      <td>${hex}</td>
      <td>(${r}, ${g}, ${b})</td>
      <td>${contrastBlack}</td>
      <td>${contrastWhite}</td>
    `;
    resultTable.appendChild(row);
    pinCount++;
  });
});