'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type ResourceKey = 'events' | 'matches' | 'sessions' | 'results' | 'games' | 'members' | 'officers' | 'achievements' | 'contact';
type SectionKey = ResourceKey | 'users' | 'account' | 'activity';
type Field = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'url' | 'date' | 'datetime-local' | 'number' | 'textarea' | 'checkbox' | 'select';
  required?: boolean;
  options?: string[];
  maxLength?: number;
  pattern?: string;
  inputMode?: 'text' | 'numeric';
};
type Resource = {
  label: string;
  endpoint: string;
  collection: string;
  fields: Field[];
};
type Entry = Record<string, unknown> & { id?: string };
type AdminUser = { id: string; email: string; username: string | null; name: string; role: 'OWNER' | 'ADMIN' | 'MODERATOR'; isActive: boolean };
type AdminActivity = {
  id: string;
  actorUsername: string | null;
  actorName: string;
  actorEmail: string;
  action: string;
  entity: string;
  itemLabel: string;
  createdAt: string;
};
type AdminProfile = Pick<AdminUser, 'id' | 'email' | 'username' | 'name' | 'role'>;

const resources: Record<ResourceKey, Resource> = {
  events: {
    label: 'Events',
    endpoint: '/api/admin/events',
    collection: 'events',
    fields: [
      { name: 'title', label: 'Event title', required: true },
      { name: 'dateStr', label: 'Date label', required: true },
      { name: 'timeStr', label: 'Start time', required: true },
      { name: 'endTimeStr', label: 'End time (e.g. 20:00)' },
      { name: 'isoDate', label: 'Date and time', type: 'datetime-local', required: true },
      { name: 'discipline', label: 'Game / discipline', required: true },
      { name: 'location', label: 'Location', required: true },
      { name: 'locationSub', label: 'Location details' },
      { name: 'format', label: 'Format', required: true },
      { name: 'formatSub', label: 'Format details' },
      { name: 'statusBadge', label: 'Status badge' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'report', label: 'Event report (shown in archive only)', type: 'textarea' },
      { name: 'slotsFilled', label: 'Slots filled', type: 'number' },
      { name: 'slotsTotal', label: 'Total slots', type: 'number' },
      { name: 'isSpotlight', label: 'Feature this event', type: 'checkbox' },
    ],
  },
  matches: {
    label: 'Matches',
    endpoint: '/api/admin/matches',
    collection: 'matches',
    fields: [
      { name: 'discipline', label: 'Game / discipline', required: true },
      { name: 'datetime', label: 'Date and time label', required: true },
      { name: 'isoDate', label: 'Date and time', type: 'datetime-local', required: true },
      { name: 'opponent', label: 'Opponent', required: true },
      { name: 'league', label: 'League', required: true },
      { name: 'streamType', label: 'Broadcast type' },
      { name: 'streamUrl', label: 'Stream URL', type: 'url' },
    ],
  },
  sessions: {
    label: 'Weekly activities',
    endpoint: '/api/admin/sessions',
    collection: 'sessions',
    fields: [
      { name: 'tag', label: 'Category', required: true },
      { name: 'title', label: 'Activity title', required: true },
      { name: 'time', label: 'Time', required: true },
      { name: 'location', label: 'Location', required: true },
      { name: 'details', label: 'Details', type: 'textarea' },
    ],
  },
  results: {
    label: 'Results',
    endpoint: '/api/admin/results',
    collection: 'results',
    fields: [
      { name: 'discipline', label: 'Game / discipline', required: true },
      { name: 'league', label: 'League' },
      { name: 'badge', label: 'Outcome', type: 'select', options: ['WIN', 'SWEEP', 'COMPLETED', 'LOSS'], required: true },
      { name: 'team1', label: 'Team one', required: true },
      { name: 'score1', label: 'Score one', required: true },
      { name: 'team2', label: 'Team two', required: true },
      { name: 'score2', label: 'Score two', required: true },
      { name: 'subtext', label: 'Result notes', type: 'textarea' },
    ],
  },
  games: {
    label: 'Games & teams',
    endpoint: '/api/admin/games',
    collection: 'games',
    fields: [
      { name: 'slug', label: 'URL-safe ID (e.g. valorant)', required: true },
      { name: 'name', label: 'Game / team name', required: true },
      { name: 'tag', label: 'Short tag', required: true },
      { name: 'divisionBadge', label: 'Division', required: true },
      { name: 'category', label: 'Platform', type: 'select', options: ['PC', 'CONSOLE', 'MOBILE'], required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'captain', label: 'Captain', required: true },
      { name: 'practiceSchedule', label: 'Practice schedule', required: true },
      { name: 'status', label: 'Roster status', required: true },
      { name: 'statusType', label: 'Status type', type: 'select', options: ['open', 'scrims', 'active', 'recruiting'], required: true },
      { name: 'league', label: 'League', required: true },
      { name: 'accentColor', label: 'Accent color (hex)' },
      { name: 'badgeBg', label: 'Badge background (rgba)' },
      { name: 'gameArt', label: 'Game art URL', type: 'url', required: true },
      { name: 'tagline', label: 'Tagline', required: true },
    ],
  },
  members: {
    label: 'Team rosters',
    endpoint: '/api/admin/members',
    collection: 'members',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'handle', label: 'Handle', required: true },
      { name: 'role', label: 'Team role', required: true },
      { name: 'gameSlug', label: 'Game slug', required: true },
      { name: 'yearMajor', label: 'Year and major', required: true },
      { name: 'tag', label: 'Roster details', required: true },
      { name: 'imageUrl', label: 'Image URL', type: 'url' },
      { name: 'order', label: 'Display order', type: 'number' },
    ],
  },
  officers: {
    label: 'Committee & members',
    endpoint: '/api/admin/officers',
    collection: 'officers',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'group', label: 'Committee section', type: 'select', options: ['President', 'Core Executive', 'Senior Coordinator', 'Junior Coordinator'], required: true },
      { name: 'role', label: 'Post', required: true, maxLength: 100 },
      { name: 'department', label: 'Department (A)', required: true, maxLength: 20, pattern: '[A-Za-z]+' },
      { name: 'studentNumber', label: 'Unique number (B)', required: true, maxLength: 12, pattern: '[0-9]+', inputMode: 'numeric' },
      { name: 'enrollmentYear', label: 'Enrollment year (C)', required: true, maxLength: 4, pattern: '[0-9]{2,4}', inputMode: 'numeric' },
      { name: 'order', label: 'Display order', type: 'number' },
    ],
  },
  achievements: {
    label: 'Achievements',
    endpoint: '/api/admin/achievements',
    collection: 'achievements',
    fields: [
      { name: 'title', label: 'Achievement', required: true },
      { name: 'game', label: 'Game / discipline', required: true },
      { name: 'award', label: 'Award / placement', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'description', label: 'Details', type: 'textarea', required: true },
      { name: 'imageUrl', label: 'Image URL', type: 'url' },
      { name: 'order', label: 'Display order', type: 'number' },
    ],
  },
  contact: {
    label: 'Contact inbox',
    endpoint: '/api/admin/contact',
    collection: 'submissions',
    fields: [],
  },
};

const resourceKeys = Object.keys(resources) as ResourceKey[];

function emptyForm(resource: Resource): Record<string, string | boolean> {
  return Object.fromEntries(
    resource.fields.map((field) => [
      field.name,
      field.type === 'checkbox' ? false : '',
    ])
  );
}

function displayDateTime(value: unknown) {
  if (typeof value !== 'string') return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 16);
}

function displayDate(value: unknown) {
  if (typeof value !== 'string') return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
}

function EventReportPanel({ eventId, eventDiscipline, images, onChanged }: {
  eventId: string;
  eventDiscipline: string;
  images: { id: string; url: string }[];
  onChanged: () => Promise<void>;
}) {
  const [boxes, setBoxes] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelError, setPanelError] = useState('');
  const [panelNotice, setPanelNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [form, setForm] = useState({ discipline: '', league: '', badge: 'WIN', team1: '', score1: '', team2: '', score2: '', subtext: '' });
  const [boxBusy, setBoxBusy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const loadBoxes = useCallback(async () => {
    const response = await fetch('/api/admin/results', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load result boxes.');
    return (Array.isArray(data.results) ? data.results : []).filter((box: Entry) => box.eventId === eventId);
  }, [eventId]);

  useEffect(() => {
    let activeRequest = true;
    void loadBoxes()
      .then((filtered) => {
        if (activeRequest) {
          setBoxes(filtered);
          setLoading(false);
        }
      })
      .catch((boxesError: unknown) => {
        if (activeRequest) {
          setPanelError(boxesError instanceof Error ? boxesError.message : 'Could not load result boxes.');
          setLoading(false);
        }
      });
    return () => {
      activeRequest = false;
    };
  }, [loadBoxes]);

  function startForm(box?: Entry) {
    setEditingBoxId(typeof box?.id === 'string' ? box.id : null);
    setForm({
      discipline: String(box?.discipline ?? eventDiscipline),
      league: String(box?.league ?? ''),
      badge: String(box?.badge ?? 'WIN'),
      team1: String(box?.team1 ?? ''),
      score1: String(box?.score1 ?? ''),
      team2: String(box?.team2 ?? ''),
      score2: String(box?.score2 ?? ''),
      subtext: String(box?.subtext ?? ''),
    });
    setShowForm(true);
    setPanelNotice('');
    setPanelError('');
  }

  async function saveForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBoxBusy(true);
    setPanelError('');
    setPanelNotice('');
    try {
      const response = await fetch('/api/admin/results', {
        method: editingBoxId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...(editingBoxId ? { id: editingBoxId } : {}), eventId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this result box.');
      setShowForm(false);
      setEditingBoxId(null);
      setPanelNotice(editingBoxId ? 'Result box updated.' : 'Result box added to the event report.');
      setBoxes(await loadBoxes());
      await onChanged();
    } catch (saveError) {
      setPanelError(saveError instanceof Error ? saveError.message : 'Could not save this result box.');
    } finally {
      setBoxBusy(false);
    }
  }

  async function uploadImage() {
    if (!imageFile) return;
    setBoxBusy(true);
    setPanelError('');
    setPanelNotice('');
    try {
      const imageForm = new FormData();
      imageForm.set('eventId', eventId);
      imageForm.set('image', imageFile);
      const response = await fetch('/api/admin/events/report-image', { method: 'POST', body: imageForm });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not upload this image.');
      setImageFile(null);
      setFileKey((key) => key + 1);
      setPanelNotice('Image uploaded and stored as WebP.');
      await onChanged();
    } catch (uploadError) {
      setPanelError(uploadError instanceof Error ? uploadError.message : 'Could not upload this image.');
    } finally {
      setBoxBusy(false);
    }
  }

  async function removeImage(id: string) {
    if (!window.confirm('Delete this report image? This cannot be undone.')) return;
    setBoxBusy(true);
    setPanelError('');
    setPanelNotice('');
    try {
      const response = await fetch(`/api/admin/events/report-image?imageId=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete this image.');
      setPanelNotice('Report image deleted.');
      await onChanged();
    } catch (deleteError) {
      setPanelError(deleteError instanceof Error ? deleteError.message : 'Could not delete this image.');
    } finally {
      setBoxBusy(false);
    }
  }

  async function removeBox(id: string) {    if (!window.confirm('Delete this result box? This cannot be undone.')) return;
    setBoxBusy(true);
    setPanelError('');
    setPanelNotice('');
    try {
      const response = await fetch(`/api/admin/results?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete this result box.');
      if (editingBoxId === id) {
        setEditingBoxId(null);
        setShowForm(false);
      }
      setPanelNotice('Result box deleted.');
      setBoxes(await loadBoxes());
      await onChanged();
    } catch (deleteError) {
      setPanelError(deleteError instanceof Error ? deleteError.message : 'Could not delete this result box.');
    } finally {
      setBoxBusy(false);
    }
  }

  return (
    <section className="mt-6 border border-[#33343b] bg-[#0c0e14] p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline-md uppercase text-white">Event report — result boxes ({loading ? '…' : boxes.length})</h2>
        {!showForm && (
          <button onClick={() => startForm()} disabled={boxBusy} className="bg-[#cdf200] px-4 py-2 font-label-caps text-xs font-bold uppercase text-[#0a0b0e] disabled:opacity-50">
            Add result box
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-[#8f96a3]">Write the report in the event form above. Manage each outcome below — boxes appear on the archived event card and in the recent results feed.</p>
      {panelError && <p role="alert" className="mb-4 border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{panelError}</p>}
      {panelNotice && <p role="status" className="mb-4 border border-[#637500] bg-[#1d1f26] p-3 text-sm text-[#cdf200]">{panelNotice}</p>}
      <div className="mb-6 border border-[#33343b] bg-[#191b22] p-4">
        <h3 className="mb-1 font-headline-sm uppercase text-white">Report images ({images.length})</h3>
        <p className="mb-3 text-sm text-[#8f96a3]">JPEG, PNG, or WebP up to 4 MB. Stored and served as WebP. Shown in the archived event report.</p>
        <div className="flex flex-col gap-3">
          <label className="block space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
            Choose image
            <input
              key={fileKey}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && file.size > 4 * 1024 * 1024) {
                  setPanelError('Report images must be no larger than 4 MB.');
                  event.target.value = '';
                  setImageFile(null);
                  return;
                }
                setPanelError('');
                setImageFile(file);
              }}
              className="block w-full border border-[#33343b] bg-[#0c0e14] px-3 py-2 normal-case text-white file:mr-3 file:border-0 file:bg-[#cdf200] file:px-3 file:py-1 file:font-bold file:text-[#0a0b0e]"
            />
          </label>
          <div>
            <button onClick={() => void uploadImage()} disabled={boxBusy || !imageFile} className="bg-[#cdf200] px-4 py-2 font-label-caps text-xs font-bold uppercase text-[#0a0b0e] disabled:opacity-50">
              {boxBusy ? 'Uploading…' : 'Upload image'}
            </button>
          </div>
        </div>
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="border border-[#33343b] bg-[#0c0e14] p-2">
                <Image src={image.url} alt="Event report image" width={320} height={240} unoptimized className="h-32 w-full border border-[#33343b] object-cover" />
                <button onClick={() => void removeImage(image.id)} disabled={boxBusy} className="mt-2 w-full border border-red-900 px-3 py-1 text-xs uppercase text-red-200 hover:bg-red-950/40 disabled:opacity-50">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && (
        <form onSubmit={saveForm} className="mb-4 grid grid-cols-1 gap-4 border border-[#cdf200] bg-[#191b22] p-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
            Game / discipline
            <input required value={form.discipline} onChange={(event) => setForm({ ...form, discipline: event.target.value })} maxLength={100} className="w-full border border-[#33343b] bg-[#0c0e14] px-3 py-2 normal-case text-white" />
          </label>
          <label className="space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
            League
            <input value={form.league} onChange={(event) => setForm({ ...form, league: event.target.value })} maxLength={160} placeholder="Collegiate League" className="w-full border border-[#33343b] bg-[#0c0e14] px-3 py-2 normal-case text-white" />
          </label>
          <label className="space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
            Outcome
            <select value={form.badge} onChange={(event) => setForm({ ...form, badge: event.target.value })} className="w-full border border-[#33343b] bg-[#0c0e14] px-3 py-2 text-white">
              <option value="WIN">WIN</option>
              <option value="SWEEP">SWEEP</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="LOSS">LOSS</option>
            </select>
          </label>
          <label className="space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
            Notes
            <input value={form.subtext} onChange={(event) => setForm({ ...form, subtext: event.target.value })} maxLength={500} className="w-full border border-[#33343b] bg-[#0c0e14] px-3 py-2 normal-case text-white" />
          </label>
          <label className="space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
            Team one
            <input required value={form.team1} onChange={(event) => setForm({ ...form, team1: event.target.value })} maxLength={160} className="w-full border border-[#33343b] bg-[#0c0e14] px-3 py-2 normal-case text-white" />
          </label>
          <label className="space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
            Score one
            <input required value={form.score1} onChange={(event) => setForm({ ...form, score1: event.target.value })} maxLength={40} className="w-full border border-[#33343b] bg-[#0c0e14] px-3 py-2 normal-case text-white" />
          </label>
          <label className="space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
            Team two
            <input required value={form.team2} onChange={(event) => setForm({ ...form, team2: event.target.value })} maxLength={160} className="w-full border border-[#33343b] bg-[#0c0e14] px-3 py-2 normal-case text-white" />
          </label>
          <label className="space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
            Score two
            <input required value={form.score2} onChange={(event) => setForm({ ...form, score2: event.target.value })} maxLength={40} className="w-full border border-[#33343b] bg-[#0c0e14] px-3 py-2 normal-case text-white" />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={boxBusy} className="bg-[#cdf200] px-4 py-2 font-label-caps text-xs font-bold uppercase text-[#0a0b0e] disabled:opacity-50">
              {boxBusy ? 'Saving…' : editingBoxId ? 'Save changes' : 'Add box'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingBoxId(null); }} className="border border-[#33343b] px-4 py-2 text-xs uppercase text-white">Cancel</button>
          </div>
        </form>
      )}
      {boxes.length === 0 && !showForm && !loading && (
        <p className="border border-[#33343b] bg-[#191b22] p-5 text-sm text-[#8f96a3]">No result boxes yet. Add the first outcome using the button above.</p>
      )}
      <div className="space-y-3">
        {boxes.map((box) => {
          const boxId = typeof box.id === 'string' ? box.id : '';
          return (
            <article key={boxId || String(box.createdAt)} className="flex flex-wrap items-start justify-between gap-3 border border-[#33343b] bg-[#191b22] p-4">
              <div className="min-w-0">
                <h3 className="break-words font-semibold text-white">{String(box.team1 ?? '')} {String(box.score1 ?? '')} — {String(box.score2 ?? '')} {String(box.team2 ?? '')}</h3>
                <p className="mt-1 break-words text-sm text-[#8f96a3]">{String(box.discipline ?? '')} • {String(box.league ?? '')} • {String(box.badge ?? '')}</p>
                {box.subtext ? <p className="mt-1 break-words text-sm text-[#8f96a3]">{String(box.subtext)}</p> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => startForm(box)} className="border border-[#33343b] px-3 py-1 text-xs uppercase text-white hover:border-[#cdf200]">Edit</button>
                <button onClick={() => void removeBox(boxId)} disabled={!boxId || boxBusy} className="border border-red-900 px-3 py-1 text-xs uppercase text-red-200 hover:bg-red-950/40 disabled:opacity-50">Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState<SectionKey>('events');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState<Record<string, string | boolean>>(emptyForm(resources.events));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<AdminUser['role'] | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUser, setNewUser] = useState({ email: '', role: 'MODERATOR' as AdminUser['role'], message: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [eventPosterFile, setEventPosterFile] = useState<File | null>(null);
  const [officerPhotoFile, setOfficerPhotoFile] = useState<File | null>(null);

  const resource = resources[active === 'users' || active === 'account' || active === 'activity' ? 'events' : active];
  const endpoint = resource.endpoint;
  const existingEventPosterValue = active === 'events' && editingId
    ? entries.find((entry) => entry.id === editingId)?.posterUrl
    : null;
  const existingEventPoster = typeof existingEventPosterValue === 'string' ? existingEventPosterValue : null;
  const existingOfficerPhotoValue = active === 'officers' && editingId
    ? entries.find((entry) => entry.id === editingId)?.photoUrl
      ?? entries.find((entry) => entry.id === editingId)?.imageUrl
    : null;
  const existingOfficerPhoto = typeof existingOfficerPhotoValue === 'string' && existingOfficerPhotoValue
    ? existingOfficerPhotoValue
    : null;

  const loadEntries = useCallback(async () => {
    const response = await fetch(endpoint, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load this section.');
    setEntries(Array.isArray(data[resource.collection]) ? data[resource.collection] : []);
  }, [endpoint, resource.collection]);

  useEffect(() => {
    let activeRequest = true;
    void fetch('/api/admin/logout', { cache: 'no-store' })
      .then(async (response) => {
        if (activeRequest) {
          setAuthenticated(response.ok);
          if (response.ok) {
            const data = await response.json();
            setRole(data.user.role);
          }
        }
      })
      .catch(() => {
        if (activeRequest) setError('Unable to check administrator access.');
      })
      .finally(() => {
        if (activeRequest) setChecking(false);
      });
    return () => {
      activeRequest = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated || active === 'users' || active === 'account' || active === 'activity') return;
    let activeRequest = true;
    void fetch(endpoint, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load this section.');
        if (activeRequest) setEntries(Array.isArray(data[resource.collection]) ? data[resource.collection] : []);
      })
      .catch((loadError: unknown) => {
        if (activeRequest) setError(loadError instanceof Error ? loadError.message : 'Could not load this section.');
      });
    return () => {
      activeRequest = false;
    };
  }, [active, authenticated, endpoint, resource.collection]);

  useEffect(() => {
    if (!authenticated || active !== 'activity') return;
    let activeRequest = true;
    void fetch('/api/admin/activity', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load activity.');
        if (activeRequest) setActivity(data.activity);
      })
      .catch((loadError: unknown) => {
        if (activeRequest) setError(loadError instanceof Error ? loadError.message : 'Could not load activity.');
      });
    return () => {
      activeRequest = false;
    };
  }, [active, authenticated]);

  useEffect(() => {
    if (!authenticated || active !== 'account') return;
    let activeRequest = true;
    void fetch('/api/admin/profile', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load profile.');
        if (activeRequest) {
          setProfile(data.profile);
          setProfileName(data.profile.name);
          setProfileUsername(data.profile.username ?? '');
        }
      })
      .catch((loadError: unknown) => {
        if (activeRequest) setError(loadError instanceof Error ? loadError.message : 'Could not load profile.');
      });
    return () => {
      activeRequest = false;
    };
  }, [active, authenticated]);

  const fields = useMemo(() => resource.fields, [resource.fields]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed.');
      setAuthenticated(true);
      setRole(data.user.role);
      window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: data.user }));
      setPassword('');
      setNotice('Signed in successfully.');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function loadUsers() {
    const response = await fetch('/api/admin/users', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load accounts.');
    setUsers(data.users);
  }

  useEffect(() => {
    if (authenticated && active === 'users' && (role === 'OWNER' || role === 'ADMIN')) {
      let activeRequest = true;
      void fetch('/api/admin/users', { cache: 'no-store' })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Could not load accounts.');
          if (activeRequest) setUsers(data.users);
        })
        .catch((loadError: unknown) => {
          if (activeRequest) setError(loadError instanceof Error ? loadError.message : 'Could not load accounts.');
        });
      return () => {
        activeRequest = false;
      };
    }
    return undefined;
  }, [active, authenticated, role]);

  async function inviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not invite this user.');
      setNewUser({ email: '', role: 'MODERATOR', message: '' });
      setNotice('Invitation sent. The account holder must set a password within 30 minutes.');
      await loadUsers();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Could not invite this user.');
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(user: AdminUser, changes: Partial<Pick<AdminUser, 'role' | 'isActive'>>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ...changes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update this account.');
      setNotice('Account permissions updated. Any existing session was signed out.');
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update this account.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(`Delete ${user.role} account ${user.email}? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete this account.');
      setNotice('User account deleted.');
      await loadUsers();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this account.');
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not change password.');
      setCurrentPassword('');
      setNewPassword('');
      setAuthenticated(false);
      setNotice('Password changed. Sign in again with the new password.');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Could not change password.');
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, username: profileUsername }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update profile.');
      setProfile(data.profile);
      setProfileUsername(data.profile.username);
      window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: data.profile }));
      setNotice('Profile updated.');
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  }

  function startEditing(entry: Entry) {
    const values: Record<string, string | boolean> = emptyForm(resource);
    for (const field of fields) {
      const value = entry[field.name];
      if (field.type === 'checkbox') values[field.name] = value === true;
      else if (field.type === 'date') values[field.name] = displayDate(value);
      else if (field.type === 'datetime-local') values[field.name] = displayDateTime(value);
      else values[field.name] = value == null ? '' : String(value);
    }
    if (active === 'officers' && typeof entry.rollNo === 'string') {
      const [department = '', studentNumber = '', enrollmentYear = ''] = entry.rollNo.split('/');
      values.department = department;
      values.studentNumber = studentNumber;
      values.enrollmentYear = enrollmentYear;
    }
    setEditingId(typeof entry.id === 'string' ? entry.id : null);
    setEventPosterFile(null);
    setOfficerPhotoFile(null);
    setForm(values);
    setNotice('');
    setError('');
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const body: Record<string, string | number | boolean | null> = {};
      for (const field of fields) {
        const value = form[field.name];
        if (field.type === 'checkbox') body[field.name] = value === true;
        else if (field.type === 'number') body[field.name] = value === '' ? null : Number(value);
        else if (field.type === 'datetime-local' && value) body[field.name] = new Date(String(value)).toISOString();
        else body[field.name] = value === '' ? null : String(value);
      }
      if (active === 'officers') {
        const department = String(form.department ?? '').trim().toUpperCase();
        const studentNumber = String(form.studentNumber ?? '').trim();
        const enrollmentYear = String(form.enrollmentYear ?? '').trim();
        body.rollNo = `${department}/${studentNumber}/${enrollmentYear}`;
        delete body.department;
        delete body.studentNumber;
        delete body.enrollmentYear;
      }
      if (editingId) body.id = editingId;

      const response = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this item.');

      const savedEventId = active === 'events' ? String(data.event?.id ?? editingId ?? '') : '';
      const savedOfficerId = active === 'officers' ? String(data.officer?.id ?? editingId ?? '') : '';
      if (active === 'events' && eventPosterFile) {
        if (!savedEventId) throw new Error('Event saved, but its ID was not returned; the poster was not uploaded.');
        const posterForm = new FormData();
        posterForm.set('eventId', savedEventId);
        posterForm.set('poster', eventPosterFile);
        const posterResponse = await fetch('/api/admin/events/poster', { method: 'POST', body: posterForm });
        const posterData = await posterResponse.json();
        if (!posterResponse.ok) {
          setEditingId(savedEventId);
          throw new Error(`Event saved, but its poster could not be uploaded: ${posterData.error || 'Please try again.'}`);
        }
      }
      if (active === 'officers' && officerPhotoFile) {
        if (!savedOfficerId) throw new Error('Committee member saved, but its ID was not returned; the photo was not uploaded.');
        const photoForm = new FormData();
        photoForm.set('officerId', savedOfficerId);
        photoForm.set('photo', officerPhotoFile);
        const photoResponse = await fetch('/api/admin/officers/photo', { method: 'POST', body: photoForm });
        const photoData = await photoResponse.json();
        if (!photoResponse.ok) {
          setEditingId(savedOfficerId);
          await loadEntries();
          throw new Error(`Committee member saved, but their photo could not be uploaded: ${photoData.error || 'Please try again.'}`);
        }
      }

      setForm(emptyForm(resource));
      setEditingId(null);
      setEventPosterFile(null);
      setOfficerPhotoFile(null);
      setNotice(editingId ? 'Changes saved.' : 'Item added.');
      await loadEntries();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this item.');
    } finally {
      setBusy(false);
    }
  }

  async function removeEventPoster() {
    if (!editingId || !window.confirm('Remove this event poster?')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/events/poster?eventId=${encodeURIComponent(editingId)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not remove this poster.');
      setEventPosterFile(null);
      setNotice('Event poster removed.');
      await loadEntries();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove this poster.');
    } finally {
      setBusy(false);
    }
  }

  async function removeOfficerPhoto() {
    if (!editingId || !window.confirm('Remove this committee member photo?')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/officers/photo?officerId=${encodeURIComponent(editingId)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not remove this photo.');
      setOfficerPhotoFile(null);
      setNotice('Committee member photo removed.');
      await loadEntries();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove this photo.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete this item.');
      if (editingId === id) {
        setEditingId(null);
        setOfficerPhotoFile(null);
        setForm(emptyForm(resource));
      }
      setNotice('Item deleted.');
      await loadEntries();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this item.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleSubmission(entry: Entry) {
    const id = typeof entry.id === 'string' ? entry.id : '';
    const status = entry.status === 'READ' ? 'PENDING' : 'READ';
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update the submission.');
      await loadEntries();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update the submission.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setAuthenticated(false);
      setRole(null);
      window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: null }));
      setEntries([]);
      setNotice('');
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <main className="mx-auto w-full max-w-5xl flex-grow p-8 text-white">Checking administrator access…</main>;
  }

  if (!authenticated) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-grow items-start px-4 py-16 sm:px-6">
        <form onSubmit={submitLogin} className="w-full space-y-5 border border-[#33343b] bg-[#0c0e14] p-6 sm:p-8">
          <div>
            <p className="font-label-mono-sm text-xs uppercase text-[#cdf200]">Admin // Sign in</p>
            <h1 className="mt-2 font-headline-lg uppercase text-white">Club content manager</h1>
            <p className="mt-2 font-body-sm text-[#8f96a3]">Use an administrator account provided by the club.</p>
          </div>
          {error && <p role="alert" className="border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
          <label className="block space-y-1 text-sm text-[#8f96a3]">
            Email or username
            <input required autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 text-white" />
          </label>
          <label className="block space-y-1 text-sm text-[#8f96a3]">
            Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 text-white" />
          </label>
          <button disabled={busy} className="w-full bg-[#cdf200] px-4 py-3 font-label-caps font-bold uppercase text-[#0a0b0e] disabled:opacity-50">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <a href="/admin/reset-password" className="block text-center text-sm text-[#8f96a3] hover:text-white">Forgot password?</a>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-grow px-4 py-8 sm:px-6 lg:px-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#33343b] pb-4">
        <div>
          <p className="font-label-mono-sm text-xs uppercase text-[#cdf200]">Admin // Content control</p>
          <h1 className="mt-1 font-headline-xl uppercase text-white">Club content manager</h1>
          <p className="mt-1 font-body-sm text-[#8f96a3]">Changes publish directly to the public site.</p>
        </div>
        <button onClick={logout} disabled={busy} className="border border-[#33343b] bg-[#191b22] px-4 py-2 font-label-caps text-xs uppercase text-white hover:border-[#cdf200]">
          Sign out
        </button>
      </div>

      <nav aria-label="Content sections" className="mb-6 flex flex-wrap gap-2">
        {resourceKeys.filter((key) => key !== 'contact' || role !== 'MODERATOR').map((key) => (
          <button
            key={key}
            onClick={() => {
              setActive(key);
              setEditingId(null);
              setEventPosterFile(null);
              setOfficerPhotoFile(null);
              setForm(emptyForm(resources[key]));
              setError('');
              setNotice('');
            }}
            className={`border px-3 py-2 text-xs font-bold uppercase ${active === key ? 'border-[#cdf200] bg-[#cdf200] text-[#0a0b0e]' : 'border-[#33343b] bg-[#191b22] text-[#8f96a3] hover:text-white'}`}
          >
            {resources[key].label}
          </button>
        ))}
        {(role === 'OWNER' || role === 'ADMIN') && (
          <button onClick={() => { setActive('users'); setError(''); setNotice(''); }} className={`border px-3 py-2 text-xs font-bold uppercase ${active === 'users' ? 'border-[#cdf200] bg-[#cdf200] text-[#0a0b0e]' : 'border-[#33343b] bg-[#191b22] text-[#8f96a3] hover:text-white'}`}>
            User accounts
          </button>
        )}
        <button onClick={() => { setActive('account'); setError(''); setNotice(''); }} className={`border px-3 py-2 text-xs font-bold uppercase ${active === 'account' ? 'border-[#cdf200] bg-[#cdf200] text-[#0a0b0e]' : 'border-[#33343b] bg-[#191b22] text-[#8f96a3] hover:text-white'}`}>
          My profile
        </button>
        <button onClick={() => { setActive('activity'); setError(''); setNotice(''); }} className={`border px-3 py-2 text-xs font-bold uppercase ${active === 'activity' ? 'border-[#cdf200] bg-[#cdf200] text-[#0a0b0e]' : 'border-[#33343b] bg-[#191b22] text-[#8f96a3] hover:text-white'}`}>
          Activity log
        </button>
      </nav>

      {error && <p role="alert" className="mb-4 border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mb-4 border border-[#637500] bg-[#1d1f26] p-3 text-sm text-[#cdf200]">{notice}</p>}

      {active === 'users' && (role === 'OWNER' || role === 'ADMIN') ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1fr)]">
          <section className="border border-[#33343b] bg-[#0c0e14] p-5">
            <h2 className="mb-4 font-headline-md uppercase text-white">Invite a user</h2>
            <form onSubmit={inviteUser} className="space-y-4">
              <label className="block space-y-1 text-xs uppercase text-[#8f96a3]">Email<input required type="email" maxLength={254} value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white" /></label>
              {role === 'OWNER' ? (
                <label className="block space-y-1 text-xs uppercase text-[#8f96a3]">Privilege<select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value as AdminUser['role'] })} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 text-white"><option value="MODERATOR">Moderator</option><option value="ADMIN">Admin</option><option value="OWNER">Owner</option></select></label>
              ) : <p className="text-sm text-[#8f96a3]">New accounts are created as <span className="font-bold text-[#cdf200]">Moderator</span>.</p>}
              <label className="block space-y-1 text-xs uppercase text-[#8f96a3]">Personal message (optional)<textarea value={newUser.message} onChange={(event) => setNewUser({ ...newUser, message: event.target.value })} rows={3} maxLength={1000} placeholder="e.g. Welcome to the team! Please set your password within 30 minutes." className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white" /><span className="block normal-case">Included in the invitation email.</span></label>
              <button disabled={busy} className="bg-[#cdf200] px-4 py-2 font-label-caps text-xs font-bold uppercase text-[#0a0b0e] disabled:opacity-50">Send invitation</button>
            </form>
          </section>
          <section className="space-y-3">
            <h2 className="font-headline-md uppercase text-white">Accounts ({users.length})</h2>
            {users.map((user) => (
              <article key={user.id} className="flex flex-wrap items-center justify-between gap-4 border border-[#33343b] bg-[#0c0e14] p-4">
                <div><h3 className="font-semibold text-white">{user.username ? `@${user.username}` : user.name}</h3><p className="text-sm text-[#8f96a3]">{user.email}<span aria-hidden="true"> / </span>{user.isActive ? user.role : `${user.role} / DISABLED`}</p></div>
                <div className="flex flex-wrap gap-2">
                  {role === 'OWNER' ? (
                    <>
                      <select aria-label={`Privilege for ${user.email}`} value={user.role} disabled={busy || !user.isActive} onChange={(event) => void updateUser(user, { role: event.target.value as AdminUser['role'] })} className="border border-[#33343b] bg-[#191b22] px-2 py-1 text-xs text-white"><option value="OWNER">Owner</option><option value="ADMIN">Admin</option><option value="MODERATOR">Moderator</option></select>
                      <button disabled={busy} onClick={() => void updateUser(user, { isActive: !user.isActive })} className="border border-[#33343b] px-3 py-1 text-xs uppercase text-white">{user.isActive ? 'Disable' : 'Enable'}</button>
                      <button disabled={busy} onClick={() => void deleteUser(user)} className="border border-red-900 px-3 py-1 text-xs uppercase text-red-200 hover:bg-red-950/40">Delete</button>
                    </>
                  ) : user.role === 'MODERATOR' ? (
                    <button disabled={busy} onClick={() => void deleteUser(user)} className="border border-red-900 px-3 py-1 text-xs uppercase text-red-200 hover:bg-red-950/40">Delete moderator</button>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        </div>
      ) : active === 'account' ? (
        <div className="grid max-w-3xl gap-6">
          <section className="border border-[#33343b] bg-[#0c0e14] p-5">
            <h2 className="mb-4 font-headline-md uppercase text-white">My profile</h2>
            <p className="mb-4 text-sm text-[#8f96a3]">Your name and account role identify you in the site activity log.</p>
            <form onSubmit={saveProfile} className="space-y-4">
              <label className="block space-y-1 text-xs uppercase text-[#8f96a3]">Display name<input required maxLength={100} value={profileName} onChange={(event) => setProfileName(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white" /></label>
              <label className="block space-y-1 text-xs uppercase text-[#8f96a3]">Username<input required minLength={3} maxLength={30} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}" value={profileUsername} onChange={(event) => setProfileUsername(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white" /><span className="block normal-case">3–30 letters, numbers, dots, underscores, or hyphens.</span></label>
              <label className="block space-y-1 text-xs uppercase text-[#8f96a3]">Email<input readOnly value={profile?.email ?? ''} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-[#8f96a3]" /></label>
              <p className="text-sm text-[#8f96a3]">Role: <span className="font-bold text-[#cdf200]">{profile?.role ?? role}</span></p>
              <button disabled={busy} className="bg-[#cdf200] px-4 py-2 font-label-caps text-xs font-bold uppercase text-[#0a0b0e] disabled:opacity-50">Save profile</button>
            </form>
          </section>
          <section className="border border-[#33343b] bg-[#0c0e14] p-5">
            <h2 className="mb-4 font-headline-md uppercase text-white">Change your password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <label className="block space-y-1 text-xs uppercase text-[#8f96a3]">Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white" /></label>
              <label className="block space-y-1 text-xs uppercase text-[#8f96a3]">New password (14–72 bytes)<input required minLength={14} maxLength={72} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white" /></label>
              <button disabled={busy} className="bg-[#cdf200] px-4 py-2 font-label-caps text-xs font-bold uppercase text-[#0a0b0e] disabled:opacity-50">Change password</button>
            </form>
          </section>
        </div>
      ) : active === 'activity' ? (
        <section className="space-y-3">
          <h2 className="font-headline-md uppercase text-white">Recent admin activity</h2>
          {activity.length === 0 && <p className="border border-[#33343b] bg-[#0c0e14] p-5 text-sm text-[#8f96a3]">No changes have been recorded yet.</p>}
          {activity.map((item) => (
            <article key={item.id} className="border border-[#33343b] bg-[#0c0e14] p-4">
              <p className="font-semibold text-white">{item.actorUsername ? `@${item.actorUsername}` : item.actorName} <span className="font-normal text-[#8f96a3]">({item.actorEmail})</span></p>
              <p className="mt-1 text-sm text-[#8f96a3]">{item.action} {item.entity}: <span className="text-[#e2e2ea]">{item.itemLabel}</span></p>
              <time className="mt-1 block text-xs text-[#8f96a3]" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
            </article>
          ))}
        </section>
      ) : active !== 'contact' ? (
        <>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
          <section className="border border-[#33343b] bg-[#0c0e14] p-5">
            <h2 className="mb-4 font-headline-md uppercase text-white">{editingId ? `Edit ${resource.label}` : `Add ${resource.label}`}</h2>
            <form onSubmit={saveEntry} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.name} className={`space-y-1 text-xs uppercase tracking-wide text-[#8f96a3] ${field.type === 'textarea' ? 'sm:col-span-2' : ''} ${field.type === 'checkbox' ? 'flex items-center gap-3' : ''}`}>
                  {field.type === 'checkbox' ? (
                    <>
                      <input type="checkbox" checked={form[field.name] === true} onChange={(event) => setForm({ ...form, [field.name]: event.target.checked })} className="h-4 w-4 accent-[#cdf200]" />
                      <span>{field.label}</span>
                    </>
                  ) : field.type === 'textarea' ? (
                    <>
                      {field.label}
                      <textarea required={field.required} value={String(form[field.name] ?? '')} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} rows={3} maxLength={4000} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white" />
                    </>
                  ) : field.type === 'select' ? (
                    <>
                      {field.label}
                      <select required={field.required} value={String(form[field.name] ?? '')} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 text-white">
                        <option value="">Select…</option>
                        {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      {field.label}
                      <input required={field.required} type={field.type ?? 'text'} min={field.type === 'number' ? 0 : undefined} maxLength={field.maxLength} pattern={field.pattern} inputMode={field.inputMode} value={String(form[field.name] ?? '')} onChange={(event) => setForm({ ...form, [field.name]: field.name === 'department' ? event.target.value.toUpperCase() : event.target.value })} className="w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white" />
                    </>
                  )}
                </label>
              ))}
              {active === 'events' && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="block space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
                    Event poster (recommended 1440 × 1350 px)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (file && file.size > 4 * 1024 * 1024) {
                          setError('Poster images must be no larger than 4 MB.');
                          event.target.value = '';
                          setEventPosterFile(null);
                          return;
                        }
                        setError('');
                        setEventPosterFile(file);
                      }}
                      className="block w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white file:mr-3 file:border-0 file:bg-[#cdf200] file:px-3 file:py-1 file:font-bold file:text-[#0a0b0e]"
                    />
                    <span className="block normal-case">JPEG, PNG, or WebP. Maximum file size: 4 MB. The display uses a 1440:1350 aspect ratio.</span>
                  </label>
                  {existingEventPoster && (
                    <div className="flex flex-wrap items-end gap-3">
                      <Image
                        src={String(existingEventPoster)}
                        alt="Event poster preview"
                        width={288}
                        height={270}
                        unoptimized
                        className="h-auto w-36 border border-[#33343b] object-cover"
                      />
                      {editingId && existingEventPoster && !eventPosterFile && (
                        <button type="button" onClick={() => void removeEventPoster()} disabled={busy} className="border border-red-900 px-3 py-2 text-xs uppercase text-red-200 hover:bg-red-950/40 disabled:opacity-50">
                          Remove poster
                        </button>
                      )}
                    </div>
                  )}
                  {eventPosterFile && <p className="text-sm text-[#cdf200]">Selected replacement poster: {eventPosterFile.name}</p>}
                </div>
              )}
              {active === 'officers' && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="block space-y-1 text-xs uppercase tracking-wide text-[#8f96a3]">
                    Team photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (file && file.size > 4 * 1024 * 1024) {
                          setError('Team photos must be no larger than 4 MB.');
                          event.target.value = '';
                          setOfficerPhotoFile(null);
                          return;
                        }
                        setError('');
                        setOfficerPhotoFile(file);
                      }}
                      className="block w-full border border-[#33343b] bg-[#191b22] px-3 py-2 normal-case text-white file:mr-3 file:border-0 file:bg-[#cdf200] file:px-3 file:py-1 file:font-bold file:text-[#0a0b0e]"
                    />
                    <span className="block normal-case">JPEG, PNG, or WebP. Maximum file size: 4 MB.</span>
                  </label>
                  {existingOfficerPhoto && (
                    <div className="flex flex-wrap items-end gap-3">
                      <Image
                        src={existingOfficerPhoto}
                        alt="Committee member photo preview"
                        width={160}
                        height={192}
                        unoptimized
                        className="h-48 w-40 border border-[#33343b] object-cover"
                      />
                      {editingId && !officerPhotoFile && (
                        <button type="button" onClick={() => void removeOfficerPhoto()} disabled={busy} className="border border-red-900 px-3 py-2 text-xs uppercase text-red-200 hover:bg-red-950/40 disabled:opacity-50">
                          Remove photo
                        </button>
                      )}
                    </div>
                  )}
                  {officerPhotoFile && <p className="text-sm text-[#cdf200]">Selected photo: {officerPhotoFile.name}</p>}
                </div>
              )}
              <div className="flex gap-2 sm:col-span-2">
                <button disabled={busy} className="bg-[#cdf200] px-4 py-2 font-label-caps text-xs font-bold uppercase text-[#0a0b0e] disabled:opacity-50">
                  {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add item'}
                </button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setEventPosterFile(null); setOfficerPhotoFile(null); setForm(emptyForm(resource)); }} className="border border-[#33343b] px-4 py-2 text-xs uppercase text-white">Cancel</button>}
              </div>
            </form>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md uppercase text-white">{resource.label} ({entries.length})</h2>
            {entries.length === 0 && <p className="border border-[#33343b] bg-[#0c0e14] p-5 text-sm text-[#8f96a3]">No items yet. Add your first record using the form.</p>}
            {entries.map((entry, index) => {
              const id = typeof entry.id === 'string' ? entry.id : '';
              const title = String(entry.title ?? entry.name ?? entry.discipline ?? entry.tag ?? `Item ${index + 1}`);
              const timeInfo = entry.timeStr ? (entry.endTimeStr ? `${entry.timeStr} - ${entry.endTimeStr}` : String(entry.timeStr)) : null;
              const summary = entry.dateStr ? (timeInfo ? `${entry.dateStr} • ${timeInfo}` : String(entry.dateStr)) : String(entry.datetime ?? entry.time ?? entry.role ?? entry.league ?? '');
              return (
                <article key={id || index} className="border border-[#33343b] bg-[#0c0e14] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-white">{title}</h3>
                      {summary && <p className="mt-1 break-words text-sm text-[#8f96a3]">{summary}</p>}
                      {active === 'results' && typeof entry.eventId === 'string' && entry.eventId && (
                        <p className="mt-1 text-xs font-bold uppercase text-[#cdf200]">Linked to event report</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => startEditing(entry)} className="border border-[#33343b] px-3 py-1 text-xs uppercase text-white hover:border-[#cdf200]">Edit</button>
                      <button onClick={() => void deleteEntry(id)} disabled={!id || busy} className="border border-red-900 px-3 py-1 text-xs uppercase text-red-200 hover:bg-red-950/40 disabled:opacity-50">Delete</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
        {active === 'events' && editingId && (
          <EventReportPanel
            key={editingId}
            eventId={editingId}
            eventDiscipline={String(entries.find((entry) => entry.id === editingId)?.discipline ?? '')}
            images={(() => {
              const found = entries.find((entry) => entry.id === editingId)?.reportImages;
              return Array.isArray(found) ? found.filter((image): image is { id: string; url: string } =>
                typeof image === 'object' && image !== null &&
                typeof (image as { id?: unknown }).id === 'string' &&
                typeof (image as { url?: unknown }).url === 'string') : [];
            })()}
            onChanged={loadEntries}
          />
        )}
        </>
      ) : (
        <section className="space-y-3">
          <h2 className="font-headline-md uppercase text-white">Recent contact submissions ({entries.length})</h2>
          {entries.length === 0 && <p className="border border-[#33343b] bg-[#0c0e14] p-5 text-sm text-[#8f96a3]">No messages received.</p>}
          {entries.map((entry, index) => {
            const id = typeof entry.id === 'string' ? entry.id : '';
            return (
              <article key={id || index} className="border border-[#33343b] bg-[#0c0e14] p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{String(entry.name ?? 'Unknown sender')} <span className="font-normal text-[#8f96a3]">— {String(entry.email ?? '')}</span></h3>
                    <p className="mt-1 text-xs uppercase text-[#cdf200]">{String(entry.topic ?? 'General')} {entry.game ? `// ${String(entry.game)}` : ''}{' // '}{String(entry.status ?? 'PENDING')}</p>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[#d1d5db]">{String(entry.message ?? '')}</p>
                  </div>
                  <div className="flex h-fit gap-2">
                    <button disabled={busy} onClick={() => void toggleSubmission(entry)} className="border border-[#33343b] px-3 py-1 text-xs uppercase text-white">
                      {entry.status === 'READ' ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button disabled={busy || !id} onClick={() => void deleteEntry(id)} className="border border-red-900 px-3 py-1 text-xs uppercase text-red-200">Delete</button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
