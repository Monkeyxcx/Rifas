export default function MarketingHomePage() {
  return (
    <section className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-xl">
        <span className="badge-solidarity inline-block !px-4 !py-1.5 animate-pulse-soft">
          ✨ Beta abierta
        </span>
        <h1 className="font-display">
          Rifas<span className="text-brand-rose">Center</span>
        </h1>
        <p className="text-xl text-slate-600 font-sans">
          Tu número, tu premio, tu causa.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <span className="btn-md btn-primary-gradient cursor-default">
            Participar ahora
          </span>
          <span className="btn-md btn-secondary cursor-default">
            Crear mi rifa
          </span>
        </div>
        <p className="text-sm text-slate-400 pt-8">
          Estructura inicial cargada. Siguiente commit: layout + navegación.
        </p>
      </div>
    </section>
  );
}
