# Responsibilities — Kush Kings Chess / THC Chess

This file defines who is responsible for what so the project does not drift.

## Project goal

Create a cannabis-themed online chess game using the existing `dotnize/chessu` codebase as the foundation.

The project should become a polished browser game for the THC – Teaching Healthy Cultivation / DTF games ecosystem. The final game should feel original, branded, and playable while keeping normal chess rules intact.

## Core rule preservation

These systems must remain stable unless a real bug is found:

- Standard chess legal moves
- Check and checkmate
- Stalemate
- Draw logic
- Castling
- En passant
- Pawn promotion
- Board flipping/orientation
- Multiplayer room creation
- Invite links
- Spectator mode
- Chat
- Game archive/replay behavior

## User responsibilities

The user approves:

- Final game name
- Final cannabis piece concepts
- Final visual style
- Final THC/DTF brand fit
- Deployment target
- Whether accounts, chat, stats, and archives stay enabled
- Final images/assets before release

The user does not need to manually manage low-level code unless reviewing a pull request or deployment step.

## ChatGPT responsibilities

ChatGPT is responsible for:

- Project architecture
- Repo review
- Task planning
- Documentation clarity
- QA checklists
- Identifying risk before implementation
- Reviewing whether changes match the game goal
- Turning rough direction into precise GitHub issues/branches/prompts
- Checking that copyright/license requirements are respected

ChatGPT should not claim a feature is complete unless the repo change exists and the verification status is clear.

## Claude responsibilities

Claude should be used for:

- Larger code edits
- Refactoring React components
- Adding theme files
- Replacing UI copy
- Creating placeholder SVGs
- Implementing asset slots
- Running local install/build/test commands when available
- Reporting changed files and errors clearly

Claude should work branch-by-branch, not as one giant uncontrolled edit.

## GitHub responsibilities

GitHub is the source of truth for:

- Code
- Branches
- Pull requests
- Issues
- Release notes
- QA results
- Deployment history

No important project decision should live only in chat.

## Branch discipline

Use focused branches:

- `docs/project-responsibilities` — documentation and project direction
- `audit/upstream-structure` — repo structure audit
- `fix/site-url-config` — remove hardcoded upstream domain links
- `feat/thc-brand-theme` — board/theme/UI color reskin
- `feat/cannabis-piece-assets` — custom piece artwork slots and placeholder assets
- `feat/branded-landing-page` — Kush Kings / THC landing page
- `fix/mobile-board-layout` — phone/tablet layout polish
- `release/kush-kings-v1` — final release branch

## First code risks to fix

1. Hardcoded `ches.su` invite/archive links must be replaced with configurable public site URL.
2. Browser document title still says `chessu` and should become `THC Chess` or `Kush Kings Chess`.
3. README and UI still contain upstream branding.
4. Board colors are default blue/cream and need THC theme colors.
5. Piece assets are default chess pieces and need a clean custom asset pipeline.
6. Deployment variables need to be documented before hosting.

## Safety and legality guardrails

Allowed:

- Original cannabis-themed piece art
- User-provided approved assets
- Custom SVG placeholders
- THC/Kush Kings original branding
- Open-source code used according to its license

Not allowed:

- chess.com assets
- Lichess assets unless license and obligations are explicitly reviewed
- Monopoly branding/assets
- Real cannabis company logos
- Copyrighted third-party character art
- Unlicensed downloadable icon packs

## Definition of done

A branch is done only when:

1. The goal of the branch is clear.
2. Changed files are documented.
3. The app still builds or the reason it cannot be built is documented.
4. Chess rules are not weakened.
5. Multiplayer behavior is not broken.
6. The change moves the project closer to a playable THC/Kush Kings release.
