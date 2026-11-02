import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RequireAuth } from './core/guards/RequireAuth';
import { RequireSysadmin } from './core/guards/RequireSysadmin';
import { LegacyRedirect } from './core/routing/LegacyRedirect';
import { AppShell } from './components/shared/app-shell/AppShell';
import { PortalShell } from './components/shared/portal/portal-shell/PortalShell';
import { useInternalLinkNavigation } from './core/hooks/useInternalLinkNavigation';
import { DatasetCreateSkeleton } from './components/dataset-create/DatasetCreateSkeleton';
import { OrganizationCreateSkeleton } from './components/organization-create/OrganizationCreateSkeleton';
import { ProfileSkeleton } from './components/profile/ProfileSkeleton';
import { HarmonizerNewSurveySkeleton } from './components/harmonizer/harmonizer-new-survey/HarmonizerNewSurveySkeleton';
import { HarmonizerUploadSkeleton } from './components/harmonizer/harmonizer-upload/HarmonizerUploadSkeleton';
import { HarmonizerMappingSkeleton } from './components/harmonizer/harmonizer-mapping/HarmonizerMappingSkeleton';
import { HarmonizerHomeSkeleton } from './components/harmonizer/harmonizer-home/HarmonizerHomeSkeleton';
import { HarmonizerViewSkeleton } from './components/harmonizer/harmonizer-view/HarmonizerViewSkeleton';
import { HarmonizerVariablesSkeleton } from './components/harmonizer/harmonizer-variables/HarmonizerVariablesSkeleton';
import { HarmonizerVariableSkeleton } from './components/harmonizer/harmonizer-variable/HarmonizerVariableSkeleton';
import { HarmonizerCodebooksSkeleton } from './components/harmonizer/harmonizer-codebooks/HarmonizerCodebooksSkeleton';
import { HomeSkeleton } from './components/home/HomeSkeleton';
import { DatasetsListSkeleton } from './components/datasets-list/DatasetsListSkeleton';
import { OrganizationsListSkeleton } from './components/organizations-list/OrganizationsListSkeleton';
import { OrganizationDetailSkeleton } from './components/organization-detail/OrganizationDetailSkeleton';
import { DatasetDetailSkeleton } from './components/dataset-detail/DatasetDetailSkeleton';
import { PortalHomeSkeleton } from './components/portal/portal-home/PortalHomeSkeleton';
import { PortalDataSkeleton } from './components/portal/portal-data/PortalDataSkeleton';
import { PortalTopicsSkeleton } from './components/portal/portal-topics/PortalTopicsSkeleton';
import { PortalChartsViewSkeleton } from './components/portal/portal-charts-view/PortalChartsViewSkeleton';

const Login = lazy(() => import('./components/login/Login').then((m) => ({ default: m.Login })));
const Home = lazy(() => import('./components/home/Home').then((m) => ({ default: m.Home })));
const PortalHome = lazy(() => import('./components/portal/portal-home/PortalHome'));
const PortalData = lazy(() => import('./components/portal/portal-data/PortalData'));
const PortalTopics = lazy(() => import('./components/portal/portal-topics/PortalTopics'));
const PortalChartsView = lazy(
  () => import('./components/portal/portal-charts-view/PortalChartsView'),
);
const DatasetsList = lazy(() =>
  import('./components/datasets-list/DatasetsList').then((m) => ({ default: m.DatasetsList })),
);
const OrganizationsList = lazy(() =>
  import('./components/organizations-list/OrganizationsList').then((m) => ({
    default: m.OrganizationsList,
  })),
);
const OrganizationDetail = lazy(() =>
  import('./components/organization-detail/OrganizationDetail').then((m) => ({
    default: m.OrganizationDetail,
  })),
);
const OrganizationCreate = lazy(() =>
  import('./components/organization-create/OrganizationCreate').then((m) => ({
    default: m.OrganizationCreate,
  })),
);
const DatasetCreate = lazy(() =>
  import('./components/dataset-create/DatasetCreate').then((m) => ({ default: m.DatasetCreate })),
);
const DatasetDetail = lazy(() =>
  import('./components/dataset-detail/DatasetDetail').then((m) => ({ default: m.DatasetDetail })),
);
const Profile = lazy(() =>
  import('./components/profile/Profile').then((m) => ({ default: m.Profile })),
);
const HarmonizerHome = lazy(() =>
  import('./components/harmonizer/harmonizer-home/HarmonizerHome').then((m) => ({
    default: m.HarmonizerHome,
  })),
);
const HarmonizerNewSurvey = lazy(() =>
  import('./components/harmonizer/harmonizer-new-survey/HarmonizerNewSurvey').then((m) => ({
    default: m.HarmonizerNewSurvey,
  })),
);
const HarmonizerUpload = lazy(() =>
  import('./components/harmonizer/harmonizer-upload/HarmonizerUpload').then((m) => ({
    default: m.HarmonizerUpload,
  })),
);
const HarmonizerMapping = lazy(() =>
  import('./components/harmonizer/harmonizer-mapping/HarmonizerMapping').then((m) => ({
    default: m.HarmonizerMapping,
  })),
);
const HarmonizerView = lazy(() =>
  import('./components/harmonizer/harmonizer-view/HarmonizerView').then((m) => ({
    default: m.HarmonizerView,
  })),
);
const HarmonizerVariables = lazy(() =>
  import('./components/harmonizer/harmonizer-variables/HarmonizerVariables').then((m) => ({
    default: m.HarmonizerVariables,
  })),
);
const HarmonizerVariable = lazy(() =>
  import('./components/harmonizer/harmonizer-variable/HarmonizerVariable').then((m) => ({
    default: m.HarmonizerVariable,
  })),
);
const HarmonizerCodebooks = lazy(() =>
  import('./components/harmonizer/harmonizer-codebooks/HarmonizerCodebooks').then((m) => ({
    default: m.HarmonizerCodebooks,
  })),
);

function lazyRoute(path: string, page: ReactNode, skeleton: ReactNode) {
  return (
    <Route
      key={path}
      path={path}
      element={
        <Suspense key={path} fallback={skeleton}>
          {page}
        </Suspense>
      }
    />
  );
}

export function AppRoutes() {
  useInternalLinkNavigation();

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<PortalShell />}>
          {lazyRoute('/', <PortalHome />, <PortalHomeSkeleton />)}
          {lazyRoute('/data', <PortalData />, <PortalDataSkeleton />)}
          {lazyRoute('/topics', <PortalTopics />, <PortalTopicsSkeleton />)}
          {lazyRoute('/charts', <PortalChartsView />, <PortalChartsViewSkeleton />)}
          {lazyRoute('/data/view', <PortalChartsView />, <PortalChartsViewSkeleton />)}
        </Route>

        {/* Old Spanish portal URLs, already shared since the portal went live. */}
        <Route path="/datos" element={<LegacyRedirect to="/data" />} />
        <Route path="/temas" element={<LegacyRedirect to="/topics" />} />
        <Route path="/vistagraficas" element={<LegacyRedirect to="/charts" />} />
        <Route path="/datos/vista-datos" element={<LegacyRedirect to="/data/view" />} />

        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            {lazyRoute('/dashboard', <Home />, <HomeSkeleton />)}
            {lazyRoute('/datasets', <DatasetsList />, <DatasetsListSkeleton />)}
            {lazyRoute('/organizations', <OrganizationsList />, <OrganizationsListSkeleton />)}
            <Route element={<RequireSysadmin redirectTo="/organizations" />}>
              {lazyRoute(
                '/organizations/new',
                <OrganizationCreate />,
                <OrganizationCreateSkeleton />,
              )}
            </Route>
            {lazyRoute(
              '/organizations/:organizationId',
              <OrganizationDetail />,
              <OrganizationDetailSkeleton />,
            )}
            {lazyRoute(
              '/organizations/:organizationId/datasets/new',
              <DatasetCreate />,
              <DatasetCreateSkeleton />,
            )}
            {lazyRoute(
              '/organizations/:organizationId/datasets/:datasetId',
              <DatasetDetail />,
              <DatasetDetailSkeleton />,
            )}
            {lazyRoute('/profile', <Profile />, <ProfileSkeleton />)}
            {lazyRoute('/harmonizer', <HarmonizerHome />, <HarmonizerHomeSkeleton />)}
            {lazyRoute(
              '/harmonizer/new-survey',
              <HarmonizerNewSurvey />,
              <HarmonizerNewSurveySkeleton />,
            )}
            {lazyRoute(
              '/harmonizer/surveys/:surveyId/edit',
              <HarmonizerNewSurvey />,
              <HarmonizerNewSurveySkeleton />,
            )}
            {lazyRoute('/harmonizer/upload', <HarmonizerUpload />, <HarmonizerUploadSkeleton />)}
            {lazyRoute(
              '/harmonizer/datasets/:datasetId/mapping',
              <HarmonizerMapping />,
              <HarmonizerMappingSkeleton />,
            )}
            {lazyRoute(
              '/harmonizer/datasets/:datasetId/harmonized',
              <HarmonizerView />,
              <HarmonizerViewSkeleton />,
            )}
            {lazyRoute(
              '/harmonizer/surveys/:surveyId/variables',
              <HarmonizerVariables />,
              <HarmonizerVariablesSkeleton />,
            )}
            {lazyRoute(
              '/harmonizer/surveys/:surveyId/variables/:variableId',
              <HarmonizerVariable />,
              <HarmonizerVariableSkeleton />,
            )}
            {lazyRoute(
              '/harmonizer/surveys/:surveyId/codebooks',
              <HarmonizerCodebooks />,
              <HarmonizerCodebooksSkeleton />,
            )}
            {lazyRoute(
              '/harmonizer/surveys/:surveyId/harmonized',
              <HarmonizerView />,
              <HarmonizerViewSkeleton />,
            )}
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
