import imageCompression from "browser-image-compression";
import fs from "fs";
import path from "path";

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
  let storagePath = "";
  if (process.env.NODE_ENV === "development") {
    storagePath = "public" + process.env.PUBLIC_STORAGE_PATH || "/var/storage";
  } else {
    storagePath = process.env.STORAGE_PATH || "/var/storage";
  }

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
  let storagePath = "";
  if (process.env.NODE_ENV === "development") {
    storagePath = "public" + process.env.PUBLIC_STORAGE_PATH || "/var/storage";
  } else {
    storagePath = process.env.STORAGE_PATH || "/var/storage";
  }

  const filePath = path.join(storagePath, filepath);
  await fs.promises.unlink(filePath);
};
