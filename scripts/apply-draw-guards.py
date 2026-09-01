from pathlib import Path

path = Path("server/src/socket/game.socket.ts")
text = path.read_text(encoding="utf-8")
text = text.replace('import { resolveResignationWinner } from "./gameResult.js";', 'import { canOfferDraw, canRespondToDraw, resolveResignationWinner } from "./gameResult.js";', 1)
text = text.replace('''    const userId = this.request.session.user.id;\n    if (userId !== game.white.id && userId !== game.black.id) {\n        console.log(`offerDraw: session user is not seated in the active game.`);\n        return;\n    }\n    if (game.drawOfferFrom === userId) return;\n''', '''    const userId = this.request.session.user.id;\n    if (!canOfferDraw(game, userId)) {\n        console.log(`offerDraw: invalid player or an offer is already pending.`);\n        return;\n    }\n''', 1)
text = text.replace('''    const userId = this.request.session.user.id;\n    if (userId !== game.white.id && userId !== game.black.id) {\n        console.log(`respondToDraw: session user is not seated in the active game.`);\n        return;\n    }\n    if (game.drawOfferFrom === undefined || game.drawOfferFrom === userId) return;\n''', '''    const userId = this.request.session.user.id;\n    if (!canRespondToDraw(game, userId)) {\n        console.log(`respondToDraw: invalid responder or no opponent offer is pending.`);\n        return;\n    }\n''', 1)
path.write_text(text, encoding="utf-8")
print("draw guards wired")
