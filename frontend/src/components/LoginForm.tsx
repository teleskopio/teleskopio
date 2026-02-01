import { cn } from '@/util';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Telescope } from 'lucide-react';

type LoginFormProps = React.ComponentProps<'div'> & {
  login: (username: string, password: string) => Promise<boolean | void>;
};

export function LoginForm({ login, className, ...props }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Input
                id="username"
                type="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
              />
            </div>
            <div className="grid gap-3">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={async () => {
                  if (username === '') {
                    toast.warning(<div>username is empty</div>);
                    return;
                  }
                  if (password === '') {
                    toast.warning(<div>password is empty</div>);
                    return;
                  }
                  await login(username, password);
                }}
                className="w-full text-xs"
              >
                Login
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex flex-row">
                <Telescope size={15} className="mr-1" />
                <a
                  target="_blank"
                  href="https://github.com/teleskopio/teleskopio"
                  className={'text-xs'}
                >
                  <span>teleskopio v0.1.4</span>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
