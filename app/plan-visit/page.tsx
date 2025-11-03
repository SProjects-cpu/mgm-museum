import { Metadata } from "next";
import { PlanVisitClient } from "./plan-visit-client";

export const metadata: Metadata = {
  title: "Plan Your Visit",
  description:
    "Plan your visit to MGM Science Centre. Find opening hours, directions, parking, dining, accessibility, and FAQs. Open 9:30 AM - 5:30 PM, closed Mondays.",
};

export default function PlanVisitPage() {
  return <PlanVisitClient />;
}

