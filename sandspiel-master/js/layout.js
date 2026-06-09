// Fill the whole viewport with the simulation and overlay the UI on top.
// The grid resolution itself is sized to the window aspect ratio in index.js,
// so the canvas can simply stretch to 100% without distortion.
let resize = () => {
  const canvas = document.getElementById("sand-canvas");
  const canvas2 = document.getElementById("fluid-canvas");
  const ui = document.getElementById("ui");

  if (!canvas || !canvas2 || !ui) return;

  const fill =
    "position:absolute; top:0; left:0; width:100%; height:100%; max-width:none; margin:0;";
  // sand canvas on top (z-index 2); its transparent empty cells let the fluid
  // (smoke/wind) canvas show through from behind (z-index 1).
  canvas.style = fill + " z-index:2;";
  canvas2.style = fill + " z-index:1;";

  // UI overlays the top-right corner as a compact, wrapping panel.
  ui.style =
    "position:absolute; top:0; right:0; width:210px; margin:0; z-index:10;";

  let btnHeight = ui.getBoundingClientRect().height;
  const pullTabContent = document.getElementById("PullTabContent");
  if (pullTabContent) pullTabContent.style.top = btnHeight + "px";
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", resize);
} else {
  resize();
}
window.addEventListener("deviceorientation", resize, true);
window.addEventListener("resize", resize);
