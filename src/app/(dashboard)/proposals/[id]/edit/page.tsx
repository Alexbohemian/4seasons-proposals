import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ProposalForm } from "@/components/proposal-form";

export default async function EditProposalPage({
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
  if (proposal.status !== "draft") redirect(`/proposals/${id}`);

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

  const { data: images } = await supabase
    .from("proposal_images")
    .select("id, url, caption, storage_path, sort_order")
    .eq("proposal_id", id)
    .order("sort_order", { ascending: true });

  const { data: templates } = await supabase
    .from("service_templates")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("name");

  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .single();

  const client = proposal.clients as {
    id: string;
    name: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2: string;
  };

  const initialData = {
    proposalId: proposal.id,
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    clientPhone: client.phone,
    clientAddress1: client.address_line1,
    clientAddress2: client.address_line2,
    title: proposal.title,
    introduction: proposal.introduction,
    notes: proposal.notes,
    validUntil: proposal.valid_until || "",
    warrantyText: proposal.warranty_text,
    termsText: proposal.terms_text,
    zones: (zones || []).map((z) => ({
      name: z.name,
      line_items: (z.line_items || [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((item: {
          description: string;
          quantity: number | null;
          unit: string;
          unit_price: number | null;
          amount: number;
          is_addon: boolean;
        }) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          amount: Number(item.amount),
          is_addon: item.is_addon,
        })),
    })),
    milestones: (milestones || []).map((m: {
      description: string;
      percentage: number;
      amount: number;
    }) => ({
      description: m.description,
      percentage: Number(m.percentage),
      amount: Number(m.amount),
    })),
    images: (images || []).map((img: {
      id: string;
      url: string;
      caption: string;
      storage_path: string;
    }) => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      storage_path: img.storage_path,
    })),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Proposal {proposal.proposal_number}</h1>
        <p className="text-muted-foreground">{client.name} &middot; {proposal.title}</p>
      </div>
      <ProposalForm
        templates={templates || []}
        settings={settings!}
        initialData={initialData}
      />
    </div>
  );
}
