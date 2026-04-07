/**
 * Bullseye target markers for corner detection.
 *
 * A bullseye (concentric circles: black → white → black) is:
 * - Rotationally symmetric → no orientation ambiguity
 * - Trivially detected by cv2.HoughCircles or contour analysis
 * - Very compact (~16px diameter)
 * - Impossible to confuse with QR patterns, checkboxes, or text
 *
 * Assignment:
 *   TL (top-left), TR (top-right), BL (bottom-left), BR (bottom-right)
 */

const BULLSEYE_SIZE = 16

/**
 * Generate a bullseye SVG as a data URL.
 * 3 concentric circles: outer black, middle white, inner black.
 */
export function generateBullseyeSvg(size: number = BULLSEYE_SIZE): string {
  const r = size / 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<circle cx="${r}" cy="${r}" r="${r}" fill="#000"/>` +
    `<circle cx="${r}" cy="${r}" r="${r * 0.6}" fill="#fff"/>` +
    `<circle cx="${r}" cy="${r}" r="${r * 0.3}" fill="#000"/>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const BULLSEYE_PX = BULLSEYE_SIZE
