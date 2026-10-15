import "server-only";

import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { head, put } from "@vercel/blob";

const productsDirectory = path.join(process.cwd(), "public", "images", "products");
const localImagePattern = /^\/images\/products\/([a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g))$/i;
const blobImagePattern = /^https:\/\/([a-z0-9-]+\.public\.blob\.vercel-storage\.com)\/products\/([a-f0-9-]+\.(?:webp|png|jpe?g))$/i;
export const MAX_PRODUCT_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

export type ResolvedProductImage = {
  url: string;
  storageProvider: "app" | "vercel-blob";
  storageKey: string;
  width: number;
  height: number;
};

export function isProductImageStorageReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function imageDimensions(buffer: Buffer) {
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const kind = buffer.toString("ascii", 12, 16);
    if (kind === "VP8X" && buffer.length >= 30) {
      return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    }
    if (kind === "VP8L" && buffer.length >= 25) {
      const b0 = buffer[21]!;
      const b1 = buffer[22]!;
      const b2 = buffer[23]!;
      const b3 = buffer[24]!;
      return {
        width: 1 + b0 + ((b1 & 0x3f) << 8),
        height: 1 + ((b1 & 0xc0) >> 6) + (b2 << 2) + ((b3 & 0x0f) << 10),
      };
    }
    if (kind === "VP8 " && buffer.length >= 30) {
      for (let index = 20; index + 9 < buffer.length; index += 1) {
        if (buffer[index] === 0x9d && buffer[index + 1] === 0x01 && buffer[index + 2] === 0x2a) {
          return {
            width: buffer.readUInt16LE(index + 3) & 0x3fff,
            height: buffer.readUInt16LE(index + 5) & 0x3fff,
          };
        }
      }
    }
  }
  if (buffer.toString("ascii", 1, 4) === "PNG" && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1]!;
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  throw new Error("UNSUPPORTED_IMAGE");
}

function inspectImageBytes(buffer: Buffer, contentType?: string) {
  if (!buffer.length || buffer.length > MAX_PRODUCT_IMAGE_BYTES) throw new Error("INVALID_IMAGE_SIZE");
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const detectedType = buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP"
    ? "image/webp"
    : buffer[0] === 0xff && buffer[1] === 0xd8
      ? "image/jpeg"
      : isPng
        ? "image/png"
        : null;
  if (!detectedType || (contentType && contentType !== detectedType)) throw new Error("UNSUPPORTED_IMAGE");
  const dimensions = imageDimensions(buffer);
  if (dimensions.width < 1 || dimensions.height < 1 || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) {
    throw new Error("INVALID_IMAGE_DIMENSIONS");
  }
  return { ...dimensions, contentType: detectedType };
}

export async function listLocalProductImages() {
  const entries = await readdir(productsDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g)$/i.test(entry.name))
    .map((entry) => `/images/products/${entry.name}`)
    .sort((a, b) => a.localeCompare(b, "fr"));
}

export async function uploadProductImage(buffer: Buffer, contentType: string) {
  const info = inspectImageBytes(buffer, contentType);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("IMAGE_STORAGE_NOT_CONFIGURED");
  const extension = info.contentType === "image/jpeg" ? "jpg" : info.contentType.slice("image/".length);
  const pathname = `products/${randomUUID()}.${extension}`;
  const blob = await put(pathname, new Blob([new Uint8Array(buffer)], { type: info.contentType }), {
    access: "public",
    addRandomSuffix: false,
    cacheControlMaxAge: 31_536_000,
    contentType: info.contentType,
    token,
  });
  return { url: blob.url, storageKey: blob.pathname, width: info.width, height: info.height };
}

export async function resolveProductImages(urls: string[]): Promise<ResolvedProductImage[]> {
  const uniqueUrls = [...new Set(urls)];
  return Promise.all(uniqueUrls.map(async (url) => {
    const localMatch = localImagePattern.exec(url);
    if (localMatch) {
      const buffer = await readFile(path.join(productsDirectory, localMatch[1]!));
      const info = inspectImageBytes(buffer);
      return { url, storageProvider: "app", storageKey: localMatch[1]!, width: info.width, height: info.height };
    }

    const blobMatch = blobImagePattern.exec(url);
    if (!blobMatch) throw new Error("INVALID_IMAGE_PATH");
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("IMAGE_STORAGE_NOT_CONFIGURED");
    const metadata = await head(url, { token });
    if (metadata.pathname !== `products/${blobMatch[2]}` || metadata.size > MAX_PRODUCT_IMAGE_BYTES || !metadata.contentType.startsWith("image/")) {
      throw new Error("IMAGE_NOT_AVAILABLE");
    }
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error("IMAGE_NOT_AVAILABLE");
    const info = inspectImageBytes(Buffer.from(await response.arrayBuffer()), metadata.contentType);
    return {
      url,
      storageProvider: "vercel-blob",
      storageKey: metadata.pathname,
      width: info.width,
      height: info.height,
    };
  }));
}
