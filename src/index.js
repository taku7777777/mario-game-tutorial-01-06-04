// キーボードの入力状態を記録する配列の定義
var input_key_buffer = new Array();

// キーボードの入力イベントをトリガーに配列のフラグ値を更新させる
window.addEventListener("keydown", handleKeydown);
function handleKeydown(e) {
  e.preventDefault();
  input_key_buffer[e.keyCode] = true;
}

window.addEventListener("keyup", handleKeyup);
function handleKeyup(e) {
  e.preventDefault();
  input_key_buffer[e.keyCode] = false;
}

// canvas要素の取得
const canvas = document.getElementById("maincanvas");
const ctx = canvas.getContext("2d");

// 画像を表示するの座標の定義 & 初期化
var x = 0;
var y = 300;

// 上下方向の速度
var vy = 0;
// ジャンプしたか否かのフラグ値
var isJump = false;

// ゲームオーバーか否かのフラグ値
var isGameOver = false;

// 移動中の場合にカウントする
var walkingCount = 0;
// カウントに対して画像を切り替える単位
const walkRange = 3;
// 右向きか否か
var toRight = true;

// ブロック要素の定義
var blocks = [
  { x: 0, y: 332, w: 250, h: 32 },
  { x: 250, y: 232, w: 250, h: 32 },
  { x: 500, y: 132, w: 530, h: 32 },
];

// 敵の情報
var enemyX = 550;
var enemyY = 0;
var enemyIsJump = true;
var enemyVy = 0;

// ロード時に画面描画の処理が実行されるようにする
window.addEventListener("load", update);

// 画面を更新する関数を定義 (繰り返しここの処理が実行される)
function update() {
  // 画面全体をクリア
  ctx.clearRect(0, 0, 640, 480);

  // アップデート後の敵の座標
  var updatedEnemyX = enemyX;
  var updatedEnemyY = enemyY;

  // 敵は左に固定の速度で移動するようにする
  updatedEnemyX = updatedEnemyX - 1;

  // 敵の場合にも、主人公の場合と同様にジャンプか否かで分岐
  if (enemyIsJump) {
    // ジャンプ中は敵の速度分だけ追加する
    updatedEnemyY = enemyY + enemyVy;

    // 速度を固定分だけ増加させる
    enemyVy = enemyVy + 0.5;

    // ブロックを取得する
    const blockTargetIsOn = getBlockTargetIsOn(
      enemyX,
      enemyY,
      updatedEnemyX,
      updatedEnemyY
    );

    // ブロックが取得できた場合には、そのブロックの上に立っているよう見えるように着地させる
    if (blockTargetIsOn !== null) {
      updatedEnemyY = blockTargetIsOn.y - 32;
      enemyIsJump = false;
    }
  } else {
    // ブロックの上にいなければジャンプ中の扱いとして初期速度0で落下するようにする
    if (
      getBlockTargetIsOn(enemyX, enemyY, updatedEnemyX, updatedEnemyY) === null
    ) {
      enemyIsJump = true;
      enemyVy = 0;
    }
  }

  // 算出した結果に変更する
  enemyX = updatedEnemyX;
  enemyY = updatedEnemyY;

  // 更新後の座標
  var updatedX = x;
  var updatedY = y;

  if (isGameOver) {
    // 上下方向は速度分をたす
    updatedY = y + vy;

    // 落下速度はだんだん大きくなる
    vy = vy + 0.5;

    if (y > 500) {
      // ゲームオーバーのキャラが更に下に落ちてきた時にダイアログを表示し、各種変数を初期化する
      alert("GAME OVER");
      isGameOver = false;
      isJump = false;
      updatedX = 0;
      updatedY = 300;
      vy = 0;
    }
  } else {
    // 入力値の確認と反映
    if (input_key_buffer[37] || input_key_buffer[39]) {
      walkingCount = (walkingCount + 1) % (walkRange * 10);
    } else {
      walkingCount = 0;
    }

    if (input_key_buffer[37]) {
      toRight = false;
      updatedX = x - 2;
    }
    if (input_key_buffer[38] && !isJump) {
      vy = -10;
      isJump = true;
    }
    if (input_key_buffer[39]) {
      toRight = true;
      updatedX = x + 2;
    }

    // ジャンプ中である場合のみ落下するように調整する
    if (isJump) {
      // 上下方向は速度分をたす
      updatedY = y + vy;

      // 落下速度はだんだん大きくなる
      vy = vy + 0.5;

      // 主人公が乗っているブロックを取得する
      const blockTargetIsOn = getBlockTargetIsOn(x, y, updatedX, updatedY);

      // ブロックが取得できた場合には、そのブロックの上に立っているよう見えるように着地させる
      if (blockTargetIsOn !== null) {
        updatedY = blockTargetIsOn.y - 32;
        isJump = false;
      }
    } else {
      // ブロックの上にいなければジャンプ中の扱いとして初期速度0で落下するようにする
      if (getBlockTargetIsOn(x, y, updatedX, updatedY) === null) {
        isJump = true;
        vy = 0;
      }
    }

    if (y > 500) {
      // 下まで落ちてきたらゲームオーバーとし、上方向の初速度を与える
      isGameOver = true;
      updatedY = 500;
      vy = -15;
    }
  }

  x = updatedX;
  y = updatedY;

  // すでにゲームオーバーとなっていない場合のみ敵とのあたり判定を行う必要がある
  if (!isGameOver) {
    // 更新後の主人公の位置情報と、敵の位置情報とが重なっているかをチェックする
    var isHit = isAreaOverlap(
      updatedX,
      updatedY,
      32,
      32,
      updatedEnemyX,
      updatedEnemyY,
      32,
      32
    );

    if (isHit) {
      if (isJump && vy > 0) {
        // ジャンプしていて、落下している状態で敵にぶつかった場合には
        // 敵を消し去る(見えない位置に移動させる)とともに、上向きにジャンプさせる
        vy = -7;
        enemyY = 500;
      } else {
        // ぶつかっていた場合にはゲームオーバーとし、上方向の初速度を与える
        isGameOver = true;
        vy = -10;
      }
    }
  }

  // 敵の画像を表示
  var enemyImage = new Image();
  enemyImage.src = "../images/character-02/base.png";
  ctx.drawImage(enemyImage, enemyX, enemyY, 32, 32);

  // 主人公の画像を表示
  var image = new Image();
  if (isGameOver) {
    // ゲームオーバーの場合にはゲームオーバーの画像が表示する
    image.src = "../images/character-01/game-over.png";
  } else if (isJump) {
    image.src = `../images/character-01/jump-${
      toRight ? "right" : "left"
    }-000.png`;
  } else {
    image.src = `../images/character-01/walk-${toRight ? "right" : "left"}-${
      "00" + Math.floor(walkingCount / walkRange)
    }.png`;
  }
  ctx.drawImage(image, x, y, 32, 32);

  // 地面の画像を表示
  var groundImage = new Image();
  groundImage.src = "../images/ground-01/base.png";
  for (const block of blocks) {
    ctx.drawImage(groundImage, block.x, block.y, block.w, block.h);
  }

  // 再描画
  window.requestAnimationFrame(update);
}

// 変更前後のxy座標を受け取って、ブロック上に存在していればそのブロックの情報を、存在していなければnullを返す
function getBlockTargetIsOn(x, y, updatedX, updatedY) {
  // 全てのブロックに対して繰り返し処理をする
  for (const block of blocks) {
    if (y + 32 <= block.y && updatedY + 32 >= block.y) {
      if (
        (x + 32 <= block.x || x >= block.x + block.w) &&
        (updatedX + 32 <= block.x || updatedX >= block.x + block.w)
      ) {
        // ブロックの上にいない場合には何もしない
        continue;
      }
      // ブロックの上にいる場合には、そのブロック要素を返す
      return block;
    }
  }
  // 最後までブロック要素を返さなかった場合はブロック要素の上にいないということなのでnullを返却する
  return null;
}

/**
 * 2つの要素(A, B)に重なる部分があるか否かをチェックする
 * 要素Aの左上の角の座標を(ax, ay)、幅をaw, 高さをahとする
 * 要素Bの左上の角の座標を(bx, by)、幅をbw, 高さをbhとする
 */
function isAreaOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  // A要素の左側の側面が、Bの要素の右端の側面より、右側にあれば重なり得ない
  if (bx + bw < ax) {
    return false;
  }
  // B要素の左側の側面が、Aの要素の右端の側面より、右側にあれば重なり得ない
  if (ax + aw < bx) {
    return false;
  }

  // A要素の上側の側面が、Bの要素の下端の側面より、下側にあれば重なり得ない
  if (by + bh < ay) {
    return false;
  }
  // B要素の上側の側面が、Aの要素の下端の側面より、上側にあれば重なり得ない
  if (ay + ah < by) {
    return false;
  }

  // ここまで到達する場合には、どこかしらで重なる
  return true;
}
