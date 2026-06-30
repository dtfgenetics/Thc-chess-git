import CreateGame from "@/components/home/CreateGame";
import JoinGame from "@/components/home/JoinGame";
import PublicGames from "@/components/home/PublicGames/PublicGames";

export const revalidate = 0;

export default function Home() {
  return (
    <main className="flex w-full flex-col items-center gap-10 px-4 py-10">
      <section className="flex max-w-4xl flex-col items-center gap-4 text-center">
        <p className="rounded-full bg-base-300 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
          THC Chess
        </p>
        <h1 className="text-4xl font-black leading-tight md:text-6xl">Kush Kings Chess</h1>
        <p className="max-w-2xl text-base-content/80 md:text-lg">
          Strategy on a Higher Level. Play classic chess in a cleaner cannabis-themed arena built
          for THC - Teaching Healthy Cultivation.
        </p>
      </section>

      <div className="flex w-full flex-wrap items-center justify-center gap-8 lg:gap-16">
        <PublicGames />

        <div className="flex flex-col items-center gap-4 rounded-2xl bg-base-200 p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <h2 className="mb-2 text-xl font-bold leading-tight">Join Session</h2>
            <p className="mb-4 max-w-xs text-center text-sm text-base-content/70">
              Enter an invite code from another grower.
            </p>
            <JoinGame />
          </div>

          <div className="divider divider-vertical">or</div>

          <div className="flex flex-col items-center">
            <h2 className="mb-2 text-xl font-bold leading-tight">Start Match</h2>
            <p className="mb-4 max-w-xs text-center text-sm text-base-content/70">
              Create a new board and share the invite link.
            </p>
            <CreateGame />
          </div>
        </div>
      </div>
    </main>
  );
}
