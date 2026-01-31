import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { call } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResource } from '@/types';
import { cordoned } from '@/util';

interface CordonDialogProps {
  kind: string;
  apiResource: ApiResource | undefined;
  rows: any;
  open: boolean;
  setOpenDialog: (close: boolean) => void;
}
export function CordonDialog({ apiResource, kind, rows, open, setOpenDialog }: CordonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpenDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xs">
            <div>
              Cordon {rows.length} <span className="underline">{kind}</span>
            </div>
            <div className="pt-4 text-xs text-red-600 font-bold">
              This operation can't be undone!
            </div>
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <ul className="list-disc pl-3 text-xs">
          {rows.map((x: any, i: number) => {
            return (
              <li key={i}>
                Going to <b className="underline">{cordoned(x.original) ? 'uncordon' : 'cordon'}</b>{' '}
                node {x.original.metadata.name}
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end gap-2">
          <Button className="text-xs" onClick={() => setOpenDialog(false)} variant="outline">
            Cancel
          </Button>
          <Button
            className="text-xs"
            variant="destructive"
            onClick={() => {
              rows.forEach((x: any) => {
                let request = {
                  cordon: cordoned(x.original) ? false : true,
                  name: x.original.metadata?.name,
                  apiResource: { ...apiResource },
                };
                call(`${cordoned(x.original) ? 'uncordon' : 'cordon'}_node`, {
                  ...request,
                  resourceName: x.original.metadata?.name,
                })
                  .then((data) => {
                    if (data.message) {
                      toast.error(
                        <span>
                          Cant {cordoned(x.original) ? 'uncordone' : 'cordone'} Node{' '}
                          <b>{x.original.metadata?.name}</b>
                          <br />
                          {data.message}
                        </span>,
                      );
                    } else {
                      toast.info(
                        <span>
                          Node <b>{x.original.metadata?.name}</b>{' '}
                          {cordoned(x.original) ? 'uncordoned' : 'cordoned'}
                        </span>,
                      );
                    }
                  })
                  .catch((reason) => {
                    toast.error(
                      <span>
                        Cant {cordoned(x.original) ? 'uncordon' : 'cordon'}{' '}
                        <b>{x.original.metadata?.name}</b>
                        <br />
                        {reason.message}
                      </span>,
                    );
                  });
              });
              setOpenDialog(false);
            }}
          >
            Process ({rows.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
