import "./AuthLayout.scss";

const AuthLayout = ({ children }) => {
  return (
    <section className="auth-container">
      <div className="auth-form">{children}</div>
    </section>
  );
};

export default AuthLayout;
