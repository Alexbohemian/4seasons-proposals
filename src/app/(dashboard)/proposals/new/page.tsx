import { createClient } from "@/utils/supabase/server";
import { ProposalForm } from "@/components/proposal-form";

export default async function NewProposalPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("service_templates")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true });

  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Proposal</h1>
        <p className="text-muted-foreground">
          Fill in the details below or use AI to help generate your proposal.
        </p>
      </div>
      <ProposalForm templates={templates || []} settings={settings!} />
    </div>
  );
}
