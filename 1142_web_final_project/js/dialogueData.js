// ══════════════════════════════════════════════════════
//  對話資料
//  type 種類：
//    'narration'  → 旁白（顯示 description 框）
//    'thought'    → 內心獨白（斜體，無說話者）
//    'dialogue'   → 一般對話（有說話者名稱）
//    'choice'     → 玩家選項
//    'game'       → 跳轉到小遊戲頁面
//    'scene'      → 切換背景 / 角色立繪
//    'sfx'        → 播放音效
//    'bgm'        → 切換背景音樂
//    'ending'     → 跳轉結局頁面
// ══════════════════════════════════════════════════════

const ASSETS = {
  bgm: 'public/backing_sound.mp3',
  bar: 'public/bar.png',
  kitchen: 'public/kitchen.png',
  storage: 'public/storage.png',
  out: 'public/out.png',
  teacup: 'game/game3/teacup-clear.png?v=2',
  man: 'public/figure_man.png',
  sfxLine: 'public/sfx_line.mp3',
  sfxDoor: 'public/sfx_door.mp3',
  sfxScare: 'public/sfx_scare.mp3',
};

const GAMES = {
  coasterPuzzle: 'game/game1/index.html',
  powerSwitch: 'game/game2/index.html',
  spotDifference: 'game/game3/index.html',
  keyBox: 'game/game4/index.html',
  escapeRun: 'game/game5/index.html',
};

const DIALOGUE = [

  // ── 場景 0：咖啡廳座位 ──────────────────────────────
  // 立繪對照：figure_man=顧北辰  figure_yian=許以安（主角通常不顯示）
  //           figure_boss=待確認（店長 or 顧北辰第二套）  figure_friend=朋友（僅bbcall，不顯示）
  { type: 'scene', bg: ASSETS.bar, character: ASSETS.man, bgm: ASSETS.bgm },  // 咖啡廳主廳，顧北辰入場

  { type: 'narration', text: '你聽從父母的安排來到這間摩登咖啡廳相親，說是要讓你先與他們安排的對象見面留下印象，沒什麼問題回來就可以直接結婚。' },

  { type: 'dialogue', speaker: '顧北辰', text: '你知道你跟星星有什麼區別嗎？' },
  { type: 'dialogue', speaker: '顧北辰', text: '星星在天上，你在我心裡。' },
  { type: 'dialogue', speaker: '顧北辰', text: '而這是我為你切好的蛋糕。只屬於我心裡的你。' },

  { type: 'dialogue', speaker: '許以安', text: '啊不用了，謝謝你。你真貼心哈哈，我自己來就好。' },

  { type: 'dialogue', speaker: '顧北辰', text: '其實你不用這麼冷淡，我知道你在等我主動。如果你是想吸引我的注意，恭喜你，你成功了。' },

  { type: 'thought', speaker: '許以安', text: '啊啊啊這是什麼，爸媽一直說對方是個好孩子，但從來都沒有跟我說是一個38歲的普信油膩男啊！我！要！逃！婚！' },

  // ── 場景 1：咖啡廳前台 ─────────────────────────────
  { type: 'dialogue', speaker: '顧北辰', text: '我也蠻多人追的啦，可能是被我的才華跟長相吸引吧，畢竟我從小到大都蠻搶手的。' },
  { type: 'thought',  speaker: '許以安', text: '⋯⋯搶手還需要相親嗎⋯⋯' },
  { type: 'thought',  speaker: '許以安', text: '忍不下去了，趕快用bbcall請我朋友來接我好了。' },

  { type: 'sfx', src: ASSETS.sfxLine }, // TODO: 放 sfx_line.mp3 至 public/
  { type: 'narration', text: 'bbcall：已傳送 「995 」給朋友。' },
  { type: 'dialogue', speaker: '朋友', text: '? 怎麼了？' },
  { type: 'dialogue', speaker: '許以安', text: '995!!!' },
  { type: 'dialogue', speaker: '朋友', text: '姊妹你終於瘋了啊，沒事我要繼續去shopping囉～' },

  { type: 'thought',  speaker: '許以安', text: '什麼鬼啊⋯⋯算了，求人不如求己，找個藉口開溜！' },
  { type: 'dialogue', speaker: '許以安', text: '那個，呃⋯⋯不好意思，我朋友有事找我，我離開一下。' },

  { type: 'narration', text: '許走到門邊，試圖轉動門鎖。' },
  { type: 'sfx', src: ASSETS.sfxDoor }, // TODO: 放 sfx_door.mp3 至 public/
  { type: 'narration', text: '門鎖轉不動。' },
  { type: 'thought',  speaker: '許以安', text: '什麼意思！！！！！門怎麼被鎖住了！' },

  { type: 'dialogue', speaker: '顧北辰', text: '女人，你居然分心，很好，你引起了我的注意。' },
  { type: 'dialogue', speaker: '店員',   text: '（打斷）這邊幫你們送飲料喔！' },
  { type: 'dialogue', speaker: '店員',   text: '是店長說要請你們喝的，請記得把飲料放在我們特製的杯墊上做使用喔！' },
  { type: 'thought',  speaker: '許以安', text: '喝飲料就喝飲料，為什麼要強調杯墊⋯⋯難道這個杯墊有什麼特別的嗎⋯⋯' },
  { type: 'thought',  speaker: '許以安', text: '不對，這個杯墊的圖案會移動！' },

  // 觸發遊戲 1：杯墊拼圖
  { type: 'game', gameId: 1, src: GAMES.coasterPuzzle },

  // ── 場景 2：後廚 ────────────────────────────────────
  { type: 'scene', bg: ASSETS.kitchen, character: '' },

  { type: 'narration', text: '（解開了杯墊，上面好像有一行字⋯⋯）' },
  { type: 'thought',  speaker: '許以安', text: '到後廚一趟⋯⋯？這是在跟我說的嗎？可是現在那個顧什麼的坐在我對面⋯⋯我該怎麼去後廚啊⋯⋯' },

  { type: 'dialogue', speaker: '顧北辰', text: '（大喊）可惡⋯⋯是誰在攻擊我的肚子，可惡的咖啡，我記住你了！' },
  { type: 'narration', text: '（衝去廁所）' },
  { type: 'thought',  speaker: '許以安', text: '好機會，快走！' },

  { type: 'dialogue', speaker: '許以安', text: '究竟是誰約我來這裡的？' },
  { type: 'dialogue', speaker: '店員',   text: '是我。' },
  { type: 'dialogue', speaker: '許以安', text: '！是你！難道你在顧什麼的飲料裡下毒？' },
  { type: 'dialogue', speaker: '店員',   text: '並沒有，我可不會做出這種會被抓去坐牢的事情。' },
  { type: 'dialogue', speaker: '店員',   text: '還記得那個蛋糕嗎？是所謂的無糖蛋糕，用山梨醇做的。對於他那樣胃不好的人來說，攝入了咖啡因和山梨醇，就很容易引起腹瀉的狀況。' },
  { type: 'dialogue', speaker: '許以安', text: '哇⋯⋯真沒想到⋯⋯' },
  { type: 'dialogue', speaker: '店員',   text: '不過現在不是說這個的時候了。你不是想逃出去嗎？大門目前被店長鎖上了，你得先把店長關起來。' },
  { type: 'dialogue', speaker: '店員',   text: '後廚的角落有電閘，拉下電閘的話店面會斷電，等到店長進來後廚，我就趁機將他關在這裡。' },
  { type: 'dialogue', speaker: '許以安', text: '好！' },
  { type: 'thought',  speaker: '許以安', text: '不過這個女生是誰啊，她為什麼要幫我⋯⋯而且，我怎麼覺得好像在哪裡見過她？' },

  // 觸發遊戲 2：電閘
  { type: 'game', gameId: 2, src: GAMES.powerSwitch },

  // ── 場景 3：咖啡廳前台 ─────────────────────────────
  {
    type: 'scene',
    bg: ASSETS.bar,
    character: '',
    props: [{
      src: ASSETS.teacup,
      left: '30%',
      top: '37%',
      width: '4%',
    }],
  },

  { type: 'dialogue', speaker: '店長', text: '燈怎麼滅掉了？' },
  { type: 'dialogue', speaker: '店長', text: '是誰把我關起來了！！！' },
  { type: 'thought',  speaker: '許以安', text: '呼～成功了！' },
  { type: 'dialogue', speaker: '許以安', text: '所以要開始來找鑰匙了嗎⋯⋯這麼大的咖啡廳，真的能夠找到嗎？' },
  { type: 'dialogue', speaker: '店員',   text: '如果有這個的話，或許就可以更快的找到鑰匙。' },
  { type: 'dialogue', speaker: '店員',   text: '這是咖啡廳吧台的照片，這裡標記的星星之處，或許藏著什麼東西。可是，詭計多端的店長設計了一張假的——你得找出兩張照片的不同，並選出正確的那張。' },
  { type: 'dialogue', speaker: '許以安', text: '原來如此，謝謝你！' },

  { type: 'dialogue', speaker: '店員', text: '⋯⋯那個⋯⋯我有個不是那麼重要的東西，你⋯⋯呃⋯⋯我可以給你嗎？' },

  // 選項：影響曖昧值
  {
    type: 'choice',
    choices: [
      { text: 'Ａ：啊⋯⋯沒關係，你已經幫了我很多忙了，就不麻煩你了', affection: 0 },
      { text: 'Ｂ：好啊，是什麼東西啊～', affection: 1 },
      { text: 'Ｃ：不要，我又沒跟你很熟', affection: 0 },
    ]
  },

  // 選B後的額外對話（引擎會根據 affection 決定是否播放）
  { type: 'dialogue', speaker: '店員',   text: '這個是造型的項鍊，希望你能喜歡⋯⋯', condition: 'affection' },
  { type: 'dialogue', speaker: '許以安', text: '我很喜歡！謝謝你！', condition: 'affection' },
  { type: 'dialogue', speaker: '店員',   text: '你能喜歡的話，真是太好了。', condition: 'affection' },

  // 觸發遊戲 3：找不同
  { type: 'game', gameId: 3, src: GAMES.spotDifference },

  // ── 場景 4：倉庫 ────────────────────────────────────
  { type: 'scene', bg: ASSETS.storage, character: '' },

  { type: 'dialogue', speaker: '許以安', text: '成功找到星星的地方了，來看看究竟放了什麼。' },
  { type: 'dialogue', speaker: '許以安', text: '一張紙⋯⋯倉庫左邊第三排？' },
  { type: 'dialogue', speaker: '許以安', text: '左邊第三排⋯⋯找到了！一個盒子？' },
  { type: 'narration', text: '（搖動）' },
  { type: 'thought',  speaker: '許以安', text: '應該裡面就是裝著鑰匙！' },

  { type: 'dialogue', speaker: '店員',   text: '看來你成功破解出正確的照片了呢。' },
  { type: 'dialogue', speaker: '許以安', text: '啊！你怎麼每次都突然消失又突然出現啊！嚇死我了。' },
  { type: 'dialogue', speaker: '店員',   text: '抱歉抱歉，看起來離能夠出來找你麻煩還有一段時間呢。' },
  { type: 'dialogue', speaker: '許以安', text: '哈哈哈哈哈哈哈，太好了！' },

  // 場景 4-1：追問店員（曖昧值觸發）
  { type: 'dialogue', speaker: '許以安', text: '不過⋯⋯你為什麼會要幫我啊？我覺得我好像在哪裡看過你，而且你又冒著有可能被開除的風險幫我⋯⋯我們是不是認識啊？', condition: 'affection' },
  { type: 'narration', text: '（5年前，高中）', condition: 'affection' },

  // 觸發遊戲 4：鐵管取鑰匙
  { type: 'game', gameId: 4, src: GAMES.keyBox },

  // ── 場景 5：倉庫外走廊 ─────────────────────────────
  { type: 'scene', bg: ASSETS.out, character: '' },

  { type: 'dialogue', speaker: '許以安', text: '終於拿到鑰匙了，趕快去打開大門⋯⋯' },
  { type: 'sfx', src: ASSETS.sfxScare }, // TODO: 放 sfx_scare.mp3 至 public/
  { type: 'scene', character: ASSETS.man }, // 顧北辰突然出現
  { type: 'dialogue', speaker: '顧北辰', text: '女人！你竟然想跑！休想逃出我的手掌心！' },
  { type: 'thought',  speaker: '許以安', text: '不好，被發現了，快跑啊！' },

  // 觸發遊戲 5：跑酷
  { type: 'game', gameId: 5, src: GAMES.escapeRun },

  // 結局由 engine.js 根據 gameResult + affection 判斷
  { type: 'ending' },
];
