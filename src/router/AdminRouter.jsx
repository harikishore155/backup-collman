import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import PreLoader from "@/components/PreLoader/PreLoader";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";
import NotFound from "@/components/NotFound/NotFound";
import MainLayout from "@/layouts/MainLayout/MainLayout";
import ProductForm from "@/pages/Masters/Products/ProductForm/ProductForm";
import ClientForm from "@/pages/Masters/Clients/ClientForm/ClientForm";
import UserForm from "@/pages/Masters/Users/UserForm/UserForm";
import TypeForm from "@/pages/Masters/Type/TypeForm/TypeForm";
import MISCodeForm from "@/pages/Masters/MISCode/MISCodeForm/MISCodeForm";
import FieldsForm from "@/pages/Masters/Fields/FieldsForm/FieldsForm";
import { ROUTE_ACCESS } from "./routeAccessConfig";

const DashboardLayout = lazy(
  () => import("@/pages/Dashboard/DashboardLayout/DashboardLayout"),
);
const ClientsList = lazy(
  () => import("@/pages/Masters/Clients/ClientsList/ClientsList"),
);
const ClientDetails = lazy(
  () => import("@/pages/Masters/Clients/ClientDetails/ClientDetails"),
);
const CampaignsTab = lazy(
  () => import("@/pages/Masters/Clients/ClientDetails/tabs/CampaignsTab"),
);
const UsersTab = lazy(
  () => import("@/pages/Masters/Clients/ClientDetails/tabs/UsersTab"),
);
const AuditLogsTab = lazy(
  () => import("@/pages/Masters/Clients/ClientDetails/tabs/AuditLogsTab"),
);
const UserDetails = lazy(
  () => import("@/pages/Masters/Users/UserDetails/UserDetails"),
);
const DetailsTab = lazy(
  () => import("@/pages/Masters/Users/UserDetails/tabs/DetailsTab"),
);
const RoleTab = lazy(
  () => import("@/pages/Masters/Users/UserDetails/tabs/RoleTab"),
);
const UserAuditLogsTab = lazy(
  () => import("@/pages/Masters/Users/UserDetails/tabs/AuditLogsTab"),
);
const UsersList = lazy(
  () => import("@/pages/Masters/Users/UsersList/UsersList"),
);
const RolesList = lazy(
  () => import("@/pages/Masters/Roles/RolesList/RolesList"),
);
const RoleDetails = lazy(
  () => import("@/pages/Masters/Roles/RoleDetails/RoleDetails"),
);
const AccessTab = lazy(
  () => import("@/pages/Masters/Roles/RoleDetails/tabs/AccessTab"),
);
const RoleAuditLogsTab = lazy(
  () => import("@/pages/Masters/Roles/RoleDetails/tabs/AuditLogsTab"),
);
const ProductDetails = lazy(
  () => import("@/pages/Masters/Products/ProductDetails/ProductDetails"),
);
const ProductDescriptionTab = lazy(
  () => import("@/pages/Masters/Products/ProductDetails/tabs/DescriptionTab"),
);
const ProductAuditLogsTab = lazy(
  () => import("@/pages/Masters/Products/ProductDetails/tabs/AuditLogsTab"),
);
const ProductsList = lazy(
  () => import("@/pages/Masters/Products/ProductsList/ProductsList"),
);
const TypeDetails = lazy(
  () => import("@/pages/Masters/Type/TypeDetails/TypeDetails"),
);
const TypeDescriptionTab = lazy(
  () => import("@/pages/Masters/Type/TypeDetails/tabs/DescriptionTab"),
);
const TypeAuditLogsTab = lazy(
  () => import("@/pages/Masters/Type/TypeDetails/tabs/AuditLogsTab"),
);
const MISCodeDetails = lazy(
  () => import("@/pages/Masters/MISCode/MISCodeDetails/MISCodeDetails"),
);
const MISCodeDescriptionTab = lazy(
  () => import("@/pages/Masters/MISCode/MISCodeDetails/tabs/DescriptionTab"),
);
const MISCodeAuditLogsTab = lazy(
  () => import("@/pages/Masters/MISCode/MISCodeDetails/tabs/AuditLogsTab"),
);
const TypeList = lazy(() => import("@/pages/Masters/Type/TypeList/TypeList"));
const MISCodeList = lazy(
  () => import("@/pages/Masters/MISCode/MISCodeList/MISCodeList"),
);
const FieldsList = lazy(
  () => import("@/pages/Masters/Fields/FieldsList/FieldsList"),
);
const CustomersList = lazy(
  () => import("@/pages/CustomerMgt/Customers/CustomersList/CustomersList"),
);
const CustomerDetails = lazy(
  () => import("@/pages/CustomerMgt/Customers/CustomerDetails/CustomerDetails"),
);
const CustomerForm = lazy(
  () => import("@/pages/CustomerMgt/Customers/CustomerForm/CustomerForm"),
);
const AllocationList = lazy(
  () => import("@/pages/CustomerMgt/Allocation/AllocationList/AllocationList"),
);
const AllocationDetails = lazy(
  () =>
    import("@/pages/CustomerMgt/Allocation/AllocationDetails/AllocationDetails"),
);
const CasesTab = lazy(
  () =>
    import("@/pages/CustomerMgt/Allocation/AllocationDetails/tabs/CasesTab"),
);
const AllocationDetailsTab = lazy(
  () =>
    import("@/pages/CustomerMgt/Allocation/AllocationDetails/tabs/DetailsTab"),
);
const AllocationAuditLogsTab = lazy(
  () =>
    import("@/pages/CustomerMgt/Allocation/AllocationDetails/tabs/AuditLogsTab"),
);
const AllocationForm = lazy(
  () => import("@/pages/CustomerMgt/Allocation/AllocationForm/AllocationForm"),
);
const UpdateStatusForm = lazy(
  () =>
    import("@/pages/CustomerMgt/Allocation/UpdateStatusForm/UpdateStatusForm"),
);
const TargetsList = lazy(
  () => import("@/pages/CustomerMgt/Targets/TargetsList/TargetsList"),
);
const TargetDetails = lazy(
  () => import("@/pages/CustomerMgt/Targets/TargetDetails/TargetDetails"),
);
const TargetStatusTab = lazy(
  () => import("@/pages/CustomerMgt/Targets/TargetDetails/tabs/StatusTab"),
);
const TargetDetailsTab = lazy(
  () => import("@/pages/CustomerMgt/Targets/TargetDetails/tabs/DetailsTab"),
);
const TargetAuditLogsTab = lazy(
  () => import("@/pages/CustomerMgt/Targets/TargetDetails/tabs/AuditLogsTab"),
);
const IncentiveList = lazy(
  () => import("@/pages/CustomerMgt/Incentive/IncentiveList/IncentiveList"),
);
const TargetForm = lazy(
  () => import("@/pages/CustomerMgt/Targets/TargetForm/TargetForm"),
);
const IncentiveForm = lazy(
  () => import("@/pages/CustomerMgt/Incentive/IncentiveForm/IncentiveForm"),
);
const DCRsList = lazy(() => import("@/pages/DCRs/DCRsList/DCRsList"));
const DispositionList = lazy(
  () =>
    import(
      "@/pages/CustomerMgt/Dispositions/DispositionList/DispositionList"
    ),
);
const ReportHome = lazy(() => import("@/pages/Report/ReportHome/ReportHome"));
const DataNotFound = lazy(() => import("@/components/DataNotFound/DataNotFound"));
const KnowledgeBasedHome = lazy(
  () => import("@/pages/KnowleadgeBased/KnowledgeBasedHome/KnowledgeBasedHome"),
);
const KnowledgeBasedForm = lazy(
  () => import("@/pages/KnowleadgeBased/KnowledgeBasedForm/KnowledgeBasedForm"),
);
const ImportHome = lazy(() => import("@/pages/Import/ImportHome/ImportHome"));
const ImportAuditLogs = lazy(
  () => import("@/pages/Import/ImportAuditLogs/ImportAuditLogs"),
);
const ImportList = lazy(() => import("@/pages/Import/ImportList/ImportList"));
const UploadPage = lazy(() => import("@/pages/Import/UploadPage/UploadPage"));
const UploadForm = lazy(() => import("@/pages/Import/UploadForm/UploadForm"));
const ProfilePage = lazy(() => import("@/pages/Profile/ProfilePage"));

const RoleForm = lazy(() => import("@/pages/Masters/Roles/RoleForm/RoleForm"));

const AdminRouter = () => {
  const withAccess = (element, access) =>
    access ? (
      <RoleProtectedRoute module={access.module} action={access.action}>
        {element}
      </RoleProtectedRoute>
    ) : (
      element
    );

  return (
    <Suspense fallback={<PreLoader />}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route
              path="dashboard"
              element={withAccess(<DashboardLayout />, ROUTE_ACCESS.dashboard)}
            />
            <Route path="profile" element={<ProfilePage />} />

            <Route path="masters">
              <Route path="clients">
                <Route index element={withAccess(<ClientsList />, ROUTE_ACCESS.masters)} />
                <Route path="create" element={withAccess(<ClientForm mode="create" />, ROUTE_ACCESS.masterCreate)} />
                <Route path="edit/:id" element={withAccess(<ClientForm mode="edit" />, ROUTE_ACCESS.masterEdit)} />
                <Route path="view/:id" element={withAccess(<ClientDetails />, ROUTE_ACCESS.masters)}>
                  <Route index element={<Navigate to="campaigns" replace />} />
                  <Route path="campaigns" element={<CampaignsTab />} />
                  <Route path="users" element={<UsersTab />} />
                  <Route path="audit-logs" element={<AuditLogsTab />} />
                </Route>
              </Route>

              <Route path="users">
                <Route index element={withAccess(<UsersList />, ROUTE_ACCESS.masters)} />
                <Route path="create" element={withAccess(<UserForm mode="create" />, ROUTE_ACCESS.masterCreate)} />
                <Route path="edit/:id" element={withAccess(<UserForm mode="edit" />, ROUTE_ACCESS.masterEdit)} />
                <Route path="view/:id" element={withAccess(<UserDetails />, ROUTE_ACCESS.masters)}>
                  <Route index element={<Navigate to="details" replace />} />
                  <Route path="details" element={<DetailsTab />} />
                  <Route path="role" element={<RoleTab />} />
                  <Route path="audit-logs" element={<UserAuditLogsTab />} />
                </Route>
              </Route>

              <Route path="roles">
                <Route index element={withAccess(<RolesList />, ROUTE_ACCESS.masters)} />
                <Route path="create" element={withAccess(<RoleForm mode="create" />, ROUTE_ACCESS.masterCreate)} />
                <Route path="edit/:id" element={withAccess(<RoleForm mode="edit" />, ROUTE_ACCESS.masterEdit)} />
                <Route path="view/:id" element={withAccess(<RoleDetails />, ROUTE_ACCESS.masters)}>
                  <Route index element={<Navigate to="access" replace />} />
                  <Route path="access" element={<AccessTab />} />
                  <Route path="audit-logs" element={<RoleAuditLogsTab />} />
                </Route>
              </Route>

              <Route path="products">
                <Route index element={withAccess(<ProductsList />, ROUTE_ACCESS.masters)} />
                <Route path="create" element={withAccess(<ProductForm mode="create" />, ROUTE_ACCESS.masterCreate)} />
                <Route path="edit/:id" element={withAccess(<ProductForm mode="edit" />, ROUTE_ACCESS.masterEdit)} />
                <Route path="view/:id" element={withAccess(<ProductDetails />, ROUTE_ACCESS.masters)}>
                  <Route
                    index
                    element={<Navigate to="description" replace />}
                  />
                  <Route
                    path="description"
                    element={<ProductDescriptionTab />}
                  />
                  <Route path="audit-logs" element={<ProductAuditLogsTab />} />
                </Route>
              </Route>

              <Route path="type">
                <Route index element={withAccess(<TypeList />, ROUTE_ACCESS.masters)} />
                <Route path="create" element={withAccess(<TypeForm mode="create" />, ROUTE_ACCESS.masterCreate)} />
                <Route path="edit/:id" element={withAccess(<TypeForm mode="edit" />, ROUTE_ACCESS.masterEdit)} />
                <Route path="view/:id" element={withAccess(<TypeDetails />, ROUTE_ACCESS.masters)}>
                  <Route
                    index
                    element={<Navigate to="description" replace />}
                  />
                  <Route path="description" element={<TypeDescriptionTab />} />
                  <Route path="audit-logs" element={<TypeAuditLogsTab />} />
                </Route>
              </Route>

              <Route path="mis-code">
                <Route index element={withAccess(<MISCodeList />, ROUTE_ACCESS.masters)} />
                <Route path="create" element={withAccess(<MISCodeForm mode="create" />, ROUTE_ACCESS.masterCreate)} />
                <Route path="edit/:_id" element={withAccess(<MISCodeForm mode="edit" />, ROUTE_ACCESS.masterEdit)} />
                <Route path="view/:_id" element={withAccess(<MISCodeDetails />, ROUTE_ACCESS.masters)}>
                  <Route
                    index
                    element={<Navigate to="description" replace />}
                  />
                  <Route
                    path="description"
                    element={<MISCodeDescriptionTab />}
                  />
                  <Route path="audit-logs" element={<MISCodeAuditLogsTab />} />
                </Route>
              </Route>

              <Route path="fields">
                <Route index element={withAccess(<FieldsList />, ROUTE_ACCESS.masters)} />
                <Route path="create" element={withAccess(<FieldsForm mode="create" />, ROUTE_ACCESS.masterCreate)} />
                <Route path="edit/:id" element={withAccess(<FieldsForm mode="edit" />, ROUTE_ACCESS.masterEdit)} />
                <Route path="view/:id" element={withAccess(<FieldsForm mode="view" />, ROUTE_ACCESS.masters)} />
              </Route>
            </Route>

            <Route path="customer-mgt">
              {/* ── Customers ── */}
              <Route path="customers">
                <Route index element={withAccess(<CustomersList />, ROUTE_ACCESS.customers)} />
                <Route path="view/:id" element={withAccess(<CustomerDetails />, ROUTE_ACCESS.customers)} />
                <Route path="create" element={withAccess(<CustomerForm mode="create" />, ROUTE_ACCESS.customerCreate)} />
                <Route path="edit/:id" element={withAccess(<CustomerForm mode="edit" />, ROUTE_ACCESS.customerEdit)} />
              </Route>

              {/* ── Allocation ── */}
              <Route path="allocation">
                <Route index element={withAccess(<AllocationList />, ROUTE_ACCESS.allocation)} />
                <Route
                  path="create"
                  element={withAccess(<AllocationForm mode="create" />, ROUTE_ACCESS.allocationCreate)}
                />
                <Route
                  path="edit/:id"
                  element={withAccess(<AllocationForm mode="edit" />, ROUTE_ACCESS.allocationEdit)}
                />
                <Route path="view/:id" element={withAccess(<AllocationDetails />, ROUTE_ACCESS.allocation)}>
                  <Route index element={<Navigate to="cases" replace />} />
                  <Route path="cases" element={<CasesTab />} />
                  <Route path="details" element={<AllocationDetailsTab />} />
                  <Route
                    path="audit-logs"
                    element={<AllocationAuditLogsTab />}
                  />
                </Route>
                <Route
                  path="update-status"
                  element={withAccess(<UpdateStatusForm mode="create" />, ROUTE_ACCESS.allocationUpdateStatus)}
                />
              </Route>

              {/* ── Goal Sheet / Targets ── */}
              <Route path="goal-sheet">
                <Route index element={withAccess(<TargetsList />, ROUTE_ACCESS.targets)} />
                <Route path="create" element={withAccess(<TargetForm mode="create" />, ROUTE_ACCESS.targetCreate)} />
                <Route path="edit/:id" element={withAccess(<TargetForm mode="edit" />, ROUTE_ACCESS.targetEdit)} />
                <Route path="view/:id" element={withAccess(<TargetDetails />, ROUTE_ACCESS.targets)}>
                  <Route index element={<Navigate to="status" replace />} />
                  <Route path="status" element={<TargetStatusTab />} />
                  <Route path="details" element={<TargetDetailsTab />} />
                  <Route path="audit-logs" element={<TargetAuditLogsTab />} />
                </Route>
              </Route>

              {/* ── Incentives ── */}
              <Route path="incentives">
                <Route index element={withAccess(<IncentiveList />, ROUTE_ACCESS.incentives)} />
                <Route
                  path="create"
                  element={withAccess(<IncentiveForm mode="create" />, ROUTE_ACCESS.incentiveCreate)}
                />
                <Route
                  path="edit/:id"
                  element={withAccess(<IncentiveForm mode="edit" />, ROUTE_ACCESS.incentiveEdit)}
                />
                <Route
                  path="view/:id"
                  element={withAccess(<IncentiveForm mode="view" />, ROUTE_ACCESS.incentives)}
                />
              </Route>
            </Route>

            <Route path="dcrs" element={withAccess(<DCRsList />, ROUTE_ACCESS.dcrs)} />

            <Route path="cases">
              <Route path="bkt" element={withAccess(<DispositionList type="BKT" />, ROUTE_ACCESS.dispositions)} />
              <Route path="rec" element={withAccess(<DispositionList type="REC" />, ROUTE_ACCESS.dispositions)} />
            </Route>

            <Route path="reports">
              <Route index element={withAccess(<ReportHome />, ROUTE_ACCESS.reports)} />
              <Route path="telecaller-activity" element={withAccess(<DataNotFound title="Telecaller Activity" />, ROUTE_ACCESS.reports)} />
              <Route path="ptp" element={withAccess(<DataNotFound title="PTP" />, ROUTE_ACCESS.reports)} />
            </Route>

            <Route path="knowledge-base">
              <Route index element={withAccess(<KnowledgeBasedHome />, ROUTE_ACCESS.knowledgeBase)} />
              <Route path="create" element={withAccess(<KnowledgeBasedForm />, ROUTE_ACCESS.knowledgeBase)} />
            </Route>

            <Route path="imports">
              <Route index element={withAccess(<ImportHome />, ROUTE_ACCESS.imports)} />
              <Route path="audit" element={withAccess(<ImportAuditLogs />, ROUTE_ACCESS.imports)} />
              <Route path="list" element={withAccess(<ImportList />, ROUTE_ACCESS.imports)} />
              <Route path="upload" element={withAccess(<UploadPage />, ROUTE_ACCESS.imports)} />
              <Route path="upload/form" element={withAccess(<UploadForm />, ROUTE_ACCESS.imports)} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRouter;
