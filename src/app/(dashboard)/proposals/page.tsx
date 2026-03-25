import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlusCircle, FileText, Search, Eye } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; dot: string }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
    sent: { label: "Sent", className: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    viewed: { label: "Viewed", className: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
    approved: { label: "Approved", className: "bg-green-100 text-green-700", dot: "bg-green-500" },
    declined: { label: "Declined", className: "bg-red-100 text-red-700", dot: "bg-red-500" },
  };
  const c = config[status] || config.draft;
  return (
    <Badge variant="outline" className={`${c.className} border-0 gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </Badge>
  );
}

export default async function ProposalsPage() {
  const supabase = await createClient();

  const { data: proposals } = await supabase
    .from("proposals")
    .select("*, clients(name, email)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-muted-foreground">
            Manage all your proposals in one place.
          </p>
        </div>
        <Link href="/proposals/new">
          <Button className="bg-[#1B5E20] hover:bg-[#0D3311] text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      {proposals && proposals.length > 0 ? (
        <div className="grid gap-3">
          {proposals.map((proposal) => (
            <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-lg bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-[#1B5E20]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{proposal.proposal_number}</p>
                          <StatusBadge status={proposal.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {(proposal.clients as { name: string })?.name || "No client"} &middot;{" "}
                          {proposal.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Created {format(new Date(proposal.created_at), "MMM d, yyyy")}
                          {proposal.sent_at &&
                            ` · Sent ${formatDistanceToNow(new Date(proposal.sent_at), { addSuffix: true })}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ${Number(proposal.total_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No proposals yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first proposal to get started.
            </p>
            <Link href="/proposals/new">
              <Button className="mt-4 bg-[#1B5E20] hover:bg-[#0D3311] text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Proposal
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
