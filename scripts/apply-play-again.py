from pathlib import Path

game_path = Path("client/src/components/game/GamePage.tsx")
archive_path = Path("client/src/components/archive/ArchivedGame.tsx")

game = game_path.read_text(encoding="utf-8")
archive = archive_path.read_text(encoding="utf-8")

if 'href="/" className="btn btn-primary btn-sm mt-2"' not in game:
    anchor = '''                  </a>
                  .
                </div>
'''
    replacement = '''                  </a>
                  .
                  <div className="mt-2">
                    <a href="/" className="btn btn-primary btn-sm mt-2">
                      Play Again / New Match
                    </a>
                  </div>
                </div>
'''
    if anchor not in game:
        raise SystemExit("live archived result anchor not found")
    game = game.replace(anchor, replacement, 1)

if 'Play Again / New Match' not in archive:
    anchor = '''            <textarea
              className="textarea-bordered textarea h-full w-full resize-none rounded-tr-none font-mono text-xs leading-6"
'''
    replacement = '''            <div className="mb-2 flex justify-end">
              <a href="/" className="btn btn-primary btn-sm">
                Play Again / New Match
              </a>
            </div>
            <textarea
              className="textarea-bordered textarea h-full w-full resize-none rounded-tr-none font-mono text-xs leading-6"
'''
    if anchor not in archive:
        raise SystemExit("archive textarea anchor not found")
    archive = archive.replace(anchor, replacement, 1)

game_path.write_text(game, encoding="utf-8")
archive_path.write_text(archive, encoding="utf-8")
print("play again actions applied")
