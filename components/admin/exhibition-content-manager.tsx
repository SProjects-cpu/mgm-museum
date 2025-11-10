"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  GripVertical,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ContentSection {
  id: string;
  section_type: string;
  title: string | null;
  content: string | null;
  images: string[];
  display_order: number;
  active: boolean;
}

interface Props {
  exhibitionId: string;
}

const SECTION_TYPES = [
  { value: "booking_widget", label: "Book Your Visit Widget" },
  { value: "pricing_display", label: "Pricing Display" },
  { value: "features", label: "Features" },
  { value: "highlights", label: "Highlights" },
  { value: "what_to_expect", label: "What to Expect" },
  { value: "gallery", label: "Gallery" },
  { value: "faq", label: "FAQ" },
  { value: "additional_info", label: "Additional Information" },
];

function SortableSection({
  section,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  section: ContentSection;
  onEdit: (section: ContentSection) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{section.title || "Untitled Section"}</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-background rounded">
            {SECTION_TYPES.find((t) => t.value === section.section_type)?.label}
          </span>
        </div>
        {section.content && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {section.content}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={section.active}
          onCheckedChange={(checked) => onToggleActive(section.id, checked)}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(section)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(section.id)}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function ExhibitionContentManager({ exhibitionId }: Props) {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    sectionType: "features",
    title: "",
    content: "",
    images: [] as string[],
    active: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/content`);
      if (!response.ok) throw new Error("Failed to fetch content sections");
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [exhibitionId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);

      // Update display orders in backend
      try {
        await Promise.all(
          newSections.map((section, index) =>
            fetch(`/api/admin/exhibitions/${exhibitionId}/content`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sectionId: section.id,
                displayOrder: index,
              }),
            })
          )
        );
        toast.success("Section order updated");
      } catch (error) {
        toast.error("Failed to update section order");
        fetchSections(); // Revert on error
      }
    }
  };

  const handleSave = async () => {
    try {
      const url = `/api/admin/exhibitions/${exhibitionId}/content`;
      const method = editingSection ? "PUT" : "POST";
      const body = editingSection
        ? { sectionId: editingSection.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to save section");

      toast.success(
        editingSection ? "Section updated successfully" : "Section created successfully"
      );
      setEditingSection(null);
      setIsCreating(false);
      setFormData({
        sectionType: "features",
        title: "",
        content: "",
        images: [],
        active: true,
      });
      fetchSections();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      const response = await fetch(
        `/api/admin/exhibitions/${exhibitionId}/content?sectionId=${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete section");

      toast.success("Section deleted successfully");
      fetchSections();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/admin/exhibitions/${exhibitionId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: id, active }),
      });

      if (!response.ok) throw new Error("Failed to update section");

      toast.success("Section status updated");
      fetchSections();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startEdit = (section: ContentSection) => {
    setEditingSection(section);
    setFormData({
      sectionType: section.section_type,
      title: section.title || "",
      content: section.content || "",
      images: section.images || [],
      active: section.active,
    });
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setIsCreating(false);
    setFormData({
      sectionType: "features",
      title: "",
      content: "",
      images: [],
      active: true,
    });
  };

  if (loading) {
    return <div>Loading content sections...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Content Sections
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage detailed content sections for this exhibition
            </p>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isCreating && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Section Type</Label>
                <Select
                  value={formData.sectionType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sectionType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Section title"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Section content"
                  rows={6}
                />
              </div>

              {/* Special fields for booking_widget section type */}
              {formData.sectionType === 'booking_widget' && (
                <>
                  <div className="space-y-2">
                    <Label>Features (one per line)</Label>
                    <Textarea
                      value={
                        Array.isArray(formData.images) && formData.images.length > 0
                          ? formData.images.join('\n')
                          : 'Instant confirmation\nFree cancellation up to 24 hours\nMobile ticket accepted'
                      }
                      onChange={(e) => {
                        const features = e.target.value.split('\n').filter(f => f.trim());
                        setFormData({ ...formData, images: features });
                      }}
                      placeholder="Instant confirmation&#10;Free cancellation up to 24 hours&#10;Mobile ticket accepted"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter each feature on a new line. These will appear as bullet points.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  {editingSection ? "Update" : "Create"} Section
                </Button>
                <Button variant="outline" onClick={cancelEdit} className="gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No content sections yet. Add your first section to get started.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sections.map((section) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
