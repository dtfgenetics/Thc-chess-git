import ArchivedGame from "@/components/archive/ArchivedGame";
import { APP_NAME, SITE_URL } from "@/config";
import { fetchArchivedGame } from "@/lib/game";
import type { Game } from "@chessu/types";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { id: number } }) {
  const game = (await fetchArchivedGame({ id: params.id })) as Game | undefined;
  if (!game) {
    return {
      description: "Archived match not found",
      robots: {
        index: false,
        follow: false,
        nocache: true,
        noarchive: true
      }
    };
  }
  return {
    title: `${APP_NAME} Archive`,
    description: `Archived Kush Kings Chess match: ${game.white?.name} vs ${game.black?.name}`,
    openGraph: {
      title: `${APP_NAME} Archive`,
      description: `Archived Kush Kings Chess match: ${game.white?.name} vs ${game.black?.name}`,
      url: `${SITE_URL.replace(/\/$/, "")}/archive/${game.id}`,
      siteName: APP_NAME,
      locale: "en_US",
      type: "website"
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      noarchive: true
    }
  };
}

export default async function Archive({ params }: { params: { id: number } }) {
  const game = (await fetchArchivedGame({ id: params.id })) as Game | undefined;
  if (!game) {
    notFound();
  }

  return <ArchivedGame game={game} />;
}
