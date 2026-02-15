import React from "react";
import { ChessPiece, RenderChessPiece } from "./chesspiece";

export interface ChessBoardProps {
  pieces: ChessPiece[];
  availableMoves: { x: number; y: number }[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, x: number, y: number) => void;
  onDragOver: (e: React.DragEvent) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  pieces,
  availableMoves,
  onDragStart,
  onDrop,
  onDragOver,
}) => {
  return (
    <div className="chessboard">
      {Array.from({ length: 8 }).map((_, i) =>
        Array.from({ length: 8 }).map((_, j) => {
          const isBlack = (i + j) % 2 === 1;
          const piece = pieces.find((p) => p.x === j && p.y === i);
          const isAvailableMove = availableMoves.some((m) => m.x === j && m.y === i);
          const isCapture = isAvailableMove && !!piece;
          const isMoveOnly = isAvailableMove && !piece;
          return (
            <div
              key={`${j}-${i}`}
              className="square"
              style={{ backgroundColor: isBlack ? "black" : "white" }}
              onDrop={(e) => onDrop(e, j, i)}
              onDragOver={onDragOver}
            >
              {isMoveOnly && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 255, 0.35)",
                    pointerEvents: "none",
                  }}
                />
              )}
              {isCapture && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(255, 0, 0, 0.35)",
                    pointerEvents: "none",
                  }}
                />
              )}
              {piece && (
                <RenderChessPiece
                  id={piece.id}
                  type={piece.type}
                  player={piece.player}
                  onDragStart={onDragStart}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChessBoard;
