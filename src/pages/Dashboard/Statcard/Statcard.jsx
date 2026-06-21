import Skeleton from "@mui/material/Skeleton";
import "./Statcard.scss";

export default function StatCard({ label, value, loading = false, onClick }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component className={`stat-card${onClick ? " stat-card-clickable" : ""}`} onClick={onClick} type={onClick ? "button" : undefined}>
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">
        {loading ? (
          <Skeleton variant="text" width="60%" height={40} animation="wave" />
        ) : (
          value
        )}
      </div>
    </Component>
  );
}
