import { useState } from "react";
import { FiEdit2, FiEye, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { Menu, MenuItem, Grow } from "@mui/material";
import "./MoreIcon.scss";

const MoreIcon = ({ onView, onEdit, onDelete }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleAction = (callback) => {
        handleClose();
        if (callback) callback();
    };

    return (
        <>
            <span
                className={`more-icon ${open ? "active" : ""}`}
                onClick={handleClick}
                role="button"
                tabIndex={0}
            >
                <FiMoreVertical />
            </span>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Grow}
                transitionDuration={200}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                className="action-dropdown-menu"
            >
                <MenuItem onClick={() => handleAction(onView)} className="action-menu-item">
                    <FiEye className="action-icon" />
                    <span>View</span>
                </MenuItem>
                <MenuItem onClick={() => handleAction(onEdit)} className="action-menu-item">
                    <FiEdit2 className="action-icon" />
                    <span>Edit</span>
                </MenuItem>
                <MenuItem onClick={() => handleAction(onDelete)} className="action-menu-item delete">
                    <FiTrash2 className="action-icon" />
                    <span>Delete</span>
                </MenuItem>
            </Menu>
        </>
    );
};

export default MoreIcon;
