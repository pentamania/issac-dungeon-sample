/**
 * フロア一次元配列
 * @typedef {number[]} FloorPlan
 *
 * ビット演算
 * @typedef {0|1} Bit
 */

export const RoomEnum = {
  EMPTY: 0, // 進入不可・壁
  NORMAL: 1,
  BOSS: 2,
  REWARD: 3,
  SHOP: 4,
  SECRET: 5,
};
const floorplanLength = 100;
export const startRoomIdx = 45;

// 方向設定
export const Y_UNIT = 10;
const DIR_LEFT = -1;
const DIR_UP = -Y_UNIT;
const DIR_RIGHT = +1;
const DIR_DOWN = +Y_UNIT;
const directions = [DIR_LEFT, DIR_UP, DIR_RIGHT, DIR_DOWN]; // ←, ↑, →, ↓

// options
const GenerateOptions = {
  maxRoomNum: 15,
  minrooms: 7,
  /**
   * 0 ~ 1の数字を返す関数（Seed固定用）
   */
  random: Math.random,
};

/**
 * @param {Partial<typeof GenerateOptions>} [options]
 * @returns {FloorPlan}
 */
export function generateDungeon(options) {
  const optionsFulfilled = { ...GenerateOptions, ...options };
  const { maxRoomNum, minrooms, random } = optionsFulfilled;
  let floorplan = Array.from({ length: floorplanLength }, () => 0);
  let floorplanCount = 0;
  const cellQueue = [];
  const endrooms = [];

  /**
   * セルをチェックして部屋を生成
   * @param {number} i index
   * @returns {Bit} 部屋を生成したら1返す
   */
  const visit = (i) => {
    // すでに部屋がある
    if (isCellOccupied(floorplan, i)) return 0;

    // すでに隣接している部屋がある
    const neighbourRoomNum = ncount(floorplan, i);
    if (1 < neighbourRoomNum) return 0;

    // すでに部屋数が最大
    if (maxRoomNum <= floorplanCount) return 0;

    // 50%の確率で諦める (ただしスタート部屋は例外)
    if (random() < 0.5 && i != startRoomIdx) return 0;

    // チェック通過：部屋を配置＆キューに追加＆部屋数増やす
    cellQueue.push(i);
    floorplan[i] = RoomEnum["NORMAL"];
    floorplanCount += 1;
    return 1;
  };

  // 袋小路リストからランダムピックアップ&リストから削除
  const popRandomEndroom = () => {
    const index = Math.floor(random() * endrooms.length);
    const i = endrooms[index];
    endrooms.splice(index, 1);
    return i;
  };

  // フロア生成
  const setupFloorPlan = () => {
    // 初期化
    floorplan = Array.from({ length: floorplanLength }, () => 0);
    floorplanCount = 0;
    cellQueue.length = endrooms.length = 0;

    // 最初の部屋を配置 -> キューが続く限り隣接セルを次々visit
    visit(startRoomIdx);
    while (cellQueue.length > 0) {
      const i = cellQueue.shift();
      const x = i % 10;
      let created = 0;
      if (x > 1) created = created | visit(i - 1); // Left
      if (x < 9) created = created | visit(i + 1); // Right
      if (i > 20) created = created | visit(i - 10); // Up
      if (i < 70) created = created | visit(i + 10); // Down

      // 部屋を生成しなかった -> 袋小路リストに追加
      if (created === 0) endrooms.push(i);
    }
  };

  // 条件を満たすまで続ける
  {
    let bossRoomCellIdx;
    const validate = () => {
      if (floorplanCount < minrooms) return false;
      if (isNeighborOfStartRoom(bossRoomCellIdx)) return false;
      return true;
    };

    do {
      setupFloorPlan();

      // ボス部屋配置
      bossRoomCellIdx = endrooms.splice(endrooms.length - 1, 1)[0];
      floorplan[bossRoomCellIdx] = RoomEnum.BOSS;

      // 宝部屋配置
      floorplan[popRandomEndroom()] = RoomEnum.REWARD;

      // ショップ配置
      floorplan[popRandomEndroom()] = RoomEnum.SHOP;

      // 秘密部屋 配置
      floorplan[pickSecretRoom(floorplan, bossRoomCellIdx, random)] =
        RoomEnum.SECRET;
    } while (validate() === false);
  }

  return floorplan;
}

/**
 * 前後左右セル数値の合計(=> 部屋になってる隣接セルの数)
 * 最低値は1（通り道の直前セルは必ず部屋のはず）
 *
 * @param {FloorPlan} floorplanRef
 * @param {number} i 対象セルidx
 * @returns {number}
 */
function ncount(floorplanRef, i) {
  return directions.reduce((pre, cur) => {
    // 何らかの部屋なら1、そうでなければ0
    const d = floorplanRef[i + cur] > 0 ? 1 : 0;
    return pre + d;
  }, 0);
}

// ボス部屋適性検査用
const isNeighborOfStartRoom = (() => {
  const _startRoomNeighbours = directions.map((v) => startRoomIdx + v);
  return (idx) => {
    return _startRoomNeighbours.find((neighbor) => idx === neighbor) != null;
  };
})();

/**
 * セルが部屋になってるかどうか
 * @param {FloorPlan} floorplanRef
 * @param {number} cellIdx 対象セルidx
 * @returns {boolean}
 */
function isCellOccupied(floorplanRef, cellIdx) {
  return floorplanRef[cellIdx] !== RoomEnum["EMPTY"];
}

/**
 * 秘密部屋をランダム選択
 * 隣接部屋が多いセルほど選択されやすい
 *
 * @param {FloorPlan} floorplanRef
 * @param {number} bossl
 * @param {()=> number} rng 乱数生成関数
 * @returns {number} セルidx
 */
function pickSecretRoom(floorplanRef, bossl, rng) {
  for (let e = 0; e < 900; e++) {
    const x = Math.floor(rng() * 9) + 1;
    const y = Math.floor(rng() * 8) + 2;
    const i = y * Y_UNIT + x;

    // Skip created
    if (floorplanRef[i]) continue;

    // Skip Boss room neigbor
    if (
      bossl === i - DIR_LEFT ||
      bossl === i + DIR_RIGHT ||
      bossl === i + DIR_DOWN ||
      bossl === i - DIR_UP
    )
      continue;

    // 3+ rooms
    const neigborCnt = ncount(floorplanRef, i);
    if (neigborCnt >= 3) return i; // 隣接セルが3以上
    if (e > 300 && neigborCnt >= 2) return i;
    if (e > 600 && neigborCnt >= 1) return i;
  }
}
