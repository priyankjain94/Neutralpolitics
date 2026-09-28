import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import type { Lang } from "./types";

export type Messages = typeof en;

export function t(lang: Lang): Messages {
  return (lang === "hi" ? hi : en) as Messages;
}
