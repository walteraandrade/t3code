import { useEffect, useState, type ReactNode } from "react";

import { APP_STAGE_LABEL, APP_VERSION, SIDEBAR_BRAND_IMAGE_PATH } from "../../branding";
import { SidebarHeader, SidebarTrigger } from "../../components/ui/sidebar";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../components/ui/tooltip";
import { BrandMark } from "./BrandMark";

export interface ForkSidebarHeaderProps {
  readonly isElectron: boolean;
  readonly updateAction?: ReactNode;
}

function ForkSidebarBrand() {
  const [brandState, setBrandState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    const image = new Image();
    const handleLoad = () => {
      if (active) {
        setBrandState("ready");
      }
    };
    const handleError = () => {
      if (active) {
        setBrandState("error");
      }
    };

    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);
    image.src = SIDEBAR_BRAND_IMAGE_PATH;

    return () => {
      active = false;
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
            <div className="flex h-8 w-8 min-w-0 items-center overflow-hidden border border-border/60 bg-background/50">
              {brandState === "ready" ? (
                <img
                  src={SIDEBAR_BRAND_IMAGE_PATH}
                  alt="Sidebar brand"
                  className="h-8 w-8 object-contain"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center gap-1.5 px-2">
                  <BrandMark />
                  <span className="truncate text-sm font-medium tracking-tight text-muted-foreground">
                    Code
                  </span>
                </div>
              )}
            </div>
            <span className="border border-border/60 bg-muted/35 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-muted-foreground/65">
              {APP_STAGE_LABEL}
            </span>
          </div>
        }
      />
      <TooltipPopup side="bottom" sideOffset={2}>
        Version {APP_VERSION}
      </TooltipPopup>
    </Tooltip>
  );
}

export function ForkSidebarHeader({ isElectron, updateAction }: ForkSidebarHeaderProps) {
  const wordmark = (
    <div className="flex min-w-0 items-center gap-2">
      <SidebarTrigger className="shrink-0 md:hidden" />
      <div className="ml-1 flex min-w-0 flex-1 items-center">
        <ForkSidebarBrand />
      </div>
    </div>
  );

  if (isElectron) {
    return (
      <SidebarHeader className="drag-region h-[52px] flex-row items-center gap-2 px-4 py-0 pl-[90px]">
        {wordmark}
        {updateAction}
      </SidebarHeader>
    );
  }

  return (
    <SidebarHeader className="gap-3 px-3 py-2 sm:gap-2.5 sm:px-4 sm:py-3">{wordmark}</SidebarHeader>
  );
}
