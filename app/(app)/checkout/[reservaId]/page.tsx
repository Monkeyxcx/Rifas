export default function CheckoutPage({
  params
}: {
  params: Promise<{ reservaId: string }>;
}) {
  void params;
  return (
    <div className="container max-w-content py-10">
      <h2>Checkout — Mercado Pago</h2>
      <p className="text-slate-500 mt-2">Integración de pago — en construcción.</p>
    </div>
  );
}
