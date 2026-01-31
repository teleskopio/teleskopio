import { Outlet } from 'react-router-dom';
import { ThumbsUp, Loader, Info, CircleAlert, OctagonMinus } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect } from 'react';
import { FONT_KEY, FONT_SIZE_KEY, DEFAULT_FONT, DEFAULT_FONT_SIZE } from '@/settings';
import { useAuth } from '@/context/AuthProvider';
import { LoginForm } from '@/components/LoginForm';
import { toast } from 'sonner';
import { redirect } from 'react-router-dom';
import { ConfigProvider } from '@/context/ConfigContext';

export default function Layout() {
  const { theme } = useTheme();
  const { login, isAuthenticated, AuthDisabled } = useAuth();

  const handleLogin = async (username: string, password: string): Promise<boolean | void> => {
    if (username === '' || password === '') {
      return;
    }
    const response: any = await login(username, password);
    if (response.message) {
      toast.error(response.message);
      redirect('/');
      return;
    }
    redirect('/resource/Node');
  };

  useEffect(() => {
    const savedFont = localStorage.getItem(FONT_KEY) || DEFAULT_FONT;
    document.body.classList.add(savedFont);
    const savedFontSize =
      parseInt(localStorage.getItem(FONT_SIZE_KEY) || DEFAULT_FONT_SIZE.toString()) ||
      DEFAULT_FONT_SIZE;
    document.documentElement.style.setProperty('--text-xs', `${savedFontSize}px`);
  }, []);

  return (
    <ConfigProvider>
      <ThemeProvider defaultTheme="dark" storageKey="teleskopio-ui-theme">
        {AuthDisabled ? (
          <div className="group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full">
            <SidebarProvider>
              <AppSidebar />
            </SidebarProvider>
            <main className="bg-background flex w-full flex-col h-screen">
              <Outlet />
            </main>
          </div>
        ) : (
          <div className="group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full">
            {isAuthenticated ? (
              <SidebarProvider>
                <AppSidebar />
              </SidebarProvider>
            ) : (
              <></>
            )}
            <main className="bg-background flex w-full flex-col h-screen">
              {isAuthenticated ? (
                <Outlet />
              ) : (
                <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                  <div className="w-full max-w-sm">
                    <LoginForm login={handleLogin} />
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
        <Toaster
          icons={{
            success: <ThumbsUp color="green" size={18} />,
            info: <Info size={18} />,
            warning: <CircleAlert color="orange" size={18} />,
            error: <OctagonMinus color="red" size={18} />,
            loading: <Loader size={18} />,
          }}
          theme={theme}
          visibleToasts={3}
          toastOptions={{
            className: '!text-xs',
            style: {
              fontFamily: 'var(--app-font)',
            },
          }}
          position="bottom-right"
        />
      </ThemeProvider>
    </ConfigProvider>
  );
}
