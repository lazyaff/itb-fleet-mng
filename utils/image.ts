import imageCompression from "browser-image-compression";
import fs from "fs";
import path from "path";

// Resolves the on-disk storage root. In development files live under
// `public/<PUBLIC_STORAGE_PATH>` so Next can serve them statically; in
// production they go to the standalone `STORAGE_PATH` volume.
export function getStoragePath(): string {
  if (process.env.NODE_ENV === "development") {
    return "public" + (process.env.PUBLIC_STORAGE_PATH || "/var/storage");
  }
  return process.env.STORAGE_PATH || "/var/storage";
}

// Builds the browser-facing URL for a stored file. Normalizes Windows
// backslashes (from `path.join` in `saveFile`) to forward slashes.
export function buildPublicUrl(filepath: string): string {
  return (
    process.env.NEXTAUTH_URL! +
    process.env.PUBLIC_STORAGE_PATH +
    "/" +
    filepath.replace(/\\/g, "/")
  );
}

export async function compressIfNeeded(file: File, maxMB = 3): Promise<File> {
  if (file.size <= maxMB * 1024 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: maxMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  const compressed = await imageCompression(file, options);
  return compressed;
}

export const saveFile = async (file: File, folder: string, name: string) => {
  const storagePath = getStoragePath();

  const ext = path.extname(file.name) || "";
  const fileName = `${name}-${Date.now().toString()}${ext}`;

  const dirPath = path.join(storagePath, folder);
  await fs.promises.mkdir(dirPath, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filePath = path.join(dirPath, fileName);
  await fs.promises.writeFile(filePath, buffer);

  return path.join(folder, fileName);
};

export const deleteFile = async (filepath: string) => {
  const storagePath = getStoragePath();

  const filePath = path.join(storagePath, filepath);
  await fs.promises.unlink(filePath);
};
