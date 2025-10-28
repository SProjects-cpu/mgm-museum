import { Metadata } from "next";
import { ExhibitionsManagement } from "./exhibitions-management-api";

export const metadata: Metadata = {
  title: "Exhibitions Management",
};

export default function ExhibitionsPage() {
  return <ExhibitionsManagement />;
}


