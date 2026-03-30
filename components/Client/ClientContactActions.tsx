import { Button } from "@/components/ui/button";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
import { normalizePhone } from "@/src/validators/normalizePhone";
import { MessageSquare, Phone } from "lucide-react";
import Link from "next/link";

interface ItemProps {
  client: ZodClient;
}

const ClientContactActions = ({ client }: ItemProps) => {
  const rawPhone = client.phone ?? "";
  const normalizedPhone = normalizePhone(rawPhone);
  const phone = normalizedPhone || rawPhone.trim();
  const whatsappPhone = normalizedPhone || rawPhone.replace(/\D/g, "");

  return (
    <div className="flex gap-x-2">
      <Button variant="default" size="xs" asChild disabled={!phone}>
        <Link href={`tel:${phone}`}>
          {" "}
          <Phone strokeWidth={1.25} />
        </Link>
      </Button>

      <Button variant="outline" size="xs" asChild disabled={!phone}>
        <Link href={`sms:${phone}`}>
          <MessageSquare strokeWidth={1.25} />
        </Link>
      </Button>

      <Button variant="outline" size="xs" asChild disabled={!whatsappPhone}>
        <Link
          href={`https://wa.me/${whatsappPhone}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </Link>
      </Button>
    </div>
  );
};

export default ClientContactActions;
