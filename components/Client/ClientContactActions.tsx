import { Button } from "@/components/ui/button";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
import { MessageSquare, Phone } from "lucide-react";
import Link from "next/link";

interface ItemProps {
  client: ZodClient;
}

const ClientContactActions = ({ client }: ItemProps) => {
  return (
    <div className="flex gap-x-2">
      <Button variant="default" size="xs" asChild disabled={!client.phone}>
        <Link href={`tel:${client.phone ?? ""}`}>
          {" "}
          <Phone strokeWidth={1.25} />
        </Link>
      </Button>

      <Button variant="outline" size="xs" asChild disabled={!client.phone}>
        <Link href={`sms:${client.phone ?? ""}`}>
          <MessageSquare strokeWidth={1.25} />
        </Link>
      </Button>

      <Button variant="outline" size="xs" asChild disabled={!client.phone}>
        <Link
          href={`https://wa.me/${client.phone ?? ""}`}
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
