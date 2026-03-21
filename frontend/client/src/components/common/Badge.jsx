const Badge = ({ children, variant = 'primary', size = 'sm' }) => {
  const variants = {
    primary: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    danger: 'bg-red-50 text-red-700 ring-red-600/10',
    gray: 'bg-gray-50 text-gray-600 ring-gray-500/10',
    info: 'bg-sky-50 text-sky-700 ring-sky-600/10',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};

export default Badge;