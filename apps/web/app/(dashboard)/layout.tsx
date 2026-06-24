import { AuthProvider } from '@/lib/auth-context';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#FBF7F5',
          display: 'flex',
        }}
      >
        <Sidebar />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            paddingTop: 20,
          }}
        >
          <Topbar />
          <main
            id="main-content"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 32px 32px',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
