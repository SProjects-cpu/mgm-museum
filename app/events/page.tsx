import { Metadata } from "next";
import { EventsClient } from "./events-client";

export const metadata: Metadata = {
  title: "Events & Workshops",
  description:
    "Discover upcoming events, workshops, and special programs at MGM Science Centre. Join us for science exhibitions, astronomy nights, educational workshops, and more in Aurangabad.",
};

export default function EventsPage() {
  return <EventsClient />;
}


