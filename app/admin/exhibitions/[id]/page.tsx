import { Metadata } from "next";
import { ExhibitionDetailManagement } from "./exhibition-detail-management";

export const metadata: Metadata = {
  title: "Exhibition Details Management",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExhibitionDetailPage({ params }: Props) {
  const { id } = await params;
  return <ExhibitionDetailManagement exhibitionId={id} />;
}
