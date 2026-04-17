import { redirect } from "next/navigation";

/** Раньше была отдельная страница; с Яндекс OAuth вход и первый визит — один сценарий. */
export default function RegisterPage() {
  redirect("/");
}
