export function RecentPreordersTable({ preorders }) {
  return (
    <table className="w-full bg-white rounded-lg shadow overflow-hidden">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-3 text-left font-medium text-gray-800">When</th>
          <th className="px-4 py-3 text-left font-medium text-gray-800">User</th>
          <th className="px-4 py-3 text-left font-medium text-gray-800">Clothing Item</th>
          <th className="px-4 py-3 text-left font-medium text-gray-800">Size</th>
          <th className="px-4 py-3 text-left font-medium text-gray-800">Qty</th>
        </tr>
      </thead>
      <tbody>
        {preorders.map((o) => (
          <tr key={o.id} className="border-t last:border-b">
            <td className="px-4 py-3 text-gray-900">{new Date(o.createdAt).toLocaleString()}</td>
            <td className="px-4 py-3 text-gray-900">
              {o.user?.email ?? o.guestEmail ?? 'Unknown'}
            </td>
            <td className="px-4 py-3 text-gray-900">{o.clothingItem.name}</td>
            <td className="px-4 py-3 text-gray-900">{o.size}</td>
            <td className="px-4 py-3 text-gray-900">{o.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const PreorderColumns = {
  WHEN: 'When',
  USER: 'User',
  ITEM: 'Clothing Item',
  SIZE: 'Size',
  QTY: 'Qty'
}; 