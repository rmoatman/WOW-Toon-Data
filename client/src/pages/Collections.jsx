import { useEffect, useState } from 'react';
import { collectionsApi, collectibleImageUrl } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import CollectibleThumb from '../components/CollectibleThumb.jsx';

const favorite = (v) => (v ? '★' : '');

// A lazy-loaded thumbnail that enlarges on hover. `idKey` is the row field
// holding the id to resolve (mountId for mounts, speciesId for pets).
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

export default function Collections() {
  const [tab, setTab] = useState('mounts');
  const [mounts, setMounts] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([collectionsApi.mounts(), collectionsApi.pets()])
      .then(([m, p]) => {
        setMounts(m.mounts || []);
        setPets(p.pets || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading…</div>;

  const showMounts = tab === 'mounts';

  return (
    <div className="page">
      <h1>Collections</h1>
      <p className="muted">
        Your account-wide mounts and pets, shared across every character.
      </p>
      {error && <p className="form-error">{error}</p>}

      <div className="tabs" role="tablist" aria-label="Collection type">
        <button
          type="button"
          role="tab"
          aria-selected={showMounts}
          className={`tab ${showMounts ? 'active' : ''}`}
          onClick={() => setTab('mounts')}
        >
          Mounts ({mounts.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!showMounts}
          className={`tab ${!showMounts ? 'active' : ''}`}
          onClick={() => setTab('pets')}
        >
          Pets ({pets.length})
        </button>
      </div>

      {showMounts ? (
        <DataTable
          items={mounts}
          columns={MOUNT_COLUMNS}
          searchKeys={['name']}
          searchPlaceholder="Search mounts…"
          initialSort={{ key: 'name', dir: 'asc' }}
          emptyText="No mounts yet. Connect Battle.net and sync your characters."
        />
      ) : (
        <DataTable
          items={pets}
          columns={PET_COLUMNS}
          searchKeys={['name', 'nickname']}
          searchPlaceholder="Search pets…"
          initialSort={{ key: 'name', dir: 'asc' }}
          emptyText="No pets yet. Connect Battle.net and sync your characters."
        />
      )}
    </div>
  );
}
