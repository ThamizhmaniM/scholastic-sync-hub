
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  BarChart,
  FileText,
  Menu,
} from "lucide-react";
import UserMenu from "./UserMenu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SidebarLink = ({ to, icon, children }: SidebarLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
        isActive ? "bg-muted text-primary font-medium" : ""
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigationLinks = (
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
      <SidebarLink to="/attendance" icon={<ClipboardCheck className="h-5 w-5" />}>
        Attendance
      </SidebarLink>
      <SidebarLink to="/weekly-marks" icon={<FileText className="h-5 w-5" />}>
        Weekly Marks
      </SidebarLink>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="bg-sidebar w-64 border-r p-4 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="h-6 w-6 text-sidebar-foreground" />
          <h1 className="text-xl font-bold text-sidebar-foreground">EduSchedule</h1>
        </div>
        {navigationLinks}
      </aside>

      {/* Mobile header */}
      <div className="flex flex-col w-full">
        <header className="md:hidden bg-sidebar text-sidebar-foreground p-4 flex items-center justify-between">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar text-sidebar-foreground w-[250px] p-4 border-r">
              <div className="flex items-center gap-2 mb-8">
                <BookOpen className="h-6 w-6" />
                <h1 className="text-xl font-bold">EduSchedule</h1>
              </div>
              {navigationLinks}
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-xl font-bold">EduSchedule</h1>
          </Link>
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
