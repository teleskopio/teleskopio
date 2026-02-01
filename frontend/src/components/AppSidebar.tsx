import {
  Map as MapIcon,
  PackageCheck,
  ChartNoAxesGantt,
  Cable,
  Rocket,
  Box,
  ShieldAlert,
  User,
  PcCase,
  Merge,
  LayoutDashboard,
  ChevronRight,
  Wallet,
  SlidersHorizontal,
  Layers,
  ShieldUser,
  Columns3Cog,
  EthernetPort,
  Telescope,
  Percent,
  Vote,
  MessageCircleX,
  Share2,
  HardDrive,
  HardDriveDownload,
  VenetianMask,
  SquareAsterisk,
  ArrowUpDown,
  ChevronsLeftRightEllipsis,
  FileSliders,
  Network,
  GlobeLock,
  PersonStanding,
  Waypoints,
  Package,
  CalendarSync,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useloadingState } from '@/store/loader';
import { useLocation } from 'react-router';
import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/util';
import { useCrdResourcesState } from '@/store/crdResources';
import { useConfig } from '@/context/ConfigContext';
// import { compareVersions } from 'compare-versions';

export const items = [
  {
    title: 'Main',
    url: '/',
    icon: Box,
    enabled: false,
    submenu: [],
  },
  {
    title: 'Cluster',
    icon: Waypoints,
    url: '',
    enabled: false,
    submenu: [
      { title: 'Nodes', icon: PcCase, url: '/resource/Node' },
      { title: 'Events', icon: CalendarSync, url: '/resource/Event' },
      { title: 'Namespaces', icon: SquareAsterisk, url: '/resource/Namespace' },
    ],
  },
  {
    title: 'Workloads',
    icon: PackageCheck,
    enabled: false,
    submenu: [
      { title: 'Pods', icon: Package, url: '/resource/Pod' },
      { title: 'Deployments', icon: Package, url: '/resource/Deployment' },
      { title: 'DaemonSets', icon: Package, url: '/resource/DaemonSet' },
      { title: 'ReplicaSets', icon: Package, url: '/resource/ReplicaSet' },
      { title: 'StatefulSets', icon: Package, url: '/resource/StatefulSet' },
      { title: 'Jobs', icon: Package, url: '/resource/Job' },
      { title: 'CronJobs', icon: Package, url: '/resource/CronJob' },
    ],
  },
  {
    title: 'Configuration',
    icon: FileSliders,
    enabled: false,
    submenu: [
      { title: 'ConfigMaps', icon: MapIcon, url: '/resource/ConfigMap' },
      { title: 'Secrets', icon: VenetianMask, url: '/resource/Secret' },
      { title: 'HPA', icon: ArrowUpDown, url: '/resource/HorizontalPodautoScaler' },
      { title: 'PodDisruptionBudget', icon: Percent, url: '/resource/PodDisruptionBudget' },
      { title: 'ResourceQuotas', icon: Wallet, url: '/resource/ResourceQuota' },
      { title: 'LimitRanges', icon: SlidersHorizontal, url: '/resource/LimitRange' },
      { title: 'PriorityClasses', icon: ChartNoAxesGantt, url: '/resource/PriorityClass' },
    ],
  },
  {
    title: 'Networking',
    icon: Network,
    enabled: false,
    submenu: [
      { title: 'Services', icon: Share2, url: '/resource/Service' },
      { title: 'Ingresses', icon: EthernetPort, url: '/resource/Ingress' },
      { title: 'IngressClasses', icon: ChevronsLeftRightEllipsis, url: '/resource/IngressClass' },
      { title: 'NetworkPolicies', icon: ShieldAlert, url: '/resource/NetworkPolicy' },
      { title: 'Endpoints', icon: Cable, url: '/resource/Endpoints' },
    ],
  },
  {
    title: 'Storage',
    icon: HardDrive,
    enabled: false,
    submenu: [
      { title: 'StorageClasses', icon: HardDriveDownload, url: '/resource/StorageClass' },
      { title: 'VolumeAttachments', icon: HardDrive, url: '/resource/VolumeAttachment' },
      { title: 'PV', icon: HardDrive, url: '/resource/PersistentVolume' },
      { title: 'PVC', icon: HardDrive, url: '/resource/PersistentVolumeClaim' },
    ],
  },
  {
    title: 'Administration',
    icon: ShieldUser,
    enabled: false,
    submenu: [
      { title: 'MutatingWebhooks', icon: Vote, url: '/resource/MutatingWebhook' },
      { title: 'ValidatingWebhooks', icon: MessageCircleX, url: '/resource/ValidatingWebhook' },
    ],
  },
  {
    title: 'Access Control',
    icon: GlobeLock,
    enabled: false,
    submenu: [
      { title: 'ServiceAccounts', icon: GlobeLock, url: '/resource/ServiceAccount' },
      { title: 'Roles', icon: PersonStanding, url: '/resource/Role' },
      { title: 'ClusterRoles', icon: User, url: '/resource/ClusterRole' },
      { title: 'RoleBindings', icon: Merge, url: '/resource/RoleBinding' },
    ],
  },
  {
    title: 'CRD',
    icon: Columns3Cog,
    url: '',
    enabled: false,
    submenu: [{ title: 'Definitions', icon: Layers, url: '/resource/CustomResourceDefinition' }],
  },
  {
    title: 'Helm',
    icon: Rocket,
    url: '/helm',
    enabled: false,
    submenu: [],
  },
  {
    title: 'Settings',
    icon: Settings,
    url: '/settings',
    enabled: false,
    submenu: [],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const crds = useCrdResourcesState();
  const [sidebarItems, setSidebarItems] = useState<any>([]);
  const loading = useloadingState();
  const { serverInfo, isLoading } = useConfig();

  useEffect(() => {
    let newSidebar = items;
    const crdArray = Array.from(crds.get().values());
    const crdMap = new Map<string, any[]>();
    crdArray.forEach((crd: any) => {
      const data = crdMap.get(crd.spec.group);
      if (data) {
        crdMap.set(crd.spec.group, [...data, crd]);
      } else {
        crdMap.set(crd.spec.group, [crd]);
      }
    });
    const submenu = [...crdMap.keys()].map((k) => {
      const submenuItems = (crdMap.get(k) || []).map((v: any) => {
        const version = v.spec.versions?.find((x) => x.storage);
        return {
          title: v.spec.names.kind,
          url: `/customresources/${v.spec.names.kind}/${v.spec.group}/${version.name}`,
        };
      });
      return {
        title: k,
        icon: LayoutDashboard,
        url: '',
        submenu: submenuItems,
      };
    });
    newSidebar = items.map((x: any) => {
      if (x.title === 'CRD') {
        x.submenu = [
          { title: 'Definitions', icon: Layers, url: '/resource/CustomResourceDefinition' },
          ...submenu,
        ];
      }
      if (serverInfo?.server === '') {
        if (x.title === 'Main' || x.title === 'Settings') {
          x.enabled = true;
        } else if (x.title !== 'Main' || x.title !== 'Settings') {
          x.enabled = false;
        }
        return x;
      } else if (serverInfo?.server !== '') {
        if (x.title === 'Main') {
          x.enabled = false;
        } else if (x.title !== 'Main') {
          x.enabled = true;
        }
      }
      return x;
    });
    setSidebarItems(newSidebar);
  }, [crds, loading, isLoading]);
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarItems.map((item: any) => (
              <Collapsible key={item.title} className="group/collapsible">
                <SidebarMenuItem
                  className={cn(
                    'text-xs',
                    state === 'collapsed' ? 'hidden' : '',
                    item.enabled ? '' : 'pointer-events-none opacity-50',
                  )}
                  key={item.title}
                >
                  {item?.url ? (
                    <MenuItem item={item} />
                  ) : (
                    <CollapsibleTrigger className="w-full" asChild>
                      <SidebarMenuButton>
                        <div className="flex flex-row items-center">
                          <item.icon size={18} className="mr-1" />
                          <div className="text-xs">{item.title}</div>
                        </div>
                        <ChevronDown
                          size={20}
                          className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent>
                    <SidebarMenuSub className="gap-0 mx-0 px-0 border-none">
                      {item.submenu.map((i, index) => (
                        <SubmenuItem key={index} item={i} />
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <div className="flex flex-row items-center ms:invisible">
                <Telescope size={18} className="mr-1" />
                <a
                  target="_blank"
                  href="https://github.com/teleskopio/teleskopio"
                  className={cn('text-xs', state === 'collapsed' ? 'hidden' : '')}
                >
                  <span>teleskopio v0.1.4</span>
                </a>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function SubmenuItem({ item }: { item: any }) {
  let location = useLocation();
  if (item?.submenu?.length) {
    return (
      <SidebarMenuItem>
        <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton>
              <ChevronRight size={20} className="transition-transform" />
              <span className="text-xs">{item.title}</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.submenu.map((subItem, index) => (
                <MenuItem key={index} item={subItem} />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuSubItem className="flex w-full" key={item.title}>
      <SidebarMenuButton className="p-1" isActive={location.pathname === item?.url}>
        <NavLink
          to={item.url}
          className="peer/menu-button flex flex-row w-full items-center gap-0 overflow-hidden rounded-md text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-xs !gap-0"
        >
          <item.icon size={18} className="mr-1 text-gray-500 ml-2" />
          <div className="text-xs">{item.title}</div>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}

function MenuItem({ item }: { item: any }) {
  let location = useLocation();
  return (
    <SidebarMenuButton isActive={location.pathname === item?.url}>
      <NavLink to={item.url} className="flex flex-row w-full items-center">
        {item?.icon ? <item.icon size={18} className="mr-1" /> : <></>}
        <div className="text-xs">{item.title}</div>
      </NavLink>
    </SidebarMenuButton>
  );
}
