import ActivitiesIcon from "@/assets/images/sidebar/activities.svg?react";
import CustomersIcon from "@/assets/images/sidebar/customers.svg?react";
import DashboardIcon from "@/assets/images/sidebar/dashboard.svg?react";
import DcrIcon from "@/assets/images/sidebar/dcr.svg?react";
import ImportsIcon from "@/assets/images/sidebar/imports.svg?react";
import KnowledgeBaseIcon from "@/assets/images/sidebar/knowledge-base.svg?react";
import MastersIcon from "@/assets/images/sidebar/masters.svg?react";
import ReportsIcon from "@/assets/images/sidebar/reports.svg?react";
import { ROLES } from "@/config/roles";

const { MASTER, ADMIN, SUPERADMIN, MANAGER } = ROLES;

/** Admin + manager + superadmin (branch portal) */
const PORTAL_ROLES = [ADMIN, MANAGER, SUPERADMIN];
/** Admin + superadmin only */
const ADMIN_SUPER_ROLES = [ADMIN, SUPERADMIN];

export const SIDEBAR_CONFIG = [
    {
        section: "admin",
        items: [
            {
                title: "Dashboard",
                path: "dashboard",
                icon: DashboardIcon,
                roles: PORTAL_ROLES,
            },
            {
                title: "Clients",
                path: "clients",
                icon: CustomersIcon,
                roles: PORTAL_ROLES,
            },
            {
                title: "Users",
                path: "users",
                icon: MastersIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "users",
            },
            {
                title: "Live Track",
                path: "livetrack",
                icon: ActivitiesIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "live-track",
            },
            {
                title: "Attendance",
                path: "attendance",
                icon: ActivitiesIcon,
                roles: PORTAL_ROLES,
                featureKey: "attendance",
            },
            {
                title: "Requests",
                path: "request",
                icon: ImportsIcon,
                roles: PORTAL_ROLES,
                featureKey: "request",
            },
            {
                title: "Task Management",
                path: "task",
                icon: ActivitiesIcon,
                roles: PORTAL_ROLES,
                featureKey: "task-management",
            },
            {
                title: "Payslip",
                path: "payslip",
                icon: ReportsIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "payslip",
            },
            {
                title: "Asset Inventory",
                path: "inventory",
                icon: ImportsIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "asset-inventory",
            },
            {
                title: "Lead Management",
                path: "lead-management",
                icon: DcrIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "lead-management",
            },
            {
                title: "Letter Management",
                path: "letter-management",
                icon: KnowledgeBaseIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "letter-management",
            },
        ],
    },
    {
        section: "settings",
        items: [
            {
                title: "Organization Setup",
                path: "settings/organization",
                icon: MastersIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "organization-setup",
            },
            {
                title: "Leave Setup",
                path: "settings/leave",
                icon: ActivitiesIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "leave-setup",
            },
            {
                title: "Payroll Setup",
                path: "settings/payroll",
                icon: ReportsIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "payroll-setup",
            },
            {
                title: "Field Setup",
                path: "settings/field",
                icon: DcrIcon,
                roles: ADMIN_SUPER_ROLES,
                featureKey: "field-setup",
            },
        ],
    },
    {
        section: "manager",
        items: [
            {
                title: "Dashboard",
                path: "dashboard",
                icon: DashboardIcon,
                roles: [MANAGER],
            },
            {
                title: "Clients",
                path: "clients",
                icon: CustomersIcon,
                roles: [MANAGER],
            },
            {
                title: "Live Track",
                path: "livetrack",
                icon: ActivitiesIcon,
                roles: [MANAGER],
                featureKey: "live-track",
            },
            {
                title: "Attendance",
                path: "attendance",
                icon: ActivitiesIcon,
                roles: [MANAGER],
                featureKey: "attendance",
            },
            {
                title: "Task Logs",
                path: "task-logs",
                icon: ActivitiesIcon,
                roles: [MANAGER],
                featureKey: "task",
            },
            {
                title: "Request Logs",
                path: "request-logs",
                icon: ImportsIcon,
                roles: [MANAGER],
                featureKey: "request",
            },
            {
                title: "Asset Inventory",
                path: "inventory",
                icon: ImportsIcon,
                roles: [MANAGER],
                featureKey: "asset-inventory",
            },
        ],
    },
];
