export default function SearchFilters({ filters, setFilters, onSearch }) {
  return (
    <form onSubmit={e => { e.preventDefault(); onSearch(); }} style={{ marginBottom: 24, background: '#e3eafc', padding: 16, borderRadius: 8 }}>
      <input
        value={filters.q || ''}
        onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
        placeholder="Keyword (name, title, etc.)"
        style={{ width: 200, marginRight: 8 }}
      />
      <input
        value={filters.jobTitle || ''}
        onChange={e => setFilters(f => ({ ...f, jobTitle: e.target.value }))}
        placeholder="Job Title"
        style={{ width: 120, marginRight: 8 }}
      />
      <input
        value={filters.sector || ''}
        onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
        placeholder="Sector"
        style={{ width: 120, marginRight: 8 }}
      />
      <input
        value={filters.location || ''}
        onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
        placeholder="Location"
        style={{ width: 120, marginRight: 8 }}
      />
      <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4 }}>Search</button>
    </form>
  );
}
