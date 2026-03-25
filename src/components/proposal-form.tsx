"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  Trash2,
  Sparkles,
  Loader2,
  Save,
  Send,
  MapPin,
  User,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { createProposal } from "@/app/actions/proposals";
import { generateWithAI, suggestLineItems } from "@/app/actions/ai";
import type { ServiceTemplate, CompanySettings } from "@/lib/types";

interface ZoneData {
  name: string;
  line_items: {
    description: string;
    quantity: number | null;
    unit: string;
    unit_price: number | null;
    amount: number;
    is_addon: boolean;
  }[];
}

interface MilestoneData {
  description: string;
  percentage: number;
  amount: number;
}

export function ProposalForm({
  templates,
  settings,
}: {
  templates: ServiceTemplate[];
  settings: CompanySettings;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress1, setClientAddress1] = useState("");
  const [clientAddress2, setClientAddress2] = useState("");

  // Proposal
  const [title, setTitle] = useState("Artificial Grass Installation");
  const [introduction, setIntroduction] = useState(
    "Thank you for the opportunity to provide you with this proposal. We look forward to transforming your outdoor space with premium artificial turf."
  );
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [warrantyText, setWarrantyText] = useState(settings.default_warranty_text || "");
  const [termsText, setTermsText] = useState(settings.default_terms_text || "");

  // Zones
  const [zones, setZones] = useState<ZoneData[]>([
    {
      name: "Backyard",
      line_items: [
        { description: "", quantity: null, unit: "sqft", unit_price: null, amount: 0, is_addon: false },
      ],
    },
  ]);

  // Payment Milestones
  const [milestones, setMilestones] = useState<MilestoneData[]>([
    { description: "Due upon base prep", percentage: 50, amount: 0 },
    { description: "Due upon completion", percentage: 50, amount: 0 },
  ]);

  // AI project description
  const [projectDesc, setProjectDesc] = useState("");

  const totalAmount = zones.reduce(
    (sum, zone) => sum + zone.line_items.reduce((zSum, item) => zSum + (item.amount || 0), 0),
    0
  );

  // Update milestone amounts when total changes
  const updateMilestoneAmounts = (total: number, ms: MilestoneData[]) => {
    return ms.map((m) => ({
      ...m,
      amount: Math.round((m.percentage / 100) * total * 100) / 100,
    }));
  };

  const addZone = () => {
    setZones([
      ...zones,
      {
        name: `Area ${zones.length + 1}`,
        line_items: [
          { description: "", quantity: null, unit: "sqft", unit_price: null, amount: 0, is_addon: false },
        ],
      },
    ]);
  };

  const removeZone = (zoneIndex: number) => {
    if (zones.length <= 1) return;
    setZones(zones.filter((_, i) => i !== zoneIndex));
  };

  const addLineItem = (zoneIndex: number, isAddon = false) => {
    const updated = [...zones];
    updated[zoneIndex].line_items.push({
      description: "",
      quantity: null,
      unit: "sqft",
      unit_price: null,
      amount: 0,
      is_addon: isAddon,
    });
    setZones(updated);
  };

  const removeLineItem = (zoneIndex: number, itemIndex: number) => {
    const updated = [...zones];
    updated[zoneIndex].line_items = updated[zoneIndex].line_items.filter(
      (_, i) => i !== itemIndex
    );
    setZones(updated);
  };

  const updateLineItem = (
    zoneIndex: number,
    itemIndex: number,
    field: string,
    value: string | number | boolean | null
  ) => {
    const updated = [...zones];
    const item = { ...updated[zoneIndex].line_items[itemIndex], [field]: value };

    // Auto-calculate amount
    if (item.quantity && item.unit_price) {
      item.amount = Math.round(item.quantity * item.unit_price * 100) / 100;
    }

    updated[zoneIndex].line_items[itemIndex] = item;
    setZones(updated);
  };

  const addTemplateItem = (zoneIndex: number, template: ServiceTemplate) => {
    const updated = [...zones];
    updated[zoneIndex].line_items.push({
      description: template.description || template.name,
      quantity: null,
      unit: template.default_unit,
      unit_price: template.default_unit_price ? Number(template.default_unit_price) : null,
      amount: 0,
      is_addon: false,
    });
    setZones(updated);
  };

  const handleAISuggest = async () => {
    if (!projectDesc.trim()) {
      toast.error("Please describe the project first");
      return;
    }
    setAiLoading(true);
    try {
      const suggestions = await suggestLineItems(projectDesc);
      if (suggestions.length > 0) {
        const updated = [...zones];
        // Add to first zone, replacing empty items
        const firstNonEmpty = updated[0].line_items.findIndex((i) => i.description);
        if (firstNonEmpty === -1) {
          updated[0].line_items = [];
        }
        suggestions.forEach((s: { description: string; quantity: number | null; unit: string; is_addon: boolean }) => {
          updated[0].line_items.push({
            description: s.description,
            quantity: s.quantity,
            unit: s.unit || "sqft",
            unit_price: null,
            amount: 0,
            is_addon: s.is_addon || false,
          });
        });
        setZones(updated);
        toast.success(`Added ${suggestions.length} suggested line items`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIIntro = async () => {
    setAiLoading(true);
    try {
      const result = await generateWithAI(
        "Write a brief, professional introduction paragraph for this proposal. 2-3 sentences max. Be warm but professional.",
        `Client: ${clientName}, Address: ${clientAddress1} ${clientAddress2}, Project: ${title}, Description: ${projectDesc || "Artificial grass installation"}`
      );
      setIntroduction(result);
      toast.success("Introduction generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (status: string) => {
    if (!clientName.trim()) {
      toast.error("Client name is required");
      return;
    }

    setSaving(true);
    try {
      const updatedMilestones = updateMilestoneAmounts(totalAmount, milestones);

      const proposalId = await createProposal({
        client: {
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          address_line1: clientAddress1,
          address_line2: clientAddress2,
        },
        title,
        introduction,
        zones: zones.map((z) => ({
          name: z.name,
          line_items: z.line_items.filter((i) => i.description.trim()),
        })),
        payment_milestones: updatedMilestones,
        total_amount: totalAmount,
        warranty_text: warrantyText,
        terms_text: termsText,
        notes,
        valid_until: validUntil,
        status,
      });

      toast.success(status === "draft" ? "Proposal saved as draft" : "Proposal created");
      router.push(`/proposals/${proposalId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save proposal");
    } finally {
      setSaving(false);
    }
  };

  // Group templates by category
  const templatesByCategory = templates.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<string, ServiceTemplate[]>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* AI Assistant */}
      <Card className="border-2 border-dashed border-[#4CAF50]/30 bg-[#E8F5E9]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[#1B5E20]">
            <Sparkles className="h-5 w-5" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">
              Describe the project and AI will suggest line items
            </Label>
            <Textarea
              placeholder="e.g., Install artificial grass in backyard, approximately 800 sqft. Need soil removal, edging, base prep, and turf installation. Client also wants a small putting green area."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleAISuggest}
              disabled={aiLoading}
              className="border-[#4CAF50] text-[#1B5E20] hover:bg-[#E8F5E9]"
            >
              {aiLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Suggest Line Items
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAIIntro}
              disabled={aiLoading}
              className="border-[#4CAF50] text-[#1B5E20] hover:bg-[#E8F5E9]"
            >
              {aiLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Introduction
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input
                placeholder="John Smith"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="client@email.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="(408) 555-1234"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="123 Main St"
                value={clientAddress1}
                onChange={(e) => setClientAddress1(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>City, State, ZIP</Label>
              <Input
                placeholder="San Jose, CA 95120"
                value={clientAddress2}
                onChange={(e) => setClientAddress2(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proposal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proposal Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Artificial Grass Installation"
              />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Introduction</Label>
            </div>
            <Textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              rows={3}
              placeholder="Thank you for the opportunity..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Zones & Line Items */}
      {zones.map((zone, zoneIndex) => (
        <Card key={zoneIndex}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#1B5E20]" />
                <Input
                  value={zone.name}
                  onChange={(e) => {
                    const updated = [...zones];
                    updated[zoneIndex].name = e.target.value;
                    setZones(updated);
                  }}
                  className="font-semibold border-0 shadow-none p-0 h-auto text-base focus-visible:ring-0"
                  placeholder="Zone name (e.g., Backyard)"
                />
              </div>
              <div className="flex gap-2">
                {zones.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeZone(zoneIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Quick add from templates */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="text-xs text-muted-foreground py-1">Quick add:</span>
              {Object.entries(templatesByCategory).map(([category, tmpls]) => (
                <div key={category} className="flex flex-wrap gap-1">
                  {tmpls.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => addTemplateItem(zoneIndex, t)}
                      className="text-xs px-2 py-1 rounded-full bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#C8E6C9] transition-colors"
                    >
                      + {t.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Line items table */}
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_80px_100px_100px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Description</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>Unit Price</span>
                <span>Amount</span>
                <span></span>
              </div>
              {zone.line_items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={`grid grid-cols-[1fr_80px_80px_100px_100px_40px] gap-2 items-center ${
                    item.is_addon ? "pl-4 border-l-2 border-dashed border-[#4CAF50]" : ""
                  }`}
                >
                  <Input
                    placeholder={item.is_addon ? "Add-on / note..." : "Description of work..."}
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(zoneIndex, itemIndex, "description", e.target.value)
                    }
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity ?? ""}
                    onChange={(e) =>
                      updateLineItem(
                        zoneIndex,
                        itemIndex,
                        "quantity",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="text-sm"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) =>
                      updateLineItem(zoneIndex, itemIndex, "unit", e.target.value)
                    }
                    className="text-sm rounded-md border border-input px-2 py-2 bg-background"
                  >
                    <option value="sqft">sqft</option>
                    <option value="linear ft">linear ft</option>
                    <option value="each">each</option>
                    <option value="job">job</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="$0.00"
                    value={item.unit_price ?? ""}
                    onChange={(e) =>
                      updateLineItem(
                        zoneIndex,
                        itemIndex,
                        "unit_price",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="$0.00"
                    value={item.amount || ""}
                    onChange={(e) =>
                      updateLineItem(zoneIndex, itemIndex, "amount", Number(e.target.value))
                    }
                    className="text-sm font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(zoneIndex, itemIndex)}
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addLineItem(zoneIndex)}
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Add Item
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addLineItem(zoneIndex, true)}
                className="border-dashed"
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Add Note / Add-on
              </Button>
            </div>

            {/* Zone subtotal */}
            <div className="flex justify-end pt-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Zone Total: </span>
                <span className="font-semibold">
                  ${zone.line_items.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addZone} className="w-full border-dashed">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Another Zone / Area
      </Button>

      {/* Payment Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_100px_40px] gap-2 items-center">
              <Input
                value={m.description}
                onChange={(e) => {
                  const updated = [...milestones];
                  updated[i].description = e.target.value;
                  setMilestones(updated);
                }}
                placeholder="Payment milestone description"
                className="text-sm"
              />
              <div className="relative">
                <Input
                  type="number"
                  value={m.percentage}
                  onChange={(e) => {
                    const updated = [...milestones];
                    updated[i].percentage = Number(e.target.value);
                    updated[i].amount = Math.round((Number(e.target.value) / 100) * totalAmount * 100) / 100;
                    setMilestones(updated);
                  }}
                  className="text-sm pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              <div className="text-sm font-medium text-right">
                ${Math.round((m.percentage / 100) * totalAmount).toLocaleString()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (milestones.length <= 1) return;
                  setMilestones(milestones.filter((_, j) => j !== i));
                }}
                className="h-8 w-8 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setMilestones([
                ...milestones,
                { description: "", percentage: 0, amount: 0 },
              ])
            }
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Add Milestone
          </Button>
        </CardContent>
      </Card>

      {/* Warranty & Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Warranty & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Warranty</Label>
            <Textarea
              value={warrantyText}
              onChange={(e) => setWarrantyText(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Terms & Conditions</Label>
            <Textarea
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes for the client..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Total & Actions */}
      <Card className="border-2 border-[#1B5E20]/20 bg-[#E8F5E9]/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Proposal Amount</p>
              <p className="text-3xl font-bold text-[#1B5E20]">
                ${totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleSave("draft")}
              disabled={saving}
              variant="outline"
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="flex-1 bg-[#1B5E20] hover:bg-[#0D3311] text-white"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
