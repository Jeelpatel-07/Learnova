import { HiSearch } from 'react-icons/hi';

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  inputClassName = '',
  compact = false,
}) => {
  return (
    <div className={`relative ${className}`}>
      <HiSearch
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 ${
          compact ? 'h-4 w-4' : 'h-5 w-5'
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input-field pl-11 ${compact ? 'py-2.5 text-sm' : ''} ${inputClassName}`}
      />
    </div>
  );
};

export default SearchBar;
