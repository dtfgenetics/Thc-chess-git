import GameAuthWrapper from "@/components/game/GameAuthWrapper";
import { APP_NAME, SITE_URL } from "@/config";
import { fetchActiveGame } from "@/lib/game";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { code: string } }) {
  const game = await fetchActiveGame(params.code);
  if (!game) {
    return {
      description: "Match not found",
      robots: {
        index: false,
        follow: false,
        nocache: true,
        noarchive: true
      }
    };
  }
  return {
    title: `${APP_NAME} Match`,
    description: `Play or watch a Kush Kings Chess match with ${game.host?.name}`,
    openGraph: {
      title: APP_NAME,
      description: `Play or watch a Kush Kings Chess match with ${game.host?.name}`,
      url: `${SITE_URL.replace(/\/$/, "")}/${game.code}`,
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

export default async function Game({ params }: { params: { code: string } }) {
  const game = await fetchActiveGame(params.code);
  if (!game) {
    notFound();
  }

  return <GameAuthWrapper initialLobby={game} />;
}
