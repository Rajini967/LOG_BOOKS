import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ClipboardList,
  Wind,
  Wrench,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Hammer,
  Gauge,
  Filter,
  Clock,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const roleLabels: Record<string, string> = {
  operator: 'Operator',
  supervisor: 'Supervisor',
  customer: 'Client',
  client: 'Client',
  manager: 'Manager',
  super_admin: 'Super Admin',
};

const roleColors: Record<string, 'default' | 'accent' | 'warning' | 'success'> = {
  operator: 'default',
  supervisor: 'accent',
  customer: 'warning',
  client: 'warning',
  manager: 'accent',
  super_admin: 'success',
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [hvacExpanded, setHvacExpanded] = useState(false);

  // Auto-expand HVAC section if any child route is active
  useEffect(() => {
    const isHvacChildActive = location.pathname.startsWith('/hvac-validation/');
    if (isHvacChildActive) {
      setHvacExpanded(true);
    }
  }, [location.pathname]);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['operator', 'supervisor', 'customer', 'client', 'manager', 'super_admin'] },
    { path: '/logbook-builder', icon: Hammer, label: 'Logbook Builder', roles: ['super_admin', 'manager'] },
    { path: '/e-log-book', icon: ClipboardList, label: 'E Log Book', roles: ['operator', 'supervisor', 'super_admin', 'manager'] },
    { path: '/instruments', icon: Wrench, label: 'Instruments', roles: ['supervisor', 'super_admin', 'manager'] },
    { path: '/reports', icon: FileText, label: 'Reports', roles: ['supervisor', 'customer', 'client', 'super_admin', 'manager'] },
    { path: '/users', icon: Users, label: 'User Management', roles: ['super_admin', 'manager'] },
    { path: '/settings', icon: Settings, label: 'Settings', roles: ['super_admin'] },
  ];

  const hvacTestItems = [
    { path: '/hvac-validation/air-velocity-test', icon: Activity, label: 'Air Velocity Test', roles: ['operator', 'supervisor', 'super_admin', 'manager'] },
    { path: '/hvac-validation/filter-integrity-test', icon: Filter, label: 'Filter Integrity Test', roles: ['operator', 'supervisor', 'super_admin', 'manager'] },
    { path: '/hvac-validation/recovery-test', icon: Clock, label: 'Recovery Test', roles: ['operator', 'supervisor', 'super_admin', 'manager'] },
    { path: '/hvac-validation/differential-pressure-test', icon: Gauge, label: 'Differential Pressure Test', roles: ['operator', 'supervisor', 'super_admin', 'manager'] },
    { path: '/hvac-validation/nvpc-test', icon: Activity, label: 'NVPC Test', roles: ['operator', 'supervisor', 'super_admin', 'manager'] },
  ];

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const filteredHvacTests = hvacTestItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const isHvacActive = location.pathname === '/hvac-validation' || location.pathname.startsWith('/hvac-validation/');

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen sidebar-gradient transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">LogBook</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Info */}
      {user && !collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-foreground">
                {user.name 
                  ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : user.email.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name || user.email}
              </p>
              <Badge variant={roleColors[user.role] || 'default'} className="mt-1 text-xs">
                {roleLabels[user.role] || user.role}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        {user && navItems[0].roles.includes(user.role) && (() => {
          const Icon = navItems[0].icon;
          return (
            <Link
              to={navItems[0].path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                location.pathname === navItems[0].path
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{navItems[0].label}</span>}
            </Link>
          );
        })()}

        {/* Logbook Builder */}
        {user && navItems[1].roles.includes(user.role) && (() => {
          const Icon = navItems[1].icon;
          return (
            <Link
              to={navItems[1].path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                location.pathname === navItems[1].path
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{navItems[1].label}</span>}
            </Link>
          );
        })()}

        {/* E Log Book */}
        {user && navItems[2].roles.includes(user.role) && (() => {
          const Icon = navItems[2].icon;
          return (
            <Link
              to={navItems[2].path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                location.pathname === navItems[2].path
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{navItems[2].label}</span>}
            </Link>
          );
        })()}

        {/* HVAC Validation Section */}
        {user && ['operator', 'supervisor', 'super_admin', 'manager'].includes(user.role) && (
          <div className="space-y-1">
            {/* HVAC Validation Parent */}
            <div className="space-y-1">
              <div className="relative">
                <Link
                  to="/hvac-validation"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isHvacActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <Wind className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium flex-1">HVAC Validation</span>
                  )}
                </Link>
                {!collapsed && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHvacExpanded(!hvacExpanded);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-sidebar-accent/50 rounded"
                  >
                    {hvacExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* HVAC Test Sub-items */}
              {!collapsed && hvacExpanded && filteredHvacTests.length > 0 && (
                <div className="ml-4 space-y-1 border-l border-sidebar-border pl-2">
                  {filteredHvacTests.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remaining Navigation Items */}
        {filteredItems.filter(item => 
          !['/dashboard', '/logbook-builder', '/e-log-book'].includes(item.path)
        ).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
