import CreateGame from "@/components/home/CreateGame";
import JoinGame from "@/components/home/JoinGame";
import PublicGames from "@/components/home/PublicGames/PublicGames";

export const revalidate = 0;

export default function Home() {
  return (
    <main className="kush-home-shell">
      <section className="kush-home-hero" aria-labelledby="kush-home-title">
        <div className="kush-home-copy">
          <p className="kush-home-eyebrow">DTF GAMES · LIVE MULTIPLAYER CHESS</p>
          <h1 id="kush-home-title">
            KUSH KINGS <span>CHESS</span>
          </h1>
          <p className="kush-home-lede">
            Classic chess in a cannabis-themed grow-room arena. Open a private board, share the room
            code, switch between 3D and 2D play, and battle from any modern browser.
          </p>
          <div className="kush-home-features" aria-label="Kush Kings features">
            <span><strong>2D + 3D</strong> board modes</span>
            <span><strong>Live</strong> invite rooms</span>
            <span><strong>Watch</strong> as spectator</span>
            <span><strong>Review</strong> move history</span>
          </div>
          <div className="kush-home-rule" aria-hidden="true">
            <i></i><span>♔</span><i></i><span>♚</span><i></i>
          </div>
        </div>

        <aside className="kush-home-emblem" aria-label="Kush Kings match format">
          <div className="kush-crown-mark" aria-hidden="true">♔</div>
          <span>THE GROW ROOM</span>
          <strong>1 v 1</strong>
          <small>Private room · spectators welcome</small>
        </aside>
      </section>

      <section className="kush-lobby-layout" aria-label="Play Kush Kings Chess">
        <div className="kush-lobby-primary">
          <div className="kush-section-heading">
            <div>
              <p>OPEN BOARDS</p>
              <h2>Enter the arena</h2>
            </div>
            <span>Live rooms</span>
          </div>
          <PublicGames />
        </div>

        <div className="kush-lobby-actions">
          <section className="kush-action-card kush-action-card--join">
            <div className="kush-action-number">01</div>
            <p className="kush-action-kicker">Have a room code?</p>
            <h2>Join Session</h2>
            <p>Enter the invite code from another grower and take an open seat or watch the match.</p>
            <JoinGame />
          </section>

          <section className="kush-action-card kush-action-card--create">
            <div className="kush-action-number">02</div>
            <p className="kush-action-kicker">Start a fresh board</p>
            <h2>Create Match</h2>
            <p>Open a private board, choose your seat, then share the generated invite link.</p>
            <CreateGame />
          </section>
        </div>
      </section>

      <section className="kush-home-guide" aria-labelledby="kush-guide-title">
        <div>
          <p className="kush-home-eyebrow">MATCH FLOW</p>
          <h2 id="kush-guide-title">Create. Invite. Checkmate.</h2>
        </div>
        <ol>
          <li><span>01</span><strong>Open the room</strong><p>Create or join a six-character match.</p></li>
          <li><span>02</span><strong>Claim a side</strong><p>Light, dark, or spectator mode.</p></li>
          <li><span>03</span><strong>Play the board</strong><p>Legal moves, promotion, draw, resign, and reconnect.</p></li>
          <li><span>04</span><strong>Review the run</strong><p>Navigate move history and archived results.</p></li>
        </ol>
      </section>
    </main>
  );
}
