import { RoomEnum, Y_UNIT, generateDungeon, startRoomIdx } from "./dungeon.js";

const cellSize = 24;
const CellColorMap = {
  [RoomEnum.EMPTY]: "black",
  [RoomEnum.NORMAL]: "white",
  [RoomEnum.BOSS]: "red",
  [RoomEnum.REWARD]: "gold",
  [RoomEnum.SHOP]: "blue",
  [RoomEnum.SECRET]: "gray",
};
// アイコン替わりの絵文字
const emojiIconSize = cellSize * 0.8;
const iconOffsetY = emojiIconSize;
const RoomTypeToEmoji = {
  [RoomEnum.BOSS]: "💀",
  [RoomEnum.REWARD]: "👑",
  [RoomEnum.SHOP]: "👛",
  [RoomEnum.SECRET]: "❓",
};

// render opts
const drawIcon = true;

/**
 * @param {HTMLCanvasElement} canvas
 */
export function Start(canvas) {
  /** @type {import("./dungeon.js").FloorPlan} */
  let dungeon;
  let drawIndexNumber = false;

  canvas.width = canvas.height = cellSize * Y_UNIT;
  const ctx = canvas.getContext("2d");
  ctx.font = `${emojiIconSize}px ""`;

  const render = () => {
    // console.table(dungeon);
    dungeon.forEach((roomType, i) => {
      const x = (i % Y_UNIT) * cellSize;
      const y = Math.floor(i / Y_UNIT) * cellSize;
      ctx.fillStyle = CellColorMap[roomType];
      ctx.fillRect(x, y, cellSize, cellSize);

      if (drawIcon) {
        ctx.font = `${emojiIconSize}px ""`;
        if (RoomTypeToEmoji[roomType]) {
          ctx.fillText(`${RoomTypeToEmoji[roomType]}`, x, y + iconOffsetY);
        }

        // player
        if (i === startRoomIdx) {
          ctx.fillText(`🤠`, x, y + iconOffsetY);
        }
      }

      if (drawIndexNumber) {
        ctx.fillStyle = "green";
        ctx.font = `${20}px "impact"`;
        ctx.fillText(`${roomType}`, x + 8, y + iconOffsetY);
      }
    });
  };

  // onclickなどで実行
  const reset = () => {
    dungeon = generateDungeon();
    render();
  };

  // DOMセットアップ
  const panel = document.getElementById("control-panel");
  {
    const btn = document.createElement("button");
    btn.innerText = "再生成";
    btn.addEventListener("click", reset);
    panel.append(btn);
  }
  {
    const _id = "indexdrawbtn";
    const container = document.createElement("span");
    const btn = document.createElement("input");
    const label = document.createElement("label");
    label.innerText = "インデックス値を表示";
    btn.id = label.htmlFor = _id;
    btn.checked = drawIndexNumber;
    btn.type = "checkbox";
    btn.addEventListener("click", () => {
      drawIndexNumber = !drawIndexNumber;
      btn.checked = drawIndexNumber;
      render();
    });
    container.append(btn, label);
    panel.append(container);
  }

  // init
  reset();
}
