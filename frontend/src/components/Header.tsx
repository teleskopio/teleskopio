import { JumpCommand } from '@/components/ui/jump-command';
import { Plus, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { NamespaceSelector } from '@/components/NamespaceSelector';
import { toast } from 'sonner';
import { removeAllSubscriptions } from '@/lib/subscriptionManager';
import { flushAllStates } from '@/store/resources';
import { useCrdResourcesState } from '@/store/crdResources';
import { Input } from '@/components/ui/input';
import { useConfig } from '@/context/ConfigContext';

export function Header({
  setSearchQuery,
  withNsSelector,
}: {
  setSearchQuery: any;
  withNsSelector?: boolean;
}) {
  const { serverInfo, deleteConfig } = useConfig();
  const crdResources = useCrdResourcesState();
  let navigate = useNavigate();
  let location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [user] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-row py-2 px-2 border-b items-center justify-between sticky top-0 z-10 bg-background">
      {location.pathname === '/createkubernetesresource' ? (
        <></>
      ) : (
        <div className="text-muted-foreground items-center flex flex-grow w-1/3">
          <div className="flex items-center">
            <Button className="text-xs" onClick={() => navigate('/createkubernetesresource')}>
              <Plus /> Create
            </Button>
          </div>
        </div>
      )}
      <div>
        <JumpCommand />
      </div>
      <div className="flex flex-row px-2 items-center">
        <Input
          ref={inputRef}
          placeholder="Filter by name..."
          className="placeholder:text-muted-foreground flex h-6 w-full rounded-md bg-transparent py-2 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="text-muted-foreground items-center flex justify-between"></div>
      {withNsSelector ? (
        <div className="flex flex-row pr-2">
          <NamespaceSelector />
        </div>
      ) : (
        <></>
      )}
      <div className="flex flex-row">
        {user?.role ? (
          <p className="text-muted-foreground text-xs pr-2">
            <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium opacity-100 select-none">
              {user.role}
            </kbd>
          </p>
        ) : (
          <></>
        )}
        {serverInfo?.server === '' ? (
          <></>
        ) : (
          <p className="text-muted-foreground text-xs pr-2">
            <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium opacity-100 select-none">
              {serverInfo?.server}
            </kbd>
          </p>
        )}
        {serverInfo?.version === '' ? (
          <></>
        ) : (
          <p className="text-muted-foreground text-xs">
            <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium opacity-100 select-none">
              {serverInfo?.version}
            </kbd>
          </p>
        )}
      </div>
      <div className="text-muted-foreground">
        <div className="pl-2 flex items-center">
          <Button
            title="disconnect cluster"
            className="bg-red-500 hover:bg-red-400"
            onClick={() => {
              toast.warning(<div>Disconnect cluster {serverInfo?.server}</div>);
              deleteConfig();
              flushAllStates();
              crdResources.set(new Map());
              removeAllSubscriptions();
              navigate('/');
            }}
          >
            <Unplug />
          </Button>
        </div>
      </div>
    </div>
  );
}
