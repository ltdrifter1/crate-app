/**
 * Upload helpers — hashed object names + Firebase thumb paths.
 * Used by upload-tracks.js so new audio/covers are immutable CDN keys.
 */
const crypto = require("crypto");
const path = require("path");

const AUDIO_CACHE_CONTROL = "public, max-age=31536000, immutable";
const THUMB_SIZES = [200, 400, 800];

function hashedObjectName(filename, bytes) {
  const base = path.basename(String(filename || "file"));
  if (/^[a-f0-9]{12}-/i.test(base)) return base;
  const hash = crypto.createHash("sha1").update(bytes || Buffer.alloc(0)).digest("hex").slice(0, 12);
  return `${hash}-${base}`;
}

function injectSizeSuffix(filename, size) {
  const name = String(filename || "");
  if (!name) return name;
  if (/_\d+x\d+(\.[a-z0-9]+)?$/i.test(name)) return name;
  const i = name.lastIndexOf(".");
  if (i < 1) return `${name}_${size}x${size}`;
  return `${name.slice(0, i)}_${size}x${size}${name.slice(i)}`;
}

function thumbObjectPath(destPath, size) {
  const dir = path.posix.dirname(destPath);
  const file = path.posix.basename(destPath);
  const next = injectSizeSuffix(file, size);
  return dir === "." ? next : `${dir}/${next}`;
}

module.exports = {
  AUDIO_CACHE_CONTROL,
  THUMB_SIZES,
  hashedObjectName,
  injectSizeSuffix,
  thumbObjectPath,
};
