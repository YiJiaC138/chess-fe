import React, { useState, useRef } from "react";
import { ChessPiece, PieceType, Player } from "./chesspiece";
import Button from "./button";
import PanelLog, { MoveLogEntry } from "./PanelLog";
import ChessBoard from "./chessboard";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";
type MoveList = [number, number][];

interface GameState {
  pieces: ChessPiece[];
  playerTurn: Player;
  isCheckmate: boolean;
  isStalemate: boolean;
  isCheck: boolean;
}

const initialPieces: ChessPiece[] = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `${String.fromCharCode(97 + i)}2`,
    x: i,
    y: 6,
    type: "pawn" as PieceType,
    player: "white" as Player,
  })),
  { id: "a1", x: 0, y: 7, type: "rook", player: "white" },
  { id: "h1", x: 7, y: 7, type: "rook", player: "white" },
  { id: "b1", x: 1, y: 7, type: "knight", player: "white" },
  { id: "g1", x: 6, y: 7, type: "knight", player: "white" },
  { id: "c1", x: 2, y: 7, type: "bishop", player: "white" },
  { id: "f1", x: 5, y: 7, type: "bishop", player: "white" },
  { id: "d1", x: 3, y: 7, type: "queen", player: "white" },
  { id: "e1", x: 4, y: 7, type: "king", player: "white" },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `${String.fromCharCode(97 + i)}7`,
    x: i,
    y: 1,
    type: "pawn" as PieceType,
    player: "black" as Player,
  })),
  { id: "a8", x: 0, y: 0, type: "rook", player: "black" },
  { id: "h8", x: 7, y: 0, type: "rook", player: "black" },
  { id: "b8", x: 1, y: 0, type: "knight", player: "black" },
  { id: "g8", x: 6, y: 0, type: "knight", player: "black" },
  { id: "c8", x: 2, y: 0, type: "bishop", player: "black" },
  { id: "f8", x: 5, y: 0, type: "bishop", player: "black" },
  { id: "d8", x: 3, y: 0, type: "queen", player: "black" },
  { id: "e8", x: 4, y: 0, type: "king", player: "black" },
];

function indexToSquare(xIndex: number, yIndex: number): string {
  const file = String.fromCharCode(97 + xIndex);
  const rank = (8 - yIndex).toString();
  return file + rank;
}

function pieceTypeToName(type: PieceType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const GameBoard: React.FC = () => {
  const [gameMode, setGameMode] = useState<"pvp" | "ai">("pvp");
  const [pieces, setPieces] = useState<ChessPiece[]>([...initialPieces]);
  const [availableMoves, setAvailableMoves] = useState<{ x: number; y: number }[]>([]);
  const [playerTurn, setPlayerTurn] = useState<Player>("white");
  const [isCheckmate, setIsCheckmate] = useState<boolean>(false);
  const [isStalemate, setIsStalemate] = useState<boolean>(false);
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<MoveLogEntry[]>([]);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const promotionResolveRef = useRef<((value: string) => void) | null>(null);

  async function getMoves(piece: ChessPiece): Promise<{ x: number; y: number }[]> {
    const currentSquare = indexToSquare(piece.x, piece.y);
    try {
      const res = await axios.get(`${API_URL}/legal_moves/${currentSquare}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.data) return [];
      const moves: MoveList = res.data;
      return moves.map((m) => ({ x: m[0], y: m[1] }));
    } catch {
      return [];
    }
  }

  function updateGameState(newState: GameState) {
    const newPieces: ChessPiece[] = newState.pieces.map((p: ChessPiece) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      type: p.type,
      player: p.player,
    }));
    setPieces(newPieces);
    setPlayerTurn(newState.playerTurn);
    setIsCheckmate(newState.isCheckmate);
    setIsStalemate(newState.isStalemate);
    setIsCheck(newState.isCheck);
    setIsGameOver(newState.isCheckmate || newState.isStalemate);
  }

  async function postStates(move: string, promotion?: string): Promise<boolean> {
    try {
      const payload = { move_uci: move, promotion: promotion || null };
      const res = await axios.post(`${API_URL}/move/`, payload);
      if (res.data.promotionNeeded) {
        const pieceChoice = await handlePromotion();
        return postStates(move, pieceChoice);
      }
      updateGameState(res.data);
      return true;
    } catch {
      return false;
    }
  }

  async function resetBoard() {
    try {
      await axios.post(`${API_URL}/reset`);
    } catch {
      console.log("Error resetting board");
    }
  }

  async function undoMove() {
    try {
      const res = await axios.post(`${API_URL}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      updateGameState(res.data);
    } catch {
      console.log("Error undoing move");
    }
  }

  async function setMode(mode: "pvp" | "ai") {
    setGameMode(mode);
    try {
      await axios.post(`${API_URL}/set_game_mode`, { mode });
    } catch {
      console.log("Error setting game mode");
    }
  }

  async function applyAiMove() {
    try {
      const res = await axios.post(`${API_URL}/ai_move`);
      updateGameState(res.data);
    } catch {
      console.log("Error applying AI move");
    }
  }

  const handlePromotion = (): Promise<string> => {
    setPromotionModalOpen(true);
    return new Promise<string>((resolve) => {
      promotionResolveRef.current = (value: string) => {
        promotionResolveRef.current = null;
        setPromotionModalOpen(false);
        resolve(value);
      };
    });
  };

  const choosePromotion = (piece: string) => {
    promotionResolveRef.current?.(piece);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    const piece = pieces.find((p) => p.id === id);
    if (!piece || piece.player !== playerTurn) return;
    e.dataTransfer.setData("PieceId", id);
    getMoves(piece).then(setAvailableMoves);
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData("PieceId");
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    const sourceSquare = indexToSquare(piece.x, piece.y);
    const targetSquare = indexToSquare(x, y);
    const capturedPiece = pieces.find((p) => p.x === x && p.y === y);
    postStates(`${sourceSquare}${targetSquare}`).then((result) => {
      setAvailableMoves([]);
      if (result) {
        setMoveHistory((prev) => [
          ...prev,
          {
            player: piece.player,
            pieceName: pieceTypeToName(piece.type),
            source: { x: piece.x, y: piece.y },
            target: { x, y },
            capturedPieceName: capturedPiece ? pieceTypeToName(capturedPiece.type) : undefined,
          },
        ]);
      }
      if (gameMode === "ai" && result) applyAiMove();
    });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleReset = () => {
    setPieces([...initialPieces]);
    setPlayerTurn("white");
    setMoveHistory([]);
    resetBoard();
  };

  const handleUndo = () => {
    setMoveHistory((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
    undoMove();
  };

  const setToPvp = () => {
    setMode("pvp");
    resetBoard();
  };

  const setToAi = () => {
    setMode("ai");
    resetBoard();
  };

  return (
    <div>
      {promotionModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => choosePromotion("q")}
        >
          <div
            style={{
              backgroundColor: "#2a2a2a",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: "#eee", marginBottom: "8px", fontSize: "18px" }}>
              Promote pawn to
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {(["q", "r", "b", "n"] as const).map((p) => (
                <Button
                  key={p}
                  text={{ q: "Queen", r: "Rook", b: "Bishop", n: "Knight" }[p]}
                  onClick={() => choosePromotion(p)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="turn">
        <h2>
          {isCheckmate
            ? `${playerTurn === "white" ? "Red" : "Blue"} wins by Checkmate!`
            : isStalemate
              ? "Stalemate!"
              : isCheck
                ? "Check!"
                : isGameOver
                  ? "Game Over!"
                  : ""}
        </h2>
        <h2>
          {isGameOver ? (
            "Game Over!"
          ) : (
            <span style={{ color: playerTurn === "white" ? "#89CFF0" : "#FFCCCB" }}>
              {playerTurn === "white" ? "Blue's Turn" : "Red's Turn"}
            </span>
          )}
        </h2>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
        <ChessBoard
          pieces={pieces}
          availableMoves={availableMoves}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        />
        <PanelLog history={moveHistory} />
      </div>
      <div style={{ marginTop: "12px" }}>
        <Button text="Reset" onClick={handleReset} />
        <Button text="Undo" onClick={handleUndo} />
        <div className="gamemode">
          <Button text="PvP" onClick={setToPvp} />
          <Button text="AI" onClick={setToAi} />
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
