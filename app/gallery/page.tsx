import { Metadata } from "next";
import { GalleryClient } from "./gallery-client";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Explore our photo gallery showcasing exhibitions, events, workshops, and visitor experiences at MGM APJ Abdul Kalam Astrospace Science Centre in Aurangabad.",
};

export default function GalleryPage() {
  return <GalleryClient />;
}


