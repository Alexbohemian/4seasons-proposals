import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ProposalDetail } from "@/components/proposal-detail";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*, clients(*)")
    .eq("id", id)
    .single();

  if (!proposal) notFound();

  const { data: zones } = await supabase
    .from("proposal_zones")
    .select("*, line_items(*)")
    .eq("proposal_id", id)
    .order("sort_order", { ascending: true });

  const { data: milestones } = await supabase
    .from("payment_milestones")
    .select("*")
    .eq("proposal_id", id)
    .order("sort_order", { ascending: true });

  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .single();

  return (
    <ProposalDetail
      proposal={{ ...proposal, zones: zones || [], payment_milestones: milestones || [] }}
      settings={settings!}
    />
  );
}
