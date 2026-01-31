import { createBrowserRouter, useParams } from 'react-router-dom';
import Nodes from './components/resources/Cluster/Nodes';
import Events from './components/resources/Cluster/Events';
import Pods from '@/components/resources/Workloads/Pods';
import { ResourceEvents } from '@/components/resources/ResourceEvents';
import Deployments from '@/components/resources/Workloads/Deployments';
import DaemonSets from '@/components/resources/Workloads/DaemonSets';
import { PodLogs } from '@/components/resources/Workloads/PodLogs';
import ReplicaSets from '@/components/resources/Workloads/ReplicaSets';
import StatefulSets from '@/components/resources/Workloads/StatefulSets';
import Jobs from '@/components/resources/Workloads/Jobs';
import CronJobs from '@/components/resources/Workloads/CronJobs';
import MutatingWebhooks from '@/components/resources/Administration/MutatingWebhooks';
import ValidatingWebhooks from '@/components/resources/Administration/ValidatingWebhooks';
import CustomResourceDefinitions from '@/components/resources/CRD/CustomResourceDefinitions';
import CustomResources from '@/components/resources/CustomResources/CustomResources';
import ConfigMaps from '@/components/resources/Configuration/ConfigMaps';
import ResourceQuotas from '@/components/resources/Configuration/ResourceQuotas';
import LimitRanges from '@/components/resources/Configuration/LimitRanges';
import Secrets from '@/components/resources/Configuration/Secrets';
import Namespaces from '@/components/resources/Cluster/Namespaces';
import PriorityClasses from '@/components/resources/Configuration/PriorityClasses';
import HorizontalPodAutoscalers from '@/components/resources/Configuration/HorizontalPodAutoscalers';
import PodDisruptionBudgets from '@/components/resources/Configuration/PodDisruptionBudgets';
import StorageClasses from '@/components/resources/Storage/StorageClasses';
import PersistentVolumes from '@/components/resources/Storage/PersistentVolumes';
import PersistentVolumeClaims from '@/components/resources/Storage/PersistentVolumeClaims';
import VolumeAttachments from '@/components/resources/Storage/VolumeAttachments';
import Services from '@/components/resources/Networking/Services';
import IngressClasses from '@/components/resources/Networking/IngressClasses';
import Ingresses from '@/components/resources/Networking/Ingresses';
import Endpoints from '@/components/resources/Networking/Endpoints';
import NetworkPolicies from '@/components/resources/Networking/NetworkPolicies';
import Roles from '@/components/resources/Access/Roles';
import ClusterRoles from '@/components/resources/Access/ClusterRoles';
import RoleBindings from '@/components/resources/Access/RoleBindings';
import ServiceAccounts from '@/components/resources/Access/ServiceAccounts';
import ResourceEditor from '@/components/resources/ResourceEditor';
import ResourceViewer from '@/components/resources/ResourceViewer';
import ResourceSubmit from '@/components/resources/ResourceSubmit';
import { Load, LoadHelmRelease } from '@/loaders';
import { StartPage } from './components/pages/Start';
import { HelmPage } from './components/pages/Helm';
import { SettingsPage } from '@/components/pages/Settings';
import Layout from '@/components/Layout';
import ErrorPage from '@/components/ErrorPage';
import { redirect } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <StartPage />,
      },
    ],
  },
  {
    path: '/resource',
    element: <Layout />,
    children: [
      {
        path: '/resource/Node',
        element: <Nodes />,
      },
      {
        path: '/resource/Deployment',
        element: <Deployments />,
      },
      {
        path: '/resource/DaemonSet',
        element: <DaemonSets />,
      },
      {
        path: '/resource/StatefulSet',
        element: <StatefulSets />,
      },
      {
        path: '/resource/Pod',
        element: <Pods />,
      },
      {
        path: '/resource/Logs/:namespace/:name',
        loader: async ({ params }: { params: any }) => {
          return {
            name: params.name,
            ns: params.namespace,
            data: await Load('Pod', '', params.name, params.namespace),
          };
        },
        element: <PodLogs />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/resource/ReplicaSet',
        element: <ReplicaSets />,
      },
      {
        path: '/resource/Job',
        element: <Jobs />,
      },
      {
        path: '/resource/CronJob',
        element: <CronJobs />,
      },
      {
        path: '/resource/Event',
        element: <Events />,
      },
      {
        path: '/resource/MutatingWebhook',
        element: <MutatingWebhooks />,
      },
      {
        path: '/resource/ResourceQuota',
        element: <ResourceQuotas />,
      },
      {
        path: '/resource/ValidatingWebhook',
        element: <ValidatingWebhooks />,
      },
      {
        path: '/resource/ConfigMap',
        element: <ConfigMaps />,
      },
      {
        path: '/resource/Secret',
        element: <Secrets />,
      },
      {
        path: '/resource/PodDisruptionBudget',
        element: <PodDisruptionBudgets />,
      },
      {
        path: '/resource/HorizontalPodAutoscaler',
        element: <HorizontalPodAutoscalers />,
      },
      {
        path: '/resource/Namespace',
        element: <Namespaces />,
      },
      {
        path: '/resource/Service',
        element: <Services />,
      },
      {
        path: '/resource/Endpoints',
        element: <Endpoints />,
      },
      {
        path: '/resource/Ingress',
        element: <Ingresses />,
      },
      {
        path: '/resource/IngressClass',
        element: <IngressClasses />,
      },
      {
        path: '/resource/NetworkPolicy',
        element: <NetworkPolicies />,
      },
      {
        path: '/resource/ClusterRole',
        element: <ClusterRoles />,
      },
      {
        path: '/resource/PriorityClass',
        element: <PriorityClasses />,
      },
      {
        path: '/resource/RoleBinding',
        element: <RoleBindings />,
      },
      {
        path: '/resource/Role',
        element: <Roles />,
      },
      {
        path: '/resource/ServiceAccount',
        element: <ServiceAccounts />,
      },
      {
        path: '/resource/StorageClass',
        element: <StorageClasses />,
      },
      {
        path: '/resource/PersistentVolume',
        element: <PersistentVolumes />,
      },
      {
        path: '/resource/PersistentVolumeClaim',
        element: <PersistentVolumeClaims />,
      },
      {
        path: '/resource/VolumeAttachment',
        element: <VolumeAttachments />,
      },
      {
        path: '/resource/LimitRange',
        element: <LimitRanges />,
      },
      {
        path: '/resource/CustomResourceDefinition',
        element: <CustomResourceDefinitions />,
      },
      {
        path: '/resource/ResourceEvents/:kind/:uid/:namespace/:name',
        loader: async ({ params }: { params: any }) => {
          return {
            uid: params.uid,
            name: params.name,
            namespace: params.namespace,
          };
        },
        element: <ResourceEvents />,
        errorElement: <ErrorPage />,
      },
    ],
    errorElement: <ErrorPage />,
  },
  {
    path: '/createkubernetesresource',
    element: <Layout />,
    children: [
      {
        path: '/createkubernetesresource',
        element: <ResourceSubmit />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: '/customresources',
    element: <Layout />,
    children: [
      {
        path: '/customresources/:kind/:group/:version',
        loader: async ({ params }: { params: any }) => {
          return {
            group: params.group,
            kind: params.kind,
            version: params.version,
          };
        },
        element: <KindWrapper />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: '/yaml',
    element: <Layout />,
    children: [
      {
        path: '/yaml/:kind/:name/:namespace',
        loader: async ({ params, request }: { params: any; request: Request }) => {
          const url = new URL(request.url);
          const query = Object.fromEntries(url.searchParams.entries());
          const data = await Load(params.kind, query.group, params.name, params.namespace);
          if (!data) {
            return redirect(location.pathname);
          }
          return {
            name: params.name,
            group: params.group,
            namespace: params.namespace,
            data: data,
          };
        },
        element: <ResourceEditor />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: '/helm',
    element: <Layout />,
    children: [
      {
        path: '/helm',
        element: <HelmPage />,
      },
      {
        path: '/helm/:name/:namespace',
        loader: async ({ params }: { params: any; request: Request }) => {
          const data = await LoadHelmRelease(params.name, params.namespace);
          if (!data) {
            return redirect(location.pathname);
          }
          return {
            name: params.name,
            namespace: params.namespace,
            data: data.data,
          };
        },
        element: <ResourceViewer />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: '/settings',
    element: <Layout />,
    children: [
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
]);

function KindWrapper() {
  const { kind } = useParams();
  return <CustomResources key={`${kind}-${Math.random()}`} />;
}
