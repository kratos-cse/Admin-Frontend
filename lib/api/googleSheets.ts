import { apiFetchData } from "./client";

export type GoogleSheetsIntegrationStatus = {
  sync_enabled: boolean;
  credentials_configured: boolean;
  token_valid: boolean | null;
  master_spreadsheet_id: string | null;
  token_error?: string | null;
};

export type EventSheetSyncResult = {
  success: boolean;
  spreadsheet_id: string;
  spreadsheet_url: string;
  worksheet_title: string;
  synced_count: number;
  failed_count: number;
  errors: string[];
};

export function fetchGoogleSheetsStatus() {
  return apiFetchData<GoogleSheetsIntegrationStatus>("/admin/google-sheets/status", { auth: true });
}

export function syncEventGoogleSheet(eventId: string) {
  return apiFetchData<EventSheetSyncResult>(`/admin/events/${eventId}/sync-sheet`, {
    method: "POST",
    auth: true,
  });
}
