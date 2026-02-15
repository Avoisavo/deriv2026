import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  createGoogleDriveClient,
  findFolderByName,
  getFolderById,
  listFilesInFolder,
  downloadDriveFile,
  inferDomainFromFileName,
} from "./googleDriveClient.js";
import { DATA_DIR, ROOT } from "../pipeline/paths.js";
import { runEventExtraction } from "../pipeline/extract-events.js";
import { runEventPush } from "../pipeline/push-events.js";

const STATE_FILE = path.resolve(DATA_DIR, ".drive_sync_state.json");
const INBOX_DIR = path.resolve(DATA_DIR, "inbox");

function nowIso() {
  return new Date().toISOString();
}

function toSafeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function relativeFromRoot(filePath) {
  return path.relative(ROOT, filePath);
}

function isSupportedFile(change) {
  const file = change?.file;
  if (!file || file.trashed) return false;
  const mime = String(file.mimeType || "");
  const name = String(file.name || "").toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".json") || name.endsWith(".docx")) {
    return true;
  }

  if (mime === "application/vnd.google-apps.spreadsheet") return true;
  if (mime === "application/vnd.google-apps.document") return true;
  return false;
}

function isNewOrUpdatedByState(file, stateFiles) {
  const prev = stateFiles[file.id];
  if (!prev) return true;
  return Date.parse(file.modifiedTime || 0) > Date.parse(prev.modifiedTime || 0);
}

export class DriveSyncService {
  constructor({ env }) {
    this.env = env;
    this.mode = String(env.GDRIVE_MODE || process.env.GDRIVE_MODE || "manual").toLowerCase();
    this.folderName = "truman";
    this.explicitFolderId = env.GDRIVE_FOLDER_ID || process.env.GDRIVE_FOLDER_ID || "";
    this.sharedDriveId = env.GDRIVE_SHARED_DRIVE_ID || process.env.GDRIVE_SHARED_DRIVE_ID || "";
    this.webhookAddress =
      this.mode === "watch"
        ? env.GDRIVE_WEBHOOK_ADDRESS || process.env.GDRIVE_WEBHOOK_ADDRESS || ""
        : "";
    this.webhookToken = env.GDRIVE_WEBHOOK_TOKEN || process.env.GDRIVE_WEBHOOK_TOKEN || "";
    this.watchRenewIntervalMs = Number(
      env.GDRIVE_WATCH_RENEW_INTERVAL_MS || process.env.GDRIVE_WATCH_RENEW_INTERVAL_MS || 20 * 60 * 1000
    );

    this.outputFile = path.resolve(
      DATA_DIR,
      env.DRIVE_EVENTS_OUTPUT_FILE || process.env.DRIVE_EVENTS_OUTPUT_FILE || "truman_events_from_ai_crawl.json"
    );
    this.maxEventsPerSource = Number(
      env.DRIVE_MAX_EVENTS_PER_SOURCE || process.env.DRIVE_MAX_EVENTS_PER_SOURCE || 8
    );
    this.model = env.GROQ_MODEL || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    this.table = env.SUPABASE_EVENTS_TABLE || process.env.SUPABASE_EVENTS_TABLE || "truman_events";

    this.state = {
      page_token: null,
      watch_channel: null,
      files: {},
      last_run_at: null,
      last_success_at: null,
      last_error: null,
      last_result: null,
    };

    this.runtime = {
      running: false,
      renewTimer: null,
      folderId: null,
      lastDetectedFiles: [],
    };
  }

  async initialize() {
    this.drive = await createGoogleDriveClient(this.env);
    await fs.mkdir(INBOX_DIR, { recursive: true });
    await this.loadState();

    const folder = await findFolderByName({
      drive: this.drive,
      folderName: this.folderName,
      sharedDriveId: this.sharedDriveId,
    });

    const resolvedFolder = this.explicitFolderId
      ? await getFolderById({
          drive: this.drive,
          folderId: this.explicitFolderId,
          sharedDriveId: this.sharedDriveId,
        })
      : folder;

    if (!resolvedFolder?.id) {
      const svcEmail =
        this.env.GOOGLE_CLIENT_EMAIL ||
        process.env.GOOGLE_CLIENT_EMAIL ||
        this.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        "service-account-email";
      throw new Error(
        `Google Drive folder '${this.folderName}' not found for service account (${svcEmail}). Share the folder with this service-account email, or set GDRIVE_FOLDER_ID explicitly.`
      );
    }

    this.runtime.folderId = resolvedFolder.id;

    if (this.mode === "watch" && !this.state.page_token) {
      const start = await this.drive.changes.getStartPageToken({
        supportsAllDrives: Boolean(this.sharedDriveId),
        driveId: this.sharedDriveId || undefined,
      });
      this.state.page_token = start.data.startPageToken || null;
      await this.saveState();
    }

    if (this.mode === "watch" && this.webhookAddress) {
      await this.ensureWatchChannel(true);
    }
  }

  async loadState() {
    try {
      const raw = await fs.readFile(STATE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      this.state = {
        ...this.state,
        ...parsed,
        files: parsed?.files ?? {},
      };
    } catch {
      await this.saveState();
    }
  }

  async saveState() {
    await fs.writeFile(STATE_FILE, `${JSON.stringify(this.state, null, 2)}\n`, "utf8");
  }

  getStatus() {
    return {
      running: this.runtime.running,
      mode: this.mode === "watch" && this.webhookAddress ? "push_watch" : "manual_only",
      folder_name: this.folderName,
      folder_id: this.runtime.folderId,
      output_file: relativeFromRoot(this.outputFile),
      watch_channel: this.state.watch_channel,
      last_run_at: this.state.last_run_at,
      last_success_at: this.state.last_success_at,
      last_error: this.state.last_error,
      last_result: this.state.last_result,
      last_detected_files: this.runtime.lastDetectedFiles,
    };
  }

  start() {
    if (this.mode !== "watch" || !this.webhookAddress) return;
    if (this.runtime.renewTimer) return;

    this.runtime.renewTimer = setInterval(() => {
      this.ensureWatchChannel(false).catch((error) => {
        this.state.last_error = error instanceof Error ? error.message : String(error);
      });
    }, this.watchRenewIntervalMs);
  }

  stop() {
    if (!this.runtime.renewTimer) return;
    clearInterval(this.runtime.renewTimer);
    this.runtime.renewTimer = null;
  }

  async ensureWatchChannel(force = false) {
    if (!this.webhookAddress) return null;

    const current = this.state.watch_channel;
    const exp = Number(current?.expiration || 0);
    const expSoon = exp > 0 && exp - Date.now() < 5 * 60 * 1000;
    if (!force && current && !expSoon) return current;

    const channelId = randomUUID();
    const res = await this.drive.changes.watch({
      pageToken: this.state.page_token,
      supportsAllDrives: Boolean(this.sharedDriveId),
      includeItemsFromAllDrives: Boolean(this.sharedDriveId),
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: this.webhookAddress,
        token: this.webhookToken || undefined,
      },
    });

    this.state.watch_channel = {
      id: res.data.id,
      resourceId: res.data.resourceId,
      resourceUri: res.data.resourceUri,
      expiration: res.data.expiration,
      address: this.webhookAddress,
      created_at: nowIso(),
    };

    await this.saveState();
    return this.state.watch_channel;
  }

  async processPendingChanges(trigger = "manual") {
    if (this.runtime.running) {
      return { skipped: true, reason: "sync_in_progress" };
    }

    this.runtime.running = true;
    this.state.last_run_at = nowIso();

    try {
      if (this.mode !== "watch") {
        return this.processByFolderListing(trigger);
      }

      const inputFiles = [];
      const changedMeta = [];
      let nextPageToken = this.state.page_token;
      let newStartPageToken = null;

      do {
        const response = await this.drive.changes.list({
          pageToken: nextPageToken,
          fields:
            "nextPageToken,newStartPageToken,changes(fileId,removed,file(id,name,mimeType,modifiedTime,parents,trashed))",
          supportsAllDrives: Boolean(this.sharedDriveId),
          includeItemsFromAllDrives: Boolean(this.sharedDriveId),
        });

        const changes = Array.isArray(response.data.changes) ? response.data.changes : [];
        for (const change of changes) {
          if (change.removed) continue;
          if (!isSupportedFile(change)) continue;

          const parents = change.file.parents || [];
          if (!parents.includes(this.runtime.folderId)) continue;

          changedMeta.push({
            id: change.file.id,
            name: change.file.name,
            modifiedTime: change.file.modifiedTime,
          });

          const downloaded = await downloadDriveFile({
            drive: this.drive,
            file: change.file,
            outputDir: INBOX_DIR,
          });
          if (!downloaded) continue;

          const domain = inferDomainFromFileName(change.file.name);
          inputFiles.push({
            key: `gdrive_${toSafeKey(change.file.id)}`,
            domain,
            path: downloaded.path,
            type: downloaded.type,
          });

          this.state.files[change.file.id] = {
            name: change.file.name,
            modifiedTime: change.file.modifiedTime,
            domain,
            type: downloaded.type,
            localPath: relativeFromRoot(downloaded.path),
            updatedAt: nowIso(),
          };
        }

        nextPageToken = response.data.nextPageToken || null;
        if (response.data.newStartPageToken) {
          newStartPageToken = response.data.newStartPageToken;
        }
      } while (nextPageToken);

      if (newStartPageToken) {
        this.state.page_token = newStartPageToken;
      }

      this.runtime.lastDetectedFiles = changedMeta;

      if (inputFiles.length === 0) {
        this.state.last_result = {
          trigger,
          detected: changedMeta.length,
          processed: 0,
          pushed: 0,
          at: nowIso(),
        };
        await this.saveState();
        return this.state.last_result;
      }

      const extractResult = await runEventExtraction({
        apiKey: this.env.GROQ_API_KEY || process.env.GROQ_API_KEY,
        model: this.model,
        inputFiles,
        outputFile: this.outputFile,
        maxEventsPerSource: this.maxEventsPerSource,
      });

      const pushResult = await runEventPush({
        inputFile: extractResult.outputFile,
        table: this.table,
        batchSize: Number(this.env.SUPABASE_BATCH_SIZE || process.env.SUPABASE_BATCH_SIZE || 200),
        supabaseUrl: this.env.SUPABASE_URL || process.env.SUPABASE_URL,
        serviceRoleKey: this.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      });

      this.state.last_success_at = nowIso();
      this.state.last_error = null;
      this.state.last_result = {
        trigger,
        detected: changedMeta.length,
        processed: inputFiles.length,
        event_count: extractResult.eventCount,
        pushed: pushResult.pushedCount,
        output_file: relativeFromRoot(extractResult.outputFile),
        at: nowIso(),
      };

      await this.saveState();
      return this.state.last_result;
    } catch (error) {
      this.state.last_error = error instanceof Error ? error.message : String(error);
      await this.saveState();
      throw error;
    } finally {
      this.runtime.running = false;
    }
  }

  async processByFolderListing(trigger) {
    const listed = await listFilesInFolder({
      drive: this.drive,
      folderId: this.runtime.folderId,
      sharedDriveId: this.sharedDriveId,
      pageSize: 200,
    });

    const candidates = listed.filter((file) => isSupportedFile({ file, removed: false }));
    const changed = candidates.filter((file) => isNewOrUpdatedByState(file, this.state.files));
    this.runtime.lastDetectedFiles = changed.map((x) => ({
      id: x.id,
      name: x.name,
      modifiedTime: x.modifiedTime,
    }));

    if (changed.length === 0) {
      this.state.last_result = {
        trigger,
        detected: 0,
        processed: 0,
        pushed: 0,
        at: nowIso(),
      };
      await this.saveState();
      return this.state.last_result;
    }

    const inputFiles = [];
    for (const file of changed) {
      const downloaded = await downloadDriveFile({
        drive: this.drive,
        file,
        outputDir: INBOX_DIR,
      });
      if (!downloaded) continue;

      const domain = inferDomainFromFileName(file.name);
      inputFiles.push({
        key: `gdrive_${toSafeKey(file.id)}`,
        domain,
        path: downloaded.path,
        type: downloaded.type,
      });

      this.state.files[file.id] = {
        name: file.name,
        modifiedTime: file.modifiedTime,
        domain,
        type: downloaded.type,
        localPath: relativeFromRoot(downloaded.path),
        updatedAt: nowIso(),
      };
    }

    if (inputFiles.length === 0) {
      this.state.last_result = {
        trigger,
        detected: changed.length,
        processed: 0,
        pushed: 0,
        at: nowIso(),
      };
      await this.saveState();
      return this.state.last_result;
    }

    const extractResult = await runEventExtraction({
      apiKey: this.env.GROQ_API_KEY || process.env.GROQ_API_KEY,
      model: this.model,
      inputFiles,
      outputFile: this.outputFile,
      maxEventsPerSource: this.maxEventsPerSource,
    });

    const pushResult = await runEventPush({
      inputFile: extractResult.outputFile,
      table: this.table,
      batchSize: Number(this.env.SUPABASE_BATCH_SIZE || process.env.SUPABASE_BATCH_SIZE || 200),
      supabaseUrl: this.env.SUPABASE_URL || process.env.SUPABASE_URL,
      serviceRoleKey: this.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    this.state.last_success_at = nowIso();
    this.state.last_error = null;
    this.state.last_result = {
      trigger,
      detected: changed.length,
      processed: inputFiles.length,
      event_count: extractResult.eventCount,
      pushed: pushResult.pushedCount,
      output_file: relativeFromRoot(extractResult.outputFile),
      at: nowIso(),
    };

    await this.saveState();
    return this.state.last_result;
  }

  async handleWebhook(headers = {}) {
    const gotToken = headers["x-goog-channel-token"] || headers["X-Goog-Channel-Token"];
    if (this.webhookToken && gotToken !== this.webhookToken) {
      return { ok: false, ignored: true, reason: "invalid_channel_token" };
    }

    const resourceState = headers["x-goog-resource-state"] || headers["X-Goog-Resource-State"];
    if (!resourceState) {
      return { ok: false, ignored: true, reason: "missing_resource_state" };
    }

    return this.processPendingChanges(`webhook:${String(resourceState)}`);
  }
}
