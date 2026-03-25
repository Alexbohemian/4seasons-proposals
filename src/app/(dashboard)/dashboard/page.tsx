import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  PlusCircle,
  DollarSign,
  Clock,
  CheckCircle2,
  Send,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
    sent: { label: "Sent", className: "bg-blue-100 text-blue-700 border-blue-200" },
    viewed: { label: "Viewed", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    approved: { label: "Approved", className: "bg-green-100 text-green-700 border-green-200" },
    declined: { label: "Declined", className: "bg-red-100 text-red-700 border-red-200" },
  };
  const c = config[status] || config.draft;
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: proposals } = await supabase
    .from("proposals")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const { count: totalProposals } = await supabase
    .from("proposals")
    .select("*", { count: "exact", head: true });

  const { count: draftCount } = await supabase
    .from("proposals")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  const { count: sentCount } = await supabase
    .from("proposals")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent");

  const { count: approvedCount } = await supabase
    .from("proposals")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { data: approvedProposals } = await supabase
    .from("proposals")
    .select("total_amount")
    .eq("status", "approved");

  const totalRevenue = approvedProposals?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

  const stats = [
    {
      title: "Total Proposals",
      value: totalProposals || 0,
      icon: FileText,
      color: "text-[#1B5E20]",
      bg: "bg-[#E8F5E9]",
    },
    {
      title: "Drafts",
      value: draftCount || 0,
      icon: Clock,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    {
      title: "Sent & Pending",
      value: sentCount || 0,
      icon: Send,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Approved",
      value: approvedCount || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Revenue (Approved)",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here&apos;s an overview of your proposals.</p>
        </div>
        <Link href="/proposals/new">
          <Button className="bg-[#1B5E20] hover:bg-[#0D3311] text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Proposals */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Proposals</CardTitle>
          <Link href="/proposals">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {proposals && proposals.length > 0 ? (
            <div className="divide-y">
              {proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors -mx-2"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#1B5E20]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{proposal.proposal_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {(proposal.clients as { name: string })?.name || "No client"} &middot; {proposal.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        ${Number(proposal.total_amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <StatusBadge status={proposal.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No proposals yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first proposal to get started.
              </p>
              <Link href="/proposals/new">
                <Button className="mt-4 bg-[#1B5E20] hover:bg-[#0D3311] text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Proposal
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
