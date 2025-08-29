interface ActiveToggleProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function ActiveToggle({
  isActive,
  onToggle,
  disabled,
}: ActiveToggleProps) {
  return (
    <div
      className="flex items-center mr-2"
      onClick={(e) => e.stopPropagation()} // Prevent triggering header click
    >
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={onToggle}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
          w-9 h-5 bg-gray-300 rounded-full peer 
          peer-checked:bg-blue-600 
          peer-checked:after:translate-x-full 
          rtl:peer-checked:after:-translate-x-full 
          peer-checked:after:border-white 
          after:content-[''] 
          after:absolute 
          after:top-[2px] 
          after:start-[2px] 
          after:bg-white 
          after:border-gray-300 
          after:border 
          after:rounded-full 
          after:h-4 
          after:w-4 
          after:transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        ></div>
      </label>
    </div>
  );
}
