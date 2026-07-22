function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "px-6 py-3 rounded-xl font-semibold transition-all duration-300";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700",

    outline:
      "border border-indigo-600 text-indigo-600 hover:bg-indigo-50",

    ghost:
      "text-indigo-600 hover:bg-indigo-100",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;