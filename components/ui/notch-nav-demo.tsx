"use client";

import { NotchNav } from "@/components/ui/notch-nav";

export default function NotchNavDemo() {
  const items = [
    { value: "home", label: "Home" },
    { value: "projects", label: "Projects" },
    { value: "library", label: "Library" },
    { value: "settings", label: "Settings" },
  ];

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <NotchNav items={items} defaultValue="projects" ariaLabel="Site" />
    </main>
  );
}
