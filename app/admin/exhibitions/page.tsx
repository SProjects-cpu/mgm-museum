import { Metadata } from "next";
import { AdminExhibitionsTable } from "@/components/admin-exhibitions-table";

export const metadata: Metadata = {
  title: "Exhibitions Management",
};

export default function ExhibitionsPage() {
  return <AdminExhibitionsTable />;
}


