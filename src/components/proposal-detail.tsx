"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Send,
  Download,
  Eye,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  FileText,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Mail,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  updateProposalStatus,
  deleteProposal,
  sendProposalEmail,
} from "@/app/actions/proposals";
import type { CompanySettings } from "@/lib/types";
import Link from "next/link";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700", icon: Clock },
    sent: { label: "Sent", className: "bg-blue-100 text-blue-700", icon: Send },
    viewed: { label: "Viewed", className: "bg-yellow-100 text-yellow-700", icon: Eye },
    approved: { label: "Approved", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
    declined: { label: "Declined", className: "bg-red-100 text-red-700", icon: XCircle },
  };
  const c = config[status] || config.draft;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`${c.className} border-0 gap-1.5 text-sm px-3 py-1`}>
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </Badge>
  );
}

interface ProposalDetailProps {
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
    sent_at: string | null;
    viewed_at: string | null;
    signed_at: string | null;
    signer_name: string | null;
    share_token: string;
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
      }[];
    }[];
    payment_milestones: {
      description: string;
      percentage: number;
      amount: number;
    }[];
  };
  settings: CompanySettings;
}

export function ProposalDetail({ proposal, settings }: ProposalDetailProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(proposal.clients?.email || "");
  const [emailMessage, setEmailMessage] = useState("");
  const [includePdf, setIncludePdf] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/proposal/view/${proposal.share_token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.error("Please enter an email address");
      return;
    }
    setSending(true);
    try {
      await sendProposalEmail(proposal.id, recipientEmail, includePdf, emailMessage);
      toast.success("Proposal sent successfully!");
      setEmailDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this proposal? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteProposal(proposal.id);
    } catch (error) {
      toast.error("Failed to delete proposal");
      setDeleting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateProposalStatus(proposal.id, status);
      toast.success(`Status updated to ${status}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/proposal-pdf/${proposal.id}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/proposals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{proposal.proposal_number}</h1>
              <StatusBadge status={proposal.status} />
            </div>
            <p className="text-muted-foreground">
              {proposal.clients?.name} &middot; {proposal.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy Link
          </Button>
          <Link href={`/proposal/view/${proposal.share_token}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Preview
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            PDF
          </Button>

          {/* Email Dialog */}
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="bg-[#1B5E20] hover:bg-[#0D3311] text-white">
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Send
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Proposal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="client@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Personal Message (optional)</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Add a personal note to the email..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includePdf"
                    checked={includePdf}
                    onCheckedChange={(checked) => setIncludePdf(checked as boolean)}
                  />
                  <Label htmlFor="includePdf" className="text-sm">
                    Include PDF attachment
                  </Label>
                </div>
                <Button
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="w-full bg-[#1B5E20] hover:bg-[#0D3311] text-white"
                >
                  {sending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Proposal
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Created: </span>
              <span className="font-medium">{format(new Date(proposal.created_at), "MMM d, yyyy")}</span>
            </div>
            {proposal.sent_at && (
              <div>
                <span className="text-muted-foreground">Sent: </span>
                <span className="font-medium">{format(new Date(proposal.sent_at), "MMM d, yyyy h:mm a")}</span>
              </div>
            )}
            {proposal.viewed_at && (
              <div>
                <span className="text-muted-foreground">Viewed: </span>
                <span className="font-medium">{format(new Date(proposal.viewed_at), "MMM d, yyyy h:mm a")}</span>
              </div>
            )}
            {proposal.signed_at && (
              <div>
                <span className="text-muted-foreground">Signed by: </span>
                <span className="font-medium">{proposal.signer_name} on {format(new Date(proposal.signed_at), "MMM d, yyyy")}</span>
              </div>
            )}
            {proposal.valid_until && (
              <div>
                <span className="text-muted-foreground">Valid until: </span>
                <span className="font-medium">{format(new Date(proposal.valid_until), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-base">{proposal.clients?.name}</p>
                  <p className="text-muted-foreground mt-1">{proposal.clients?.address_line1}</p>
                  <p className="text-muted-foreground">{proposal.clients?.address_line2}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{proposal.clients?.phone}</p>
                  <p className="text-muted-foreground">{proposal.clients?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Introduction */}
          {proposal.introduction && (
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-700 leading-relaxed">{proposal.introduction}</p>
              </CardContent>
            </Card>
          )}

          {/* Zones */}
          {proposal.zones?.map((zone) => (
            <Card key={zone.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{zone.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {zone.line_items
                    ?.sort((a, b) => 0)
                    .map((item, i) => (
                      <div
                        key={item.id}
                        className={`flex justify-between py-2 ${
                          item.is_addon
                            ? "pl-4 border-l-2 border-dashed border-[#4CAF50] text-muted-foreground"
                            : ""
                        } ${i > 0 ? "border-t border-gray-50" : ""}`}
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
                          <p className="font-medium text-sm">
                            ${Number(item.amount).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Warranty & Terms */}
          {(proposal.warranty_text || proposal.terms_text) && (
            <Card>
              <CardContent className="p-5 space-y-4">
                {proposal.warranty_text && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Warranty</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {proposal.warranty_text}
                    </p>
                  </div>
                )}
                {proposal.terms_text && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Terms & Conditions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {proposal.terms_text}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card className="border-2 border-[#1B5E20]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold text-[#1B5E20]">
                  ${Number(proposal.total_amount).toLocaleString()}
                </p>
              </div>

              {proposal.payment_milestones?.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Payment Schedule</p>
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

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["draft", "sent", "viewed", "approved", "declined"].map((status) => (
                <Button
                  key={status}
                  variant={proposal.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  className={`w-full justify-start capitalize ${
                    proposal.status === status
                      ? "bg-[#1B5E20] hover:bg-[#0D3311] text-white"
                      : ""
                  }`}
                  disabled={proposal.status === status}
                >
                  {status}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          {proposal.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{proposal.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
