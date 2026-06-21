import React from "react";
import { useNavigate } from "react-router-dom";
import { LuDatabaseBackup, LuChevronLeft, LuLayoutDashboard } from "react-icons/lu";
import Button from "@/components/Button/Button";
import "./DataNotFound.scss";

const DataNotFound = ({ title }) => {
  const navigate = useNavigate();
  const displayTitle = title || "Report";

  return (
    <div className="data-not-found-page">
      <div className="data-not-found-card">
        {/* Decorative background gradients */}
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>

        <div className="card-content">
          {/* Stunning Illustrated Animated SVG */}
          <div className="illustration-wrapper">
            <svg
              className="illustration-svg"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer floating sparkles */}
              <circle className="sparkle sparkle-1" cx="30" cy="40" r="3" fill="#ff8c5c" />
              <circle className="sparkle sparkle-2" cx="170" cy="60" r="4" fill="#0060a9" />
              <circle className="sparkle sparkle-3" cx="45" cy="150" r="2.5" fill="#37b7d1" />

              {/* Database base cylinder shadow */}
              <ellipse cx="100" cy="150" rx="60" ry="12" fill="#e2e8f0" />

              {/* Database Stack */}
              {/* Cylinder 3 (Bottom) */}
              <path
                className="db-cylinder db-bottom"
                d="M40 115C40 123.284 66.8629 130 100 130C133.137 130 160 123.284 160 115V140C160 148.284 133.137 155 100 155C66.8629 155 40 148.284 40 140V115Z"
                fill="#f1f5f9"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <ellipse cx="100" cy="115" rx="60" ry="12" fill="#cbd5e1" />

              {/* Cylinder 2 (Middle) */}
              <path
                className="db-cylinder db-middle"
                d="M40 75C40 83.284 66.8629 90 100 90C133.137 90 160 83.284 160 75V100C160 108.284 133.137 115 100 115C66.8629 115 40 108.284 40 100V75Z"
                fill="#e2e8f0"
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <ellipse cx="100" cy="75" rx="60" ry="12" fill="#94a3b8" />

              {/* Cylinder 1 (Top) */}
              <path
                className="db-cylinder db-top"
                d="M40 35C40 43.284 66.8629 50 100 50C133.137 50 160 43.284 160 35V60C160 68.284 133.137 75 100 75C66.8629 75 40 68.284 40 60V35Z"
                fill="#3b82f6"
                fillOpacity="0.1"
                stroke="#0060a9"
                strokeWidth="2"
              />
              <ellipse cx="100" cy="35" rx="60" ry="12" fill="#0060a9" fillOpacity="0.2" stroke="#0060a9" strokeWidth="2" />

              {/* Status Indicator Lights on cylinders */}
              <circle className="db-light" cx="60" cy="50" r="3" fill="#ef4444" />
              <circle className="db-light" cx="60" cy="90" r="3" fill="#e2e8f0" />
              <circle className="db-light" cx="60" cy="130" r="3" fill="#e2e8f0" />

              {/* Magnifying Glass searching / scanning */}
              <g className="magnifier">
                <line x1="125" y1="125" x2="160" y2="160" stroke="#ff8c5c" strokeWidth="6" strokeLinecap="round" />
                <circle cx="110" cy="110" r="24" fill="#ffffff" fillOpacity="0.8" stroke="#ff8c5c" strokeWidth="4" />
                {/* Cross/Question inside the glass */}
                <path d="M104 110H116M110 104V116" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              </g>
            </svg>
            <div className="icon-badge">
              <LuDatabaseBackup size={28} className="badge-icon" />
            </div>
          </div>

          {/* Typography */}
          <h2 className="title">{displayTitle} Report</h2>
          <h3 className="subtitle">No Data Available</h3>
          <p className="description">
            We couldn't retrieve any entries for the <strong>{displayTitle}</strong> report.
            This could be because no activities have been logged yet or the data loader is currently indexing.
          </p>

          {/* Guidelines / Next Steps */}


          {/* Navigation Actions */}
          <div className="actions-group">
            <Button
              variant="tertiary"
              size="md"
              onClick={() => navigate("/dashboard")}
              className="action-btn"
            >
              <LuLayoutDashboard size={18} className="btn-icon" />
              Go to Dashboard
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/reports")}
              className="action-btn"
            >
              <LuChevronLeft size={18} className="btn-icon" />
              Back to Reports
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataNotFound;
