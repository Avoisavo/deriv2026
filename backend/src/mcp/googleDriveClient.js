import fs from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";

const DRIVE_READONLY_SCOPE = ["https://www.googleapis.com/auth/drive.readonly"];

function parseJsonSafe(raw, label) {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function decodePrivateKey(value) {
  return String(value || "").replace(/\\n/g, "\n");
}

async function loadServiceAccount(env) {
  const inlineJson = env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inlineJson) return parseJsonSafe(inlineJson, "GOOGLE_SERVICE_ACCOUNT_JSON");

  const keyFile = env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (keyFile) {
    const raw = await fs.readFile(path.resolve(keyFile), "utf8");
    return parseJsonSafe(raw, "GOOGLE_SERVICE_ACCOUNT_KEY_FILE");
  }

  const clientEmail =
    env.GOOGLE_CLIENT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  const privateKey = decodePrivateKey(
    env.SERVICE_ACC_API_KEY ||
      process.env.SERVICE_ACC_API_KEY ||
      env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing service-account credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_SERVICE_ACCOUNT_KEY_FILE, or GOOGLE_CLIENT_EMAIL + SERVICE_ACC_API_KEY."
    );
  }

  return {
    client_email: clientEmail,
    private_key: privateKey,
  };
}

function sanitizeName(name) {
  return String(name || "file")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 140);
}

export async function createGoogleDriveClient(env) {
  const account = await loadServiceAccount(env);
  const auth = new google.auth.JWT({
    email: account.client_email,
    key: account.private_key,
    scopes: DRIVE_READONLY_SCOPE,
  });

  return google.drive({ version: "v3", auth });
}

export async function findFolderByName({ drive, folderName, sharedDriveId = "" }) {
  const escaped = String(folderName).replace(/'/g, "\\'");
  const isShared = Boolean(sharedDriveId);

  const response = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${escaped}' and trashed = false`,
    fields: "files(id,name,modifiedTime)",
    pageSize: 25,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    corpora: isShared ? "drive" : "allDrives",
    driveId: isShared ? sharedDriveId : undefined,
  });

  const files = Array.isArray(response.data.files) ? response.data.files : [];
  if (!files.length) return null;
  files.sort((a, b) => Date.parse(b.modifiedTime || 0) - Date.parse(a.modifiedTime || 0));
  return files[0];
}

export async function getFolderById({ drive, folderId, sharedDriveId = "" }) {
  const response = await drive.files.get({
    fileId: folderId,
    fields: "id,name,mimeType,modifiedTime",
    supportsAllDrives: true,
  });

  const file = response.data;
  if (!file?.id) return null;
  if (file.mimeType !== "application/vnd.google-apps.folder") {
    throw new Error(`GDRIVE_FOLDER_ID '${folderId}' is not a folder.`);
  }
  return file;
}

export async function listFilesInFolder({ drive, folderId, sharedDriveId = "", pageSize = 200 }) {
  const isShared = Boolean(sharedDriveId);
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,modifiedTime,parents,trashed)",
    pageSize,
    orderBy: "modifiedTime desc",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    corpora: isShared ? "drive" : "allDrives",
    driveId: isShared ? sharedDriveId : undefined,
  });

  return Array.isArray(response.data.files) ? response.data.files : [];
}

function isGoogleDocMime(mimeType) {
  return String(mimeType || "").startsWith("application/vnd.google-apps.");
}

function exportedFormatForGoogleMime(mimeType) {
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    return {
      ext: ".xlsx",
      targetMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      type: "xlsx",
    };
  }

  if (mimeType === "application/vnd.google-apps.document") {
    return {
      ext: ".docx",
      targetMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      type: "docx",
    };
  }

  return null;
}

function detectTypeFromFile(name, mimeType) {
  const ext = path.extname(String(name || "")).toLowerCase();
  if (ext === ".csv" || mimeType === "text/csv") return "csv";
  if (
    ext === ".xlsx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "xlsx";
  }
  if (ext === ".json" || mimeType === "application/json") return "json";
  if (
    ext === ".docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  return null;
}

export function inferDomainFromFileName(fileName) {
  const lower = String(fileName || "").toLowerCase();
  if (lower.includes("support") || lower.includes("ticket") || lower.includes("customer")) {
    return "support";
  }
  if (lower.includes("finance") || lower.includes("procurement") || lower.includes("budget")) {
    return "finance";
  }
  if (
    lower.includes("ops") ||
    lower.includes("it") ||
    lower.includes("alert") ||
    lower.includes("infra")
  ) {
    return "operations";
  }
  return "operations";
}

export async function downloadDriveFile({ drive, file, outputDir }) {
  const mimeType = String(file.mimeType || "");
  const baseName = sanitizeName(file.name || file.id || "file");

  let targetExt = path.extname(baseName).toLowerCase();
  let outputName = baseName;
  let type = detectTypeFromFile(file.name, mimeType);

  if (isGoogleDocMime(mimeType)) {
    const fmt = exportedFormatForGoogleMime(mimeType);
    if (!fmt) return null;

    targetExt = fmt.ext;
    outputName = `${baseName}${fmt.ext}`;
    type = fmt.type;

    const outputPath = path.resolve(outputDir, outputName);
    const response = await drive.files.export(
      { fileId: file.id, mimeType: fmt.targetMime },
      { responseType: "arraybuffer" }
    );

    await fs.writeFile(outputPath, Buffer.from(response.data));
    return { path: outputPath, type };
  }

  if (!type) {
    type = detectTypeFromFile(`${baseName}${targetExt}`, mimeType);
    if (!type) return null;
  }

  if (!targetExt) {
    if (type === "csv") targetExt = ".csv";
    if (type === "xlsx") targetExt = ".xlsx";
    if (type === "json") targetExt = ".json";
    if (type === "docx") targetExt = ".docx";
    outputName = `${baseName}${targetExt}`;
  }

  const outputPath = path.resolve(outputDir, outputName);
  const response = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
  await fs.writeFile(outputPath, Buffer.from(response.data));

  return { path: outputPath, type };
}
