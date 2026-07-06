import { useEffect, useState } from 'react';
import { questsApi } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import CharacterHitList from '../components/CharacterHitList.jsx';

const COLUMNS = [
  { key: 'name', label: 'Quest', sortable: true },
  { key: 'characterCount', label: 'Characters', sortable: true, className: 'col-num' },
];

export default function Quests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null); // { questId, name }
  const [modalChars, setModalChars] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    questsApi
      .list()
      .then((d) => setItems(d.quests || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openRow = async (row) => {
    setSelected(row);
    setModalLoading(true);
    setModalChars([]);
    try {
      const d = await questsApi.characters(row.questId);
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
      <h1>All quests</h1>
      <p className="muted">
        Every quest completed across your characters. Click one to see who has finished it.
      </p>
      {error && <p className="form-error">{error}</p>}

      <DataTable
        items={items}
        columns={COLUMNS}
        searchKeys={['name']}
        searchPlaceholder="Search quests…"
        initialSort={{ key: 'name', dir: 'asc' }}
        emptyText="No quests yet. Connect Battle.net and sync your characters."
        onRowClick={openRow}
      />

      {selected && (
        <Modal title={selected.name || 'Quest'} onClose={() => setSelected(null)}>
          {modalLoading ? (
            <p className="muted">Loading…</p>
          ) : (
            <>
              <p className="muted modal-sub">
                {modalChars.length} {modalChars.length === 1 ? 'character has' : 'characters have'} completed
                this quest.
              </p>
              <CharacterHitList characters={modalChars} />
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
