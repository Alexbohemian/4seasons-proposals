import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="text-muted-foreground">
          All your clients. Clients are automatically created when you create proposals.
        </p>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#1B5E20] font-medium text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{client.name}</p>
                    {client.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </p>
                    )}
                    {client.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </p>
                    )}
                    {client.address_line1 && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {client.address_line1}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Added {format(new Date(client.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No clients yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Clients will appear here when you create proposals.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
