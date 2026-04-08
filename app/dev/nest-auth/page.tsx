import { notFound } from "next/navigation";
import { NestDevAuthClient } from "./NestDevAuthClient";

export default function NestAuthDevPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_NEST_DEV_PAGE !== "1"
  ) {
    notFound();
  }
  return <NestDevAuthClient />;
}
