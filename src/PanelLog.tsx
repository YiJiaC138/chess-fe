import React from "react";
import type { Player } from "./chesspiece";

export interface MoveLogEntry {
  player: Player;
  pieceName: string;
  source: { x: number; y: number };
  target: { x: number; y: number };
  capturedPieceName?: string;
}

interface PanelLogProps {
  history: MoveLogEntry[];
}

function formatSquare(x: number, y: number): string {
  const file = String.fromCharCode(97 + x);
  const rank = (8 - y).toString();
  return `${file}${rank}`;
}

const PanelLog: React.FC<PanelLogProps> = ({ history }) => {
  const colourLabel = (player: Player) => (player === "white" ? "Blue" : "Red");
  const colourStyle = (player: Player) =>
    player === "white" ? { color: "#1e3a5f" } : { color: "#8b0000" };

  return (
    <div
      style={{
        width: "220px",
        minHeight: "400px",
        maxHeight: "600px",
        border: "1px solid #8b7355",
        marginLeft: "20px",
        overflowY: "auto",
        backgroundColor: "#f5e0b7",
        display: "flex",
        flexDirection: "column",
        padding: "12px",
        color: "#2c1810",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", borderBottom: "1px solid #8b7355", paddingBottom: "8px" }}>
        Move History
      </h3>
      <ul style={{ listStyleType: "none", padding: 0, margin: 0, flex: 1 }}>
        {history.length === 0 ? (
          <li style={{ fontSize: "13px", color: "#6b5344" }}>No moves yet.</li>
        ) : (
          history.map((move, index) => (
            <li
              key={index}
              style={{
                borderBottom: "1px solid #c4a574",
                padding: "6px 0",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "4px",
              }}
            >
              <span style={{ marginRight: "4px", fontWeight: 600, color: "#5c4a3a" }}>
                {index + 1}.
              </span>
              <span style={{ ...colourStyle(move.player), fontWeight: 700 }}>
                {colourLabel(move.player)}
              </span>
              <span style={{ ...colourStyle(move.player), fontWeight: 600 }}>
                {move.pieceName}
              </span>
              <span style={{ color: "#5c4a3a" }}>
                {formatSquare(move.source.x, move.source.y)} → {formatSquare(move.target.x, move.target.y)}
              </span>
              {move.capturedPieceName && (
                <span style={{ fontSize: "12px", color: "#8b4513" }}>
                  (captures {move.capturedPieceName})
                </span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default PanelLog;
