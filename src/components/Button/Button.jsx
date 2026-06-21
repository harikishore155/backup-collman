import "./Button.scss";

const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "lg",
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      className={`app-btn ${variant} ${size} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
