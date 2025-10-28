import { Metadata } from "next";
import { ContactClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with MGM APJ Abdul Kalam Astrospace Science Centre. Contact us for inquiries, group bookings, or feedback. Call, email, or visit us in Aurangabad.",
};

export default function ContactPage() {
  return <ContactClient />;
}

