export default function ChartCard({ title, children }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="mb-4 text-lg font-medium text-gray-700">{title}</h3>
      {children}
    </div>
  );
} 