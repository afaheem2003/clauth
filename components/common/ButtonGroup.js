export default function ButtonGroup({
    label,
    options,
    selected,
    setSelected,
    required = false,
  }) {
    return (
      <div className="w-full">
        <label className="font-medium block text-xs mb-1 text-gray-800">
          {label}{required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {options.map(option => (
            <button
              key={option}
              onClick={() => setSelected(option)}
              className={`px-3 py-1.5 rounded-full border text-sm ${
                selected === option
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-800 border-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }
  