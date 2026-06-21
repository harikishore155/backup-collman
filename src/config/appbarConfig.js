import CustomersIcon from "@/assets/images/appbar/customers.svg?react";
import DashboardIcon from "@/assets/images/appbar/dashboard.svg?react";
import DcrIcon from "@/assets/images/appbar/dcr.svg?react";
import ImportsIcon from "@/assets/images/appbar/imports.svg?react";
import KnowledgeBaseIcon from "@/assets/images/appbar/knowledge-base.svg?react";
import MastersIcon from "@/assets/images/appbar/masters.svg?react";
import ReportsIcon from "@/assets/images/appbar/reports.svg?react";
import ClientIcon from "@/assets/images/appbar/client.svg?react";
import UserIcon from "@/assets/images/appbar/user.svg?react";
import RoleIcon from "@/assets/images/appbar/role.svg?react";
import ProductIcon from "@/assets/images/appbar/product.svg?react";
import TypeIcon from "@/assets/images/appbar/type.svg?react";
import MisIcon from "@/assets/images/appbar/mis.svg?react";
import FieldIcon from "@/assets/images/appbar/field.svg?react";
import AllocationIcon from "@/assets/images/appbar/allocation.svg?react";
import TargetIcon from "@/assets/images/appbar/target.svg?react";
import IncentiveIcon from "@/assets/images/appbar/incentive.svg?react";
import { ROUTE_ACCESS } from "@/router/routeAccessConfig";

export const APPBAR_CONFIG = [
    {
        title: "Dashboard",
        path: "dashboard",
        icon: DashboardIcon,
        access: ROUTE_ACCESS.dashboard,
    },
    {
        title: "Customer Mgt",
        path: "customer-mgt",
        icon: CustomersIcon,
        children: [
            {
                title: "Customers",
                path: "customer-mgt/customers",
                icon: CustomersIcon,
                access: ROUTE_ACCESS.customers,
            },
            {
                title: "Allocation",
                path: "customer-mgt/allocation",
                icon: AllocationIcon,
                access: ROUTE_ACCESS.allocation,
            },
            {
                title: "BKT Dispositions",
                path: "cases/bkt",
                icon: AllocationIcon,
                access: ROUTE_ACCESS.dispositions,
            },
            {
                title: "REC Dispositions",
                path: "cases/rec",
                icon: AllocationIcon,
                access: ROUTE_ACCESS.dispositions,
            }
        ]
    },
    {
        title: "Masters",
        path: "masters",
        icon: MastersIcon,
        children: [
            {
                title: "Client Master",
                path: "masters/clients",
                icon: ClientIcon,
                access: ROUTE_ACCESS.masters,
            },
            {
                title: "User Master",
                path: "masters/users",
                icon: UserIcon,
                access: ROUTE_ACCESS.masters,
            },
            {
                title: "Role Master",
                path: "masters/roles",
                icon: RoleIcon,
                access: ROUTE_ACCESS.masters,
            },
            {
                title: "Product Master",
                path: "masters/products",
                icon: ProductIcon,
                access: ROUTE_ACCESS.masters,
            },
            {
                title: "Type Master",
                path: "masters/type",
                icon: TypeIcon,
                access: ROUTE_ACCESS.masters,
            },
            {
                title: "MIS Code Master",
                path: "masters/mis-code",
                icon: MisIcon,
                access: ROUTE_ACCESS.masters,
            },
            {
                title: "Field Setup",
                path: "masters/fields",
                icon: FieldIcon,
                access: ROUTE_ACCESS.masters,
            },
        ],
    },
    // {
    //     title: "Activities",
    //     path: "activities",
    //     icon: ActivitiesIcon,
    // },
    {
        title: "DCR's",
        path: "dcrs",
        icon: DcrIcon,
        access: ROUTE_ACCESS.dcrs,
    },
    {
        title: "Goal Sheet",
        path: "customer-mgt/goal-sheet",
        icon: TargetIcon,
        access: ROUTE_ACCESS.targets,
    },
    {
        title: "Incentive",
        path: "customer-mgt/incentives",
        icon: IncentiveIcon,
        access: ROUTE_ACCESS.incentives,
    },
    {
        title: "Reports",
        path: "reports",
        icon: ReportsIcon,
        access: ROUTE_ACCESS.reports,
    },
    {
        title: "Imports",
        path: "imports",
        icon: ImportsIcon,
        access: ROUTE_ACCESS.imports,
    },
    {
        title: "Knowledge Base",
        path: "knowledge-base",
        icon: KnowledgeBaseIcon,
        access: ROUTE_ACCESS.knowledgeBase,
    },
    // {
    //     title: "Campaign Mgt",
    //     path: "campaign-mgt",
    //     icon: KnowledgeBaseIcon,
    // },
];
