import "./styles.css";
import WinningScreen from "./components/WinningScreen";
import Box from "./components/Box";
import { useState, useEffect } from "react";

const players = ["x", "o"];

function setValueToLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getValueFromLS(key) {
  const value = localStorage.getItem(key);

  if (value !== null || value !== undefined) {
    return JSON.parse(value);
  }

  return null;
}

function checkEquality(arr1, arr2) {
  let count = 0;

  if (
    arr1 !== undefined &&
    arr2 !== undefined &&
    arr1.length > 0 &&
    arr2.length > 0
  ) {
    arr1.map((val, ind) => val !== arr2[ind] && count++);
  }
  return count;
}

function handleBoardUpadteInLS(newUpdate) {
  const boardStatusInLS = getValueFromLS("boardStepWise") || [];
  const lastUpdate = boardStatusInLS[boardStatusInLS.length - 1];

  const count = checkEquality(lastUpdate, newUpdate);
  if (count > 0) {
    const newBoard = [...boardStatusInLS, newUpdate];

    setValueToLS("boardStepWise", newBoard);
  }

  boardStatusInLS.length === 0 && setValueToLS("boardStepWise", [newUpdate]);
}

const useBoardState = () => {
  const [board, setBoard] = useState(
    getValueFromLS("boardStatus") || Array(9).fill("")
  );
  const setMark = ({ index, mark }) => {
    setBoard((oldBoard) => {
      const oldBoardCopy = [...oldBoard];

      if (oldBoardCopy[index] === "") {
        oldBoardCopy[index] = mark;
        setValueToLS("boardStatus", oldBoardCopy);

        return oldBoardCopy;
      }

      return oldBoard;
    });
  };

  const updateBoard = (newBoard) => {
    setBoard(newBoard);
    setValueToLS("boardStatus", newBoard);
  };

  return [board, setMark, updateBoard];
};

const usePlayerState = () => {
  const defaultPlayer = players[0];
  const [currentPlayer, setCurrentPlayer] = useState(
    getValueFromLS("currentPlayer") || defaultPlayer
  );
  const activePlayers = players.reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: true
    }),
    {}
  );

  const setPlayer = ({ resetPlayer = false, player } = {}) => {
    setCurrentPlayer((prevPlayer) => {
      if (resetPlayer === true) {
        return defaultPlayer;
      }

      if (activePlayers[player] === true) {
        return player;
      } else if (player !== undefined) {
        return prevPlayer;
      }

      if (prevPlayer === players[1]) {
        return defaultPlayer;
      }

      return players[1];
    });

    const board = getValueFromLS("boardStatus");

    if (board.join("").length === 0 || board.join("").length % 2 === 0) {
      setValueToLS("currentPlayer", players[0]);
    } else {
      setValueToLS("currentPlayer", players[1]);
    }
  };

  return {
    currentPlayer: getValueFromLS("currentPlayer") || defaultPlayer,
    setPlayer
  };
};

const usePlayersCount = () => {
  const initialState = players.reduce(
    (prev, curr) => ({
      ...prev,
      [curr]: 0
    }),
    {}
  );
  const [playersCount, setPlayersCount] = useState(initialState);

  const updatePlayerCount = (player) => {
    const newCount = playersCount[player] + 1;

    setPlayersCount({
      ...playersCount,
      [player]: newCount
    });
    setValueToLS(`${player}Count`, newCount);
  };

  const resetCount = () => {
    setPlayersCount(initialState);
    setValueToLS("xCount", 0);
    setValueToLS("cCount", 0);
  };

  return {
    xCount: getValueFromLS("xCount") || 0,
    oCount: getValueFromLS("oCount") || 0,
    updatePlayerCount,
    resetCount
  };
};

const getWinner = (board) => {
  const winningCondition = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 4, 8],
    [2, 4, 6],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8]
  ];

  for (const winningPattern of winningCondition) {
    if (
      board[winningPattern[0]] !== "" &&
      board[winningPattern[0]] === board[winningPattern[1]] &&
      board[winningPattern[1]] === board[winningPattern[2]]
    ) {
      return true;
    }
  }
};

const handleUndo = (updateBoard, setPlayer) => {
  const oldBoardSteps = getValueFromLS("boardStepWise");
  const newBoard = oldBoardSteps[oldBoardSteps.length - 2];
  const newBoardSteps = oldBoardSteps.slice(0, oldBoardSteps.length - 2);

  updateBoard(newBoard && newBoard.length > 0 ? newBoard : Array(9).fill(""));
  setValueToLS("boardStepWise", newBoardSteps);
  setPlayer();
};

export default function App() {
  const [board, setMark, updateBoard] = useBoardState();
  const { currentPlayer, setPlayer } = usePlayerState();
  const [winner, setWinner] = useState(null);
  const { xCount, oCount, updatePlayerCount, resetCount } = usePlayersCount();

  useEffect(() => {
    const joined = board.join("");

    if (joined === "") {
      return;
    }

    const isWinner = getWinner(board);

    if (isWinner === true) {
      setWinner(currentPlayer);
      updatePlayerCount(currentPlayer);
    }

    setPlayer();
    handleBoardUpadteInLS(board);
  }, [board]);

  const handleBoxClick = (index) => () =>
    setMark({ index, mark: currentPlayer });

  const restart = () => {
    setWinner(null);
    updateBoard(Array(9).fill(""));
    setPlayer({ resetPlayer: true });
    setValueToLS("boardStepWise", []);
  };

  const handleReset = () => resetCount();

  return (
    <div className="parent">
      <div className="scoreBoard">
        <p className="scores">
          X-total: {xCount} &nbsp; &nbsp;O-total: {oCount}
        </p>
        <button className="reset" onClick={handleReset}>
          Reset Scores
        </button>
        <button
          className="undo"
          onClick={() => handleUndo(updateBoard, setPlayer)}
        >
          UNDO
        </button>
      </div>
      <div className="board">
        {board.map((mark, index) => (
          <Box
            className="child"
            key={index}
            mark={mark}
            onClick={handleBoxClick(index)}
          />
        ))}
      </div>
      <div className="activePlayer">
        <p>{currentPlayer}'s turn</p>
      </div>
      {winner !== null && (
        <div className="resultScreen">
          <WinningScreen mark={winner} className="resultStatus" />
          <button className="restart" onClick={restart}>
            Play Again!
          </button>
        </div>
      )}
      {winner === null && board.join("").length === 9 && (
        <div className="resultScreen">
          <p className="resultStatus">oops... Its a draw</p>
          <button className="restart" onClick={restart}>
            Play Again!
          </button>
        </div>
      )}
    </div>
  );
}
