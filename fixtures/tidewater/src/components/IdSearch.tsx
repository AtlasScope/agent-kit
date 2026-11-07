export function IdSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      className="id-search"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder}
    />
  );
}
