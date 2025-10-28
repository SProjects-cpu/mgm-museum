"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Image, Home, Info, Save, X, Edit, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  updated_at: string;
  icon: any;
}

const defaultPages = [
  { slug: "homepage", title: "Homepage", icon: Home },
  { slug: "about", title: "About Page", icon: Info },
  { slug: "gallery", title: "Gallery", icon: Image },
  { slug: "visitor-guidelines", title: "Visitor Guidelines", icon: FileText },
];

export default function ContentManagement() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
    // Set up real-time polling (every 5 seconds)
    const interval = setInterval(fetchPages, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/admin/content");
      if (!response.ok) throw new Error("Failed to fetch content pages");
      
      const data = await response.json();
      const pagesWithIcons = data.pages.map((page: any) => ({
        ...page,
        icon: defaultPages.find(p => p.slug === page.slug)?.icon || FileText,
      }));
      setPages(pagesWithIcons);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching pages:", err);
      setError(err.message);
      // Initialize with default pages if fetch fails
      setPages(defaultPages.map(p => ({
        id: p.slug,
        slug: p.slug,
        title: p.title,
        content: "",
        published: false,
        updated_at: new Date().toISOString(),
        icon: p.icon,
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingPage) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content/${editingPage.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingPage.title,
          content: editingPage.content,
          published: editingPage.published,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save content");
      }

      toast.success("Content saved successfully!");
      setEditingPage(null);
      await fetchPages();
    } catch (err: any) {
      toast.error(err.message || "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">
          Content Management
        </h1>
        <p className="text-muted-foreground">
          Edit website content and pages with real-time updates
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {pages.map((page) => (
          <Card key={page.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <page.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-lg">{page.title}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {page.published ? "Published" : "Draft"}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Last updated: {formatDate(page.updated_at)}
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setEditingPage(page)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Content
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingPage?.title}</DialogTitle>
            <DialogDescription>
              Update the content for this page. Changes are saved in real-time.
            </DialogDescription>
          </DialogHeader>

          {editingPage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={editingPage.title}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, title: e.target.value })
                  }
                  placeholder="Page title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={editingPage.content}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, content: e.target.value })
                  }
                  placeholder="Enter page content here..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={editingPage.published}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, published: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="published" className="cursor-pointer">
                  Publish this page
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPage(null)}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




