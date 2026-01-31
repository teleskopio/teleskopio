import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { call } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResource } from '@/types';
import { useState } from 'react';

interface ScaleDialogProps {
  kind: string;
  apiResource: ApiResource | undefined;
  rows: any;
  open: boolean;
  setOpenDialog: (close: boolean) => void;
}
export function ScaleDialog({ apiResource, kind, rows, open, setOpenDialog }: ScaleDialogProps) {
  const obj = rows[0].original;
  const [scaleValue, setScaleValue] = useState(obj?.spec?.replicas || 0);

  return (
    <Dialog open={open} onOpenChange={setOpenDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xs">
            <div>
              Scale <span className="underline">{kind}</span>
              <br /> {obj.metadata.namespace}/{obj.metadata.name}
            </div>
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="text-xs"></div>
        <div className="flex flex-col items-center">
          <Input
            type="number"
            min="0"
            onChange={(e) => setScaleValue(e.target.value)}
            value={scaleValue}
            className="placeholder:text-muted-foreground flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Slider
            onValueChange={(e) => setScaleValue(e)}
            value={[scaleValue]}
            className="pt-4"
            min={0}
            step={1}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setOpenDialog(false)} className="text-xs" variant="outline">
            Cancel
          </Button>
          <Button
            onClick={() => {
              call('scale_resource', {
                name: obj.metadata.name,
                namespace: obj.metadata.namespace,
                apiResource: {
                  ...apiResource,
                },
                replicas: parseInt(scaleValue),
              })
                .then((data) => {
                  if (data.message) {
                    toast.error(
                      <span>
                        Cant scale <b>{obj.metadata.name}</b>
                        <br />
                        {data.message}
                      </span>,
                    );
                  } else {
                    toast.info(
                      <span>
                        Scaling {obj.kind} <b>{obj.metadata.name}</b> from {obj.spec?.replicas} to{' '}
                        {scaleValue}
                      </span>,
                    );
                  }
                })
                .catch((reason) => {
                  toast.error(
                    <span>
                      Cant scale <b>{obj.metadata.name}</b>
                      <br />
                      {reason.message}
                    </span>,
                  );
                });
              setOpenDialog(false);
            }}
            className="text-xs"
            variant="plain"
          >
            Scale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
