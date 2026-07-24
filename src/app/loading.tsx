export default function Loading() {
  return (
    <div
      className="site-container grid min-h-[45vh] place-items-center py-20"
      role="status"
    >
      <div className="text-center">
        <span className="mx-auto block size-9 animate-spin rounded-full border-4 border-purple-950/15 border-t-blue-700" />
        <p className="mt-4 text-purple-950/70">Načítáme obsah…</p>
      </div>
    </div>
  );
}
