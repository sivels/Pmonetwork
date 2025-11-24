export default function FileUploader({ label, name, accept }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label>{label}</label>
      <input name={name} type="file" accept={accept} />
    </div>
  );
}
