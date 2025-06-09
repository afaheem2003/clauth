export default function Input({ label, value, onChange, placeholder, type = 'text', required = false }) {
    return (
      <div className="w-full">
        <label className="font-medium block text-xs mb-1 text-gray-800">
          {label}{required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || label}
          className="w-full px-2 py-1.5 border rounded-md text-gray-900 placeholder-gray-600 text-sm focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-all"
          required={required}
        />
      </div>
    );
  }
  