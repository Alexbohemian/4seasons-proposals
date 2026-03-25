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
import { Save, Building2, Key, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { CompanySettings } from "@/lib/types";

export default function SettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
