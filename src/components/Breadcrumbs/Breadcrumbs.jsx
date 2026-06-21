import { Breadcrumbs as MuiBreadcrumbs, Typography, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const Breadcrumbs = ({ items = [] }) => {
  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ marginBottom: "1rem" }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.link) {
          return (
            <Typography
              key={index}
              color={isLast ? "text.primary" : "text.secondary"}
              sx={{ fontWeight: isLast ? 500 : 400, fontSize: "0.9rem" }}
            >
              {item.label}
            </Typography>
          );
        }

        return (
          <MuiLink
            key={index}
            component={RouterLink}
            to={item.link}
            underline="hover"
            color="inherit"
            sx={{ fontSize: "0.9rem", color: "text.secondary" }}
          >
            {item.label}
          </MuiLink>
        );
      })}
    </MuiBreadcrumbs>
  );
};

export default Breadcrumbs;
