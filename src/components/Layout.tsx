
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, BookOpen, CalendarDays, Calendar, ClipboardCheck, BarChart, FileText } from "lucide-react";
import UserMenu from "./UserMenu";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SidebarLink = ({ to, icon, children }: SidebarLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={`sidebar-link ${isActive ? "active" : ""}`}>
      {icon}
      <span>{children}</span>
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="bg-sidebar w-64 border-r p-4 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="h-6 w-6 text-sidebar-foreground" />
          <h1 className="text-xl font-bold text-sidebar-foreground">EduSchedule</h1>
        </div>
        <nav className="space-y-1">
          <SidebarLink to="/" icon={<BarChart className="h-5 w-5" />}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/students" icon={<Users className="h-5 w-5" />}>
            Students
          </SidebarLink>
          <SidebarLink to="/groups" icon={<BookOpen className="h-5 w-5" />}>
            Groups
          </SidebarLink>
          <SidebarLink to="/timetable" icon={<CalendarDays className="h-5 w-5" />}>
            Timetable
          </SidebarLink>
          <SidebarLink to="/tests" icon={<Calendar className="h-5 w-5" />}>
            Tests
          </SidebarLink>
          <SidebarLink to="/attendance" icon={<ClipboardCheck className="h-5 w-5" />}>
            Attendance
          </SidebarLink>
          <SidebarLink to="/weekly-marks" icon={<FileText className="h-5 w-5" />}>
            Weekly Marks
          </SidebarLink>
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-col w-full">
        <header className="md:hidden bg-sidebar text-sidebar-foreground p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-xl font-bold">EduSchedule</h1>
          </div>
          <UserMenu />
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex bg-white border-b p-4 justify-end">
          <UserMenu />
        </header>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
