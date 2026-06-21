import { Link } from "react-router-dom";
import NoRecords from "@/components/NoRecords/NoRecords";
import "./AuditLogsTimeline.scss";

const AuditLogsTimeline = ({ groups = [], loading = false }) => {
  if (loading) {
    return (
      <div className="audit-logs-timeline audit-logs-timeline--loading">
        <p className="audit-logs-timeline__loading-text">Loading audit logs…</p>
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="audit-logs-timeline audit-logs-timeline--empty">
        <NoRecords message="No audit logs found" />
      </div>
    );
  }

  return (
    <div className="audit-logs-timeline">
      {groups.map((group) => (
        <section key={group.dateKey} className="audit-logs-timeline__day-group">
          <div className="audit-logs-timeline__date-separator">
            <span className="audit-logs-timeline__date-pill">{group.label}</span>
          </div>

          <ul className="audit-logs-timeline__entries">
            {group.entries.map((entry) => (
              <li key={entry._id} className="audit-logs-timeline__entry">
                <span className="audit-logs-timeline__dot" aria-hidden="true" />
                <div className="audit-logs-timeline__entry-body">
                  {entry.userId ? (
                    <Link
                      to={`/masters/users/view/${entry.userId}`}
                      className="audit-logs-timeline__user-link"
                    >
                      {entry.userName}
                    </Link>
                  ) : (
                    <span className="audit-logs-timeline__user-name">
                      {entry.userName}
                    </span>
                  )}
                  <span className="audit-logs-timeline__description">
                    {entry.description}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default AuditLogsTimeline;
