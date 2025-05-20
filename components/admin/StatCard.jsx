export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
} 