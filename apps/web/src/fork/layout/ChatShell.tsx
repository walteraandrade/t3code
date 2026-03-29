import { type ReactNode } from "react";

import { Sidebar, SidebarProvider, SidebarRail } from "../../components/ui/sidebar";

export interface ChatShellProps {
  readonly children: ReactNode;
  readonly sidebar: ReactNode;
  readonly sidebarStorageKey: string;
  readonly sidebarMinWidth: number;
  readonly mainContentMinWidth: number;
}

export function ChatShell({
  children,
  sidebar,
  sidebarStorageKey,
  sidebarMinWidth,
  mainContentMinWidth,
}: ChatShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        side="left"
        collapsible="offcanvas"
        className="border-r border-border bg-card text-foreground"
        resizable={{
          minWidth: sidebarMinWidth,
          shouldAcceptWidth: ({ nextWidth, wrapper }) =>
            wrapper.clientWidth - nextWidth >= mainContentMinWidth,
          storageKey: sidebarStorageKey,
        }}
      >
        {sidebar}
        <SidebarRail />
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}
