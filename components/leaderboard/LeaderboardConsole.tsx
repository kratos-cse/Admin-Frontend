"use client";

import { useEffect, useState, type FormEvent } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useAuth } from "@/context/AuthProvider";
import {
  awardPoints, createLeaderboardCollege, syncLeaderboardMetadata, voidPoints,
} from "@/lib/api/leaderboard";
import { ApiError } from "@/lib/api/client";
import { leaderboardError, ordinal, parsePoints } from "@/lib/leaderboard";
import type { LeaderboardCollege, LeaderboardEvent, LeaderboardRow } from "@/types/leaderboard";
import { useLeaderboardFeed, type LeaderboardTab } from "./useLeaderboardFeed";
import styles from "./leaderboard.module.css";

function timestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

function Placement({ value }: { value: number | null | undefined }) {
  return value ? <span className={`${styles.place} ${value <= 3 ? styles.podiumPlace : ""}`}>{ordinal(value)}</span> : <span className="muted">—</span>;
}

function AwardRow({ row, eventId, busy, onSave, onVoid }: {
  row: LeaderboardRow;
  eventId: string;
  busy: boolean;
  onSave: (collegeId: string, points: number, note: string | null) => Promise<boolean>;
  onVoid: (row: LeaderboardRow) => void;
}) {
  const current = row.breakdown.find((item) => item.event_id === eventId);
  const currentPoints = current?.points;
  const [points, setPoints] = useState(current ? String(current.points) : "");
  const [note, setNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!dirty) setPoints(currentPoints === undefined ? "" : String(currentPoints));
  }, [currentPoints, dirty]); // Only refresh clean inputs; another row's save must not erase a draft.

  async function save() {
    const parsed = parsePoints(points);
    if (parsed === null) {
      setError("Enter a whole number from 0 to 100,000.");
      return;
    }
    setError("");
    if (await onSave(row.college_id, parsed, note.trim() || null)) {
      setDirty(false);
      setNote("");
    }
  }

  return (
    <tr>
      <th scope="row" className={styles.collegeName}>{row.college}</th>
      <td data-label="Points">
        <div className={styles.scoreInput}>
          <input aria-label={`Points for ${row.college}`} aria-invalid={Boolean(error)} aria-describedby={error ? `points-error-${row.college_id}` : undefined}
            type="number" min={0} max={100000} step={1} value={points} placeholder="0" disabled={busy}
            onChange={(event) => { setPoints(event.target.value); setDirty(true); setError(""); }}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void save(); } }} />
          <small className="muted">{current ? `Saved: ${current.points} pts` : "Not awarded"}{dirty ? " · Unsaved" : ""}</small>
          {error && <small id={`points-error-${row.college_id}`} className={styles.errorText} role="alert">{error}</small>}
        </div>
      </td>
      <td data-label="Placement"><Placement value={current?.placement} /></td>
      <td data-label="New note">
        <input aria-label={`Note for ${row.college}`} type="text" maxLength={500} value={note} disabled={busy} placeholder="Optional note for this save"
          onChange={(event) => { setNote(event.target.value); setDirty(true); }} />
      </td>
      <td data-label="Actions"><div className="row-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void save()}>Save</button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !current} onClick={() => onVoid(row)}>Clear</button>
      </div></td>
    </tr>
  );
}

export default function LeaderboardConsole() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<LeaderboardTab>("award");
  const [events, setEvents] = useState<LeaderboardEvent[]>([]);
  const [colleges, setColleges] = useState<LeaderboardCollege[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [awardEvent, setAwardEvent] = useState("");
  const [boardEvent, setBoardEvent] = useState("");
  const [historyEvent, setHistoryEvent] = useState("");
  const [historyCollege, setHistoryCollege] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [revision, setRevision] = useState(0);
  const [metadataRevision, setMetadataRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [clearRow, setClearRow] = useState<LeaderboardRow | null>(null);
  const eventId = tab === "award" ? awardEvent : tab === "board" ? boardEvent : historyEvent;
  const feed = useLeaderboardFeed(tab, eventId, tab === "history" ? historyCollege : "", revision);
  const syncDisabled = Boolean(accessError || feed.accessDenied);

  useEffect(() => {
    if (syncDisabled) return;
    let controller: AbortController | undefined;
    let disposed = false;
    let inFlight = false;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setMetadataLoading(true);

    async function sync() {
      if (disposed || stopped || inFlight || document.hidden) return;
      inFlight = true;
      const requestController = new AbortController();
      controller = requestController;
      const timeout = setTimeout(() => requestController.abort(), 15000);
      try {
        const { events: nextEvents, colleges: nextColleges } = await syncLeaderboardMetadata(requestController.signal);
        if (disposed) return;
        setEvents(nextEvents);
        setColleges(nextColleges);
        setAwardEvent((previous) => nextEvents.some((item) => item.id === previous) ? previous : nextEvents[0]?.id ?? "");
        setMetadataError(null);
        setRevision((previous) => previous + 1);
      } catch (error) {
        if (disposed) return;
        const status = error instanceof ApiError ? error.status : 0;
        stopped = status === 401 || status === 403 || status === 404;
        setMetadataError(requestController.signal.aborted ? "College sync timed out. Existing data is still shown; refresh or wait for the next sync." : leaderboardError(error));
        if (status === 401 || status === 403) setAccessError(leaderboardError(error));
      } finally {
        clearTimeout(timeout);
        inFlight = false;
        if (!disposed) {
          setMetadataLoading(false);
          if (!stopped && !document.hidden) timer = setTimeout(sync, 30000);
        }
      }
    }

    function visibilityChanged() {
      clearTimeout(timer);
      if (!document.hidden) void sync();
    }

    void sync();
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [metadataRevision, syncDisabled]);

  function reload() {
    setRevision((previous) => previous + 1);
    setMetadataRevision((previous) => previous + 1);
  }

  async function mutate(operation: () => Promise<unknown>, success: string) {
    setBusy(true);
    setActionError(null);
    setNotice("");
    try {
      await operation();
      setNotice(success);
      reload();
      return true;
    } catch (error) {
      setActionError(leaderboardError(error));
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) setAccessError(leaderboardError(error));
      if (error instanceof ApiError && error.status === 409) reload();
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addCollege(event: FormEvent) {
    event.preventDefault();
    const name = collegeName.trim();
    if (!name) return;
    if (await mutate(() => createLeaderboardCollege(name), `${name} added.`)) setCollegeName("");
  }

  const error = accessError || (feed.accessDenied ? feed.error : null);
  if (error) return <div className="state-error" role="alert"><p>{error}</p><button type="button" className="btn btn-ghost" onClick={() => void signOut()}>Sign out and sign in again</button></div>;

  const board = feed.board;
  const eventOptions = events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>);
  const firstLoad = (metadataLoading && !events.length) || (feed.loading && !board && tab !== "history");

  return (
    <>
      <PageHeader eyebrow="Competition" title="Leaderboard & points"
        description="Award points to colleges for each event. Saved scores update the standings and remain in the award history."
        actions={<button type="button" className="btn btn-ghost" disabled={busy || metadataLoading || feed.loading} onClick={reload}>Refresh</button>} />
      <div role="status" aria-live="polite" className={styles.notice}>{notice}</div>
      {actionError && <p className="state-error" role="alert">{actionError}</p>}
      {metadataError && <p className="state-error" role="alert">{metadataError}</p>}
      {feed.error && !metadataError && <p className="state-error" role="alert">{feed.error} {feed.updatedAt && `Showing data last received ${timestamp(feed.updatedAt)}.`}</p>}
      <Tabs.Root value={tab} onValueChange={(value) => { setTab(value as LeaderboardTab); setNotice(""); setActionError(null); }}>
        <Tabs.List aria-label="Leaderboard sections" className={styles.tabs}>
          <Tabs.Trigger value="award" disabled={busy}>Award points</Tabs.Trigger>
          <Tabs.Trigger value="board" disabled={busy}>Leaderboard</Tabs.Trigger>
          <Tabs.Trigger value="history" disabled={busy}>History</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="award" className={styles.panel}>
          <div className="toolbar">
            <div className={styles.eventField}><label htmlFor="award-event">Event</label><select id="award-event" value={awardEvent} disabled={busy || metadataLoading} onChange={(event) => setAwardEvent(event.target.value)}>
              {!events.length && <option value="">No events available</option>}{eventOptions}
            </select></div>
          </div>
          <form className={styles.addForm} onSubmit={(event) => void addCollege(event)}>
            <label htmlFor="college-name">Add a college</label>
            <input id="college-name" value={collegeName} maxLength={200} required placeholder="College name" disabled={busy || Boolean(metadataError)} onChange={(event) => setCollegeName(event.target.value)} />
            <button type="submit" className="btn btn-ghost" disabled={busy || !collegeName.trim() || Boolean(metadataError)}>Add college</button>
          </form>
          <p className={styles.help}>Colleges stay in sync with registrations automatically. Each save replaces this college’s score and note for the selected event. Earlier awards stay in History. Placement comes from points; ties share a place.</p>
          {firstLoad ? <TableSkeleton columns={5} label="Loading event scores" /> : !metadataError && !feed.error && !events.length ? <div className="empty-state">No events yet. Create an event in the Events page first.</div> : board && !board.rows.length ? <div className="empty-state">No active colleges yet. Colleges appear automatically from registrations, or you can add one above.</div> : board && (
            <div className="table-wrap"><table className={`data ${styles.awardTable}`}><caption className="sr-only">College points for {events.find((event) => event.id === awardEvent)?.name}</caption>
              <thead><tr><th scope="col">College</th><th scope="col">Points</th><th scope="col">Placement</th><th scope="col">New note</th><th scope="col">Actions</th></tr></thead>
              <tbody>{board.rows.map((row) => <AwardRow key={`${awardEvent}:${row.college_id}`} row={row} eventId={awardEvent} busy={busy}
                onSave={(collegeId, points, note) => mutate(async () => { feed.replaceBoard(await awardPoints(awardEvent, collegeId, points, note)); }, `${row.college}: ${points} points saved.`)}
                onVoid={setClearRow} />)}</tbody>
            </table></div>
          )}
        </Tabs.Content>

        <Tabs.Content value="board" className={styles.panel}>
          <div className={styles.boardToolbar}>
            <div className={styles.eventField}><label htmlFor="board-event">Standings</label><select id="board-event" value={boardEvent} disabled={metadataLoading} onChange={(event) => setBoardEvent(event.target.value)}><option value="">Overall (all events)</option>{eventOptions}</select></div>
            <p className="muted" role="status">{feed.error ? "Disconnected · data may be out of date" : feed.updatedAt ? "Live · refreshes every 3 seconds while visible" : "Connecting…"}<br />{feed.updatedAt && <>Last received <time dateTime={feed.updatedAt}>{timestamp(feed.updatedAt)}</time></>}</p>
          </div>
          {firstLoad ? <TableSkeleton columns={5} label="Loading leaderboard" /> : board && <>
            {board.podium.length > 0 && <div className={styles.podium} aria-label="Podium">{board.podium.map((row) => <article key={row.college_id} className={styles.podiumEntry}>
              <p className={styles.podiumRank}>{ordinal(row.rank)} place</p><h2>{row.college}</h2><p className={styles.podiumPoints}>{row.total_points.toLocaleString()} <span>pts</span></p>
            </article>)}</div>}
            {!board.rows.length ? <div className="empty-state">No active colleges yet. Colleges appear automatically from registrations.</div> : <div className="table-wrap"><table className={`data ${styles.standingsTable}`}>
              <caption className="sr-only">{boardEvent ? "Event standings" : "Overall college standings"}</caption>
              <thead><tr><th scope="col">Rank</th><th scope="col">College</th><th scope="col">Points</th><th scope="col">Events scored</th><th scope="col">Breakdown</th></tr></thead>
              <tbody>{board.rows.map((row) => <tr key={row.college_id}>
                <td data-label="Rank"><Placement value={row.total_points > 0 ? row.rank : null} /></td><th scope="row" className={styles.collegeName}>{row.college}</th>
                <td data-label="Points" className={styles.number}>{row.total_points.toLocaleString()}</td><td data-label="Events scored" className={styles.number}>{row.events_scored}</td>
                <td data-label="Breakdown">{row.breakdown.length ? <details><summary>View events<span className="sr-only"> for {row.college}</span></summary><ul className={styles.breakdown}>{row.breakdown.map((item) => <li key={item.event_id}><span>{item.event}{item.placement ? ` · ${ordinal(item.placement)}` : ""}</span><b>{item.points} pts</b></li>)}</ul></details> : <span className="muted">No awards</span>}</td>
              </tr>)}</tbody>
            </table></div>}
          </>}
        </Tabs.Content>

        <Tabs.Content value="history" className={styles.panel}>
          <div className="toolbar">
            <div className={styles.eventField}><label htmlFor="history-event">Event</label><select id="history-event" value={historyEvent} disabled={metadataLoading} onChange={(event) => setHistoryEvent(event.target.value)}><option value="">All events</option>{eventOptions}</select></div>
            <div className={styles.eventField}><label htmlFor="history-college">College</label><select id="history-college" value={historyCollege} disabled={metadataLoading} onChange={(event) => setHistoryCollege(event.target.value)}><option value="">All colleges</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}{college.is_active ? "" : " (inactive)"}</option>)}</select></div>
          </div>
          <p className={styles.help}>Latest {feed.awards.length} awards (up to 500), newest first. Filter by event or college to narrow the history. Voided awards remain recorded.</p>
          {feed.loading && !feed.updatedAt ? <TableSkeleton columns={7} label="Loading award history" /> : !feed.error && !feed.awards.length ? <div className="empty-state">No awards for this selection. Saved awards and corrections will appear here.</div> : feed.awards.length > 0 && <div className="table-wrap"><table className={`data ${styles.historyTable}`}>
            <caption className="sr-only">Award history</caption><thead><tr><th scope="col">Created</th><th scope="col">Event / college</th><th scope="col">Points</th><th scope="col">Current placement</th><th scope="col">Note</th><th scope="col">Awarded by</th><th scope="col">Status</th></tr></thead>
            <tbody>{feed.awards.map((award) => <tr key={award.id} className={award.voided_at ? styles.voided : ""}>
              <td data-label="Created"><time dateTime={award.created_at ?? undefined}>{timestamp(award.created_at)}</time></td>
              <td data-label="Event / college"><div><strong>{award.event}</strong><br />{award.college}</div></td>
              <td data-label="Points" className={styles.number}>{award.points}</td><td data-label="Current placement"><Placement value={award.placement} /></td>
              <td data-label="Note">{award.note || "—"}</td><td data-label="Awarded by" className={styles.actor}>{award.awarded_by || "—"}</td>
              <td data-label="Status">{award.voided_at ? <span>Voided · {award.void_reason}<br /><time dateTime={award.voided_at}>{timestamp(award.voided_at)}</time></span> : <span className="pill">Active</span>}</td>
            </tr>)}</tbody>
          </table></div>}
        </Tabs.Content>
      </Tabs.Root>

      <Dialog.Root open={Boolean(clearRow)} onOpenChange={(open) => { if (!open && !busy) setClearRow(null); }}>
        <Dialog.Portal><Dialog.Overlay className="dialog-backdrop" /><Dialog.Content className={`dialog ${styles.confirmDialog}`} onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onInteractOutside={(event) => { if (busy) event.preventDefault(); }}>
          <Dialog.Title>Clear this award?</Dialog.Title><Dialog.Description className="muted">Remove {clearRow?.college}’s points for {events.find((event) => event.id === awardEvent)?.name}. The award stays in History.</Dialog.Description>
          <div className="dialog-actions"><Dialog.Close asChild><button className="btn btn-ghost" disabled={busy}>Cancel</button></Dialog.Close><button className="btn btn-danger" disabled={busy} onClick={async () => {
            if (clearRow) {
              await mutate(async () => { feed.replaceBoard(await voidPoints(awardEvent, clearRow.college_id)); }, `${clearRow.college}: award cleared.`);
              setClearRow(null);
            }
          }}>{busy ? "Clearing…" : "Clear award"}</button></div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
