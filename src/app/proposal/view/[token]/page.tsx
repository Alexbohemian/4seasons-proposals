import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { PublicProposalView } from "@/components/public-proposal-view";

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*, clients(*)")
    .eq("share_token", token)
    .single();

  if (!proposal) notFound();

  // Mark as viewed if sent
  if (proposal.status === "sent" && !proposal.viewed_at) {
    await supabase
      .from("proposals")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", proposal.id);
  }

  const { data: zones } = await supabase
    .from("proposal_zones")
    .select("*, line_items(*)")
    .eq("proposal_id", proposal.id)
    .order("sort_order", { ascending: true });

  const { data: milestones } = await supabase
    .from("payment_milestones")
    .select("*")
    .eq("proposal_id", proposal.id)
    .order("sort_order", { ascending: true });

  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .single();

  return (
    <PublicProposalView
      proposal={{ ...proposal, zones: zones || [], payment_milestones: milestones || [] }}
      settings={settings!}
      token={token}
    />
  );
}
