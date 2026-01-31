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

interface DeleteDialogProps {
  kind: string;
  apiResource: ApiResource | undefined;
  rows: any;
  open: boolean;
  setOpenDialog: (close: boolean) => void;
}
export function DeleteDialog({ apiResource, kind, rows, open, setOpenDialog }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpenDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xs">
            <div>
              Delete {rows.length} <span className="underline">{kind}</span>
            </div>
            <div className="pt-4 text-xs text-red-600 font-bold">
              This operation can't be undone!
            </div>
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <ul className="list-disc pl-3 text-xs">
          {(rows || []).map((x: any, i: number) => {
            return (
              <li key={i}>
                {x.original.metadata.namespace ? `${x.original.metadata.namespace}/` : ''}
                {x.original.metadata.name}
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
              call('delete_dynamic_resources', {
                apiResource: apiResource,
                resources: rows.map((x) => ({
                  name: x.original.metadata.name,
                  namespace: x.original.metadata.namespace,
                })),
              })
                .then((data) => {
                  if (data.message) {
                    toast.error(
                      <span>
                        Cant terminating resources
                        <br />
                        {data.message}
                      </span>,
                    );
                  } else {
                    toast.info(<span>Terminating...</span>);
                  }
                })
                .catch((reason) => {
                  toast.error(
                    <span>
                      Cant delete resources
                      <br />
                      {reason.message}
                    </span>,
                  );
                });
              setOpenDialog(false);
            }}
          >
            Delete ({rows.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
