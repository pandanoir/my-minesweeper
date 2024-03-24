import type { MetaFunction } from '@remix-run/node';
import clsx from 'clsx';
import { produce } from 'immer';
import { useCallback, useMemo, useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'my Minesweeper' },
    { name: 'description', content: 'my minesweeper' },
  ];
};

// 初級：9×9のマスに10個の地雷（Windows Meまでのバージョンは8×8）
type Cell = { isOpen: boolean; hasFlag: boolean; hasMine: boolean };
type Map = Cell[][];

const getInitialMap = (): Map => {
  const map = [...Array(9)].map(() =>
    [...Array(9)].map(() => ({
      isOpen: false,
      hasFlag: false,
      hasMine: false,
    })),
  );
  for (let i = 0; i < 10; i++) {
    let row, col;
    do {
      row = Math.trunc(Math.random() * 9);
      col = Math.trunc(Math.random() * 9);
    } while (map[row][col].hasMine);
    map[row][col].hasMine = true;
  }
  return map;
};
const useMap = () => {
  const [map, setMap] = useState<Map>(() => getInitialMap());
  const mineCount = useMemo(() => {
    const mineCount = [...Array(9)].map(() => [...Array(9)].map(() => 0));
    for (let row = 0; row < mineCount.length; row++) {
      for (let col = 0; col < mineCount[row].length; col++) {
        for (let i = 0; i < 9; i++) {
          const dr = dx[i],
            dc = dy[i];
          const r = row + dr,
            c = col + dc;
          if (
            (dr === 0 && dc === 0) ||
            !(0 <= r && r < 9 && 0 <= c && c < 9) ||
            !map[r][c].hasMine
          ) {
            continue;
          }
          mineCount[row][col]++;
        }
      }
    }
    return mineCount;
  }, [map]);
  return {
    map,
    mineCount,
    openCell: useCallback(
      (row: number, col: number) => {
        setMap((map) =>
          produce(map, (draft) => {
            class Queue<T> {
              constructor(private queue: T[] = []) {}
              pop() {
                const val = this.queue.shift();
                if (typeof val === 'undefined') throw new Error();
                return val;
              }
              push(val: T) {
                this.queue.push(val);
              }
              isEmpty() {
                return this.queue.length === 0;
              }
            }
            const queue = new Queue<[number, number]>();
            queue.push([row, col]);
            while (!queue.isEmpty()) {
              const [row, col] = queue.pop();
              draft[row][col].isOpen = true;
              if (mineCount[row][col] === 0)
                for (let i = 0; i < 9; i++) {
                  const r = row + dx[i],
                    c = col + dy[i];
                  if (
                    (dx[i] === 0 && dy[i] === 0) ||
                    !(0 <= r && r < 9 && 0 <= c && c < 9) ||
                    draft[r][c].isOpen
                  )
                    continue;
                  queue.push([r, c]);
                }
            }
          }),
        );
      },
      [mineCount],
    ),
    toggleFlag: (row: number, col: number) => {
      setMap((map) =>
        produce(map, (draft) => {
          draft[row][col].hasFlag = !draft[row][col].hasFlag;
        }),
      );
    },
  };
};
type GameStatus = 'in progress' | 'won' | 'lose';
const dx = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
const dy = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
export default function Index() {
  const { map, mineCount, openCell, toggleFlag } = useMap();
  const [gameStatus, setGameStatus] = useState<GameStatus>('in progress');

  return (
    <div>
      <h1>my minesweeper</h1>
      <table className="border-collapse border">
        {map.map((row, rIndex) => (
          <tr key={rIndex}>
            {row.map((cell, cIndex) => (
              <td
                key={cIndex}
                className={clsx('w-10 h-10 text-center border', {
                  'bg-green-600': !cell.isOpen,
                })}
                onClick={() => {
                  if (gameStatus !== 'in progress') {
                    return;
                  }
                  if (cell.hasMine) {
                    setGameStatus('lose');
                  }
                  openCell(rIndex, cIndex);
                }}
                onContextMenu={(e) => {
                  if (e.type !== 'contextmenu') {
                    return;
                  }
                  e.preventDefault();
                  toggleFlag(rIndex, cIndex);
                }}
              >
                {cell.hasFlag && 'flag'}
                {cell.isOpen && `${mineCount[rIndex][cIndex]}`}
              </td>
            ))}
          </tr>
        ))}
      </table>
      {gameStatus === 'lose' && 'you lose'}
    </div>
  );
}
