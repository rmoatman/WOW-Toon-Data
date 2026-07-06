import { useEffect, useState } from 'react';
import { achievementsApi } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import CharacterHitList from '../components/CharacterHitList.jsx';

const COLUMNS = [
  { key: 'name', label: 'Achievement', sortable: true },
  { key: 'points', label: 'Points', sortable: true, className: 'col-num', render: (v) => v ?? '—' },
  {
    key: 'characterCount',
    label: 'Characters',
    sortable: true,
    className: 'col-num',
  },
];

export default function Achievements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null); // { achievementId, name }
  const [modalChars, setModalChars] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    achievementsApi
      .list()
      .then((d) => setItems(d.achievements || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openRow = async (row) => {
    setSelected(row);
    setModalLoading(true);
    setModalChars([]);
    try {
      const d = await achievementsApi.characters(row.achievementId);
      setModalChars(d.characters || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="page">
      <h1>All achievements</h1>
      <p className="muted">
        Every achievement earned across your characters. Click one to see who has it.
      </p>
      {error && <p className="form-error">{error}</p>}

      <DataTable
        items={items}
        columns={COLUMNS}
        searchKeys={['name']}
        searchPlaceholder="Search achievements…"
        initialSort={{ key: 'name', dir: 'asc' }}
        emptyText="No achievements yet. Connect Battle.net and sync your characters."
        onRowClick={openRow}
      />

      {selected && (
        <Modal title={selected.name || 'Achievement'} onClose={() => setSelected(null)}>
          {modalLoading ? (
            <p className="muted">Loading…</p>
          ) : (
            <>
              <p className="muted modal-sub">
                {modalChars.length} {modalChars.length === 1 ? 'character has' : 'characters have'} this
                achievement.
              </p>
              <CharacterHitList characters={modalChars} showDate />
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
