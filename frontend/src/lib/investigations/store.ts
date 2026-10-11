import type { DocumentItem } from "@/types/document";
import type { QueryResult } from "@/types/rag";

export interface InvestigationSummary {
  id: string;
  title: string;
  document_id: string;
  document_title: string;
  updated_at: string;
  run_count: number;
}

export interface InvestigationRun {
  id: string;
  question: string;
  result: QueryResult;
  created_at: string;
}

export interface InvestigationDetail extends InvestigationSummary {
  created_at: string;
  runs: InvestigationRun[];
}

const DATABASE_NAME = "dragn-local-history";
const DATABASE_VERSION = 2;
const STORE_NAME = "investigations";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("Local investigation history is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
        return;
      }

      const store = request.transaction!.objectStore(STORE_NAME);
      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) return;
        const record = cursor.value as Record<string, unknown>;
        if (!Array.isArray(record.runs)) {
          const runs = Array.isArray(record.turns) ? record.turns : [];
          record.runs = runs;
          record.run_count = runs.length;
          delete record.turns;
          delete record.turn_count;
          cursor.update(record);
        }
        cursor.continue();
      };
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local history."));
  });
}

function readAll(database: IDBDatabase): Promise<InvestigationDetail[]> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as InvestigationDetail[]);
    request.onerror = () => reject(request.error ?? new Error("Could not read local history."));
  });
}

export async function getInvestigations(): Promise<InvestigationSummary[]> {
  const database = await openDatabase();
  try {
    const items = await readAll(database);
    return items
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
      .map((item) => ({
        id: item.id,
        title: item.title,
        document_id: item.document_id,
        document_title: item.document_title,
        updated_at: item.updated_at,
        run_count: item.run_count,
      }));
  } finally {
    database.close();
  }
}

export async function getInvestigation(id: string): Promise<InvestigationDetail> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        if (request.result) resolve(request.result as InvestigationDetail);
        else reject(new Error("Saved investigation was not found on this device."));
      };
      request.onerror = () => reject(request.error ?? new Error("Could not read saved investigation."));
    });
  } finally {
    database.close();
  }
}

function titleFromFirstQuestion(question: string): string {
  const normalized = question.trim().replace(/\s+/g, " ");
  const characters = Array.from(normalized);
  return characters.length > 72 ? `${characters.slice(0, 71).join("").trimEnd()}…` : normalized;
}

export async function saveInvestigationRun(
  document: DocumentItem,
  investigationId: string | undefined,
  run: InvestigationRun,
): Promise<string> {
  const database = await openDatabase();
  try {
    const existing = investigationId
      ? await new Promise<InvestigationDetail | undefined>((resolve, reject) => {
          const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(investigationId);
          request.onsuccess = () => resolve(request.result as InvestigationDetail | undefined);
          request.onerror = () => reject(request.error ?? new Error("Could not find saved investigation."));
        })
      : undefined;
    const id = existing ? investigationId! : window.crypto.randomUUID();
    const now = new Date().toISOString();
    const record: InvestigationDetail = existing
      ? { ...existing, updated_at: now, runs: [...existing.runs, run], run_count: existing.runs.length + 1 }
      : {
          id,
          title: titleFromFirstQuestion(run.question),
          document_id: document.id,
          document_title: document.title,
          created_at: now,
          updated_at: now,
          runs: [run],
          run_count: 1,
        };

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save investigation."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Saving investigation was interrupted."));
    });
    return id;
  } finally {
    database.close();
  }
}

export async function renameInvestigation(id: string, title: string): Promise<void> {
  const normalizedTitle = title.trim().replace(/\s+/g, " ");
  if (!normalizedTitle) throw new Error("Investigation name cannot be empty.");

  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        if (!request.result) {
          transaction.abort();
          reject(new Error("Saved investigation was not found on this device."));
          return;
        }
        store.put({ ...request.result, title: normalizedTitle, updated_at: new Date().toISOString() });
      };
      request.onerror = () => reject(request.error ?? new Error("Could not rename investigation."));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not rename investigation."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Renaming investigation was interrupted."));
    });
  } finally {
    database.close();
  }
}

export async function deleteInvestigation(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not delete investigation."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Deleting investigation was interrupted."));
    });
  } finally {
    database.close();
  }
}
