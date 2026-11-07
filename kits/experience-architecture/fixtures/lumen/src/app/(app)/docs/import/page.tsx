export default function ImportPage() {
  return (
    <>
      <h1>Import data</h1>
      <p className="muted">Bring projects and tasks over from a CSV export.</p>
      <input type="file" accept=".csv" />
      <button type="button">Start import</button>
    </>
  );
}
