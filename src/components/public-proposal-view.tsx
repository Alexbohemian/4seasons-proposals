"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Download, FileDown, Loader2, Pen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { CompanySettings } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

interface PublicProposalViewProps {
  proposal: {
    id: string;
    proposal_number: string;
    status: string;
    title: string;
    introduction: string;
    total_amount: number;
    warranty_text: string;
    terms_text: string;
    notes: string;
    valid_until: string;
    created_at: string;
    signed_at: string | null;
    signature_data: string | null;
    signer_name: string | null;
    clients: {
      name: string;
      email: string;
      phone: string;
      address_line1: string;
      address_line2: string;
    };
    zones: {
      id: string;
      name: string;
      line_items: {
        id: string;
        description: string;
        quantity: number | null;
        unit: string;
        unit_price: number | null;
        amount: number;
        is_addon: boolean;
        sort_order: number;
      }[];
    }[];
    payment_milestones: {
      description: string;
      percentage: number;
      amount: number;
    }[];
    images?: {
      id: string;
      url: string;
      caption: string;
      sort_order: number;
    }[];
  };
  settings: CompanySettings;
  token: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  draft:    { label: "Draft",    bg: "bg-gray-500/20",   text: "text-gray-100" },
  sent:     { label: "Sent",     bg: "bg-blue-500/20",   text: "text-blue-100" },
  viewed:   { label: "Viewed",   bg: "bg-yellow-500/20", text: "text-yellow-100" },
  approved: { label: "Approved", bg: "bg-green-500/20",  text: "text-green-100" },
  declined: { label: "Declined", bg: "bg-red-500/20",    text: "text-red-100" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.sent;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {cfg.label}
    </span>
  );
}

export function PublicProposalView({ proposal, settings, token }: PublicProposalViewProps) {
  const [signing, setSigning] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [showSignature, setShowSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const isApproved = proposal.status === "approved";
  const isSigned = !!proposal.signed_at;
  const primaryColor = settings.primary_color || "#1B5E20";
  const secondaryColor = settings.secondary_color || "#4CAF50";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      isDrawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const endDraw = () => {
      isDrawingRef.current = false;
    };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);
    canvas.addEventListener("touchstart", startDraw);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", endDraw);

    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", endDraw);
      canvas.removeEventListener("mouseleave", endDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", endDraw);
    };
  }, [showSignature, primaryColor]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApprove = async () => {
    if (!signerName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL("image/png");

    setSigning(true);
    try {
      // Get client IP
      let ip = "unknown";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch {}

      const supabase = createClient();
      const { error } = await supabase
        .from("proposals")
        .update({
          status: "approved",
          signed_at: new Date().toISOString(),
          signature_data: signatureData,
          signer_name: signerName,
          signer_ip: ip,
        })
        .eq("id", proposal.id);

      if (error) throw error;

      toast.success("Proposal approved and signed! Thank you.");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to submit signature. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="proposal-print-root min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="proposal-print-header text-white py-8"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={settings.company_name}
                    className="h-[120px] w-auto max-w-[200px] rounded-xl object-contain bg-white p-2 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <span className="font-bold text-sm">4S</span>
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold">{settings.company_name}</h1>
                  <p className="text-sm" style={{ color: secondaryColor }}>{settings.license_number}</p>
                </div>
              </div>
              <p className="text-sm text-white/70">{settings.address_line1}, {settings.address_line2}</p>
              <p className="text-sm text-white/70">{settings.phone} &middot; {settings.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">Proposal</p>
              <p className="text-lg font-bold">{proposal.proposal_number}</p>
              <p className="text-sm text-white/70">
                {format(new Date(proposal.created_at), "MMMM d, yyyy")}
              </p>
              <div className="mt-2">
                <StatusBadge status={proposal.status} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="proposal-print-content max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Approved banner */}
        {isSigned && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-green-800">Proposal Approved</h2>
            <p className="text-green-600 text-sm mt-1">
              Signed by {proposal.signer_name} on{" "}
              {format(new Date(proposal.signed_at!), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Prepared For</p>
            <p className="font-semibold text-lg">{proposal.clients?.name}</p>
            <p className="text-sm text-muted-foreground">{proposal.clients?.address_line1}</p>
            <p className="text-sm text-muted-foreground">{proposal.clients?.address_line2}</p>
            {proposal.clients?.phone && (
              <p className="text-sm text-muted-foreground mt-1">{proposal.clients.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Project</p>
            <p className="font-semibold text-lg">{proposal.title}</p>
            {proposal.valid_until && (
              <p className="text-sm text-muted-foreground mt-1">
                Valid until {format(new Date(proposal.valid_until), "MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        {/* Introduction */}
        {proposal.introduction && (
          <Card className="proposal-card">
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">{proposal.introduction}</p>
            </CardContent>
          </Card>
        )}

        {/* Scope of Work */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: primaryColor }}>Scope of Work</h2>
          {proposal.zones?.map((zone) => (
            <Card key={zone.id} className="proposal-card mb-4">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">{zone.name}</h3>
                <div className="space-y-2">
                  {zone.line_items
                    ?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((item, i) => (
                      <div
                        key={item.id}
                        className={`flex justify-between items-start py-2 ${
                          i > 0 ? "border-t border-gray-100" : ""
                        } ${item.is_addon ? "text-muted-foreground italic" : ""}`}
                      >
                        <div className="flex-1">
                          <p className="text-sm">
                            {i + 1}. {item.description}
                          </p>
                          {item.quantity && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.quantity} {item.unit}
                              {item.unit_price ? ` × $${Number(item.unit_price).toFixed(2)}` : ""}
                            </p>
                          )}
                        </div>
                        {item.amount > 0 && (
                          <p className="font-medium text-sm ml-4">
                            ${Number(item.amount).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Site Photos */}
        {proposal.images && proposal.images.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4" style={{ color: primaryColor }}>Site Photos</h2>
            <div className="grid grid-cols-2 gap-3">
              {proposal.images
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((img) => (
                  <div key={img.id} className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={img.url}
                      alt={img.caption || "Site photo"}
                      className="w-full h-80 object-cover"
                    />
                    {img.caption && (
                      <p className="text-xs text-muted-foreground px-2 py-1.5 bg-white">
                        {img.caption}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Total & Payment */}
        <Card className="proposal-card border-2" style={{ borderColor: primaryColor + "33" }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Total Investment</h2>
              <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                ${Number(proposal.total_amount).toLocaleString()}
              </p>
            </div>
            {proposal.payment_milestones?.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold text-sm mb-3">Payment Schedule</h3>
                <div className="space-y-2">
                  {proposal.payment_milestones.map((m, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{m.description}</span>
                      <span className="font-medium">
                        ${Number(m.amount).toLocaleString()} ({m.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Warranty & Terms */}
        {(proposal.warranty_text || proposal.terms_text) && (
          <Card className="proposal-card">
            <CardContent className="p-6 space-y-4">
              {proposal.warranty_text && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Warranty</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {proposal.warranty_text}
                  </p>
                </div>
              )}
              {proposal.terms_text && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Terms & Conditions</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {proposal.terms_text}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Signature Section */}
        {!isSigned && (
          <Card className="proposal-card no-print border-2" style={{ borderColor: primaryColor }}>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-2">Accept & Sign This Proposal</h2>
              <p className="text-sm text-muted-foreground mb-4">
                By signing below, you agree to the scope of work, pricing, and terms outlined above.
              </p>

              {!showSignature ? (
                <Button
                  onClick={() => setShowSignature(true)}
                  className="w-full text-white py-6 text-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Pen className="mr-2 h-5 w-5" />
                  Accept & Sign Proposal
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your Full Name</Label>
                    <Input
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Enter your full legal name"
                      className="text-lg py-5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Signature</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-40 signature-canvas"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={clearSignature}>
                        Clear Signature
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By signing, you electronically agree to the terms of this proposal.
                    Your IP address and timestamp will be recorded.
                  </p>
                  <Button
                    onClick={handleApprove}
                    disabled={signing}
                    className="w-full text-white py-6 text-lg"
                  style={{ backgroundColor: primaryColor }}
                  >
                    {signing ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                    )}
                    Approve & Sign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Existing signature display */}
        {isSigned && proposal.signature_data && (
          <Card className="proposal-card">
            <CardContent className="p-6">
              <h3 className="font-semibold text-sm mb-3">Electronic Signature</h3>
              <div className="border rounded-lg p-4 bg-white">
                <img
                  src={proposal.signature_data}
                  alt="Signature"
                  className="max-h-24 mx-auto"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Signed by {proposal.signer_name} on{" "}
                {format(new Date(proposal.signed_at!), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Download PDF */}
        <div className="no-print flex justify-center py-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2 border-2 text-sm font-medium px-6 py-5"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <FileDown className="h-4 w-4" />
            Download Proposal as PDF
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p className="font-medium" style={{ color: primaryColor }}>{settings.company_name}</p>
          <p>{settings.phone} &middot; {settings.email}</p>
          <p>{settings.address_line1}, {settings.address_line2}</p>
        </div>
      </div>
    </div>
  );
}
