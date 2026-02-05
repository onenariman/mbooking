import { cn } from "@/src/lib/utils";
import { LoaderIcon } from "lucide-react";

function Spinner({
  children,
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <div className="flex gap-x-2">
      {children}
      <LoaderIcon
        role="status"
        aria-label="Loading"
        className={cn("size-4 animate-spin", className)}
        {...props}
      />
    </div>
  );
}

export default Spinner;
