"use client";

import { useEffect, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function useSidebarLayout() {
  const { state, isMobile } = useSidebar();
  const [sidebarWidth, setSidebarWidth] = useState("16rem");

  useEffect(() => {
    if (isMobile) {
      setSidebarWidth("0");
    } else if (state === "collapsed") {
      setSidebarWidth("3rem");
    } else {
      setSidebarWidth("16rem");
    }
  }, [state, isMobile]);

  return {
    sidebarWidth,
    isCollapsed: state === "collapsed",
    isMobile,
  };
}

