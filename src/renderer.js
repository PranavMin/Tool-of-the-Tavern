/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import "./index.css";
import { extractSlug } from "./util.js";
import { getTop8 } from "./api.js";

// removed automatic fetch-on-load and add UI to fetch/render on button click
const STARTGG_URL = "";

// input for user to paste start.gg link
const input = document.createElement("input");
input.id = "startgg-input";
input.placeholder = "Paste start.gg event URL or tournament/.../event/...";
input.style.width = "100%";
input.style.maxWidth = "700px"; // 40% larger than previous 720px
input.style.marginBottom = "8px";
input.value = STARTGG_URL; // prefill with example
document.body.appendChild(input);

// fetch button (placed directly under input, above player list)
const btn = document.createElement("button");
btn.id = "fetch-top8-btn";
btn.textContent = "Fetch Top 8";
btn.style.display = "block";
btn.style.marginTop = "8px auto";
btn.style.margin = "0 auto 8px auto";
btn.style.width = "100%";
btn.style.maxWidth = "600px"; // match input width (40% larger)
document.body.appendChild(btn);

// warning / status area (reused for results)
const container = document.createElement("div");
container.id = "top8-container";
container.style.whiteSpace = "pre-wrap"; // keep newlines
container.style.marginTop = "8px auto";
document.body.appendChild(container);

// new button to generate graphic from the editable form
const genBtn = document.createElement("button");
genBtn.id = "generate-graphic-btn";
genBtn.textContent = "Generate Graphic";
genBtn.style.display = "block";
// center the button, limit max width so margin auto centers it
genBtn.style.maxWidth = "600px";
genBtn.style.width = "100%";
genBtn.style.margin = "8px auto";
genBtn.disabled = true; // enabled after successful fetch/render
document.body.appendChild(genBtn);

// area where generated canvas / download link will be placed
const graphicArea = document.createElement("div");
graphicArea.id = "graphic-area";
// center canvas and buttons inside this area
graphicArea.style.display = "flex";
graphicArea.style.flexDirection = "column";
graphicArea.style.alignItems = "center";
graphicArea.style.marginTop = "12px";
document.body.appendChild(graphicArea);

// add a checkbox to toggle a border around the generated image
const borderLabel = document.createElement("label");
borderLabel.style.display = "inline-block";
borderLabel.style.marginTop = "8px";
borderLabel.style.marginBottom = "8px";
borderLabel.style.maxWidth = "1008px";
borderLabel.style.width = "100%";

const borderChk = document.createElement("input");
borderChk.type = "checkbox";
borderChk.id = "add-border-chk";
borderChk.style.marginRight = "8px";

borderLabel.appendChild(borderChk);
borderLabel.appendChild(document.createTextNode("Add border"));

// place the checkbox underneath the generate button but above the canvas
// insert before the graphic area so it shows above whatever canvas will be appended there
document.body.insertBefore(borderLabel, graphicArea);

// add a test button to generate graphic from dummy data
const testBtn = document.createElement("button");
testBtn.id = "test-graphic-btn";
testBtn.textContent = "Test Graphic (Dummy Data)";
testBtn.style.display = "block";
testBtn.style.marginTop = "8px";
testBtn.style.width = "100%";
testBtn.style.maxWidth = "1008px";
document.body.appendChild(testBtn);

btn.addEventListener("click", async () => {
  btn.disabled = true;
  container.textContent = "Loading...";
  genBtn.disabled = true;
  graphicArea.innerHTML = "";

  // validate input contains "event"
  const raw = (input.value || "").trim();
  const url = raw || STARTGG_URL;
  if (!url.toLowerCase().includes("event")) {
    container.innerText =
      'Invalid link: please provide a start.gg URL or slug that contains "event".';
    btn.disabled = false;
    return;
  }

  // helper to strip everything before and including the pipe
  function cleanName(name) {
    if (!name) return "Unknown";
    const parts = name.split("|");
    return parts[parts.length - 1].trim();
  }

  try {
    const nodes = await getTop8(url);

    if (nodes && nodes.length) {
      // render editable inputs + character dropdown for each player
      const MELEE_CHARACTERS = [
        "Fox",
        "Falco",
        "Marth",
        "Sheik",
        "Peach",
        "Jigglypuff",
        "Captain Falcon",
        "Ice Climbers",
        "Samus",
        "Ganondorf",
        "Young Link",
        "Link",
        "Luigi",
        "Mario",
        "Bowser",
        "Yoshi",
        "Pikachu",
        "Roy",
        "Mr. Game & Watch",
        "Ness",
        "Mewtwo",
        "Pichu",
        "Dr. Mario",
        "Donkey Kong",
        "Kirby",
        "Zelda",
      ];

      container.innerHTML = "";

      const sorted = nodes
        .slice()
        .sort((a, b) => (a.placement ?? 0) - (b.placement ?? 0))
        .slice(0, 8);

      sorted.forEach((n) => {
        const placement = n.placement ?? "";
        const rawName = n.entrant?.name ?? "Unknown";

        const row = document.createElement("div");
        row.className = "top8-row";
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";
        row.style.marginBottom = "0px";
        row.style.marginTop = "4px";

        const placelabel = document.createElement("div");
        placelabel.textContent = `${placement}.`;
        placelabel.style.width = "auto";
        placelabel.style.height = "auto";
        // placelabel.style.flex = '0 0 auto';

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = (function cleanName(name) {
          if (!name) return "Unknown";
          const parts = name.split("|");
          return parts[parts.length - 1].trim();
        })(rawName);
        nameInput.style.flex = "1";
        nameInput.style.minWidth = "10px";

        const charSelect = document.createElement("select");
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select character";
        charSelect.appendChild(defaultOption);

        MELEE_CHARACTERS.forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c;
          charSelect.appendChild(opt);
        });

        charSelect.style.flex = "1";

        row.appendChild(placelabel);
        row.appendChild(nameInput);
        row.appendChild(charSelect);

        container.appendChild(row);
      });
      // enable generate button when rows are present
      genBtn.disabled = false;
    } else {
      container.innerText = "No standings returned.";
    }
  } catch (err) {
    console.error(err);
    container.innerText = "Error fetching top 8.";
  } finally {
    btn.disabled = false;
  }
});

// helper: create a simple initials badge for a character name
function charInitials(name) {
  if (!name) return "?";
  const parts = name.replace(/&/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// new helpers: map character -> asset filename and preload icon
function cleanedIconBase(name) {
  if (!name) return null;
  // remove periods and spaces, keep ampersands and letters intact to match filenames like "MrGame&WatchHeadSSBM.png"
  return name.replace(/\./g, "").replace(/\s+/g, "");
}

function loadCharacterIcon(character) {
  return new Promise((resolve) => {
    if (!character) return resolve(null);
    const base = cleanedIconBase(character);
    if (!base) return resolve(null);
    const filename = `${base}HeadSSBM.png`;
    // resolve relative to this module so Vite will handle the asset path
    const url = new URL(`../assets/stockicons/${filename}`, import.meta.url)
      .href;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Generate graphic from the editable rows
// refactor: single function that draws given entries (preloads icons)
async function generateGraphic(entries) {
  graphicArea.innerHTML = "";

  // ensure entries is an array
  if (!Array.isArray(entries) || !entries.length) {
    graphicArea.innerText = "No entries to generate from.";
    return;
  }

  // preload icons for each entry (attach as entry.icon)
  await Promise.all(
    entries.map(async (e) => {
      e.icon = await loadCharacterIcon(e.character);
    })
  );

  // layout constants
  const leftPadding = 4;
  const rightPadding = 4;
  const iconLeftPadding = 24;
  const iconSize = 60;
  const rowH = 70;
  const textFont = "700 44px Roboto, serif"; // name & placement font (44px)
  const headerFont = "700 72px Roboto, serif"; // "Top 8" font (72px)
  const headerBottomPadding = 24;

  // border option (reads the checkbox added to the UI)
  const addBorder = !!document.getElementById("add-border-chk")?.checked;
  const borderSize = addBorder ? 1 : 0; // border thickness in CSS pixels

  // measurement context (unscaled)
  const measureCtx = document.createElement("canvas").getContext("2d");
  measureCtx.font = textFont;

  // measure widest placement+name
  let maxRowTextWidth = 0;
  entries.forEach((e) => {
    const label = `${e.place}. ${e.name}`;
    const w = measureCtx.measureText(label).width;
    if (w > maxRowTextWidth) maxRowTextWidth = w;
  });

  // measure header
  measureCtx.font = headerFont;
  const headerText = "Top 8";
  const headerWidth = measureCtx.measureText(headerText).width;
  const headerHeight = 72; // approximate; matches font size

  // compute inner content width (without border) and final needed width including border
  const neededWidthForRows =
    leftPadding + maxRowTextWidth + iconLeftPadding + iconSize + rightPadding;
  const innerWidth = Math.ceil(
    Math.max(neededWidthForRows, leftPadding + headerWidth + rightPadding, 200)
  ); // min width 200
  const neededWidth = innerWidth + borderSize * 2;

  // compute inner content height and final height including border
  const innerHeight =
    headerHeight + headerBottomPadding + entries.length * rowH;
  const height = innerHeight + borderSize * 2;

  // device pixel ratio handling
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.width = neededWidth * dpr;
  canvas.height = height * dpr;
  canvas.style.width = neededWidth + "px";
  canvas.style.height = height + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // transparent background
  canvas.style.background = "transparent";
  ctx.clearRect(0, 0, neededWidth, height);

  // draw header (offset by borderSize)
  ctx.fillStyle = "#523d30";
  ctx.font = headerFont;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const headerY = borderSize + headerHeight / 2;
  ctx.fillText(
    headerText,
    borderSize + (innerWidth - headerWidth) / 2,
    headerY
  );

  // draw rows (offset by borderSize)
  ctx.font = textFont;
  ctx.textBaseline = "middle";
  entries.forEach((e, i) => {
    const y = borderSize + headerHeight + headerBottomPadding + i * rowH;
    const label = `${e.place}. ${e.name}`;

    // text
    ctx.fillStyle = "#523d30";
    ctx.textAlign = "left";
    ctx.fillText(label, borderSize + leftPadding, y + rowH / 2);

    // measure to place icon immediately after text
    const textWidth = ctx.measureText(label).width;
    let iconX = Math.round(
      borderSize + leftPadding + textWidth + iconLeftPadding
    );
    // ensure icon doesn't overflow inner content area
    const innerRight = borderSize + innerWidth - rightPadding;
    if (iconX + iconSize > innerRight) {
      iconX = innerRight - iconSize;
    }
    const iconY = y + (rowH - iconSize) / 2;

    if (e.icon) {
      // draw image as-is (no circular clipping)
      try {
        ctx.drawImage(e.icon, iconX, iconY, iconSize, iconSize);
      } catch (err) {
        // fallback to square with initials if drawImage fails
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          charInitials(e.character || e.name),
          iconX + iconSize / 2,
          iconY + iconSize / 2
        );
      }
    } else {
      // fallback: simple colored square with initials (no character text)
      const seed = (e.character || e.name || "")
        .split("")
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const hue = seed % 360;
      ctx.fillStyle = `hsl(${hue} 60% 45%)`;
      ctx.fillRect(iconX, iconY, iconSize, iconSize);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        charInitials(e.character || e.name),
        iconX + iconSize / 2,
        iconY + iconSize / 2
      );
    }
  });

  // draw border if requested (stroke centered on the canvas edge)
  if (addBorder && borderSize > 0) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = borderSize;
    // draw rectangle so the stroke sits inside the canvas
    ctx.strokeRect(
      borderSize / 2,
      borderSize / 2,
      neededWidth - borderSize,
      height - borderSize
    );
  }

  graphicArea.appendChild(canvas);

  // download button
  const dl = document.createElement("a");
  dl.textContent = "Download PNG";
  dl.style.display = "inline-block";
  dl.style.marginTop = "8px";
  dl.style.padding = "8px 12px";
  dl.style.background = "#2563eb";
  dl.style.color = "#fff";
  dl.style.borderRadius = "4px";
  dl.style.textDecoration = "none";
  dl.href = canvas.toDataURL("image/png");
  dl.download = "top8.png";
  graphicArea.appendChild(dl);
}

// update existing generate button to use the refactored function
genBtn.addEventListener("click", async () => {
  const rows = Array.from(container.querySelectorAll(".top8-row"));
  if (!rows.length) {
    graphicArea.innerText = "No rows to generate from.";
    return;
  }

  const entries = rows.map((r) => {
    const place = r.children[0]?.textContent?.replace(".", "")?.trim() || "";
    const name = (r.querySelector("input")?.value || "").trim() || "Unknown";
    const character = (r.querySelector("select")?.value || "").trim();
    return { place, name, character, icon: null };
  });

  await generateGraphic(entries);
});

// wire up the test button to use dummy data for quick testing
testBtn.addEventListener("click", async () => {
  const dummy = [
    { place: "1", name: "Lucky", character: "Fox", icon: null },
    { place: "2", name: "Mango", character: "Falco", icon: null },
    { place: "3", name: "Mew2King", character: "Marth", icon: null },
    { place: "4", name: "PPMD", character: "Sheik", icon: null },
    { place: "5", name: "Armada", character: "Peach", icon: null },
    { place: "6", name: "Hbox", character: "Jigglypuff", icon: null },
    { place: "7", name: "Wizzrobe", character: "Captain Falcon", icon: null },
    { place: "8", name: "Axe", character: "Pikachu", icon: null },
  ];

  await generateGraphic(dummy);
});
