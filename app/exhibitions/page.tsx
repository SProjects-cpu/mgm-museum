import { Metadata } from "next";
import { ExhibitionsClient } from "./exhibitions-client";

export const metadata: Metadata = {
  title: "Exhibitions",
  description:
    "Explore our interactive science exhibitions including Planetarium, Astro Gallery, 3D Theatre, Holography, Math Lab, Physics Lab, and more at MGM Science Centre.",
};

export default function ExhibitionsPage() {
  return <ExhibitionsClient />;
}

