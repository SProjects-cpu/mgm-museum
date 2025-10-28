"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExhibitionsStore } from "@/lib/store/exhibitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  Edit,
  MoreVertical,
  Filter,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { EXHIBITION_CATEGORY_LABELS } from "@/types";
import { toast } from "sonner";
import { ResponsiveTable } from "@/components/admin/responsive-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExhibitionDialog } from "@/components/admin/exhibition-dialog";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";


export function ExhibitionsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Zustand store
  const { exhibitions, deleteExhibition, toggleFeatured } = useExhibitionsStore();

  const filteredExhibitions = exhibitions.filter((exhibition) => {
    const matchesSearch = exhibition.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || exhibition.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleToggleFeatured = (id: string) => {
    try {
      toggleFeatured(id);
      toast.success("Featured status updated");
    } catch (error) {
      toast.error("Failed to update featured status");
    }
  };

  const handleDeleteExhibition = (id: string) => {
    if (confirm("Are you sure you want to delete this exhibition?")) {
      try {
        deleteExhibition(id);
        toast.success("Exhibition deleted successfully");
      } catch (error) {
        toast.error("Failed to delete exhibition");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mt-6">Exhibitions Management</h1>
          <p className="text-muted-foreground">
            Manage all exhibitions, shows, and galleries
          </p>
        </div>
        <ExhibitionDialog mode="create" />
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search exhibitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "maintenance" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("maintenance")}
              >
                Maintenance
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exhibitions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Exhibitions ({filteredExhibitions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            cardView={
              <div className="space-y-4">
                {filteredExhibitions.map((exhibition) => (
                  <div
                    key={exhibition.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold">{exhibition.name}</p>
                          {exhibition.featured && (
                            <Badge variant="secondary" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {EXHIBITION_CATEGORY_LABELS[exhibition.category]}
                          </Badge>
                          <Badge
                            variant={
                              exhibition.status === "active" ? "success" : "secondary"
                            }
                            className="text-xs"
                          >
                            {exhibition.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-3 border-t border-b">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bookings</p>
                        <p className="font-semibold">
                          {Math.floor(Math.random() * 200) + 50}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                        <p className="font-semibold text-primary text-sm">
                          {formatCurrency(Math.random() * 20000 + 5000)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                        <p className="font-semibold">{exhibition.capacity}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/exhibitions/${exhibition.slug}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <ExhibitionDialog
                        mode="edit"
                        exhibition={exhibition}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        }
                      />
                      <DeleteConfirmationDialog
                        title="Delete Exhibition"
                        description="Are you sure you want to delete this exhibition? This action cannot be undone."
                        itemName={exhibition.name}
                        onConfirm={async () => {
                          handleDeleteExhibition(exhibition.id);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExhibitions.map((exhibition) => (
                  <TableRow key={exhibition.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{exhibition.name}</p>
                          {exhibition.featured && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {EXHIBITION_CATEGORY_LABELS[exhibition.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          exhibition.status === "active" ? "success" : "secondary"
                        }
                      >
                        {exhibition.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {Math.floor(Math.random() * 200) + 50}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatCurrency(Math.random() * 20000 + 5000)}
                    </TableCell>
                    <TableCell>{exhibition.capacity}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/exhibitions/${exhibition.slug}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <ExhibitionDialog
                          mode="edit"
                          exhibition={exhibition}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleFeatured(exhibition.id)}
                            >
                              {exhibition.featured ? "Remove from Featured" : "Mark as Featured"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/exhibitions/${exhibition.slug}`}>
                                View Public Page
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <DeleteConfirmationDialog
                                title="Delete Exhibition"
                                description="Are you sure you want to delete this exhibition? This action cannot be undone."
                                itemName={exhibition.name}
                                onConfirm={async () => {
                                  handleDeleteExhibition(exhibition.id);
                                }}
                                trigger={
                                  <span className="w-full text-left">Delete Exhibition</span>
                                }
                              />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  );
}

