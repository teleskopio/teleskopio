import { ContextMenuItem } from '@/components/ui/context-menu';
import { RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import type { ApiResource } from '@/types';
import { call } from '@/lib/api';

export function CronJobTriggerMenu({
  key,
  obj,
  apiResource,
}: {
  apiResource: ApiResource | undefined;
  key: string;
  obj: any;
}) {
  return (
    <ContextMenuItem
      key={`${key}-${Math.random()}`}
      className="text-xs"
      onClick={() => {
        call(`trigger_cronjob`, {
          apiResource: { ...apiResource },
          namespace: obj.metadata?.namespace,
          name: obj.metadata?.name,
        })
          .then((data) => {
            if (data.message) {
              toast.error(
                <span>
                  Cant trigger cronjob {obj.metadata?.name}
                  <br />
                  {data.message}
                </span>,
              );
            } else {
              toast.info(
                <span>
                  Cronjob {obj.metadata?.name} triggered
                  <br />
                  Job: {data.success} created
                </span>,
              );
            }
          })
          .catch((reason) => {
            toast.error(
              <span>
                Cant trigger cronjob {obj.metadata?.name}
                <br />
                {reason.message}
              </span>,
            );
          });
      }}
    >
      <RotateCw />
      Trigger
    </ContextMenuItem>
  );
}
