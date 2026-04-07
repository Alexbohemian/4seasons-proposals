"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Building2, Key, FileText, Loader2, CheckCircle2, Upload, X, Palette } from "lucide-react";
import { toast } from "sonner";
import type { CompanySettings } from "@/lib/types";

const PRESET_COLORS = [
  { label: "Forest Green", primary: "#1B5E20", secondary: "#4CAF50" },
  { label: "Navy Blue", primary: "#1A237E", secondary: "#42A5F5" },
  { label: "Charcoal", primary: "#212121", secondary: "#757575" },
  { label: "Deep Red", primary: "#B71C1C", secondary: "#EF5350" },
  { label: "Teal", primary: "#004D40", secondary: "#26A69A" },
  { label: "Purple", primary: "#4A148C", secondary: "#AB47BC" },
];

export default function SettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("company_settings").select("*").single();
      setSettings(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    const { error } = await supabase
      .from("company_settings")
      .update({
        company_name: settings.company_name,
        license_number: settings.license_number,
        address_line1: settings.address_line1,
        address_line2: settings.address_line2,
        phone: settings.phone,
        email: settings.email,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        gemini_api_key: settings.gemini_api_key,
        sendgrid_api_key: settings.sendgrid_api_key,
        default_warranty_text: settings.default_warranty_text,
        default_terms_text: settings.default_terms_text,
      })
      .eq("id", settings.id);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved successfully");
    }
    setSaving(false);
  };

  if (loading || !settings) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  const update = (field: keyof CompanySettings, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("company_settings")
        .update({ logo_url: publicUrl })
        .eq("id", settings.id);

      if (updateError) throw updateError;

      setSettings({ ...settings, logo_url: publicUrl });
      toast.success("Logo uploaded successfully");
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings) return;
    const { error } = await supabase
      .from("company_settings")
      .update({ logo_url: null })
      .eq("id", settings.id);
    if (error) {
      toast.error("Failed to remove logo");
    } else {
      setSettings({ ...settings, logo_url: null });
      toast.success("Logo removed");
    }
  };

  const primaryColor = settings.primary_color || "#1B5E20";
  const secondaryColor = settings.secondary_color || "#4CAF50";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-muted-foreground">
            Manage your company information and integrations.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1B5E20] hover:bg-[#0D3311] text-white"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Key className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="defaults" className="gap-2">
            <FileText className="h-4 w-4" />
            Default Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={settings.company_name}
                    onChange={(e) => update("company_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input
                    value={settings.license_number || ""}
                    onChange={(e) => update("license_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={settings.address_line1 || ""}
                    onChange={(e) => update("address_line1", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City, State, ZIP</Label>
                  <Input
                    value={settings.address_line2 || ""}
                    onChange={(e) => update("address_line2", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={settings.phone || ""}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={settings.email || ""}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <div className="space-y-6">
            {/* Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  {settings.logo_url ? (
                    <div className="relative">
                      <img
                        src={settings.logo_url}
                        alt="Company logo"
                        className="h-20 w-auto max-w-[200px] object-contain rounded-xl border bg-white p-2"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center"
                      style={{ backgroundColor: primaryColor + "10" }}
                    >
                      <span className="text-xs text-muted-foreground text-center px-2">No logo</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                    <p className="text-xs text-muted-foreground">JPG, PNG, WebP or SVG · Max 5MB</p>
                    <p className="text-xs text-muted-foreground">Shown on login, sidebar, and proposals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Palette */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Color Palette</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Presets */}
                <div className="space-y-2">
                  <Label className="text-sm">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setSettings({
                          ...settings,
                          primary_color: preset.primary,
                          secondary_color: preset.secondary,
                        })}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-gray-50 transition-colors"
                        style={{
                          borderColor: primaryColor === preset.primary ? preset.primary : undefined,
                          backgroundColor: primaryColor === preset.primary ? preset.primary + "10" : undefined,
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded-full inline-block"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span
                          className="w-4 h-4 rounded-full inline-block -ml-1"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Custom pickers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Primary Color</Label>
                    <p className="text-xs text-muted-foreground -mt-1">Used for headers, buttons, and accents</p>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => update("primary_color", e.target.value)}
                          className="w-12 h-12 rounded-xl border cursor-pointer p-0.5 bg-white"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={primaryColor}
                          onChange={(e) => update("primary_color", e.target.value)}
                          placeholder="#1B5E20"
                          className="font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    {/* Preview swatch */}
                    <div
                      className="h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Primary Preview
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Secondary Color</Label>
                    <p className="text-xs text-muted-foreground -mt-1">Used for highlights and accents</p>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => update("secondary_color", e.target.value)}
                          className="w-12 h-12 rounded-xl border cursor-pointer p-0.5 bg-white"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={secondaryColor}
                          onChange={(e) => update("secondary_color", e.target.value)}
                          placeholder="#4CAF50"
                          className="font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    {/* Preview swatch */}
                    <div
                      className="h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      Secondary Preview
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Live preview */}
                <div className="space-y-2">
                  <Label className="text-sm">Proposal Header Preview</Label>
                  <div
                    className="rounded-xl p-5 text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="flex items-center gap-3">
                      {settings.logo_url ? (
                        <img
                          src={settings.logo_url}
                          alt="logo"
                          className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: primaryColor + "40", border: "1px solid rgba(255,255,255,0.3)" }}
                        >
                          4S
                        </div>
                      )}
                      <div>
                        <p className="font-bold">{settings.company_name}</p>
                        <p className="text-sm" style={{ color: secondaryColor }}>
                          {settings.license_number || "Lic. 000000"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Google Gemini AI
                  {settings.gemini_api_key && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect Google Gemini to get AI-powered proposal suggestions, introduction
                  text generation, and smart line item recommendations.
                </p>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={settings.gemini_api_key || ""}
                    onChange={(e) => update("gemini_api_key", e.target.value)}
                    placeholder="Enter your Gemini API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <span className="font-medium">Google AI Studio</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  SendGrid Email
                  {settings.sendgrid_api_key && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect SendGrid to send proposals directly to clients via email.
                </p>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={settings.sendgrid_api_key || ""}
                    onChange={(e) => update("sendgrid_api_key", e.target.value)}
                    placeholder="Enter your SendGrid API key"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="defaults">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default Proposal Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Warranty Text</Label>
                <Textarea
                  value={settings.default_warranty_text || ""}
                  onChange={(e) => update("default_warranty_text", e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Default Terms & Conditions</Label>
                <Textarea
                  value={settings.default_terms_text || ""}
                  onChange={(e) => update("default_terms_text", e.target.value)}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
