import { setImageContain } from './config.js';

/** Масштаб рамки после contain (чуть >1 — немного шире/выше всплывающий декор). */
export const BORDER_FRAME_SCALE = 1.1;

/** Макс. ширина рамки относительно ширины backdrop (1 = не шире фона; чуть >1 — допустимый люфт). */
export const BORDER_MAX_WIDTH_VS_BACKDROP = 1.1;

/**
 * Внутреннее «окно» под контент: доли от размера спрайта рамки (толщина декора по краям текстуры).
 * Подогнано под border_frame.webp ~928×1232.
 */
export const FRAME_INNER_PAD_X_RATIO = 0.22;
export const FRAME_INNER_PAD_TOP_RATIO = 0.13;
export const FRAME_INNER_PAD_BOTTOM_RATIO = 0.1;
export const FRAME_INNER_PAD_X_MIN = 10;
export const FRAME_INNER_PAD_TOP_MIN = 50;
export const FRAME_INNER_PAD_BOTTOM_MIN = 12;

/**
 * Fits a border_frame image into safeRect the same way across every scene
 * (GameScene board frame, factory window, etc.) so the layout stays identical.
 * Mutates and positions `borderImage` in place; returns the outer frame rect
 * (bgRect) and the padded inner content rect (innerRect).
 */
export function layoutBorderFrame(borderImage, safeRect) {
  borderImage.setPosition(safeRect.x + safeRect.width / 2, safeRect.y + safeRect.height / 2);
  borderImage.setOrigin(0.5);

  setImageContain(borderImage, safeRect.width, safeRect.height);
  borderImage.setDisplaySize(
    borderImage.displayWidth * BORDER_FRAME_SCALE,
    borderImage.displayHeight * BORDER_FRAME_SCALE,
  );
  const maxBorderW = safeRect.width * BORDER_MAX_WIDTH_VS_BACKDROP;
  if (borderImage.displayWidth > maxBorderW) {
    const s = maxBorderW / borderImage.displayWidth;
    borderImage.setDisplaySize(borderImage.displayWidth * s, borderImage.displayHeight * s);
  }

  const bgRect = {
    x: safeRect.x + (safeRect.width - borderImage.displayWidth) / 2,
    y: safeRect.y + (safeRect.height - borderImage.displayHeight) / 2,
    width: borderImage.displayWidth,
    height: borderImage.displayHeight,
  };

  const padX = Math.max(FRAME_INNER_PAD_X_MIN, bgRect.width * FRAME_INNER_PAD_X_RATIO);
  const padTop = Math.max(FRAME_INNER_PAD_TOP_MIN, bgRect.height * FRAME_INNER_PAD_TOP_RATIO);
  const padBottom = Math.max(FRAME_INNER_PAD_BOTTOM_MIN, bgRect.height * FRAME_INNER_PAD_BOTTOM_RATIO);

  const innerRect = {
    x: bgRect.x + padX,
    y: bgRect.y + padTop,
    width: bgRect.width - 2 * padX,
    height: bgRect.height - padTop - padBottom,
  };

  return { bgRect, innerRect };
}
