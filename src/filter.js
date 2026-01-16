/**
 * HSL Filter Module
 * Allows users to modify Hue, Saturation, and Lightness values of an image
 */

/**
 * Convert RGB to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {Array} [h, s, l] where h is 0-360, s and l are 0-100
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {Array} [r, g, b] where each is 0-255
 */
function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Remove background using remove.bg API
 * @param {File|Blob} imageFile - The image file to process
 * @returns {Promise<Blob>} The image with background removed as a Blob
 */
export async function removeBackgroundWithAPI(imageFile) {
  const apiKey = import.meta.env.VITE_REMOVEBG_KEY;
  
  if (!apiKey) {
    throw new Error("remove.bg API key not configured. Please set VITE_REMOVEBG_KEY in .env");
  }

  const formData = new FormData();
  formData.append("image_file", imageFile);
  formData.append("size", "auto");
  formData.append("type", "auto");

  try {
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `remove.bg API error: ${errorData.errors?.[0]?.title || response.statusText}`
      );
    }

    return await response.blob();
  } catch (error) {
    throw new Error(`Failed to remove background: ${error.message}`);
  }
}

/**
 * Apply colorize effect to an image (like Photoshop's colorize)
 * Converts image to grayscale, then applies a hue tint
 * @param {ImageData} imageData - The image data to colorize
 * @param {number} hue - The hue to apply (0-360)
 * @param {number} saturation - The saturation level (0-100)
 */
function applyColorize(imageData, hue, saturation) {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Convert to grayscale using luminosity method
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Convert grayscale to HSL (gray has 0 saturation)
    let [, , l] = rgbToHsl(gray, gray, gray);

    // Apply the colorize hue and saturation
    const [newR, newG, newB] = hslToRgb(hue, saturation, l);

    data[i] = newR;
    data[i + 1] = newG;
    data[i + 2] = newB;
    data[i + 3] = a;
  }
}

/**
 * Apply HSL adjustments to an image
 * Optionally removes background first, then applies colorize effect
 * @param {File|Blob} imageFile - The image file to process
 * @param {number} hueShift - Amount to shift hue (-180 to 180)
 * @param {number} saturationAdjust - Amount to adjust saturation (-100 to 100)
 * @param {number} lightnessAdjust - Amount to adjust lightness (-100 to 100)
 * @param {boolean} removeBg - Whether to remove the background first
 * @returns {Promise<Blob>} The processed image as a Blob
 */
export async function applyHslFilter(
  imageFile,
  hueShift = 0,
  saturationAdjust = 0,
  lightnessAdjust = 0,
  removeBg = false
) {
  return new Promise(async (resolve, reject) => {
    try {
      let fileToProcess = imageFile;

      // First, optionally remove background using remove.bg API
      if (removeBg) {
        try {
          fileToProcess = await removeBackgroundWithAPI(imageFile);
        } catch (error) {
          reject(error);
          return;
        }
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Apply colorize effect with the hue shift as the colorize hue
          // Using the saturation adjustment as the colorize saturation
          applyColorize(imageData, hueShift, saturationAdjust);

          // Then apply lightness adjustment if any
          if (lightnessAdjust !== 0) {
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              let [h, s, l] = rgbToHsl(r, g, b);
              l = Math.max(0, Math.min(100, l + lightnessAdjust));

              const [newR, newG, newB] = hslToRgb(h, s, l);
              data[i] = newR;
              data[i + 1] = newG;
              data[i + 2] = newB;
              data[i + 3] = a;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          // Convert canvas to Blob
          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            "image/png"
          );
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(fileToProcess);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get a download URL for a processed image
 * @param {Blob} imageBlob - The processed image blob
 * @returns {string} Object URL for the blob
 */
export function getBlobUrl(imageBlob) {
  return URL.createObjectURL(imageBlob);
}

/**
 * Clean up a blob URL
 * @param {string} url - The object URL to revoke
 */
export function revokeBlobUrl(url) {
  URL.revokeObjectURL(url);
}
