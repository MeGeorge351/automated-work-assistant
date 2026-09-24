import { useEffect, useRef, useState } from "react";
import { Grid3X3, Brain, Zap, RotateCcw } from "lucide-react";
import { Card, CardHeader } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

// ---- Quick break games: lightweight mini-games for rest intervals ----

type GameId = "tictactoe" | "memory" | "reaction";

const GAMES: { id: GameId; label: string; icon: typeof Grid3X3 }[] = [
  { id: "tictactoe", label: "Tic-Tac-Toe", icon: Grid3X3 },
  { id: "memory", label: "Memory Match", icon: Brain },
  { id: "reaction", label: "Reaction Test", icon: Zap },
];

export function BreakGames() {
  const [game, setGame] = useState<GameId>("tictactoe");

  return (
    <Card>
      <CardHeader
        title="Break games"
        description="A quick mental reset for your break — pick a game and play a round."
      />
      <div className="px-5 py-5">
        <div className="mb-5 flex flex-wrap gap-2">
          {GAMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setGame(id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                game === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        {game === "tictactoe" && <TicTacToe key="ttt" />}
        {game === "memory" && <MemoryMatch key="mem" />}
        {game === "reaction" && <ReactionTest key="rxn" />}
      </div>
    </Card>
  );
}

// ---- Tic-Tac-Toe (you are X, simple computer plays O) ----

type Cell = "X" | "O" | null;

function winnerOf(board: Cell[]): Cell | "draw" {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? "draw" : null;
}

function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [status, setStatus] = useState<string>("Your move — you are X.");

  const reset = () => {
    setBoard(Array(9).fill(null));
    setStatus("Your move — you are X.");
  };

  const play = (i: number) => {
    if (board[i] || winnerOf(board)) return;
    const next = [...board];
    next[i] = "X";
    let result = winnerOf(next);
    if (!result) {
      // Computer: pick a random open cell.
      const open = next.map((c, idx) => (c ? -1 : idx)).filter((idx) => idx >= 0);
      if (open.length > 0) {
        next[open[Math.floor(Math.random() * open.length)]!] = "O";
        result = winnerOf(next);
      }
    }
    setBoard(next);
    setStatus(
      result === "X" ? "You win! Nice one." :
      result === "O" ? "The computer got you. Rematch?" :
      result === "draw" ? "It's a draw." :
      "Your move — you are X.",
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ""}`}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-secondary/50 text-2xl font-bold transition-colors hover:bg-secondary",
              cell === "X" && "text-primary",
              cell === "O" && "text-accent-foreground",
            )}
          >
            {cell}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{status}</p>
      <GameReset onClick={reset} />
    </div>
  );
}

// ---- Memory Match (flip cards to find emoji pairs) ----

const EMOJIS = ["🌿", "☕", "🌊", "🍃", "🌙", "☀️"];

interface MemCard {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function MemoryMatch() {
  const [cards, setCards] = useState<MemCard[]>(() =>
    shuffle([...EMOJIS, ...EMOJIS].map((emoji, id) => ({ id, emoji, flipped: false, matched: false }))),
  );
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const lockRef = useRef(false);

  const reset = () => {
    setCards(shuffle([...EMOJIS, ...EMOJIS].map((emoji, id) => ({ id, emoji, flipped: false, matched: false }))));
    setOpen([]);
    setMoves(0);
  };

  const flip = (id: number) => {
    if (lockRef.current) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const next = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(next);
    const newOpen = [...open, id];
    setOpen(newOpen);

    if (newOpen.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newOpen.map((oid) => next.find((c) => c.id === oid)!);
      if (a.emoji === b.emoji) {
        setCards((cs) => cs.map((c) => (newOpen.includes(c.id) ? { ...c, matched: true } : c)));
        setOpen([]);
      } else {
        lockRef.current = true;
        window.setTimeout(() => {
          setCards((cs) => cs.map((c) => (newOpen.includes(c.id) ? { ...c, flipped: false } : c)));
          setOpen([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  const done = cards.every((c) => c.matched);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            aria-label={card.flipped || card.matched ? `Card ${card.emoji}` : "Hidden card"}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-lg border text-2xl transition-colors",
              card.matched
                ? "border-accent bg-accent"
                : card.flipped
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:bg-secondary",
            )}
          >
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {done ? `All pairs found in ${moves} moves!` : `Moves: ${moves}`}
      </p>
      <GameReset onClick={reset} />
    </div>
  );
}

// ---- Reaction Test (wait for green, then click as fast as you can) ----

type RxnState = "idle" | "waiting" | "ready" | "result" | "tooSoon";

function ReactionTest() {
  const [state, setState] = useState<RxnState>("idle");
  const [ms, setMs] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const begin = () => {
    setState("waiting");
    timerRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setState("ready");
    }, 1500 + Math.random() * 2500);
  };

  const click = () => {
    if (state === "idle" || state === "result" || state === "tooSoon") {
      begin();
    } else if (state === "waiting") {
      window.clearTimeout(timerRef.current);
      setState("tooSoon");
    } else if (state === "ready") {
      const elapsed = Math.round(performance.now() - startRef.current);
      setMs(elapsed);
      setBest((b) => (b === null || elapsed < b ? elapsed : b));
      setState("result");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={click}
        className={cn(
          "flex h-40 w-full max-w-md items-center justify-center rounded-xl border px-6 text-center text-sm font-medium transition-colors",
          state === "ready"
            ? "border-accent bg-accent text-accent-foreground"
            : state === "waiting"
              ? "border-border bg-secondary text-muted-foreground"
              : "border-border bg-card text-foreground hover:bg-secondary",
        )}
      >
        {state === "idle" && "Click to start. Wait for the panel to turn green…"}
        {state === "waiting" && "Wait for green…"}
        {state === "ready" && "CLICK NOW!"}
        {state === "tooSoon" && "Too soon! Click to try again."}
        {state === "result" && `${ms} ms — click to go again.`}
      </button>
      <p className="text-sm text-muted-foreground">
        {best !== null ? `Your best: ${best} ms` : "Average human reaction is about 250 ms."}
      </p>
    </div>
  );
}

function GameReset({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      New round
    </button>
  );
}
