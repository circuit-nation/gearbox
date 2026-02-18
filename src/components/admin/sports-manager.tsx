"use client";

import { useState, useMemo } from "react";
import { useSports, useCreateSport, useDeleteSport, useUpdateSport } from "@/hooks/use-sports";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreateSport, SportsType, Sport } from "@/lib/schema";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable, createSortableHeader } from "./data-table";
import { ConfirmationDialog } from "./confirmation-dialog";

const SPORTS_TYPES: SportsType[] = [
  "formula",
  "feeder",
  "indycar",
  "motogp",
  "superbike",
  "endurance",
  "off-road",
  "nascar",
];

export function SportsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sportToDelete, setSportToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState("");
  const [formData, setFormData] = useState<CreateSport>({
    name: "",
    logo: "",
    color: "#000000",
    type: "formula",
    tags: [],
  });
  const [editFormData, setEditFormData] = useState<Partial<Sport>>({});

  // Extract sorting values for API
  const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

  const { data, isLoading } = useSports(
    pagination.pageIndex + 1,
    pagination.pageSize,
    sortBy,
    sortOrder as "asc" | "desc" | undefined,
    filterName || undefined,
    filterType || undefined
  );
  const createSport = useCreateSport({
    onSuccess: () => {
      toast.success("Sport created successfully!");
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteSport = useDeleteSport({
    onSuccess: () => {
      toast.success("Sport deleted successfully!");
      setDeleteConfirmOpen(false);
      setSportToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeleteConfirmOpen(false);
      setSportToDelete(null);
    },
  });

  const updateSport = useUpdateSport({
    onSuccess: () => {
      toast.success("Sport updated successfully!");
      setIsEditOpen(false);
      setEditingSport(null);
      setEditFormData({});
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      logo: "",
      color: "#000000",
      type: "formula",
      tags: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSport.mutate(formData);
  };

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport);
    setEditFormData({
      name: sport.name,
      logo: sport.logo,
      color: sport.color,
      type: sport.type,
      tags: sport.tags,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSport) {
      updateSport.mutate({ id: editingSport.convexId, data: editFormData });
    }
  };

  const handleDeleteClick = (id: string) => {
    setSportToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (sportToDelete) {
      deleteSport.mutate(sportToDelete);
    }
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Sport>[]>(
    () => [
      {
        accessorKey: "logo",
        header: "Logo",
        cell: ({ row }) => (
          <img src={row.original.logo} alt={row.original.name} className="h-8 w-8 object-contain" />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: createSortableHeader("Name"),
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
      },
      {
        accessorKey: "type",
        header: createSortableHeader("Type"),
        cell: ({ row }) => row.original.type,
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: row.original.color }}
            />
            <span className="text-xs">{row.original.color}</span>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.tags?.map((tag, idx) => (
              <Badge key={idx} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(row.original.convexId)}
              disabled={deleteSport.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteSport.isPending]
  );

  const tableData = useMemo(() => data?.documents || [], [data]);

  const filterComponent = (
    <div className="flex items-center gap-4">
      <Input
        placeholder="Filter by name..."
        value={filterName}
        onChange={(event) => {
          setFilterName(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by type..."
        value={filterType}
        onChange={(event) => {
          setFilterType(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Sport
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sport</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Formula 1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as SportsType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="racing, motorsport"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createSport.isPending}>
                {createSport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Sport
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Sport Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sport</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Formula 1"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={editFormData.type}
                onValueChange={(value) => setEditFormData({ ...editFormData, type: value as SportsType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-logo">Logo URL</Label>
              <Input
                id="edit-logo"
                value={editFormData.logo || ""}
                onChange={(e) => setEditFormData({ ...editFormData, logo: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                type="color"
                value={editFormData.color || "#000000"}
                onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={editFormData.tags?.join(", ") || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="racing, motorsport"
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateSport.isPending}>
              {updateSport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Sport
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Sport"
        description="Are you sure you want to delete this sport? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteSport.isPending}
      />

      <DataTable
        data={tableData}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalCount={data?.total || 0}
        isLoading={isLoading}
        filterComponent={filterComponent}
      />
    </div>
  );
}
