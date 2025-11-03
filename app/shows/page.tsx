import { Metadata } from "next";
import { ShowsClient } from "./shows-client";

export const metadata: Metadata = {
  title: "Planetarium Shows",
  description:
    "Experience breathtaking planetarium shows at MGM Science Centre. Book your seats for Full Dome Digital shows, 3D Theatre presentations, and Holography experiences in Aurangabad.",
};

export default function ShowsPage() {
  return <ShowsClient />;
}


