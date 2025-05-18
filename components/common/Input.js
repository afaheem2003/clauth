export default function Input({ label, value, setValue, required = false }) {
    return (
      <div className="w-full">
        <label className="font-medium block text-xs mb-1 text-gray-800">
          {label}{required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          placeholder={label}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full px-2 py-1.5 border rounded-md text-gray-800 placeholder-gray-300 text-sm"
        />
      </div>
    );
  }
  