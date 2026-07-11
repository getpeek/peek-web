export function ResultEmpty({ message }: { message: string }) {
  return (
    <div className='no-results' style={{ padding: 16 }}>
      <span style={{ color: "var(--pk-fg-muted)" }}>{message}</span>
    </div>
  );
}
