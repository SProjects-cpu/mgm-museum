import { Metadata } from "next";
import { AboutClient } from "./about-client";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about MGM APJ Abdul Kalam Astrospace Science Centre - our mission to inspire scientific curiosity, our history, facilities, and educational programs in Aurangabad.",
};

export default function AboutPage() {
  return <AboutClient />;
}

