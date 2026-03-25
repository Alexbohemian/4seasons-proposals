"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ServiceTemplate } from "@/lib/types";

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceTemplate | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("sqft");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [category, setCategory] = useState("General");

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("service_templates")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDefaultUnit("sqft");
    setDefaultPrice("");
    setCategory("General");
    setEditing(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    const data = {
      name,
      description,
      default_unit: defaultUnit,
      default_unit_price: defaultPrice ? Number(defaultPrice) : null,
      category,
    };

    if (editing) {
      const { error } = await supabase
        .from("service_templates")
        .update(data)
        .eq("id", editing.id);
      if (error) {
        toast.error("Failed to update template");
        return;
      }
      toast.success("Template updated");
    } else {
      const { error } = await supabase.from("service_templates").insert(data);
      if (error) {
        toast.error("Failed to create template");
        return;
      }
      toast.success("Template created");
    }

    resetForm();
    setDialogOpen(false);
    loadTemplates();
  };

  const handleEdit = (template: ServiceTemplate) => {
    setEditing(template);
    setName(template.name);
    setDescription(template.description);
    setDefaultUnit(template.default_unit);
    setDefaultPrice(template.default_unit_price?.toString() || "");
    setCategory(template.category);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const { error } = await supabase.from("service_templates").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete template");
      return;
    }
    toast.success("Template deleted");
    loadTemplates();
  };

  // Group by category
  const grouped = templates.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<string, ServiceTemplate[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Templates</h1>
          <p className="text-muted-foreground">
            Pre-built line items for quick proposal creation.
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger
            render={
              <Button className="bg-[#1B5E20] hover:bg-[#0D3311] text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Soil Removal" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Unit</Label>
                  <select
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    className="w-full rounded-md border border-input px-3 py-2 bg-background text-sm"
                  >
                    <option value="sqft">sqft</option>
                    <option value="linear ft">linear ft</option>
                    <option value="each">each</option>
                    <option value="job">job</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Default Price</Label>
                  <Input
                    type="number"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    placeholder="$0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Site Preparation" />
              </div>
              <Button onClick={handleSave} className="w-full bg-[#1B5E20] hover:bg-[#0D3311] text-white">
                {editing ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : templates.length > 0 ? (
        Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline" className="bg-[#E8F5E9] text-[#1B5E20] border-0">
                  {category}
                </Badge>
                <span className="text-xs text-muted-foreground font-normal">
                  {items.length} template{items.length !== 1 ? "s" : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {items.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.description} &middot; {t.default_unit}
                        {t.default_unit_price ? ` · $${Number(t.default_unit_price).toFixed(2)}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(t)} className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No templates yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add service templates to speed up proposal creation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
