export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Conversations" value="—" />
        <Stat label="Documents" value="—" />
        <Stat label="Avg. Response (ms)" value="—" />
        <Stat label="Satisfaction" value="—" />
      </div>

      <section className="mt-10 rounded-xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Quick start</h2>
        <ol className="list-decimal space-y-2 pl-5 text-gray-700">
          <li>Upload your first knowledge document</li>
          <li>Configure your widget appearance</li>
          <li>Copy & paste the embed snippet on your site</li>
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
