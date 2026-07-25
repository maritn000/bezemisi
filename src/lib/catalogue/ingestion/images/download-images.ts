import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const IMAGE_HASH_INDEX = path.join(
  process.cwd(),
  ".catalogue-cache",
  "image-hashes.json",
);

type ImageHashIndex = Record<string, string>;

async function loadHashIndex(): Promise<ImageHashIndex> {
  try {
    return JSON.parse(await readFile(IMAGE_HASH_INDEX, "utf8")) as ImageHashIndex;
  } catch {
    return {};
  }
}

async function saveHashIndex(index: ImageHashIndex) {
  await mkdir(path.dirname(IMAGE_HASH_INDEX), { recursive: true });
  await writeFile(IMAGE_HASH_INDEX, JSON.stringify(index, null, 2), "utf8");
}

function extensionFromContentType(contentType: string | null, url: string) {
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
    return ".jpg";
  }
  const fromUrl = path.extname(new URL(url).pathname);
  return fromUrl || ".jpg";
}

export type DownloadedImage = {
  sourceUrl: string;
  localPath: string;
  contentHash: string;
  reused: boolean;
};

export async function downloadVehicleImage(input: {
  sourceUrl: string;
  brandSlug: string;
  modelSlug: string;
  filename?: string;
}): Promise<DownloadedImage | null> {
  if (!input.sourceUrl || !input.sourceUrl.startsWith("http")) {
    return null;
  }

  const response = await fetch(input.sourceUrl, {
    headers: { "User-Agent": "BezemisiCatalogueBot/1.0" },
  });
  if (!response.ok) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1024) return null;

  const contentHash = createHash("sha256").update(buffer).digest("hex");
  const hashIndex = await loadHashIndex();
  const existingPath = hashIndex[contentHash];
  if (existingPath) {
    return {
      sourceUrl: input.sourceUrl,
      localPath: existingPath,
      contentHash,
      reused: true,
    };
  }

  const ext = extensionFromContentType(
    response.headers.get("content-type"),
    input.sourceUrl,
  );
  const filename =
    input.filename ??
    `${input.modelSlug}${ext}`;
  const relativePath = path.posix.join(
    "/vehicles",
    input.brandSlug,
    input.modelSlug,
    filename,
  );
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  hashIndex[contentHash] = relativePath;
  await saveHashIndex(hashIndex);

  return {
    sourceUrl: input.sourceUrl,
    localPath: relativePath,
    contentHash,
    reused: false,
  };
}

export async function downloadOfferImage(input: {
  sourceUrl: string;
  offerId: string;
}) {
  if (!input.sourceUrl.startsWith("http")) return null;

  const response = await fetch(input.sourceUrl, {
    headers: { "User-Agent": "BezemisiCatalogueBot/1.0" },
  });
  if (!response.ok) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = extensionFromContentType(
    response.headers.get("content-type"),
    input.sourceUrl,
  );
  const relativePath = path.posix.join(
    "/offers",
    input.offerId,
    `hero${ext}`,
  );
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  return relativePath;
}
