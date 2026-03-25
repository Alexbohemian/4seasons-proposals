"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProposal(formData: {
  client: {
    name: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2: string;
  };
  title: string;
  introduction: string;
  zones: {
    name: string;
    line_items: {
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
  total_amount: number;
  warranty_text: string;
  terms_text: string;
  notes: string;
  valid_until: string;
  status: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Upsert client
  let clientId: string;

  if (formData.client.name) {
    // Check if client exists by name
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("name", formData.client.name)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
      await supabase
        .from("clients")
        .update({
          email: formData.client.email,
          phone: formData.client.phone,
          address_line1: formData.client.address_line1,
          address_line2: formData.client.address_line2,
        })
        .eq("id", clientId);
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: formData.client.name,
          email: formData.client.email,
          phone: formData.client.phone,
          address_line1: formData.client.address_line1,
          address_line2: formData.client.address_line2,
        })
        .select("id")
        .single();

      if (clientError) throw clientError;
      clientId = newClient.id;
    }
  } else {
    throw new Error("Client name is required");
  }

  // Create proposal
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .insert({
      client_id: clientId,
      status: formData.status || "draft",
      title: formData.title,
      introduction: formData.introduction,
      total_amount: formData.total_amount,
      warranty_text: formData.warranty_text,
      terms_text: formData.terms_text,
      notes: formData.notes,
      valid_until: formData.valid_until || null,
      created_by: user.id,
      proposal_number: "",
    })
    .select("id")
    .single();

  if (proposalError) throw proposalError;

  // Create zones and line items
  for (let i = 0; i < formData.zones.length; i++) {
    const zone = formData.zones[i];
    const { data: newZone, error: zoneError } = await supabase
      .from("proposal_zones")
      .insert({
        proposal_id: proposal.id,
        name: zone.name,
        sort_order: i,
      })
      .select("id")
      .single();

    if (zoneError) throw zoneError;

    if (zone.line_items.length > 0) {
      const lineItemsData = zone.line_items.map((item, j) => ({
        zone_id: newZone.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        amount: item.amount,
        is_addon: item.is_addon,
        sort_order: j,
      }));

      const { error: itemsError } = await supabase
        .from("line_items")
        .insert(lineItemsData);

      if (itemsError) throw itemsError;
    }
  }

  // Create payment milestones
  if (formData.payment_milestones.length > 0) {
    const milestonesData = formData.payment_milestones.map((m, i) => ({
      proposal_id: proposal.id,
      description: m.description,
      percentage: m.percentage,
      amount: m.amount,
      sort_order: i,
    }));

    const { error: milestonesError } = await supabase
      .from("payment_milestones")
      .insert(milestonesData);

    if (milestonesError) throw milestonesError;
  }

  revalidatePath("/proposals");
  revalidatePath("/dashboard");

  return proposal.id;
}

export async function updateProposalStatus(proposalId: string, status: string) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status };
  if (status === "sent") {
    updateData.sent_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("proposals")
    .update(updateData)
    .eq("id", proposalId);

  if (error) throw error;

  revalidatePath("/proposals");
  revalidatePath("/dashboard");
  revalidatePath(`/proposals/${proposalId}`);
}

export async function deleteProposal(proposalId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", proposalId);

  if (error) throw error;

  revalidatePath("/proposals");
  revalidatePath("/dashboard");
  redirect("/proposals");
}

export async function sendProposalEmail(
  proposalId: string,
  recipientEmail: string,
  includePdf: boolean,
  message: string
) {
  const supabase = await createClient();

  // Get company settings for SendGrid key
  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .single();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*, clients(name, email)")
    .eq("id", proposalId)
    .single();

  if (!proposal || !settings) throw new Error("Proposal or settings not found");

  const apiKey = settings.sendgrid_api_key || process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SendGrid API key not configured. Go to Settings > Integrations.");

  // Build share URL dynamically — works on any deployment domain
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://4seasons-proposals.vercel.app";
  const shareUrl = `${baseUrl}/proposal/view/${proposal.share_token}`;

  const clientName = (proposal.clients as { name: string })?.name || "Valued Client";

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1B5E20; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${settings.company_name}</h1>
        <p style="color: #81C784; margin: 4px 0 0;">${settings.license_number}</p>
      </div>
      <div style="padding: 32px; background: #f9f9f9;">
        <p>Dear ${clientName},</p>
        ${message ? `<p>${message}</p>` : `<p>Thank you for considering ${settings.company_name} for your project. Please find your proposal below.</p>`}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${shareUrl}" style="background: #1B5E20; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Proposal #${proposal.proposal_number}
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Proposal Amount: <strong>$${Number(proposal.total_amount).toLocaleString()}</strong></p>
        <p style="color: #666; font-size: 14px;">You can view, approve, and sign the proposal using the button above.</p>
      </div>
      <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
        ${settings.company_name} &middot; ${settings.phone} &middot; ${settings.email}
      </div>
    </div>
  `;

  // Determine sender — SendGrid requires a verified sender identity
  const fromEmail = settings.email || "noreply@4seasonsgreensinc.com";

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: recipientEmail }] }],
      from: { email: fromEmail, name: settings.company_name },
      subject: `Proposal ${proposal.proposal_number} from ${settings.company_name}`,
      content: [{ type: "text/html", value: emailBody }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("SendGrid error:", response.status, errorText);

    // Parse SendGrid error for user-friendly message
    try {
      const errorJson = JSON.parse(errorText);
      const errors = errorJson.errors || [];
      const messages = errors.map((e: { message: string }) => e.message);

      if (response.status === 403 || messages.some((m: string) => m.toLowerCase().includes("verified"))) {
        throw new Error(
          `SendGrid sender not verified. You need to verify "${fromEmail}" as a sender in your SendGrid dashboard (Settings > Sender Authentication).`
        );
      }
      if (response.status === 401) {
        throw new Error("SendGrid API key is invalid. Please check your key in Settings > Integrations.");
      }
      throw new Error(`Email failed: ${messages.join("; ") || errorText}`);
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message.startsWith("SendGrid")) throw parseErr;
      if (parseErr instanceof Error && parseErr.message.startsWith("Email failed")) throw parseErr;
      throw new Error(`Email failed (${response.status}): ${errorText.substring(0, 200)}`);
    }
  }

  // Update status to sent
  await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposalId);

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/dashboard");
}
