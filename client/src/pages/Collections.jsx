import { useEffect, useState } from 'react';
import { collectionsApi, collectibleImageUrl } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import CollectibleThumb from '../components/CollectibleThumb.jsx';

const favorite = (v) => (v ? '★' : '');

// A lazy-loaded thumbnail that enlarges on hover. `idKey` is the row field
// holding the id to resolve (mountId, speciesId, or toyId).
const thumbColumn = (type, idKey) => ({
  key: 'image',
  label: '',
  className: 'col-thumb',
  render: (_, row) =>
    row[idKey] != null ? (
      <CollectibleThumb src={collectibleImageUrl(type, row[idKey])} />
    ) : null,
});

const MOUNT_COLUMNS = [
  thumbColumn('mount', 'mountId'),
  { key: 'name', label: 'Mount', sortable: true },
  { key: 'isFavorite', label: 'Favorite', sortable: true, className: 'col-num', render: favorite },
];

const PET_COLUMNS = [
  thumbColumn('pet', 'speciesId'),
  { key: 'name', label: 'Pet', sortable: true },
  { key: 'nickname', label: 'Nickname', sortable: true, render: (v) => v || '—' },
  { key: 'level', label: 'Level', sortable: true, className: 'col-num', render: (v) => v ?? '—' },
  { key: 'quality', label: 'Quality', sortable: true, render: (v) => v || '—' },
  { key: 'isFavorite', label: 'Favorite', sortable: true, className: 'col-num', render: favorite },
];

const TOY_COLUMNS = [
  thumbColumn('toy', 'toyId'),
  { key: 'name', label: 'Toy', sortable: true },
  { key: 'isFavorite', label: 'Favorite', sortable: true, className: 'col-num', render: favorite },
];

// key -> label, table columns, search keys, and which api call loads it.
const TABS = [
  { key: 'mounts', label: 'Mounts', columns: MOUNT_COLUMNS, searchKeys: ['name'], load: collectionsApi.mounts, pick: (d) => d.mounts },
  { key: 'pets', label: 'Pets', columns: PET_COLUMNS, searchKeys: ['name', 'nickname'], load: collectionsApi.pets, pick: (d) => d.pets },
  { key: 'toys', label: 'Toys', columns: TOY_COLUMNS, searchKeys: ['name'], load: collectionsApi.toys, pick: (d) => d.toys },
];

export default function Collections() {
  const [tab, setTab] = useState('mounts');
  const [data, setData] = useState({}); // key -> array (cached once loaded)
  const [loadingTab, setLoadingTab] = useState(true);
  const [error, setError] = useState(null);

  const active = TABS.find((t) => t.key === tab);

  // Load each tab's data on first visit; cache it afterwards.
  useEffect(() => {
    if (data[tab]) {
      setLoadingTab(false);
      return;
    }
    let cancelled = false;
    setLoadingTab(true);
    active
      .load()
      .then((d) => {
        if (!cancelled) setData((prev) => ({ ...prev, [tab]: active.pick(d) || [] }));
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoadingTab(false));
    return () => {
      cancelled = true;
    };
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = data[tab] || [];

  return (
    <div className="page">
      <h1>Collections</h1>
      <p className="muted">
        Your account-wide mounts, pets, and toys — shared across every character.
      </p>
      {error && <p className="form-error">{error}</p>}

      <div className="tabs" role="tablist" aria-label="Collection type">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {data[t.key] ? ` (${data[t.key].length})` : ''}
          </button>
        ))}
      </div>

      {loadingTab ? (
        <p className="muted">Loading…</p>
      ) : (
        <DataTable
          items={items}
          columns={active.columns}
          searchKeys={active.searchKeys}
          searchPlaceholder={`Search ${active.label.toLowerCase()}…`}
          initialSort={{ key: 'name', dir: 'asc' }}
          emptyText={`No ${active.label.toLowerCase()} yet. Connect Battle.net and sync your characters.`}
        />
      )}
    </div>
  );
}
