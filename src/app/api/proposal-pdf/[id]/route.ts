import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*, clients(*)")
    .eq("id", id)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  const client = proposal.clients as { name: string; address_line1: string; address_line2: string; phone: string; email: string };

  // Generate HTML for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; font-size: 11pt; line-height: 1.5; }
    .header { background: #1B5E20; color: white; padding: 32px 40px; display: flex; justify-content: space-between; }
    .header h1 { font-size: 22pt; margin-bottom: 2px; }
    .header .subtitle { color: #81C784; font-size: 10pt; }
    .header .contact { font-size: 9pt; color: #C8E6C9; margin-top: 8px; }
    .header .right { text-align: right; }
    .header .proposal-num { font-size: 16pt; font-weight: bold; }
    .content { padding: 32px 40px; }
    .client-section { display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e0e0e0; }
    .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 4px; }
    .client-name { font-size: 14pt; font-weight: bold; }
    .intro { margin-bottom: 24px; color: #555; }
    .section-title { font-size: 13pt; font-weight: bold; color: #1B5E20; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #E8F5E9; }
    .zone-name { font-weight: bold; font-size: 11pt; margin: 16px 0 8px; color: #333; }
    .line-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
    .line-item .desc { flex: 1; }
    .line-item .detail { font-size: 9pt; color: #999; }
    .line-item .amount { font-weight: 600; min-width: 80px; text-align: right; }
    .addon { padding-left: 16px; border-left: 2px dashed #4CAF50; color: #666; font-style: italic; }
    .total-section { margin-top: 32px; padding: 20px; background: #f8faf8; border: 2px solid #E8F5E9; border-radius: 8px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-amount { font-size: 24pt; font-weight: bold; color: #1B5E20; }
    .milestone { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10pt; }
    .terms-section { margin-top: 24px; }
    .terms-title { font-weight: bold; font-size: 10pt; margin-bottom: 4px; }
    .terms-text { font-size: 9pt; color: #666; white-space: pre-line; }
    .signature-section { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e0e0e0; }
    .sig-line { border-bottom: 1px solid #333; width: 250px; margin-top: 40px; }
    .sig-label { font-size: 9pt; color: #999; margin-top: 4px; }
    .footer { margin-top: 40px; text-align: center; font-size: 9pt; color: #999; padding-top: 16px; border-top: 1px solid #e0e0e0; }
    ${proposal.signature_data ? `.sig-image { max-height: 60px; margin-top: 8px; }` : ""}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${settings?.company_name || ""}</h1>
      <div class="subtitle">${settings?.license_number || ""}</div>
      <div class="contact">${settings?.address_line1 || ""}, ${settings?.address_line2 || ""}<br>${settings?.phone || ""} · ${settings?.email || ""}</div>
    </div>
    <div class="right">
      <div class="label">Proposal</div>
      <div class="proposal-num">${proposal.proposal_number}</div>
      <div style="font-size: 10pt; color: #C8E6C9; margin-top: 4px;">${new Date(proposal.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
  </div>

  <div class="content">
    <div class="client-section">
      <div>
        <div class="label">Prepared For</div>
        <div class="client-name">${client?.name || ""}</div>
        <div>${client?.address_line1 || ""}</div>
        <div>${client?.address_line2 || ""}</div>
        ${client?.phone ? `<div>${client.phone}</div>` : ""}
        ${client?.email ? `<div>${client.email}</div>` : ""}
      </div>
      <div style="text-align: right;">
        <div class="label">Project</div>
        <div style="font-weight: bold;">${proposal.title}</div>
        ${proposal.valid_until ? `<div style="font-size: 9pt; color: #999;">Valid until ${new Date(proposal.valid_until).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>` : ""}
      </div>
    </div>

    ${proposal.introduction ? `<div class="intro">${proposal.introduction}</div>` : ""}

    <div class="section-title">Scope of Work</div>
    ${(zones || [])
      .map(
        (zone) => `
      <div class="zone-name">${zone.name}</div>
      ${(zone.line_items || [])
        .sort((a: { sort_order?: number }, b: { sort_order?: number }) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(
          (item: { description: string; quantity: number | null; unit: string; unit_price: number | null; amount: number; is_addon: boolean }, i: number) => `
        <div class="line-item ${item.is_addon ? "addon" : ""}">
          <div class="desc">
            ${i + 1}. ${item.description}
            ${item.quantity ? `<div class="detail">${item.quantity} ${item.unit}${item.unit_price ? ` × $${Number(item.unit_price).toFixed(2)}` : ""}</div>` : ""}
          </div>
          ${item.amount > 0 ? `<div class="amount">$${Number(item.amount).toLocaleString()}</div>` : ""}
        </div>
      `
        )
        .join("")}
    `
      )
      .join("")}

    <div class="total-section">
      <div class="total-row">
        <div>
          <div style="font-weight: bold;">Total Investment</div>
        </div>
        <div class="total-amount">$${Number(proposal.total_amount).toLocaleString()}</div>
      </div>
      ${
        milestones && milestones.length > 0
          ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
          <div style="font-size: 9pt; font-weight: bold; margin-bottom: 4px;">Payment Schedule</div>
          ${milestones
            .map(
              (m) => `
            <div class="milestone">
              <span>${m.description}</span>
              <span>$${Number(m.amount).toLocaleString()} (${m.percentage}%)</span>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>

    ${
      proposal.warranty_text || proposal.terms_text
        ? `
      <div class="terms-section">
        ${
          proposal.warranty_text
            ? `
          <div class="terms-title">Warranty</div>
          <div class="terms-text">${proposal.warranty_text}</div>
        `
            : ""
        }
        ${
          proposal.terms_text
            ? `
          <div class="terms-title" style="margin-top: 12px;">Terms & Conditions</div>
          <div class="terms-text">${proposal.terms_text}</div>
        `
            : ""
        }
      </div>
    `
        : ""
    }

    <div class="signature-section">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <div class="label">Client Acceptance</div>
          ${
            proposal.signature_data
              ? `<img src="${proposal.signature_data}" class="sig-image" /><br><strong>${proposal.signer_name}</strong><br><span style="font-size: 9pt; color: #999;">Signed: ${proposal.signed_at ? new Date(proposal.signed_at).toLocaleString() : ""}</span>`
              : `<div class="sig-line"></div><div class="sig-label">Signature & Date</div>`
          }
        </div>
        <div>
          <div class="label">Company Representative</div>
          <div class="sig-line"></div>
          <div class="sig-label">${settings?.company_name || ""}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      ${settings?.company_name || ""} · ${settings?.phone || ""} · ${settings?.email || ""}<br>
      ${settings?.address_line1 || ""}, ${settings?.address_line2 || ""}
    </div>
  </div>
</body>
</html>`;

  // Return HTML that the browser can print to PDF
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
