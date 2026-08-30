import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { APP_NAME } from "@/core/constants";
import { BRAND_ICON } from "./nav-config";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import type { NavItem } from "./nav-config";

export function MobileHeader({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <SheetHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BRAND_ICON className="size-4" />
                </div>
                <SheetTitle>{APP_NAME}</SheetTitle>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-4">
              <SidebarNav items={items} onNavigate={() => setOpen(false)} />
            </div>
            <UserMenu />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <BRAND_ICON className="size-4 text-primary" />
          <h1 className="font-display text-sm font-semibold">{APP_NAME}</h1>
        </div>
      </div>
    </header>
  );
}
