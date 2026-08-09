// Photo storage for customer avatars.
//
// Uses Cloudflare R2 (S3-compatible API) when configured. Falls back to the
// local filesystem (./data/uploads) for local development and when no R2
// credentials are set, so the API runs without Cloudflare setup.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export interface StoredPhoto {
  bytes: Uint8Array;
  contentType: string;
}

export interface PhotoStore {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<StoredPhoto | null>;
}

// ---------- Cloudflare R2 (S3-compatible) ----------

export class R2Client implements PhotoStore {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  }) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint: options.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  }

  async get(key: string): Promise<StoredPhoto | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      const contentType = (res.ContentType ?? "application/octet-stream") as string;
      const bytes = new Uint8Array(await res.Body.transformToByteArray());
      return { bytes, contentType };
    } catch (err) {
      if ((err as { name?: string })?.name === "NoSuchKey") return null;
      throw err;
    }
  }
}

// ---------- Local filesystem fallback ----------

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export class LocalPhotoStore implements PhotoStore {
  constructor(private readonly baseDir: string = LOCAL_UPLOAD_DIR) {}

  private resolve(key: string): string {
    const safe = key.replace(/\.\./g, "").replace(/[^a-zA-Z0-9._/-]/g, "");
    return path.join(this.baseDir, safe);
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    const file = this.resolve(key);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, bytes);
  }

  async get(key: string): Promise<StoredPhoto | null> {
    const file = this.resolve(key);
    if (!existsSync(file)) return null;
    return { bytes: readFileSync(file), contentType: contentTypeFor(key) };
  }
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

export function contentTypeFor(key: string): string {
  const ext = path.extname(key).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export const ALLOWED_PHOTO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

const R2_BY_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export function extensionFor(contentType: string): string {
  return R2_BY_EXT[contentType] ?? ".png";
}

// ---------- Store selection ----------

export function getPhotoStore(): PhotoStore {
  const accountId = process.env.CF_ACCOUNT_ID;
  const accessKeyId = process.env.CF_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CF_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CF_R2_BUCKET;

  const configured =
    accountId && accessKeyId && secretAccessKey && bucket;

  if (configured && process.env.CF_R2_MODE !== "local") {
    const endpoint =
      process.env.CF_R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`;
    return new R2Client({
      endpoint,
      accessKeyId,
      secretAccessKey,
      bucket,
    });
  }

  return new LocalPhotoStore();
}

export function isR2Configured(): boolean {
  return !!(process.env.CF_ACCOUNT_ID && process.env.CF_R2_ACCESS_KEY_ID && process.env.CF_R2_SECRET_ACCESS_KEY && process.env.CF_R2_BUCKET && process.env.CF_R2_MODE !== "local");
}
