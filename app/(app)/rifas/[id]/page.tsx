export default function RifaDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  void params;
  return (
    <div className="container max-w-content py-10">
      <h2>Detalle de rifa</h2>
      <p className="text-slate-500 mt-2">Grid de números + checkout — en construcción.</p>
    </div>
  );
}
