"use client";
// TODO: restructure, i could use some help with this :>

import {
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconPlayerSkipBack,
  IconPlayerSkipForward
} from "@tabler/icons-react";

import type { FormEvent, KeyboardEvent } from "react";

import { SessionContext } from "@/context/session";
import { useContext, useEffect, useReducer, useRef, useState } from "react";

import type { Message } from "@/types";
import type { Game } from "@chessu/types";

import type { Move, Square } from "chess.js";
import { Chess } from "chess.js";
import type { ClearPremoves } from "react-chessboard";
import { Chessboard } from "react-chessboard";

import { API_URL, APP_NAME, SITE_URL } from "@/config";
import { KUSH_BOARD_THEME, KUSH_COPY, KUSH_PIECE_ASSETS } from "@/kushTheme";
import { io } from "socket.io-client";

import { lobbyReducer, squareReducer } from "./reducers";
import { initSocket, type SocketConnectionState } from "./socketEvents";
import { syncPgn, syncSide } from "./utils";
import CapturedPieces from "./CapturedPieces";
import PromotionPicker from "./PromotionPicker";
import ThreeChessBoard from "./ThreeChessBoard";

const socket = io(API_URL, { withCredentials: true, autoConnect: false });

type PromotionPiece = "q" | "r" | "b" | "n";

export default function GamePage({ initialLobby }: { initialLobby: Game }) {
  const session = useContext(SessionContext);

  const [lobby, updateLobby] = useReducer(lobbyReducer, {
    ...initialLobby,
    actualGame: new Chess(),
    side: "s"
  });

  const [customSquares, updateCustomSquares] = useReducer(squareReducer, {
    options: {},
    lastMove: {},
    rightClicked: {},
    check: {}
  });

  const [moveFrom, setMoveFrom] = useState<string | Square | null>(null);
  const [boardWidth, setBoardWidth] = useState(480);
  const [boardMode, setBoardMode] = useState<"3d" | "2d">("3d");
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [connectionState, setConnectionState] = useState<SocketConnectionState>("connecting");
  const chessboardRef = useRef<ClearPremoves>(null);

  const [navFen, setNavFen] = useState<string | null>(null);
  const [navIndex, setNavIndex] = useState<number | null>(null);

  const [playBtnLoading, setPlayBtnLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      author: {},
      message: `Welcome to the grow room. Share the invite link to bring in another grower or spectators.`
    }
  ]);
  const chatListRef = useRef<HTMLUListElement>(null);
  const moveListRef = useRef<HTMLDivElement>(null);

  const customPieces = Object.fromEntries(
    Object.entries(KUSH_PIECE_ASSETS).map(([piece, imageUrl]) => [
      piece,
      ({ squareWidth }: { squareWidth: number }) => (
        <div
          aria-label={piece}
          className="kush-piece"
          role="img"
          style={{
            width: squareWidth,
            height: squareWidth,
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain"
          }}
        />
      )
    ])
  );

  const [abandonSeconds, setAbandonSeconds] = useState(60);
  useEffect(() => {
    if (
      lobby.side === "s" ||
      lobby.endReason ||
      lobby.winner ||
      !lobby.pgn ||
      !lobby.white ||
      !lobby.black ||
      (lobby.white.id !== session?.user?.id && lobby.black.id !== session?.user?.id)
    )
      return;

    let interval: number;
    if (!lobby.white?.connected || !lobby.black?.connected) {
      setAbandonSeconds(60);
      interval = Number(
        setInterval(() => {
          if (abandonSeconds === 0 || (lobby.white?.connected && lobby.black?.connected)) {
            clearInterval(interval);
            return;
          }
          setAbandonSeconds((s) => s - 1);
        }, 1000)
      );
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobby.black, lobby.white, lobby.black?.disconnectedOn, lobby.white?.disconnectedOn]);

  useEffect(() => {
    if (!session?.user || !session.user?.id) return;
    setConnectionState("connecting");
    socket.connect();

    window.addEventListener("resize", handleResize);
    handleResize();

    if (lobby.pgn && lobby.actualGame.pgn() !== lobby.pgn) {
      syncPgn(lobby.pgn, lobby, { updateCustomSquares, setNavFen, setNavIndex });
    }

    syncSide(session.user, undefined, lobby, { updateLobby });

    initSocket(session.user, socket, lobby, {
      updateLobby,
      addMessage,
      updateCustomSquares,
      makeMove,
      setNavFen,
      setNavIndex,
      setConnectionState,
      setPlayBtnLoading
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.removeAllListeners();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto scroll down when new message is added
  useEffect(() => {
    const chatList = chatListRef.current;
    if (!chatList) return;
    chatList.scrollTop = chatList.scrollHeight;
  }, [chatMessages]);

  // auto scroll for moves
  useEffect(() => {
    const activeMoveEl = document.getElementById("activeNavMove");
    const moveList = moveListRef.current;
    if (!activeMoveEl || !moveList) return;
    moveList.scrollTop = activeMoveEl.offsetTop;
  });

  useEffect(() => {
    updateTurnTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobby]);

  function updateTurnTitle() {
    if (lobby.side === "s" || !lobby.white?.id || !lobby.black?.id) return;

    if (!lobby.endReason && lobby.side === lobby.actualGame.turn()) {
      document.title = `(your turn) ${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }
  }

  function handleResize() {
    if (window.innerWidth >= 1920) {
      setBoardWidth(580);
    } else if (window.innerWidth >= 1536) {
      setBoardWidth(540);
    } else if (window.innerWidth >= 768) {
      setBoardWidth(480);
    } else {
      setBoardWidth(Math.min(350, Math.max(240, window.innerWidth - 24)));
    }
  }

  function addMessage(message: Message) {
    setChatMessages((prev) => [...prev, message]);
  }

  function sendChat(message: string) {
    if (!session?.user) return;

    socket.emit("chat", message);
    addMessage({ author: session.user, message });
  }

  function chatKeyUp(e: KeyboardEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.key === "Enter") {
      const input = e.target as HTMLInputElement;
      if (!input.value || input.value.length == 0) return;
      sendChat(input.value);
      input.value = "";
    }
  }

  function chatClickSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = e.target as HTMLFormElement;
    const input = target.elements.namedItem("chatInput") as HTMLInputElement;
    if (!input.value || input.value.length == 0) return;
    sendChat(input.value);
    input.value = "";
  }

  function makeMove(m: { from: string; to: string; promotion?: string }) {
    try {
      const result = lobby.actualGame.move(m);

      if (result) {
        setNavFen(null);
        setNavIndex(null);
        updateLobby({
          type: "updateLobby",
          payload: { pgn: lobby.actualGame.pgn() }
        });
        updateTurnTitle();
        let kingSquare = undefined;
        if (lobby.actualGame.inCheck()) {
          const kingPos = lobby.actualGame.board().reduce((acc, row, index) => {
            const squareIndex = row.findIndex(
              (square) => square && square.type === "k" && square.color === lobby.actualGame.turn()
            );
            return squareIndex >= 0 ? `${String.fromCharCode(squareIndex + 97)}${8 - index}` : acc;
          }, "");
          kingSquare = {
            [kingPos]: {
              background: `radial-gradient(${KUSH_BOARD_THEME.checkWarning}, transparent 70%)`,
              borderRadius: "50%"
            }
          };
        }
        updateCustomSquares({
          lastMove: {
            [result.from]: { background: KUSH_BOARD_THEME.moveHighlight },
            [result.to]: { background: KUSH_BOARD_THEME.moveHighlight }
          },
          options: {},
          check: kingSquare
        });
        return true;
      } else {
        throw new Error("Invalid move");
      }
    } catch (err) {
      updateCustomSquares({
        options: {}
      });
      return false;
    }
  }

  function isDraggablePiece({ piece }: { piece: string }) {
    return piece.startsWith(lobby.side) && !lobby.endReason && !lobby.winner;
  }

  function needsPromotion(from: Square, to: Square) {
    const piece = lobby.actualGame.get(from);
    if (!piece || piece.type !== "p") return false;
    const moves = lobby.actualGame.moves({ square: from, verbose: true }) as Move[];
    return moves.some((move) => move.to === to && Boolean(move.promotion));
  }

  function sendMove(from: Square, to: Square, promotion?: PromotionPiece) {
    const moveDetails = { from, to, ...(promotion ? { promotion } : {}) };
    const move = makeMove(moveDetails);
    if (!move) return false;
    setMoveFrom(null);
    socket.emit("sendMove", moveDetails);
    return true;
  }

  function attemptMove(from: Square, to: Square) {
    if (needsPromotion(from, to)) {
      setPendingPromotion({ from, to });
      updateCustomSquares({ options: {} });
      return "promotion" as const;
    }
    return sendMove(from, to);
  }

  function choosePromotion(piece: PromotionPiece) {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    setPendingPromotion(null);
    sendMove(from, to, piece);
  }

  function cancelPromotion() {
    setPendingPromotion(null);
    setMoveFrom(null);
    updateCustomSquares({ options: {} });
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    if (lobby.side === "s" || navFen || lobby.endReason || lobby.winner) return false;

    // premove
    if (lobby.side !== lobby.actualGame.turn()) return true;

    const result = attemptMove(sourceSquare, targetSquare);
    if (result === "promotion") return false;
    return result;
  }

  function getMoveOptions(square: Square) {
    const moves = lobby.actualGame.moves({
      square,
      verbose: true
    }) as Move[];
    if (moves.length === 0) {
      return;
    }

    const newSquares: {
      [square: string]: { background: string; borderRadius?: string };
    } = {};
    moves.map((move) => {
      newSquares[move.to] = {
        background:
          lobby.actualGame.get(move.to as Square) &&
          lobby.actualGame.get(move.to as Square)?.color !== lobby.actualGame.get(square)?.color
            ? `radial-gradient(circle, ${KUSH_BOARD_THEME.legalMove} 85%, transparent 85%)`
            : `radial-gradient(circle, ${KUSH_BOARD_THEME.legalMove} 25%, transparent 25%)`,
        borderRadius: "50%"
      };
      return move;
    });
    newSquares[square] = {
      background: KUSH_BOARD_THEME.moveHighlight
    };
    updateCustomSquares({ options: newSquares });
  }

  function onPieceDragBegin(_piece: string, sourceSquare: Square) {
    if (lobby.side !== lobby.actualGame.turn() || navFen || lobby.endReason || lobby.winner) return;

    getMoveOptions(sourceSquare);
  }

  function onPieceDragEnd() {
    updateCustomSquares({ options: {} });
  }

  function onSquareClick(square: Square) {
    updateCustomSquares({ rightClicked: {} });
    if (lobby.side !== lobby.actualGame.turn() || navFen || lobby.endReason || lobby.winner) return;

    function resetFirstMove(square: Square) {
      setMoveFrom(square);
      getMoveOptions(square);
    }

    // from square
    if (moveFrom === null) {
      resetFirstMove(square);
      return;
    }

    const result = attemptMove(moveFrom as Square, square);
    if (result === false) {
      resetFirstMove(square);
    }
  }

  function onSquareRightClick(square: Square) {
    const colour = KUSH_BOARD_THEME.rightClickMarker;
    updateCustomSquares({
      rightClicked: {
        ...customSquares.rightClicked,
        [square]:
          customSquares.rightClicked[square] &&
          customSquares.rightClicked[square]?.backgroundColor === colour
            ? undefined
            : { backgroundColor: colour }
      }
    });
  }

  function clickPlay(e: FormEvent<HTMLButtonElement>) {
    setPlayBtnLoading(true);
    e.preventDefault();
    socket.emit("joinAsPlayer");
  }

  function getPlayerHtml(side: "top" | "bottom") {
    const blackHtml = (
      <div className="flex w-full flex-col justify-center">
        <a
          className={
            (lobby.black?.name ? "font-bold" : "") +
            (typeof lobby.black?.id === "number" ? " text-primary link-hover" : " cursor-default")
          }
          href={typeof lobby.black?.id === "number" ? `/user/${lobby.black?.name}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          {lobby.black?.name || "(open seat)"}
        </a>
        <span className="flex items-center gap-1 text-xs">
          dark side
          {lobby.black?.connected === false && (
            <span className="badge badge-xs badge-error">disconnected</span>
          )}
        </span>
      </div>
    );
    const whiteHtml = (
      <div className="flex w-full flex-col justify-center">
        <a
          className={
            (lobby.white?.name ? "font-bold" : "") +
            (typeof lobby.white?.id === "number" ? " text-primary link-hover" : " cursor-default")
          }
          href={typeof lobby.white?.id === "number" ? `/user/${lobby.white?.name}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          {lobby.white?.name || "(open seat)"}
        </a>
        <span className="flex items-center gap-1 text-xs">
          light side
          {lobby.white?.connected === false && (
            <span className="badge badge-xs badge-error">disconnected</span>
          )}
        </span>
      </div>
    );

    if (lobby.black?.id === session?.user?.id) {
      return side === "top" ? whiteHtml : blackHtml;
    } else {
      return side === "top" ? blackHtml : whiteHtml;
    }
  }

  function getGamePath() {
    return lobby.endReason ? `archive/${lobby.id}` : initialLobby.code;
  }

  function getGameUrl() {
    return `${SITE_URL.replace(/\/$/, "")}/${getGamePath()}`;
  }

  function getDisplayGameUrl() {
    return getGameUrl().replace(/^https?:\/\//, "");
  }

  function copyInvite() {
    const text = getGameUrl();
    if ("clipboard" in navigator) {
      navigator.clipboard.writeText(text);
    } else {
      document.execCommand("copy", true, text);
    }
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 5000);
  }

  function getMoveListHtml() {
    const history = lobby.actualGame.history({ verbose: true });
    const movePairs = history
      .slice(history.length / 2)
      .map((_, i) => history.slice((i *= 2), i + 2));

    return movePairs.map((moves, i) => {
      return (
        <tr className="flex w-full items-center gap-1" key={i + 1}>
          <td className="">{i + 1}.</td>
          <td
            className={
              "btn btn-ghost btn-xs h-full w-2/5 font-normal normal-case" +
              ((history.indexOf(moves[0]) === history.length - 1 && navIndex === null) ||
              navIndex === history.indexOf(moves[0])
                ? " btn-active pointer-events-none rounded-none"
                : "")
            }
            id={
              (history.indexOf(moves[0]) === history.length - 1 && navIndex === null) ||
              navIndex === history.indexOf(moves[0])
                ? "activeNavMove"
                : ""
            }
            onClick={() => navigateMove(history.indexOf(moves[0]))}
          >
            {moves[0].san}
          </td>
          {moves[1] && (
            <td
              className={
                "btn btn-ghost btn-xs h-full w-2/5 font-normal normal-case" +
                ((history.indexOf(moves[1]) === history.length - 1 && navIndex === null) ||
                navIndex === history.indexOf(moves[1])
                  ? " btn-active pointer-events-none rounded-none"
                  : "")
              }
              id={
                (history.indexOf(moves[1]) === history.length - 1 && navIndex === null) ||
                navIndex === history.indexOf(moves[1])
                  ? "activeNavMove"
                  : ""
              }
              onClick={() => navigateMove(history.indexOf(moves[1]))}
            >
              {moves[1].san}
            </td>
          )}
        </tr>
      );
    });
  }

  function navigateMove(index: number | null | "prev") {
    const history = lobby.actualGame.history({ verbose: true });

    if (index === null || (index !== "prev" && index >= history.length - 1) || !history.length) {
      // last move
      setNavIndex(null);
      setNavFen(null);
      return;
    }

    if (index === "prev") {
      index = history.length - 2;
    } else if (index < 0) {
      index = 0;
    }

    chessboardRef.current?.clearPremoves(false);

    setNavIndex(index);
    setNavFen(history[index].after);
  }

  function getNavMoveSquares() {
    if (navIndex === null) return;
    const history = lobby.actualGame.history({ verbose: true });

    if (!history.length) return;

    return {
      [history[navIndex].from]: { background: KUSH_BOARD_THEME.moveHighlight },
      [history[navIndex].to]: { background: KUSH_BOARD_THEME.moveHighlight }
    };
  }

  function claimAbandoned(type: "win" | "draw") {
    if (
      lobby.side === "s" ||
      lobby.endReason ||
      lobby.winner ||
      !lobby.pgn ||
      abandonSeconds > 0 ||
      (lobby.black?.connected && lobby.white?.connected)
    ) {
      return;
    }
    socket.emit("claimAbandoned", type);
  }

  return (
    <>
      {pendingPromotion && (
        <PromotionPicker color={lobby.actualGame.turn()} onChoose={choosePromotion} onCancel={cancelPromotion} />
      )}
      <div className="flex w-full flex-wrap justify-center gap-6 px-4 py-4 lg:gap-10 2xl:gap-16">
      <div className="relative h-min">
        {/* overlay */}
        {(!lobby.white?.id || !lobby.black?.id) && (
          <div className="absolute bottom-0 right-0 top-0 z-10 flex h-full w-full items-center justify-center bg-black bg-opacity-70">
            <div className="bg-base-200 flex w-full items-center justify-center gap-4 px-2 py-4">
              {KUSH_COPY.waitingForOpponent}
              {session?.user?.id !== lobby.white?.id && session?.user?.id !== lobby.black?.id && (
                <button
                  className={"btn btn-secondary" + (playBtnLoading ? " btn-disabled" : "")}
                  onClick={clickPlay}
                >
                  {lobby.white?.id ? KUSH_COPY.joinDarkSide : KUSH_COPY.joinLightSide}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-2 flex items-center justify-between gap-2" style={{ width: boardWidth }}>
          <div className="flex items-center gap-2 text-xs opacity-75">
            <span
              className={`badge badge-sm ${
                connectionState === "connected"
                  ? "badge-success"
                  : connectionState === "connecting"
                    ? "badge-warning"
                    : "badge-error"
              }`}
            >
              {connectionState === "connected"
                ? "online"
                : connectionState === "connecting"
                  ? "connecting"
                  : "reconnecting"}
            </span>
            <span>
              {boardMode === "3d" ? "Interactive grow-room board" : "2D compatibility board"}
            </span>
          </div>
          <div className="join">
            <button
              type="button"
              className={`btn join-item btn-xs ${boardMode === "3d" ? "btn-primary" : "btn-ghost"}`}
              aria-pressed={boardMode === "3d"}
              onClick={() => setBoardMode("3d")}
            >
              3D
            </button>
            <button
              type="button"
              className={`btn join-item btn-xs ${boardMode === "2d" ? "btn-primary" : "btn-ghost"}`}
              aria-pressed={boardMode === "2d"}
              onClick={() => setBoardMode("2d")}
            >
              2D
            </button>
          </div>
        </div>

        <div style={{ width: boardWidth, height: boardWidth }}>
          {boardMode === "3d" ? (
            <ThreeChessBoard
              fen={navFen || lobby.actualGame.fen()}
              orientation={lobby.side === "b" ? "black" : "white"}
              disabled={
                lobby.side === "s" ||
                !!navFen ||
                !!lobby.endReason ||
                !!lobby.winner ||
                lobby.side !== lobby.actualGame.turn()
              }
              selectedSquare={moveFrom ? String(moveFrom) : null}
              legalSquares={Object.keys(customSquares.options).filter((square) => square !== moveFrom)}
              lastMoveSquares={Object.keys(
                navIndex === null ? customSquares.lastMove : getNavMoveSquares() || {}
              )}
              checkSquares={Object.keys(navIndex === null ? customSquares.check : {})}
              markerSquares={Object.keys(customSquares.rightClicked)}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
            />
          ) : (
            <Chessboard
              boardWidth={boardWidth}
              customDarkSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.darkSquare }}
              customLightSquareStyle={{ backgroundColor: KUSH_BOARD_THEME.lightSquare }}
              customPieces={customPieces}
              position={navFen || lobby.actualGame.fen()}
              boardOrientation={lobby.side === "b" ? "black" : "white"}
              isDraggablePiece={isDraggablePiece}
              onPieceDragBegin={onPieceDragBegin}
              onPieceDragEnd={onPieceDragEnd}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
              arePremovesAllowed={!navFen}
              customSquareStyles={{
                ...(navIndex === null ? customSquares.lastMove : getNavMoveSquares()),
                ...(navIndex === null ? customSquares.check : {}),
                ...customSquares.rightClicked,
                ...(navIndex === null ? customSquares.options : {})
              }}
              ref={chessboardRef}
            />
          )}
        </div>
        <CapturedPieces
          history={
            navIndex === null
              ? (lobby.actualGame.history({ verbose: true }) as Move[])
              : (lobby.actualGame.history({ verbose: true }) as Move[]).slice(0, navIndex + 1)
          }
        />
      </div>

      <div className="flex max-w-lg flex-1 flex-col items-center justify-center gap-4">
        <div className="flex w-full flex-wrap items-center gap-2 px-2 text-xs">
          <span className="badge badge-outline">Room {initialLobby.code}</span>
          <span className="badge badge-outline">
            {lobby.side === "w" ? "Light player" : lobby.side === "b" ? "Dark player" : "Spectator"}
          </span>
          <span className="badge badge-outline">{lobby.observers?.length ?? 0} watching</span>
        </div>
        <div className="mb-auto flex w-full p-2">
          <div className="flex flex-1 flex-col items-center justify-between">
            {getPlayerHtml("top")}
            <div className="my-auto w-full text-sm">vs</div>
            {getPlayerHtml("bottom")}
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <div className="mb-2 flex w-full flex-col items-end gap-1">
              {lobby.endReason ? "Archived match link:" : "Invite another grower:"}
              <div
                className={
                  "dropdown dropdown-top dropdown-end" + (copiedLink ? " dropdown-open" : "")
                }
              >
                <label
                  tabIndex={0}
                  className="badge badge-md bg-base-300 text-base-content h-8 gap-1 font-mono text-xs sm:h-5 sm:text-sm"
                  onClick={copyInvite}
                >
                  <IconCopy size={16} />
                  {getDisplayGameUrl()}
                </label>
                <div tabIndex={0} className="dropdown-content badge badge-neutral text-xs shadow">
                  copied to clipboard
                </div>
              </div>
            </div>
            <div className="h-32 w-full overflow-y-scroll" ref={moveListRef}>
              <table className="table-compact table w-full">
                <tbody>{getMoveListHtml()}</tbody>
              </table>
            </div>
            <div className="flex h-4 w-full">
              <button
                className={
                  "btn btn-sm flex-grow rounded-r-none" +
                  (navIndex === 0 || lobby.actualGame.history().length <= 1 ? " btn-disabled" : "")
                }
                onClick={() => navigateMove(0)}
              >
                <IconPlayerSkipBack size={18} />
              </button>
              <button
                className={
                  "btn btn-sm flex-grow rounded-none" +
                  (navIndex === 0 || lobby.actualGame.history().length <= 1 ? " btn-disabled" : "")
                }
                onClick={() => navigateMove(navIndex === null ? "prev" : navIndex - 1)}
              >
                <IconChevronLeft size={18} />
              </button>
              <button
                className={
                  "btn btn-sm flex-grow rounded-none" + (navIndex === null ? " btn-disabled" : "")
                }
                onClick={() => navigateMove(navIndex === null ? null : navIndex + 1)}
              >
                <IconChevronRight size={18} />
              </button>
              <button
                className={
                  "btn btn-sm flex-grow rounded-l-none" + (navIndex === null ? " btn-disabled" : "")
                }
                onClick={() => navigateMove(null)}
              >
                <IconPlayerSkipForward size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative h-60 w-full min-w-fit">
          {(lobby.endReason ||
            (lobby.pgn &&
              lobby.white &&
              session?.user?.id === lobby.white?.id &&
              lobby.black &&
              !lobby.black?.connected) ||
            (lobby.pgn &&
              lobby.black &&
              session?.user?.id === lobby.black?.id &&
              lobby.white &&
              !lobby.white?.connected)) && (
            <div className="bg-neutral absolute w-full rounded-t-lg bg-opacity-95 p-2">
              {lobby.endReason ? (
                <div>
                  {lobby.endReason === "abandoned"
                    ? lobby.winner === "draw"
                      ? `The match ended in an even harvest due to abandonment.`
                      : `The match was won by ${lobby.winner} due to abandonment.`
                    : lobby.winner === "draw"
                      ? "The match ended in an even harvest."
                      : `Harvest complete by checkmate (${lobby.winner}).`} {" "}
                  <br />
                  You can review the archived match at {" "}
                  <a
                    className="link"
                    href={`/archive/${lobby.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getDisplayGameUrl()}
                  </a>
                  .
                </div>
              ) : abandonSeconds > 0 ? (
                `The other grower disconnected. You can claim the harvest or even harvest in ${abandonSeconds} second${
                  abandonSeconds > 1 ? "s" : ""
                }.`
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span>The other grower disconnected.</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => claimAbandoned("win")}
                      className="btn btn-sm btn-primary"
                    >
                      Claim Harvest
                    </button>
                    <button onClick={() => claimAbandoned("draw")} className="btn btn-sm btn-ghost">
                      Even Harvest
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="bg-base-300 flex h-full w-full min-w-[64px] flex-col rounded-lg p-4 shadow-sm">
            <ul
              className="mb-4 flex h-full flex-col gap-1 overflow-y-scroll break-words"
              ref={chatListRef}
            >
              {chatMessages.map((m, i) => (
                <li
                  className={
                    "max-w-[30rem]" +
                    (!m.author.id && (m.author.name === "server" || m.author.name === "Grow Room")
                      ? " bg-base-content text-base-300 p-2"
                      : "")
                  }
                  key={i}
                >
                  <span>
                    {m.author.id && (
                      <span>
                        <a
                          className={
                            "font-bold" +
                            (typeof m.author.id === "number"
                              ? " text-primary link-hover"
                              : " cursor-default")
                          }
                          href={
                            typeof m.author.id === "number" ? `/user/${m.author.name}` : undefined
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {m.author.name}
                        </a>
                        : {" "}
                      </span>
                    )}
                    <span>{m.message}</span>
                  </span>
                </li>
              ))}
            </ul>
            <form className="input-group mt-auto" onSubmit={chatClickSend}>
              <input
                type="text"
                placeholder="Grow room chat..."
                className="input input-bordered flex-grow"
                name="chatInput"
                id="chatInput"
                onKeyUp={chatKeyUp}
                required
              />
              <button className="btn btn-secondary ml-1" type="submit">
                Send
              </button>
            </form>
          </div>
        </div>
        {lobby.observers && lobby.observers.length > 0 && (
          <div className="w-full px-2 text-xs md:px-0">
            Watching: {lobby.observers?.map((o) => o.name).join(", ")}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
