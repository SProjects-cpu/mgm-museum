"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, Home, Info } from "lucide-react";

const contentPages = [
  { title: "Homepage", icon: Home, lastUpdated: "2 days ago" },
  { title: "About Page", icon: Info, lastUpdated: "1 week ago" },
  { title: "Gallery", icon: Image, lastUpdated: "3 days ago" },
  { title: "Visitor Guidelines", icon: FileText, lastUpdated: "2 weeks ago" },
];

export default function ContentManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">Content Management</h1>
        <p className="text-muted-foreground">Edit website content and pages</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {contentPages.map((page, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <page.icon className="w-5 h-5 text-primary" />
                </div>
                {page.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Last updated: {page.lastUpdated}
              </p>
              <Button variant="outline" className="w-full">Edit Content</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}




