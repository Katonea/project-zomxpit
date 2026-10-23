/* ZomXPit 아트 팩 — 게임 그림 코드 전체 (수정 없이 사용). 의존: ctx(2D 컨텍스트), FONT, FN(볼 색), META.sel */
// ===== 아트 팩이 필요로 하는 최소 전역 (게임 본편에서는 이미 있음) =====
const W = 720, H = 1280;
const FONT = '"Noto Sans KR",sans-serif';
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rand = Math.random;
const P = v => Math.round(v * 100) + '%';
const FN = {
  fire:   {name:'화염', pre:'불꽃', color:'#ff8a3d', e1:{pct:.20}, e5:{pct:.40}, cap:{pct:1.2}, d:v => '화상 ' + P(v.pct) + '/초'},
  frost:  {name:'얼음', pre:'서리', color:'#7fd3f5', e1:{slow:.30, freeze:1}, e5:{slow:.50, freeze:2}, cap:{slow:.8, freeze:4}, d:v => '둔화 ' + P(v.slow) + ' · 빙결 ' + v.freeze.toFixed(1) + '초'},
  poison: {name:'독',   pre:'독',   color:'#8bd65a', e1:{max:3}, e5:{max:7}, cap:{max:15}, d:v => '독 최대 ' + Math.round(v.max) + '중첩'},
  spark:  {name:'번개', pre:'번개', color:'#ffe25a', e1:{n:2, pct:.6}, e5:{n:4, pct:.8}, cap:{n:8, pct:1.5}, d:v => '연쇄 ' + Math.round(v.n) + '명 ' + P(v.pct)},
  bomb:   {name:'폭탄', pre:'폭발', color:'#ff5a6a', e1:{r:50, pct:.5}, e5:{r:80, pct:.8}, cap:{r:160, pct:1.5}, d:v => '폭발 반경 ' + Math.round(v.r) + ' · 주변 피해 ' + P(v.pct)},
  split:  {name:'분열', pre:'쌍둥이', color:'#f3d9a0', e1:{n:1}, e5:{n:3}, cap:{n:6}, d:v => '분열 ' + Math.round(v.n) + '개'},
  pierce: {name:'관통', pre:'가시', color:'#b8c0d0', e1:{n:1}, e5:{n:3}, cap:{n:8}, d:v => '관통 ' + Math.round(v.n) + '회'},
  vamp:   {name:'흡혈', pre:'흡혈', color:'#d04060', e1:{pct:.01}, e5:{pct:.03}, cap:{pct:.08}, d:v => '흡혈 ' + (v.pct*100).toFixed(1) + '%'},
  wind:   {name:'바람', pre:'바람', color:'#b9f0d0', e1:{px:20}, e5:{px:60}, cap:{px:120}, d:v => '밀치기 ' + Math.round(v.px)},
  giant:  {name:'거대', pre:'왕',   color:'#c08850', e1:{size:.2, dmg:.1}, e5:{size:.6, dmg:.4}, cap:{size:1.5, dmg:1.5}, d:v => '크기 +' + P(v.size) + ' 피해 +' + P(v.dmg)},
  homing: {name:'유도', pre:'추적', color:'#b48cff', e1:{deg:60}, e5:{deg:150}, cap:{deg:400}, d:v => '유도 ' + Math.round(v.deg) + '°/초'},
  curse:  {name:'저주', pre:'저주', color:'#9a5ad0', e1:{pct:.10}, e5:{pct:.25}, cap:{pct:.6}, d:v => '받는 피해 +' + P(v.pct)},
  bleed:  {name:'출혈', pre:'피칼', color:'#e0405a', e1:{pct:.3}, e5:{pct:.6}, cap:{pct:2}, d:v => '출혈 ' + P(v.pct) + ' (3초)'},
  crit:   {name:'치명', pre:'치명', color:'#ff4ad0', e1:{pct:.1}, e5:{pct:.25}, cap:{pct:.6}, d:v => '치명타 확률 +' + P(v.pct)},
  stun:   {name:'기절', pre:'쾅쾅', color:'#d0b040', e1:{pct:.1, t:.5}, e5:{pct:.25, t:.8}, cap:{pct:.5, t:1.5}, d:v => P(v.pct) + ' 확률 기절 ' + v.t.toFixed(1) + '초'},
  echo:   {name:'메아리', pre:'메아리', color:'#6af0ff', e1:{pct:.4}, e5:{pct:.8}, cap:{pct:2}, d:v => '0.4초 뒤 같은 자리 재타격 ' + P(v.pct)},
  meteor: {name:'운석', pre:'운석', color:'#ff7a1a', e1:{p:.1, r:90}, e5:{p:.2, r:130}, cap:{p:.5, r:220}, d:v => P(v.p) + ' 확률 운석 낙하 (반경 ' + Math.round(v.r) + ')'},
  holy:   {name:'신성', pre:'신성', color:'#fff2a0', e1:{pct:.3}, e5:{pct:.8}, cap:{pct:3}, d:v => '보스·정예 피해 +' + P(v.pct)},
  // 2026-10-14 추가 12종
  lucky:  {name:'행운', pre:'행운', color:'#6ad86a', e1:{pct:.3}, e5:{pct:.8}, cap:{pct:2}, d:v => '이 볼로 처치하면 경험치 +' + P(v.pct)},
  rot:    {name:'부패', pre:'썩은', color:'#b0a060', e1:{pct:.02}, e5:{pct:.05}, cap:{pct:.12}, d:v => '적 최대 HP의 ' + P(v.pct) + ' 추가 피해 (보스는 1/10)'},
  swift:  {name:'가속', pre:'번쩍', color:'#8ae8ff', e1:{spd:.15, dmg:.05}, e5:{spd:.4, dmg:.15}, cap:{spd:.8, dmg:.5}, d:v => '공 속도 +' + P(v.spd) + ' · 피해 +' + P(v.dmg)},
  acid:   {name:'산성', pre:'산성', color:'#c8f03a', e1:{pct:.4}, e5:{pct:1}, cap:{pct:1}, d:v => '방패·안전모 관통 ' + P(v.pct)},
  ricochet:{name:'도탄', pre:'도탄', color:'#e8c890', e1:{n:1}, e5:{n:3}, cap:{n:6}, d:v => '맞히면 가까운 적에게 꺾여 날아감 ' + Math.round(v.n) + '회'},
  shatter:{name:'파쇄', pre:'파쇄', color:'#b8e8ff', e1:{pct:.5}, e5:{pct:1.2}, cap:{pct:3}, d:v => '얼거나 느려지거나 기절한 적에게 피해 +' + P(v.pct)},
  nova:   {name:'폭죽', pre:'폭죽', color:'#ff9a5a', e1:{r:60, pct:.5}, e5:{r:100, pct:1}, cap:{r:180, pct:2}, d:v => '이 볼로 처치하면 그 자리 폭발 (반경 ' + Math.round(v.r) + ' ' + P(v.pct) + ')'},
  gravity:{name:'중력', pre:'중력', color:'#9a7ae8', e1:{r:90, px:30}, e5:{r:150, px:60}, cap:{r:260, px:120}, d:v => '맞은 자리로 반경 ' + Math.round(v.r) + ' 적을 끌어당김'},
  execute:{name:'처형', pre:'처형', color:'#d04848', e1:{pct:.1}, e5:{pct:.2}, cap:{pct:.35}, d:v => 'HP ' + P(v.pct) + ' 이하 일반 적 즉시 처치 · 보스·정예 피해 +' + P(v.pct)},
  prism:  {name:'프리즘', pre:'무지개', color:'#ff9ae8', e1:{n:2, pct:.4}, e5:{n:3, pct:.7}, cap:{n:6, pct:1.5}, d:v => '맞히면 무작위 적 ' + Math.round(v.n) + '명에게 빛줄기 ' + P(v.pct)},
  chrono: {name:'시간', pre:'시계', color:'#e8d898', e1:{p:.05, t:1}, e5:{p:.1, t:1.5}, cap:{p:.25, t:3}, d:v => P(v.p) + ' 확률로 일반 적 모두 ' + v.t.toFixed(1) + '초 정지'},
  phoenix:{name:'불사조', pre:'불사조', color:'#ff6a3a', e1:{hp:.3}, e5:{hp:.6}, cap:{hp:1}, d:v => '판마다 한 번, 쓰러지면 HP ' + P(v.hp) + '로 부활'},
};
const RAID = {time:60, waves:3, waveLen:9, bossDelay:1.5, mobMul:[.6, .8, 1], bossHp:[1400, 2800, 3500], xpMul:.4, ballSpd:300,
  fireEvery:[1.3, 1.1, .9], dmg:[6, 8, 10], pinball:[2, 3, 4],
  spin:2.4, spiralGap:.3, spiralSpd:.75, spiralDmg:.85, // 탄막: 포탑 회전(라디안/초), 발사 간격 = fireEvery × spiralGap, 탄속·탄 피해 배율
  // 침략 리그: 침략 점수(META.rp)로 정해짐. 이기면 +win, 지면 -lose (0 밑으로 안 내려감). 리그가 높을수록 상대 등급·탄 피해(dmg)·탄막 패턴(pats)이 세짐
  win:30, lose:15,
  // 아레나 = 리그. 처음 올라간 아레나의 balls가 해금돼 잭팟·처치 보상에서 나오기 시작 (낮을수록 직관적인 볼, 아레나마다 유니크 1개 이상). 이미 가진 볼은 그대로 쓴다
  leagues:[{name:'브론즈', an:'폐허 놀이터', min:0, c:'#c8844a', tier:1, dmg:1, pats:['spiral', 'fan'], balls:['fire', 'frost', 'split', 'pierce', 'giant', 'meteor']},
    {name:'실버', an:'버려진 쇼핑몰', min:120, c:'#b8c4d0', tier:1, dmg:1.15, pats:['spiral', 'fan', 'aimall'], balls:['poison', 'spark', 'bomb', 'crit', 'vamp', 'holy']},
    {name:'골드', an:'군사 기지', min:300, c:'#ffd34a', tier:2, dmg:1.3, pats:['spiral', 'fan', 'aimall', 'flower'], balls:['wind', 'swift', 'bleed', 'homing', 'stun', 'phoenix']},
    {name:'플래티넘', an:'병원 지하', min:600, c:'#6ae0d0', tier:3, dmg:1.5, pats:['flower', 'aimall', 'fan', 'spiral'], balls:['lucky', 'acid', 'ricochet', 'shatter', 'execute', 'echo']},
    {name:'다이아', an:'좀비 왕좌', min:1000, c:'#8ab4ff', tier:3, dmg:1.75, pats:['flower', 'aimall', 'fan', 'spiral', 'storm'], balls:['rot', 'curse', 'nova', 'gravity', 'prism', 'chrono']}],
  // 탄막 패턴: gap = 발사 간격 배율(× fireEvery), dmg = 탄 하나 피해 배율. 한 패턴을 patLen초 쏘고 patRest초 쉼(포탑 깜빡임 = 다음 패턴 예고)
  patLen:4, patRest:.7,
  pat:{spiral:{gap:.3, dmg:1}, fan:{gap:.6, dmg:.8, n:5, spread:.75}, aimall:{gap:1.1, dmg:.7, n:16}, flower:{gap:.16, dmg:.6}, storm:{gap:.22, dmg:.55, n:3}},
  // 승리 뒤 선택: 살려주면 핀볼 많이 / 처치하면 랜덤 볼 1개 (등급은 dropRarity)
  sparePinball:[16, 24, 36], dropRarity:[{common:30, uncommon:45, rare:22, unique:3}, {uncommon:45, rare:40, unique:15}, {uncommon:20, rare:55, unique:25}]};
const TOP = 70, BOT = 980, SLOTY = H - 130, DECK = 170;
const PINBALL = {
  // 잭팟(선물 상자)을 뺀 모든 칸은 플레이어 경험치 (v = 경험치)
  slots:[{id:'xp', v:3, w:27, name:'EXP', color:'#7fd3f5'}, {id:'xp', v:6, w:21, name:'EXP', color:'#8bd65a'}, {id:'gift', w:4, name:'잭팟', color:'#ff6ab0'},
         {id:'xp', v:6, w:21, name:'EXP', color:'#8bd65a'}, {id:'xp', v:3, w:27, name:'EXP', color:'#7fd3f5'}],
  counts:[1, 2, 3, 5, 10], unlock:{2:50, 3:300, 5:500, 10:1000}, dropEvery:.15, // 배율 단계 (탭할 때마다 순환) + 해금 조건: 보유 핀볼이 unlock[n]개 이상일 때만 그 배율 사용
  cycleBalls:20,                                       // PUSH를 누르고 있을 때 한 사이클에 날아가는 공 수 (최대). 바꾸려면 이 숫자만 고치면 됨
  rarity:{common:55, uncommon:30, rare:12, unique:3},  // 선물 상자 볼 릴의 볼 등급
  reel:{ball:40, char:30, pb:30},                    // 선물 상자 슬롯머신 심볼 (릴마다 독립)
  tripleBall:{rare:75, unique:25}, tripleCharPb:40, tripleMul:10,   // 릴 3개가 모두 핀볼이면 핀볼 ×tripleMul. 모든 캐릭터를 이미 가졌을 때 캐릭터 3개 일치 = 핀볼 tripleCharPb
  shardsToUnlock:10, lockedBias:.7, dupShardPb:4, charMaxLv:5, charUpCost:lv => 10*lv, charUp:{atk:.06, hp:.08}, // 캐릭터 강화: Lv n → n+1에 조각 10n개, 레벨마다 공격 +6%·HP +8%                      // 해금 후/남는 캐릭터 조각 1개 = 핀볼 dupShardPb
};
var META = window.META || {sel:'hero'};
var S = window.S || null;
// ===== 도트 스프라이트 (좀비·보스·사람 캐릭터·볼·보석·배경·탄) =====
// ---------- 픽셀 스프라이트 ----------
// 왼쪽 절반만 적고 좌우 대칭으로 펼친다. '.' = 투명
const PAL = {k:'#2b1d14', g:'#6cc46a', G:'#3d8f4a', w:'#ffffff', b:'#8a5a3a', y:'#ffd34a',
  h:'#c8d0e0', H:'#7a8098', a:'#e8e2f5', A:'#a89cc8', r:'#d94a4a', n:'#3a3a48',
  o:'#f4efe6', s:'#cfc4b0', p:'#f2a0a8'}; // o 뼈, s 뼈 그림자, p 볼터치
// 주인공: 아기 해골 (큰 두개골, 반짝이는 눈구멍, 볼터치, 빨간 스카프, 작은 몸)
const SPR_SKULL = ['....kkkkk','..kkooooo','.koowoooo','.kooooooo','koooooooo','koooooooo','kookkkooo','kookwkooo','kookkkook','kppoooooo','.kppsoooo','..kokokok','...kkkkkk','..krrrrrr','..kkrrrrk','..knnnnnn','..knnnnnn','..kook...'];
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function sprite(half, pal) {
  const rows = half.map(r => r + [...r].reverse().join('')), c = mkCanvas(rows[0].length, rows.length), x = c.getContext('2d');
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { x.fillStyle = pal[ch] || PAL[ch]; x.fillRect(i, j, 1, 1); } }));
  return c;
}
function tinted(spr, color) { // 상태이상 틴트: 불투명 픽셀 위에만 색을 덮음
  const c = mkCanvas(spr.width, spr.height), x = c.getContext('2d');
  x.drawImage(spr, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = .45; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  c.k = spr.k; return c; // 칸 크기 보정값 k(= 32/격자 칸 수)를 새 캔버스에 그대로 복사 (빠뜨리면 32칸 그림이 2배로 커짐)
}
function rimmed(spr, color) { // 피격: 몸 색은 그대로 두고 실루엣 바깥 1칸만 붉게 두름
  const c = mkCanvas(spr.width + 2, spr.height + 2), x = c.getContext('2d');
  for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) x.drawImage(spr, dx, dy);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'source-over'; x.drawImage(spr, 1, 1);
  c.k = spr.k; return c;
}
const shade = (spr, st) => (st === 'hit' ? rimmed : tinted)(spr, TINT[st]);
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v)*t).toString(16).padStart(2, '0')).join(''); };
const lite = (c, t) => mix(c, '#ffffff', t), dark = (c, t) => mix(c, '#150c1c', t);
function pixOutline(c, ink) { // 알파를 0/255로 고정하고 불투명 픽셀 둘레에 한 칸 외곽선
  const x = c.getContext('2d'), w = c.width, h = c.height, id = x.getImageData(0, 0, w, h), p = id.data, a = p.slice(), on = k => a[k*4 + 3] > 120;
  for (let k = 0; k < w*h; k++) {
    if (on(k)) { p[k*4 + 3] = 255; continue; }
    const i = k%w, j = (k/w) | 0;
    if ((i > 0 && on(k - 1)) || (i < w - 1 && on(k + 1)) || (j > 0 && on(k - w)) || (j < h - 1 && on(k + w))) p.set(ink, k*4); else p[k*4 + 3] = 0;
  }
  x.putImageData(id, 0, 0); return c;
}
// ---------- 좀비 도트: 16칸(보스 32칸), 걸음 2프레임(f = 0/1). 종류 구분은 머리 위 표식 ----------
const ZSK = '#8ab84a', ZSKD = '#6a9838', ZBL = '#c8302a';
// 비율 좌표(0~1)로 그려 N칸에 찍고 바깥 윤곽. 일반 16칸, 보스 32칸 (화면 크기는 예전 32칸과 같게 k로 맞춤)
// 머리 위 표식(폭탄·불꽃·주사기 등)이 칸 위로 솟을 수 있어 위쪽 여유 칸을 두고, 쓴 만큼 아래에도 빈 칸을 더해 몸 중심을 맞춘다
function zgrid(N, draw) {
  const T = Math.round(N*.25), px = Array.from({length:N + T}, () => Array(N + 2).fill(null));
  const P = (x, y, c) => { y += T; x += 1; if (x >= 0 && y >= 0 && x < N + 2 && y < N + T) px[y][x] = c; };
  const rect = (x, y, w, h, c) => { const x0 = Math.round(x*N), y0 = Math.round(y*N), x1 = Math.max(x0 + 1, Math.round((x + w)*N)), y1 = Math.max(y0 + 1, Math.round((y + h)*N)); for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) P(i, j, c); };
  const circ = (cx, cy, r, c, top) => { const R2 = (r*N)**2; for (let j = -T; j < N; j++) for (let i = -1; i <= N; i++) { const dx = i + .5 - cx*N, dy = j + .5 - cy*N; if (dx*dx + dy*dy <= R2 && (!top || dy <= 0)) P(i, j, c); } };
  const dot = (x, y, c, n = 1) => { const x0 = Math.floor(x*N), y0 = Math.floor(y*N); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) P(x0 + i, y0 + j, c); };
  draw({rect, circ, dot});
  let top = 0; while (top < T && px[top].every(c => !c)) top++;
  const rows = px.slice(top); for (let i = top; i < T; i++) rows.push(Array(N + 2).fill(null)); rows.unshift(Array(N + 2).fill(null)); rows.push(Array(N + 2).fill(null));
  const Hh = rows.length, Ww = N + 2, o = rows.map(r => r.slice());
  for (let j = 0; j < Hh; j++) for (let i = 0; i < Ww; i++) if (!rows[j][i] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => rows[j + dy] && rows[j + dy][i + dx])) o[j][i] = '#1a1420';
  const c = mkCanvas(Ww, Hh), g = c.getContext('2d');
  for (let j = 0; j < Hh; j++) for (let i = 0; i < Ww; i++) if (o[j][i]) { g.fillStyle = o[j][i]; g.fillRect(i, j, 1, 1); }
  c.k = 32/N; return c;
}
const ZG = '#8ab84a', ZGD = '#6a9838', ZY = '#ffe14a', ZE = '#2a1a10', ZM = '#5a1a1a', ZWH = '#f4f4f4', ZSH = '#c8c4b8', ZSHD = '#9a968a', ZPA = '#3a4a6a', ZSO = '#2a2a34', ZNV = '#1a2440', ZSB = '#a8d4f4', ZSBL = '#d8ecff', ZBD = '#ffd84a';
// 정면 좀비: 큰 둥근 머리 + 노란 눈 + 앞으로 뻗은 팔. f = 걸음 프레임(다리 하나씩 들고 팔이 번갈아 흔들림). o.hat = 머리 표식
const zbody = (o = {}, N = 16) => f => zgrid(N, D => {
  const {rect, circ, dot} = D, w = o.wide || 0, sh = o.shirt || ZSH, pa = o.pants || ZPA, l = f ? .04 : 0, r = f ? 0 : .04;
  o.back && o.back(D, f);
  rect(.36 - w, .74 - l, .11, .16, pa); rect(.53 + w, .74 - r, .11, .16, pa); rect(.34 - w, .88 - l, .14, .06, ZSO); rect(.52 + w, .88 - r, .14, .06, ZSO);
  rect(.31 - w, .5, .38 + 2*w, .27, sh); rect(.6 + w, .52, .09, .24, o.shirtD || ZSHD); dot(.56, .6, ZBL);
  o.body && o.body(D, f);
  if (o.arms !== false) { rect(.19 - w, .52 + r, .12, .14, sh); rect(.69 + w, .52 + l, .12, .14, sh); rect(.19 - w, .64 + r, .1, .08, ZG); rect(.71 + w, .64 + l, .1, .08, ZG); }
  circ(.5, .3, .25, ZG); circ(.56, .36, .16, ZGD); circ(.47, .27, .19, ZG);
  dot(.36, .26, ZY); dot(.58, .26, ZY); rect(.43, .4, .14, .05, ZM); dot(.64, .14, ZBL);
  o.hat && o.hat(D, f); o.front && o.front(D, f);
});
const zpolice = (hat, N = 16) => zbody({shirt:ZNV, shirtD:'#0e1830', pants:ZNV, arms:false, hat,
  front:({rect, dot}, f) => { const y = f ? .01 : 0; rect(.2, .47 + y, .6, .45, ZSB); rect(.23, .5 + y, .08, .38, ZSBL); rect(.2, .66 + y, .6, .03, ZNV); dot(.48, .76 + y, ZBD); dot(.16, .62, ZG); dot(.82, .62, ZG); }}, N); // 몸 앞을 거의 다 가리는 진압 방패
const zhelmet = {shirt:'#ff9a1a', shirtD:'#d8781a', body:({rect}) => { rect(.31, .56, .38, .04, '#f0f0c0'); rect(.31, .66, .38, .03, '#f0f0c0'); }};
// 보스 탱크 (32칸): 거대한 몸 + 작은 머리 + 땅에 끌리는 큰 팔
const ztank32 = (o = {}) => f => zgrid(32, D => {
  const {rect, circ, dot} = D, l = f ? .03 : 0, r = f ? 0 : .03;
  o.back && o.back(D, f);
  rect(.28, .78 - l, .18, .16, '#3a3a44'); rect(.54, .78 - r, .18, .16, '#3a3a44');
  circ(.5, .56, .36, ZG); circ(.58, .64, .24, ZGD); circ(.46, .5, .26, ZG); dot(.64, .42, ZBL, 2); dot(.34, .64, ZBL, 2);
  rect(.04, .42 + r, .14, .36, ZG); circ(.11, .8 + r, .1, ZG); rect(.82, .44 + l, .14, .36, ZG); circ(.89, .82 + l, .1, ZG);
  circ(.5, .2, .15, ZG); dot(.43, .17, ZY, 2); dot(.53, .17, ZY, 2); rect(.44, .27, .12, .03, ZM);
  o.hat && o.hat(D, f); o.front && o.front(D, f);
});
const flames = (D, f, k = 1, y0 = 0) => { const {circ, dot} = D, b = f ? .02 : 0; // 머리에서 활활: 프레임마다 혀가 오르내림
  circ(.5, y0 + .02*k, .16*k, '#ff6a1a'); circ(.5 - .12*k, y0 - .06*k - b, .09*k, '#ff8a2a'); circ(.5 + .12*k, y0 - .08*k + b, .09*k, '#ff8a2a'); circ(.5, y0 - .14*k - b, .07*k, '#ff8a2a'); circ(.5, y0 + .04*k, .09*k, '#ffd23a'); dot(.5, y0 - .02*k, '#fff6a0'); };
const ZART = { // 적 종류 → 그림 함수 (f = 걸음 프레임 → 캔버스). 행동(ENEMY)은 그대로
  knight:zbody(),                                                                                          // 기본 좀비
  archer:zbody({shirt:'#5a6a3a', shirtD:'#3e4a28', pants:'#4a5a32', hat:({rect, circ, dot}) => { circ(.5, .22, .26, '#4a5a32', true); rect(.22, .2, .56, .05, '#4a5a32'); dot(.36, .1, '#7a8a5a'); }, // 군인: 철모 + 아래로 겨눈 총
    front:({rect}) => { rect(.45, .56, .08, .34, '#2a2a2a'); rect(.42, .6, .14, .06, '#5a3a20'); }}),
  shield:zpolice(({rect, circ, dot}) => { circ(.5, .24, .25, ZNV, true); rect(.27, .22, .46, .05, ZNV); dot(.5, .04, ZBD); }), // 방패 경찰: 헬멧 + 큰 방패
  priest:zbody({shirt:ZWH, shirtD:'#d0d0d8', pants:'#e0e0e8', hat:({rect}) => { rect(.24, .18, .08, .3, '#6a3a24'); rect(.68, .18, .08, .3, '#6a3a24'); rect(.3, -.04, .4, .14, ZWH); rect(.47, -.03, .06, .12, ZBL); rect(.43, .01, .14, .04, ZBL); }}), // 간호사: 빨간 십자 간호모
  boar:f => zgrid(16, ({rect, circ, dot}) => { const a = f ? .04 : 0, b = f ? 0 : .04;                       // 기어오는 좀비: 다리 없이 두 팔로 바닥을 짚고 빠르게 기어옴 (팔 번갈아)
    rect(.3, .58, .4, .16, ZSHD); rect(.36, .7, .28, .06, '#6a665a'); dot(.56, .62, ZBL);                         // 엎드린 몸통 (찢어진 셔츠)
    rect(.12, .58 - a, .14, .1, ZG); rect(.08, .66 - a, .14, .08, ZG); rect(.74, .58 - b, .14, .1, ZG); rect(.78, .66 - b, .14, .08, ZG); // 바닥을 짚은 두 팔
    for (const x of [.08, .12, .16]) dot(x, .74 - a, ZGD); for (const x of [.82, .86, .9]) dot(x, .74 - b, ZGD);   // 손가락
    circ(.5, .46, .2, ZG); circ(.55, .5, .12, ZGD); dot(.42, .42, ZY); dot(.58, .42, ZY);                          // 낮게 든 머리
    rect(.42, .52, .16, .08, ZM); for (const x of [.44, .5, .55]) dot(x, .52, '#ffffff'); dot(.62, .34, ZBL); rect(.3, .3, .1, .04, '#4a3a2a'); rect(.6, .28, .08, .04, '#4a3a2a'); }),
  bomber:zbody({shirt:'#5a4a3a', shirtD:'#3e3226', hat:({rect, circ, dot}, f) => { circ(.5, -.02, .17, '#2a2a34'); dot(.42, -.1, '#6a6a7a'); rect(.6, -.24, .05, .1, '#c8a060'); dot(.64, -.27, f ? '#ff8a2a' : '#ffe14a'); dot(.68, -.24, f ? '#ffe14a' : '#ff8a2a'); }}), // 폭탄 조끼: 머리에 인 폭탄 + 깜빡이는 심지
  runner:zbody({shirt:'#d8503a', shirtD:'#a83a2a', pants:'#2a2a3a', body:({rect}) => { rect(.31, .58, .38, .04, ZWH); rect(.44, .64, .12, .08, ZWH); }, // 러너: 휘날리는 빨간 머리띠
    hat:({rect}, f) => { rect(.22, .12, .56, .07, '#ff3a3a'); rect(.74, .14 - (f ? .02 : 0), .14, .05, '#ff3a3a'); rect(.84, .18 + (f ? .02 : 0), .08, .05, '#ff3a3a'); }}),
  helmet:zbody({...zhelmet, hat:({rect, circ}) => { circ(.5, .2, .26, '#ffd23a', true); rect(.18, .18, .64, .05, '#ffd23a'); rect(.4, .02, .08, .05, '#fff6a0'); }}), helmet0:zbody(zhelmet), // 안전모 / 깨진 뒤
  fatty:zbody({wide:.07, shirt:'#e0d8c4', shirtD:'#b8b09c', pants:'#5a4a3a', body:({circ}) => { circ(.5, .66, .15, '#9ac85a'); }, // 뚱보 펑: 머리에 부풀어 오른 독 혹
    hat:({circ, dot}, f) => { const p = f ? .01 : 0; circ(.3, .06, .1 + p, '#b8e05a'); circ(.68, .02, .09 + p, '#b8e05a'); circ(.5, -.06, .08 + p, '#b8e05a'); dot(.28, .02, '#efffa0'); dot(.68, -.02, '#efffa0'); dot(.5, -.1, '#efffa0'); }}),
  convict:zbody({shirt:'#ff8a2a', shirtD:'#d86a1a', pants:'#ff8a2a', body:({rect}) => { for (const y of [.54, .62, .7]) rect(.31, y, .38, .03, '#2a2a2a'); }, // 죄수: 줄무늬 죄수모 (쇠공은 따로 돌며 그림)
    hat:({rect}) => { rect(.28, 0, .44, .16, '#f0f0f0'); rect(.28, .03, .44, .04, '#2a2a2a'); rect(.28, .1, .44, .04, '#2a2a2a'); }}),
  syringe:zbody({shirt:'#f0a0c0', shirtD:'#d880a0', pants:'#e888b0', hat:({rect}) => { rect(.28, .04, .44, .1, '#f0a0c0'); rect(.58, -.22, .12, .3, '#f4f4fa'); rect(.58, -.16, .12, .14, '#6ae04a'); rect(.55, .06, .18, .04, '#a8b0c0'); rect(.62, -.28, .04, .06, '#c8d0dc'); }}), // 주사기 간호사: 머리에 꽂힌 큰 주사기
  mage:zbody({shirt:'#b8b4a8', shirtD:'#8a867a', pants:'#8a867a', hat:(D, f) => { flames(D, f); D.rect(.3, .22, .4, .1, '#5a8ab8'); D.rect(.42, .34, .16, .08, '#3a3a44'); }}), // 화염방사: 머리에서 활활 + 방독면
  spitter:zbody({shirt:'#7a9a5a', shirtD:'#5a7a3a', pants:'#4a5a3a', hat:({rect, circ, dot}, f) => { const p = f ? .01 : 0; circ(.5, -.04, .13 + p, '#6ad84a'); circ(.34, .03, .09, '#8ae04a'); circ(.66, .01, .1 - p, '#8ae04a'); dot(.48, -.08, '#d8ff9a'); dot(.66, -.02, '#d8ff9a');
    rect(.44, .38, .12, .07 + (f ? .04 : 0), '#6ad84a'); }}), // 독 뿜는 좀비: 머리 위 독 거품 + 흘러내리는 침
  mbdash:zbody({wide:.06, shirt:'#c8302a', shirtD:'#8a1a1a', pants:'#f4f4f4', // 돌진 대장: 넓은 어깨 보호대 + 등번호 + 뿔 달린 미식축구 헬멧
    body:({rect}) => { rect(.24, .48, .52, .07, '#f4f4f4'); rect(.42, .58, .16, .04, '#f4f4f4'); rect(.48, .58, .04, .14, '#f4f4f4'); },
    hat:({rect, circ}) => { circ(.5, .26, .27, '#c8302a', true); rect(.26, .3, .48, .04, '#ffd23a'); rect(.36, .38, .28, .03, '#d8d8e0'); rect(.36, .43, .28, .03, '#d8d8e0'); rect(.14, .02, .08, .18, '#f4f0e0'); rect(.78, .02, .08, .18, '#f4f0e0'); }}, 32),
  mbsnipe:zbody({shirt:'#5a6a3a', shirtD:'#3a4a22', pants:'#4a5a2a', // 저격 대장: 위장복 + 몸을 가로지르는 긴 저격총 + 베레모·빨간 조준경
    body:({dot}) => { dot(.38, .58, '#3a4a22', 2); dot(.6, .7, '#7a8a4a', 2); dot(.46, .72, '#3a4a22'); },
    front:({rect, dot}, f) => { const y = f ? .01 : 0; for (let i = 0; i < 10; i++) rect(.12 + i*.075, .7 - i*.035 + y, .08, .05, i < 3 ? '#6a4a2a' : '#2a2a34'); rect(.44, .5 + y, .14, .06, '#2a2a34'); dot(.58, .52 + y, '#ff3a3a'); },
    hat:({rect, dot}) => { rect(.28, .08, .46, .1, '#3a5a2a'); rect(.24, .15, .52, .05, '#2a4a1a'); dot(.66, .1, '#ffd23a'); rect(.54, .24, .16, .1, '#2a2a34'); dot(.62, .28, '#ff3a3a', 2); }}, 32),
  mbflame:zbody({shirt:'#e8731a', shirtD:'#b8501a', pants:'#c8601a', // 화염 대장: 등 뒤 연료통 둘 + 방염복 띠 + 손에 든 화염 노즐 + 방독면·머리 불
    back:({rect}) => { rect(.18, .4, .14, .36, '#8a2a1a'); rect(.68, .4, .14, .36, '#8a2a1a'); rect(.18, .4, .14, .05, '#c8c8d0'); rect(.68, .4, .14, .05, '#c8c8d0'); },
    body:({rect}) => { rect(.31, .6, .38, .05, '#ffe14a'); },
    front:({rect, dot}, f) => { const y = f ? .01 : 0; rect(.62, .62 + y, .22, .06, '#4a4a56'); rect(.82, .6 + y, .06, .1, '#2a2a34'); dot(.9, .64 + y, f ? '#ff8a2a' : '#ffe14a', 2); },
    hat:(D, f) => { flames(D, f); D.rect(.3, .22, .4, .1, '#5a8ab8'); D.rect(.42, .34, .16, .08, '#3a3a44'); }}, 32),
  mbtoxic:zbody({shirt:'#e8e8e0', shirtD:'#b8b8a8', pants:'#4a5a3a', // 독병 대장: 초록 얼룩 실험 가운 + 양손 독병 + 보안경·독 거품
    body:({dot}) => { dot(.38, .62, '#6ad84a', 2); dot(.56, .72, '#6ad84a'); dot(.62, .56, '#4ab83a'); },
    front:({rect, dot}, f) => { const y = f ? .02 : 0; for (const x of [.12, .76]) { rect(x + .03, .52 - y, .06, .05, '#c8c8d0'); rect(x, .57 - y, .12, .14, '#6ad84a'); dot(x + .03, .6 - y, '#d8ff9a'); } },
    hat:({rect, circ, dot}, f) => { const p = f ? .01 : 0; circ(.5, .02, .13 + p, '#6ad84a'); circ(.32, .08, .09, '#8ae04a'); circ(.68, .06, .09 - p, '#8ae04a'); dot(.48, -.04, '#d8ff9a', 2); rect(.3, .22, .4, .07, '#2a2a34'); dot(.38, .25, '#9ae8ff', 2); dot(.6, .25, '#9ae8ff', 2); }}, 32),
  midboss:zpolice(({rect, circ, dot}) => { circ(.5, .24, .25, ZNV, true); rect(.24, .2, .52, .05, ZBD); rect(.3, .27, .4, .05, '#9ac8ff'); dot(.48, .02, ZBD, 2); }, 32), // 진압 대장: 금줄 헬멧
  captain:ztank32({front:({rect, dot}, f) => { const y = f ? .01 : 0; rect(.03, .32 + y, .48, .56, ZSB); rect(.06, .35 + y, .08, .5, ZSBL); rect(.03, .58 + y, .48, .03, ZNV); dot(.26, .66 + y, ZBD, 2); }}), // 탱크: 왼쪽 큰 방패 (판정 shieldSide와 같음)
  butcher:ztank32({front:({rect, dot}, f) => { rect(.3, .44, .4, .4, '#f0e8e0'); rect(.3, .44, .4, .05, '#c8c0b8'); dot(.4, .56, ZBL, 2); dot(.56, .66, ZBL, 2); dot(.46, .74, ZBL); // 피 묻은 앞치마 + 오른손 큰 식칼
      const y = f ? .02 : 0; rect(.84, .2 + y, .14, .3, '#c8d0dc'); rect(.84, .2 + y, .14, .04, '#e8eef4'); rect(.88, .5 + y, .06, .14, '#6a4a2a'); dot(.9, .3 + y, ZBL, 2); },
    hat:({rect}) => { rect(.36, .04, .28, .06, '#f4f4f4'); rect(.4, -.02, .2, .07, '#f4f4f4'); }}),
  digger:ztank32({front:({rect, dot}, f) => { rect(.3, .46, .4, .36, '#6a5a3a'); rect(.42, .46, .04, .36, '#4a3a22'); rect(.54, .46, .04, .36, '#4a3a22'); // 흙 묻은 멜빵바지 + 왼손 삽
      const y = f ? .02 : 0; rect(.06, .14 + y, .05, .5, '#8a6a3a'); rect(.01, .6 + y, .15, .16, '#9aa4b4'); rect(.02, .72 + y, .13, .04, '#6a7080'); for (const [a, b] of [[.36, .6], [.6, .7], [.48, .78]]) dot(a, b, '#4a3a22', 2); },
    hat:({rect, dot}) => { rect(.32, .06, .36, .05, '#3a2a1a'); rect(.38, -.02, .24, .1, '#3a2a1a'); dot(.48, 0, '#ffe14a', 2); }}), // 광부 모자 + 램프
  paladin:ztank32({hat:({rect}) => { rect(.3, -.14, .4, .24, ZWH); rect(.3, .06, .4, .04, '#c8c8d0'); rect(.46, -.11, .08, .18, ZBL); rect(.4, -.06, .2, .08, ZBL); rect(.42, -.18, .16, .05, '#c8c8d0'); }, // 수간호 탱크: 머리에 인 큰 메디팩
    front:({rect}) => { rect(.36, .46, .28, .22, ZWH); rect(.47, .49, .06, .16, ZBL); rect(.41, .54, .18, .06, ZBL); }}),
  archmage:ztank32({hat:(D, f) => flames(D, f, .8, 0), back:({rect, circ}) => { rect(.16, .1, .14, .3, '#d8402a'); rect(.7, .1, .14, .3, '#d8402a'); circ(.23, .1, .07, '#d8402a'); circ(.77, .1, .07, '#d8402a'); }, // 화염 탱크: 머리 불꽃 + 등 가스통
    front:({rect, circ}) => { rect(.46, .74, .08, .12, '#4a4a4a'); circ(.5, .92, .07, '#ff8a2a'); circ(.5, .92, .03, '#ffe14a'); }}),
};
// ---------- 주인공: 탑뷰 포탑 거북. 몸은 위(좀비 쪽)를 보고, 등 위 포탑만 aim 방향으로 돈다. g = 다리 걸음(-1/0/1) ----------
// o = 변형(TV): skin·head 피부, shell·shell2 등딱지 겉·안, spot 무늬, R 등딱지 크기, box 상자 등딱지, wings 날개, guns 포신 각도(조준 기준), gl·gw 포신 길이·굵기, twin 쌍포, gc·tip 포신 색
// h = 몸 방향(0 = 머리가 위). 포탑은 몸과 따로 aim(화면 각도)을 본다
function turtleSprite(aim, g, o = {}, h = 0) { // 32칸에 1:1로 그림 (좀비 도트와 같은 밀도): 그늘·하이라이트·흰 테·발톱까지
  const c = mkCanvas(32, 32), x = c.getContext('2d'), sk = o.skin || '#7ab84a', R = Math.min(11, Math.round((o.R || 11)*.9)), cy = 18;
  const C = (cx, y, r, k) => { x.fillStyle = k; x.beginPath(); x.arc(cx, y, r, 0, 7); x.fill(); }, Rc = (a, b, w, hh, k) => { x.fillStyle = k; x.fillRect(a, b, w, hh); };
  const shade = (cx, y, r, base, dk, lt) => { C(cx, y, r, dk); C(cx - .9, y - .9, r - 1, base); if (lt) C(cx - r*.45, y - r*.45, Math.max(1, r*.28), lt); }; // 오른쪽 아래 그늘 + 왼쪽 위 빛
  x.translate(16, cy); x.rotate(h); x.translate(-16, -cy);
  for (const [lx, ly, sg] of [[-1, -1, 1], [1, -1, -1], [-1, 1, -1], [1, 1, 1]]) { const px_ = 16 + lx*(R*.78 + 1.5), py_ = cy + ly*(R*.62 + 1) + g*1.6*sg; // 다리 + 발톱 (대각선으로 삐져나옴)
    shade(px_, py_, 3.4, sk, dark(sk, .3)); Rc(px_ + lx*2.4 - .5, py_ + ly*2.4 - .5, 1, 1, '#f4efe0'); Rc(px_ + lx*2.6 - .5 - ly, py_ + ly*1.4 - .5, 1, 1, '#f4efe0'); }
  C(16, cy + R + 1.5, 1.8, dark(sk, .2));                                                                   // 꼬리
  if (o.wings) for (const m of [-1, 1]) { const P = (pts, k) => { x.fillStyle = k; x.beginPath(); pts.forEach(([a, b]) => x.lineTo(16 + m*a, cy + b)); x.fill(); }; // 박쥐 날개: 아래 가장자리가 물결진 막 + 안쪽 밝은 막 + 뼈대 3줄 + 끝 발톱
    P([[5, -6], [15, -12], [15.5, -3], [14, 3], [11.5, 1], [9, 5], [6.5, 2.5]], o.wings); P([[7, -5], [13.5, -9.5], [13.2, -2], [10.8, -.5], [8.5, 2]], lite(o.wings, .2));
    x.strokeStyle = dark(o.wings, .4); x.lineWidth = 1; for (const [a, b] of [[15, -12], [14, 3], [9, 5]]) { x.beginPath(); x.moveTo(16 + m*6, cy - 4); x.lineTo(16 + m*a, cy + b); x.stroke(); }
    x.fillStyle = '#f4efe0'; x.fillRect(16 + m*15 - .5, cy - 12.5, 1, 1); }
  const hy = cy - R - 3; shade(16, hy, 4.6, o.head || '#8ad05a', dark(o.head || '#8ad05a', .25), lite(o.head || '#8ad05a', .35)); // 머리
  if (o.ears) for (const m of [-1, 1]) { x.fillStyle = o.head; x.beginPath(); x.moveTo(16 + m*2.5, hy - 2.5); x.lineTo(16 + m*6.5, hy - 5); x.lineTo(16 + m*4.8, hy + .5); x.fill(); Rc(16 + m*4.6 - .5, hy - 2.6, 1, 1, '#ff8aa0'); } // 박쥐 귀
  if (o.fangs) { Rc(15, hy + 2, 1, 1, '#ffffff'); Rc(16, hy + 2, 1, 1, '#ffffff'); }                          // 송곳니
  for (const ex of [14, 18]) { Rc(ex - 1, hy - 2, 2, 2, '#ffffff'); Rc(ex - (ex < 16 ? 0 : 1), hy - 1, 1, 1, '#1a1010'); }  // 눈: 흰자 + 눈동자
  Rc(12, hy + 1, 1, 1, '#ff8aa0'); Rc(19, hy + 1, 1, 1, '#ff8aa0');                                           // 볼터치
  if (o.box) { const sh = o.shell, s2 = o.shell2; Rc(16 - R - 1, cy - R, R*2 + 2, R*2, '#fff4e0'); Rc(16 - R, cy - R + 1, R*2, R*2 - 2, dark(sh, .3)); Rc(16 - R, cy - R + 1, R*2 - 1, R*2 - 3, sh); // 보물상자 등딱지
    Rc(16 - R + 1, cy - R + 2, R*2 - 3, R - 3, s2); Rc(16 - R + 1, cy - R + 2, R*2 - 3, 1, lite(s2, .3)); Rc(16 - R, cy - 1, R*2, 2, o.spot); Rc(15, cy - R + 1, 2, R*2 - 2, o.spot); Rc(15, cy + 2, 2, 2, '#2a1a10'); }
  else { C(16, cy, R + 1.5, '#fff4e0'); if (o.rock) for (let k = 0; k < 8; k++) { const d = k*TAU/8 + .3; C(16 + Math.cos(d)*(R + .6), cy + Math.sin(d)*(R + .6), 2.3, dark(o.shell, .3)); } // 바위: 테두리가 울퉁불퉁
    shade(16, cy, R, o.shell || '#8a5a32', dark(o.shell || '#8a5a32', .35));   // 흰 테 + 등딱지 (그늘)
    C(16 - .5, cy - .5, R*.55, o.shell2 || '#a8703e');                                                            // 가운데 판
    for (let k = 0; k < 6; k++) { const d = k*Math.PI/3 + Math.PI/6; C(16 + Math.cos(d)*R*.74, cy + Math.sin(d)*R*.74, o.spotR ? o.spotR*.8 : 1.6, o.spot || '#6a4224'); } // 둘레 판 무늬
    if (o.rock) { x.strokeStyle = dark(o.shell, .5); x.lineWidth = 1; for (const [a, b, c2, d] of [[-.85, -.15, -.25, .15], [-.25, .15, -.1, .7], [.3, -.85, .1, -.25], [.75, .3, .25, .6]]) { x.beginPath(); x.moveTo(16 + a*R, cy + b*R); x.lineTo(16 + c2*R, cy + d*R); x.stroke(); } // 금
      for (const [a, b] of [[-.5, .5], [.55, -.4], [-.15, -.75]]) { C(16 + a*R, cy + b*R, 2.2, '#4a7a32'); C(16 + a*R - .6, cy + b*R - .6, 1.2, '#8ac85a'); }   // 이끼 덩이
      Rc(16 + Math.round(R*.35), cy + Math.round(R*.3), 2, 2, '#6ad8f0'); Rc(16 + Math.round(R*.35), cy + Math.round(R*.3), 1, 1, '#ffffff'); } // 박힌 광석
    C(16 - R*.5, cy - R*.55, 1.3, 'rgba(255,255,255,.55)'); }                                                     // 등딱지 반짝
  x.setTransform(1, 0, 0, 1, 0, 0); x.translate(16, cy); x.rotate(aim);
  const gl = Math.round((o.gl || 11)*.8), gw = Math.max(3, Math.round((o.gw || 5)*.8)), gc = o.gc || '#9aa4b4';
  const gun = y => { Rc(2, y - gw/2, gl, gw, gc); Rc(2, y + gw/2 - 1, gl, 1, dark(gc, .35)); Rc(2, y - gw/2, gl, 1, lite(gc, .4)); Rc(gl, y - gw/2 - 1, 3, gw + 2, '#c8d0dc'); Rc(gl + 2, y - 1, 1, 2, o.tip || '#2a6ad8'); }; // 포신: 윗면 빛 + 아랫면 그늘 + 포구
  for (const off of o.guns || [0]) { x.rotate(off); if (o.twin) { gun(-2.5); gun(2.5); } else gun(0); x.rotate(-off); }
  x.setTransform(1, 0, 0, 1, 0, 0); shade(16, cy, 3.6, '#c8d0dc', '#6a7484'); Rc(15, cy - 2, 1, 1, '#ffffff');      // 포탑 받침
  return pixOutline(c, [34, 26, 24, 255]);
}
// 캐릭터별 거북: 특성에 맞춘 변형 (말랑 = 젤리 등딱지·갈라지는 포신, 포실 = 버섯 갓·독 포신, 팔락 = 박쥐 날개·긴 포신, 덥썩 = 보물상자, 돌돌 = 이끼 낀 바위·쌍포)
const TV = {hero:{},
  slime:{skin:'#7ac8e8', head:'#8ad8f0', shell:'#4aa8e8', shell2:'#8ad8ff', spot:'#e0f6ff', spotR:1.6, R:12.5, guns:[-.32, .32], gl:9},
  mushroom:{skin:'#e8d0a8', head:'#f0dcb4', shell:'#d83a2a', shell2:'#e85a48', spot:'#fff4e0', spotR:2.8, gc:'#8a5ac8', tip:'#7ddc4a'},
  bat:{skin:'#9a7ad0', head:'#a88ad8', shell:'#4a2a7a', shell2:'#6a4a9a', spot:'#2a1a4a', wings:'#4a2e6a', ears:true, fangs:true, gl:15, gw:4, tip:'#ff5a7a'},
  mimic:{skin:'#e08a7a', head:'#e89a8a', box:true, shell:'#a8683a', shell2:'#c8884a', spot:'#ffd34a', gc:'#ffd34a', tip:'#ff5a3a'},
  golem:{skin:'#9aa0a8', head:'#aab0b8', shell:'#7a8088', shell2:'#8e949c', spot:'#646a72', spotR:2, rock:true, twin:true, gw:4.5, gc:'#6a7078'}};
const SPR = {hero:turtleSprite(-Math.PI/2, 0)}, TINT = {frozen:'#bfe9ff', poison:'#7ddc4a', burn:'#ff7a2e', flash:'#ffffff', rage:'#ff3030', hit:'#ff2a2a'}; // hit = 붉은 테두리 (rimmed), 나머지는 색 덮기
SPR.hero.k = .5; // 메뉴용 정지 거북은 32칸이라 옛 18칸 도트 기준 배율의 절반
for (const t in ZART) for (const f of [0, 1]) { // 키: 종류 + 상태틴트 + 프레임('1'). 침략 상대(rival)는 rivalSprite로 그린다
  const base = ZART[t](f);
  SPR[t + (f ? '1' : '')] = base; for (const k in TINT) SPR[t + '_' + k + (f ? '1' : '')] = shade(base, k);
}
const SPR_GEM = sprite(['....k', '...kc', '..kcw', '.kccw', 'kcccc', '.kccd', '..kcd', '...kd', '....k'], {c:'#9fe0ff', d:'#3a96f0'});   // 경험치 보석
const SPR_UP = [0, 1].map(f => { // 무료 강화 = 톱니 코어 16×16: 금 톱니 8개 + 파란 코어. 프레임 둘(톱니 22.5° 어긋남)이 번갈아 돌아가는 느낌
  const c = mkCanvas(16, 16), x = c.getContext('2d'), C = (k, r) => { x.fillStyle = k; x.beginPath(); x.arc(8, 8, r, 0, 7); x.fill(); };
  x.save(); x.translate(8, 8); x.rotate(f*Math.PI/8); x.fillStyle = '#ffd34a'; for (let k = 0; k < 8; k++) { x.rotate(Math.PI/4); x.fillRect(-1.5, -7.5, 3, 3); } x.restore();
  C('#ffd34a', 5); C('#c89838', 3.4); C('#5ad8ff', 2); x.fillStyle = '#ffffff'; x.fillRect(7, 6, 1, 1);
  return pixOutline(c, [43, 29, 20, 255]);
});
const ballCache = {};
function ballSprite(fns, R) { // 반지름 R 픽셀 원, 기능 수만큼 색 분할
  const key = fns.join() + R;
  if (ballCache[key]) return ballCache[key];
  const d = 2*R + 1, c = mkCanvas(d, d), x = c.getContext('2d'), n = fns.length;
  for (let j = 0; j < d; j++) for (let i = 0; i < d; i++) {
    const dx = i - R, dy = j - R, dist = Math.hypot(dx, dy);
    if (dist > R + .3) continue;
    let col;
    if (dist > R - .7) col = PAL.k;
    else if (!n) col = '#f4efe6';
    else col = FN[fns[Math.floor(((Math.atan2(dx, -dy) + Math.PI*2) % (Math.PI*2))/(Math.PI*2/n))]].color;
    if (dist <= R - .7 && col !== PAL.k && (j === R || (R >= 4 && Math.abs(i - R) === Math.floor(R/2) && j === R - 2))) col = dark(col, .28); // 회전이 보이는 줄무늬
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }
  return ballCache[key] = c;
}
const BG = (() => { // 4px 단위 폐허 거리: 흙바닥 + 깨진 벽돌·잔해·타이어·마른 핏자국·금
  const r = mulberry32(42), c = mkCanvas(W/4, H/4), x = c.getContext('2d'), shades = ['#40322a', '#46372b', '#3a2e25', '#4c3c2e'];
  const R = (k, a, b, w, h) => { x.fillStyle = k; x.fillRect(a, b, w, h); }, at = () => [Math.floor(r()*c.width), Math.floor(r()*c.height)];
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) R(shades[Math.floor(r()*r()*4)], i, j, 1, 1);
  for (let k = 0; k < 14; k++) { let [a, b] = at(); for (let n = 0; n < 6 + r()*8; n++) { R('#2a2018', a, b, 1, 1); a += r() < .5 ? 1 : -1; b += 1; } } // 금
  for (let k = 0; k < 40; k++) { const [a, b] = at(); R('#8a4436', a, b, 3, 2); R('#5e2e24', a, b + 2, 3, 1); }                  // 깨진 벽돌 조각
  for (let k = 0; k < 70; k++) { const [a, b] = at(); R(r() < .5 ? '#6a5a4a' : '#5a4a3c', a, b, 1 + Math.floor(r()*2), 1); }        // 자갈
  for (let k = 0; k < 8; k++) { const [a, b] = at(); R('#4a1810', a, b, 4, 2); R('#4a1810', a + 1, b + 2, 2, 1); R('#4a1810', a + 4, b + 1, 1, 1); } // 마른 핏자국
  for (let k = 0; k < 3; k++) { const [a, b] = at(); R('#1a1614', a, b, 6, 6); R('#2a2420', a + 1, b + 1, 4, 4); R('#40322a', a + 2, b + 2, 2, 2); } // 버려진 타이어
  for (let k = 0; k < 4; k++) { const [a, b] = at(); R('#6a7078', a, b, 5, 1); R('#3a3e44', a + 1, b + 1, 4, 1); }                  // 부러진 철근
  for (let k = 0; k < 20; k++) { const [a, b] = at(); R('#4a6a34', a, b, 1, 1); }                                              // 틈새 잡초
  return c;
})();
// ---------- 사람 캐릭터 (16칸, 엔터 더 건전풍: 큰 머리·짧은 몸·손에 든 총) ----------
// 글자 = 색 역할: H 모자·머리 주색, h 그늘·챙, A 머리카락, s 피부, S 피부 그늘, e 눈, m 입, T 눈물, c 옷, C 옷 무늬, p 바지, b 신발, g 총, G 총 밝은 부분, X 소품 강조색(죽으면 X 눈)
const HFACE = {'':['....ssssssss....', '....sessssesS...', '....ssssssssS...', '.....SSSSSS.....'],
  happy:['....sesssses....', '....ssssssssS...', '....sssmmsssS...', '.....SSSSSS.....'],
  sad:['....ssssssss....', '....sessssesS...', '....sTssssTsS...', '.....SSmmSS.....'],
  joy:['....sesssses....', '....sTssssTsS...', '....sTsmmsTsS...', '.....SSSSSS.....'],
  dead:['....ssssssss....', '....sKssssKsS...', '....ssssssssS...', '.....SSmmSS.....']};
const HHEAD = {
  helmet:{r:['................', '......HHHH......', '.....HHHHHH.....', '....HHHHHHHH....', '....HhhhhhhH....']},
  cap:{r:['................', '.....HHHHHH.....', '....HHHHHHHH....', '....HHHHXHHH....', '...hhhhhhhhhh...']},
  ponytail:{r:['................', '.....AAAAAA.....', '....AAAAAAAA....', '...AAAAAAAAAA...', '...AAAAAAAAAAAA.'], side:{5:'.AA', 6:'.AA', 7:'.A.'}},
  mohawk:{r:['.......HH.......', '.......HH.......', '......HHHH......', '....hhHHHHhh....', '....hhhhhhhh....']},
  afro:{r:['.....AAAAAA.....', '...AAAAAAAAAA...', '..AAAAAAAAAAAA..', '..AAAAAAAAAAAA..', '..AAAAAAAAAAAA..'], frame:'A'},
  chef:{r:['.....HHHHHH.....', '....HHHHHHHH....', '....HHHHHHHH....', '.....HHHHHH.....', '....hhhhhhhh....']},
  hood:{r:['................', '.....HHHHHH.....', '....HHHHHHHH....', '...HHHHHHHHHH...', '...HHhhhhhhHH...'], frame:'H'},
};
const HBODY = {
  jacket:['....cccccccc....', '...ccccCCcccc...', '..sccccCCcccc...', '...ccccccccsGg..', '....pppppppp.gg.', '....ppp..ppp....', '....bbb..bbb....'],
  coat:['....cccccccc....', '...ccCccccCcc...', '..scccccccccc...', '...ccccccccsGg..', '....cccccccc.gg.', '....ccc..ccc....', '....bbb..bbb....'],
  armor:['...CccccccccC...', '..CCccCCCCccCC..', '..sCccccccccC...', '...CccccccccsGg.', '....pppppppp.gg.', '....ppp..ppp....', '....bbb..bbb....'],
};
const HSKIN = {light:['#f8d4b0', '#e0b088'], tan:['#e8b890', '#c8946c'], brown:['#b87a50', '#94603a'], dark:['#7a4a30', '#5a3420']};
// 캐릭터별 모습 (hero_mockups.html 시안 번호). back = 뒷모습에서 머리를 덮는 색 역할
const LOOK = {
  hero:{head:'ponytail', body:'jacket', skin:'light', back:'A', p:{A:'#7a4428', c:'#ff7aa8', C:'#d84a80', p:'#3a4a6a', b:'#4a2a20', g:'#4a4a58', G:'#9a9aa8'}},             // 3 생존자 소녀
  golem:{head:'helmet', body:'armor', skin:'tan', back:'H', p:{H:'#5a6a3a', h:'#3e4a28', c:'#6a7a4a', C:'#3e4a28', p:'#4a4a3a', b:'#2a2a2a'}},                                 // 1 군인
  slime:{head:'helmet', body:'coat', skin:'light', back:'H', p:{H:'#ffd23a', h:'#c8901a', c:'#e8731a', C:'#fff6a0', p:'#3a3a44', b:'#2a2a2a', g:'#6a4a2a'}},                    // 2 소방관
  police:{head:'cap', body:'jacket', skin:'brown', back:'H', p:{H:'#2a3a6a', h:'#141e3a', X:'#ffd84a', c:'#7aa8e0', C:'#ffd84a', p:'#1a2440', b:'#141414'}},                   // 4 경찰
  mushroom:{head:'afro', body:'coat', skin:'light', back:'A', p:{A:'#f0f0f8', e:'#2a6ad8', c:'#f4f4f8', C:'#9ad8ff', p:'#4a4a5a', b:'#2a2a2a', g:'#2ab8a0', G:'#9affe8'}},       // 5 과학자
  bat:{head:'mohawk', body:'jacket', skin:'tan', back:'H', p:{H:'#ff3aa8', h:'#c8946c', c:'#2a2a34', C:'#c8c8d8', p:'#3a2a4a', b:'#1a1a1a', g:'#c83a3a', G:'#ff8a8a'}},           // 6 펑크
  chef:{head:'chef', body:'coat', skin:'brown', back:'H', p:{H:'#f4f4f8', h:'#d0d0d8', c:'#f4f4f8', C:'#d8302a', p:'#2a2a34', b:'#2a2a2a', g:'#d8302a', G:'#ff8a6a'}},          // 10 요리사
  mimic:{head:'hood', body:'jacket', skin:'dark', back:'H', p:{H:'#5a5a6a', h:'#3a3a44', X:'#4ae08a', c:'#3a3a44', C:'#4ae08a', p:'#2a2a34', b:'#1a1a1a', g:'#2a2a34', G:'#4ae08a'}}, // 11 해커
};
const HUMAN_IDS = Object.keys(LOOK);
function humanRows(L, view, mood, f) { // view 'front' | 'back', f = 걸음 프레임 0/1
  const H = HHEAD[L.head], body = HBODY[L.body];
  let rows;
  if (view === 'back') { const hair = '....' + L.back.repeat(8) + '....'; rows = [...H.r, hair, hair, hair, '.....SSSSSS.....', ...body.map(r => r.replace(/[gG]/g, '.'))];
    ['gG', 'gG', 'gG', 'gg', 'ss', 'sc', 'cc', 'cc', 'cc', 'cc'].forEach((t, k) => { const a = [...rows[k]]; a[12] = t[0]; a[13] = t[1]; rows[k] = a.join(''); }); } // 총은 머리 옆으로 위를 겨눔
  else { rows = [...H.r, ...(HFACE[mood] || HFACE['']), ...body];
    for (const k in H.side || {}) { const a = [...rows[k]]; [...H.side[k]].forEach((ch, i) => { a[12 + i] = ch; }); rows[k] = a.join(''); } // 포니테일
    if (H.frame) for (const k of [5, 6, 7]) { const a = [...rows[k]]; a[3] = H.frame; a[12] = H.frame; rows[k] = a.join(''); } }   // 후드·곱슬머리가 얼굴 옆을 감쌈
  if (f === 1) { rows[14] = rows[14].replace('ppp..ppp', 'ppp...pp').replace('ccc..ccc', 'ccc...cc'); rows[15] = rows[15].replace('bbb..bbb', 'bbb.....'); } // 걸음: 오른발을 듦
  if (f === 2) { rows[14] = rows[14].replace('ppp..ppp', 'pp...ppp').replace('ccc..ccc', 'cc...ccc'); rows[15] = rows[15].replace('bbb..bbb', '.....bbb'); } // 왼발을 듦
  return rows;
}
function humanCanvas(rows, pal) { // 글자 지도 → 캔버스 + 바깥 윤곽(좀비와 같은 색)
  const Hh = rows.length, Ww = rows[0].length, px = rows.map(r => [...r].map(ch => ch === '.' ? null : pal[ch] || '#ff00ff')), o = px.map(r => r.slice());
  for (let j = 0; j < Hh; j++) for (let i = 0; i < Ww; i++) if (!px[j][i] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => px[j + b] && px[j + b][i + a])) o[j][i] = '#1a1420';
  const c = mkCanvas(Ww, Hh), x = c.getContext('2d');
  for (let j = 0; j < Hh; j++) for (let i = 0; i < Ww; i++) if (o[j][i]) { x.fillStyle = o[j][i]; x.fillRect(i, j, 1, 1); }
  return c;
}
const HUMAN = {};
const humanLook = id => LOOK[id] || LOOK.hero;
function humanSpr(look, view = 'front', mood = '', f = 0, flip = false) { // look = LOOK 항목 (침략 상대는 옷 색을 바꾼 복사본). 캐시
  const k = (look.key || look.head + look.body + look.p.c) + view + mood + f + flip; if (HUMAN[k]) return HUMAN[k];
  const pal = {s:HSKIN[look.skin][0], S:HSKIN[look.skin][1], e:'#2a1a10', g:'#3a3a44', G:'#8a8a98', m:'#8a2a2a', T:'#6ac0ff', K:'#2a1a10', X:'#2a1a10', ...look.p};
  let c = humanCanvas(humanRows(look, view, mood, f), pal);
  if (flip) { const d = mkCanvas(c.width, c.height), x = d.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); c = d; }
  return HUMAN[k] = c;
}
function heroSpr(id, aim, g) { // 전투 주인공: 위쪽을 쏘면 뒷모습, 아래쪽이면 정면. 왼쪽을 겨누면 좌우 반전. g = 걸음(-1/0/1). blit 배율 2에서 64px
  const c = humanSpr(humanLook(id), Math.sin(aim) < .2 ? 'back' : 'front', '', g > 0 ? 1 : 0, Math.cos(aim) < -.25); c.k = 2; return c;
}
// 메뉴·팝업용 사람: s = 크기 기준 (전체 키 ≈ 2.3s, 예전 거북 등딱지 반지름과 같은 값을 그대로 씀). mood '' | happy | sad | joy
function uiHero(x, y, s, look, mood = '', T = performance.now()/1000) {
  const spr = humanSpr(look, 'front', mood), k = Math.max(1, Math.round(s*2.3/16)), w = spr.width*k, h = spr.height*k, bob = mood === 'sad' ? 0 : Math.round(Math.sin(T*3)*s*.03);
  ctx.beginPath(); ctx.ellipse(x, y + h/2 - k, w*.32, k*1.6, 0, 0, TAU); ctx.fillStyle = 'rgba(20,8,50,.22)'; ctx.fill(); // 그림자
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, Math.round(x - w/2), Math.round(y - h/2 + bob), w, h); ctx.imageSmoothingEnabled = sm;
  if (mood === 'joy') for (let i = 0; i < 2; i++) { const u = (T*1.4 + i*.5)%1; ctx.globalAlpha = 1 - u; glDropAt(x + (i ? 1 : -1)*k*(4 + u*3), y - h/2 + k*(8 + u*6), k*.35); ctx.globalAlpha = 1; } // 기쁨의 눈물이 흩날림
}
function uiHeroDead(x, y, s, look, T = performance.now()/1000) { // 처치된 상대: 옆으로 쓰러짐 + X 눈 + 머리 위 도는 별
  const spr = humanSpr(look, 'front', 'dead'), k = Math.max(1, Math.round(s*2.3/16)), w = spr.width*k, h = spr.height*k;
  ctx.beginPath(); ctx.ellipse(x, y + w*.3, h*.5, k*1.6, 0, 0, TAU); ctx.fillStyle = 'rgba(20,8,50,.22)'; ctx.fill();
  ctx.save(); ctx.translate(x, y + w*.1); ctx.rotate(-Math.PI/2 + Math.sin(T*2.2)*.03); const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, -w/2, -h/2, w, h); ctx.imageSmoothingEnabled = sm; ctx.restore();
  for (let i = 0; i < 3; i++) { const a = T*3 + i*TAU/3; uiStar(x - h*.42 + Math.cos(a)*k*5, y - k*6 + Math.sin(a)*k*1.5, k*1.2, UI.gold); }
}
// 침략 상대 = 다른 유저의 캐릭터: 8종 중 하나 + 옷 색이 상대 색
const rivalLook = r => { const base = LOOK[HUMAN_IDS[[...r.id].reduce((a, ch) => a + ch.charCodeAt(0), 0)%HUMAN_IDS.length]]; return {...base, key:'rv' + r.id, p:{...base.p, c:r.hue, C:dark(r.hue, .3)}}; };
function blit(spr, x, y, ps) { ps *= spr.k || 1; ctx.drawImage(spr, Math.round(x - spr.width*ps/2), Math.round(y - spr.height*ps/2), spr.width*ps, spr.height*ps); }
function px(x, y, s, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x - s/2), Math.round(y - s/2), s, s); }

const TAU = Math.PI*2, INK = '#2b1d14';
const TURTLE = {};
// 침략 상대 = 다른 유저의 거북: 등딱지가 상대 색, 포신이 등급 + 1개 (사방으로 돌며 쏨)
const rivalTV = r => ({shell:r.hue, shell2:lite(r.hue, .3), spot:dark(r.hue, .45), guns:[...Array(r.tier + 1)].map((_, k) => k*TAU/(r.tier + 1)), gl:9, gc:'#c8d0dc', tip:'#ff5a5a'});
const rivalSprites = {};
function rivalSprite(r, st = '', f = 0) { // 침략 상대: 정면(나를 봄) 사람, 걸음 2프레임. st = 상태 틴트
  const k = r.id + st + f; if (rivalSprites[k]) return rivalSprites[k];
  return rivalSprites[k] = st ? shade(rivalSprite(r, '', f), st) : humanSpr(rivalLook(r), 'front', '', f);
}
// 적 투사체 = 별: 15px 별을 그려 알파를 이진화한 도트. 프레임 둘이 번갈아 반짝(회전)
const SPR_BULLET = (() => { // 가시 총알 16×10: 뾰족한 탄두(오른쪽 = 진행 방향) + 꼬리 불꽃, 내 둥근 공과 실루엣이 다름
  const c = mkCanvas(16, 10), x = c.getContext('2d'), P = (k, pts) => { x.fillStyle = k; x.beginPath(); pts.forEach(([a, b]) => x.lineTo(a, b)); x.fill(); };
  P('#ff6a1a', [[5, 3], [0, 5], [5, 7]]); P('#ffd34a', [[15, 5], [9, 1.5], [4, 2.5], [4, 7.5], [9, 8.5]]); x.fillStyle = '#c89838'; x.fillRect(4, 2.5, 2, 5); x.fillStyle = '#fff6c0'; x.fillRect(8, 3, 3, 1);
  return pixOutline(c, [43, 29, 20, 255]);
})();
const SPR_SYR = (() => { // 주사기 16×8: 바늘(오른쪽 = 진행 방향) + 초록 약 + 흰 몸통 + 밀대
  const c = mkCanvas(16, 8), x = c.getContext('2d'), R = (k, a, b, w, h) => { x.fillStyle = k; x.fillRect(a, b, w, h); };
  R('#c8d0dc', 0, 3, 3, 2); R('#e8e8f0', 0, 1, 1, 6); R('#f4f4fa', 3, 2, 8, 4); R('#6ae04a', 6, 3, 5, 2); R('#a8b0c0', 11, 2, 1, 4); R('#d8dce8', 12, 3, 4, 1);
  return pixOutline(c, [43, 29, 20, 255]);
})();
const starCache = {};
function starSprite(c, core, fr) {
  const key = c + core + fr; if (starCache[key]) return starCache[key];
  const n = 15, cv2 = mkCanvas(n, n), g = cv2.getContext('2d');
  g.translate(7.5, 7.7); g.rotate(fr ? Math.PI/5 : 0); g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI/2 + i*Math.PI/5, r = i%2 ? 3.1 : 7; g.lineTo(Math.cos(a)*r, Math.sin(a)*r); }
  g.closePath(); g.lineJoin = 'round'; g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); g.fillStyle = c; g.fill(); g.fillStyle = core || '#fff'; g.fillRect(-1, -1, 2, 2);
  const id = g.getImageData(0, 0, n, n), d = id.data; for (let i = 3; i < d.length; i += 4) d[i] = d[i] < 110 ? 0 : 255;
  g.putImageData(id, 0, 0); return starCache[key] = cv2;
}

// 캐릭터 도트: 메뉴용 정지 거북 (포탑이 위를 봄). k = 0.5 (32칸이라 옛 18칸 배율의 절반)
const SPR_CHAR = {};
for (const id in TV) { SPR_CHAR[id] = id === 'hero' ? SPR.hero : turtleSprite(-Math.PI/2, 0, TV[id]); SPR_CHAR[id].k = .5; }

// ===== 도트 폭발 =====
const bhash = n => { const x = Math.sin(n*127.1)*43758.5453; return x - Math.floor(x); };
function boomPx(x, y, r, a = 1) { // 도트 불덩이: 8px 칸, 가운데 흰색 → 노랑 → 주황 → 빨강
  if (a <= 0 || r <= 0) return; const g = 8; ctx.globalAlpha = Math.min(1, a);
  for (let j = -r; j <= r; j += g) for (let i = -r; i <= r; i += g) { const d = Math.hypot(i, j)/r + (bhash(i*.7 + j*1.3) - .5)*.25; if (d > 1) continue;
    ctx.fillStyle = d < .3 ? '#fff8e0' : d < .55 ? '#ffe14a' : d < .8 ? '#ff8a2a' : '#c8301a'; ctx.fillRect(Math.round((x + i)/g)*g, Math.round((y + j)/g)*g, g, g); }
  ctx.globalAlpha = 1;
}
function boomFx(x, y, r, a, c) { // 범위 폭발 도트: 가운데 흰색 → 볼 색 → 어두운 볼 색 (6px 칸)
  if (a <= 0 || r <= 0) return; const g = 6, c2 = dark(c, .35); ctx.globalAlpha = Math.min(1, a);
  for (let j = -r; j <= r; j += g) for (let i = -r; i <= r; i += g) { const d = Math.hypot(i, j)/r + (bhash(i*.7 + j*1.3) - .5)*.3; if (d > 1) continue;
    ctx.fillStyle = d < .3 ? '#fff8e0' : d < .7 ? c : c2; ctx.fillRect(Math.round((x + i)/g)*g, Math.round((y + j)/g)*g, g, g); }
  ctx.globalAlpha = 1;
}
// ===== UI 키트 (도트 상자·버튼·리본·아이콘·볼 문양·잭팟 심볼·로비/메뉴 배경) =====
// ---------- UI v2: 뚜까펫풍 밝은 만화 UI (벡터, 굵은 보라 윤곽선). 핀볼 판이 메인 화면, 하단 탭으로 전투·장비·캐릭터 ----------
const UI = {ink:'#2a1450', cream:'#fff4d6', gold:'#ffd23a'};
// ---------- 도트 UI (시안 2): 4픽셀 칸으로 찍는 상자. 1칸 테 + 모서리 1칸 깎음 + 위 빛 + 아래 그늘. 글씨는 둥근 글꼴 그대로 ----------
const PXU = 4;
function pxBox(x, y, w, h, fill, o = {}) {
  const u = o.u || PXU, X = Math.round(x/u)*u, Y = Math.round(y/u)*u, Wd = Math.max(3, Math.round(w/u)), Ht = Math.max(3, Math.round(h/u));
  if (o.drop) { ctx.fillStyle = typeof o.drop === 'string' ? o.drop : 'rgba(10,2,30,.5)'; ctx.fillRect(X + u, Y + u*2, (Wd - 1)*u, Ht*u); }
  ctx.fillStyle = o.edge || UI.ink; ctx.fillRect(X + u, Y, (Wd - 2)*u, Ht*u); ctx.fillRect(X, Y + u, Wd*u, (Ht - 2)*u); // 테 (모서리 깎음)
  ctx.fillStyle = fill; ctx.fillRect(X + u, Y + u, (Wd - 2)*u, (Ht - 2)*u);
  if (o.light !== null) { ctx.fillStyle = o.light || 'rgba(255,255,255,.32)'; ctx.fillRect(X + u, Y + u, (Wd - 2)*u, u*(o.lh || 1)); }
  if (o.shade !== null) { const sh = Math.min(Ht - 3, o.sh || 2); ctx.fillStyle = o.shade || 'rgba(20,0,40,.22)'; ctx.fillRect(X + u, Y + (Ht - 1 - sh)*u, (Wd - 2)*u, sh*u); }
  return {X, Y, W:Wd*u, H:Ht*u, u};
}
const THEME = {orange:['#ffb43a', '#e8731a'], green:['#8ae04a', '#3f9a2a'], blue:['#6ac0ff', '#2a6ad0'], purple:['#a070f0', '#5a2fb0'], gray:['#a49cb8', '#625a78'], red:['#ff7a5a', '#d8302a'], yellow:['#ffe45a', '#e8a81a']};
const RCOL = {common:'#9a90b0', uncommon:'#4ab85a', rare:'#3a96f0', unique:'#ffb41a'}; // UI용 등급색 (밝은·어두운 배경 모두에서 보임)
function uiPath(x, y, w, h, r) { // 도트 둥근 상자 경로: 4픽셀 칸에 맞추고 모서리를 계단(칸 1~3개)으로 깎음. 클립·채우기·윤곽 모두 이 모양
  const u = PXU, X = Math.round(x/u)*u, Y = Math.round(y/u)*u, Wd = Math.max(2*u, Math.round(w/u)*u), Ht = Math.max(2*u, Math.round(h/u)*u);
  const n = Math.max(0, Math.min(3, Math.round(r/8), Math.floor(Wd/u/2) - 1, Math.floor(Ht/u/2) - 1)), st = [[1, 1], [1, 1], [2, 1]].slice(0, n); // 계단: (가로 칸, 세로 칸)
  ctx.beginPath(); let cx = X, cy = Y + n*u; ctx.moveTo(cx, cy);
  for (let i = n - 1; i >= 0; i--) { cy -= u; ctx.lineTo(cx, cy); cx += u; ctx.lineTo(cx, cy); }                      // 왼쪽 위
  cx = X + Wd - n*u; ctx.lineTo(cx, cy); for (let i = 0; i < n; i++) { cx += u; ctx.lineTo(cx, cy); cy += u; ctx.lineTo(cx, cy); } // 오른쪽 위
  cy = Y + Ht - n*u; ctx.lineTo(cx, cy); for (let i = 0; i < n; i++) { cy += u; ctx.lineTo(cx, cy); cx -= u; ctx.lineTo(cx, cy); } // 오른쪽 아래
  cx = X + n*u; ctx.lineTo(cx, cy); for (let i = 0; i < n; i++) { cx -= u; ctx.lineTo(cx, cy); cy -= u; ctx.lineTo(cx, cy); }      // 왼쪽 아래
  ctx.closePath();
}
function uiLine(c, lw) { ctx.lineJoin = 'miter'; ctx.lineCap = 'square'; ctx.strokeStyle = c || UI.ink; ctx.lineWidth = lw || 5; ctx.stroke(); }
function uiTxt(s, x, y, size, fill, al) { // 굵은 보라 외곽선 글씨
  ctx.font = '900 ' + size + 'px ' + FONT; ctx.textAlign = al || 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = UI.ink; ctx.lineWidth = Math.max(4, size*.24); ctx.strokeText(s, x, y); ctx.fillStyle = fill || '#fff'; ctx.fillText(s, x, y);
}
function wrapLines(s, size, maxW, w) { // 글자 크기 size로 maxW 안에 들어가게 나눈 줄 목록
  ctx.font = (w || 700) + ' ' + size + 'px ' + FONT; const out = []; let cur = '';
  for (const word of String(s).split(' ')) {
    const t = cur ? cur + ' ' + word : word;
    if (ctx.measureText(t).width <= maxW) { cur = t; continue; }
    if (cur) out.push(cur);
    cur = ''; for (const ch of word) { if (ctx.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ''; } cur += ch; } // 한 단어가 칸보다 길면 글자 단위
  }
  if (cur) out.push(cur); return out;
}
function fitWrap(s, size, maxW, maxLines, w, min = 12) { // 줄 수가 maxLines를 넘지 않을 때까지 글자를 줄임 → {lines, size}
  let z = size, L = wrapLines(s, z, maxW, w); while (L.length > maxLines && z > min) { z--; L = wrapLines(s, z, maxW, w); }
  return {lines:L, size:z};
}
function uiWrap(s, x, y, size, maxW, maxLines, c, al, w, lh = 1.25) { // 줄바꿈해서 그리고 다 쓴 높이를 돌려줌 (y = 첫 줄 글자 바닥)
  const f = fitWrap(s, size, maxW, maxLines, w); f.lines.forEach((t, i) => uiLabel(t, x, y + i*f.size*lh, f.size, c, al, w)); return f.lines.length*f.size*lh;
}
function uiLabel(s, x, y, size, c, al, w) { ctx.font = (w || 700) + ' ' + size + 'px ' + FONT; ctx.textAlign = al || 'left'; ctx.fillStyle = c || UI.ink; ctx.fillText(s, x, y); } // 외곽선 없는 글씨 (밝은 패널 위)
function uiBtn(b, label, theme, size, off) { // 도트 버튼: 위쪽 밝은 띠 + 아래 진한 띠 + 큰 버튼은 가끔 빛이 지나감
  const [c1, c2] = THEME[off ? 'gray' : theme || 'orange'], u = PXU;
  const r = pxBox(b.x, b.y, b.w, b.h, c1, {drop:dark(c2, .5), light:lite(c1, .35), lh:2, shade:c2, sh:Math.max(2, Math.round(b.h/u*.28))});
  if (b.h >= 80 && !off) { const t = (performance.now()/1000 + b.x/400)%3.2/1.1; if (t < 1) { const sx = Math.round((r.X + t*(r.W + 60))/u)*u; ctx.fillStyle = 'rgba(255,255,255,.3)'; for (let k = 1; k < r.H/u - 1; k++) { const xx = sx - k*u; if (xx > r.X && xx < r.X + r.W - 3*u) ctx.fillRect(xx, r.Y + k*u, u*2, u); } } }
  if (label) uiTxt(label, b.x + b.w/2, b.y + b.h/2 + (size || 30)*.36, size || 30, off ? '#ddd6ee' : '#fff');
}
function uiPanel(x, y, w, h, fill, lw) { pxBox(x, y, w, h, fill || UI.cream, {drop:true, u:lw >= 8 ? 5 : PXU}); }
function uiPill(x, y, w, h, fill) { pxBox(x, y, w, h, fill, {shade:null}); }
function uiBar(x, y, w, h, v, cols) { // 도트 막대: 칸 단위로 차오름
  const r = pxBox(x, y, w, h, '#1a0a3a', {light:null, shade:null}), u = r.u, cells = r.W/u - 2, n = Math.round(Math.max(0, Math.min(1, v))*cells);
  if (n > 0) { ctx.fillStyle = cols[1]; ctx.fillRect(r.X + u, r.Y + u, n*u, r.H - 2*u); ctx.fillStyle = cols[0]; ctx.fillRect(r.X + u, r.Y + u, n*u, Math.max(u, Math.floor((r.H - 2*u)/u/2)*u)); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(r.X + u, r.Y + u, n*u, u); }
}
function uiCoin(x, y, r) {
  const g = ctx.createRadialGradient(x - r*.3, y - r*.3, r*.1, x, y, r); g.addColorStop(0, '#fff3a0'); g.addColorStop(.6, '#ffd23a'); g.addColorStop(1, '#e8981a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); uiLine(UI.ink, Math.max(3, r*.2));
  ctx.beginPath(); ctx.arc(x, y, r*.6, 0, TAU); ctx.strokeStyle = 'rgba(160,90,0,.6)'; ctx.lineWidth = Math.max(2, r*.12); ctx.stroke();
  ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI/2 + k*Math.PI/5, d = k%2 ? r*.16 : r*.36; ctx.lineTo(x + Math.cos(a)*d, y + Math.sin(a)*d); } ctx.closePath(); ctx.fillStyle = 'rgba(190,110,0,.55)'; ctx.fill(); // 별 새김
}
// 볼 기능 문양: 좌표는 -1~1 안, 흰 바탕 + 보라 윤곽선. 18종이 색만이 아니라 모양으로도 구분된다
const GL_LW = .26;
const glFill = c => { ctx.fillStyle = c; ctx.fill(); uiLine(UI.ink, GL_LW); };
const glLine = (x1, y1, x2, y2, w = .2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); uiLine(UI.ink, w + .22); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); uiLine('#fff', w); };
const glArc = (r, a0, a1, w = .2) => { ctx.beginPath(); ctx.arc(0, 0, r, a0, a1); uiLine(UI.ink, w + .22); ctx.beginPath(); ctx.arc(0, 0, r, a0, a1); uiLine('#fff', w); };
const glDrop = (x, y, k, c) => { ctx.beginPath(); ctx.moveTo(x, y - k); ctx.bezierCurveTo(x + k*.2, y - k*.45, x + k*.75, y, x + k*.75, y + k*.35); ctx.arc(x, y + k*.35, k*.75, 0, Math.PI); ctx.bezierCurveTo(x - k*.75, y, x - k*.2, y - k*.45, x, y - k); glFill(c); };
const glStar4 = (x, y, k, c) => { ctx.beginPath(); [[0, -1], [.22, -.22], [1, 0], [.22, .22], [0, 1], [-.22, .22], [-1, 0], [-.22, -.22]].forEach(([a, b]) => ctx.lineTo(x + a*k, y + b*k)); ctx.closePath(); glFill(c); };
const GLYPH = {
  fire() { ctx.beginPath(); ctx.moveTo(0, -1); ctx.bezierCurveTo(.2, -.55, .75, -.35, .7, .25); ctx.bezierCurveTo(.65, .8, .2, 1, 0, 1); ctx.bezierCurveTo(-.2, 1, -.7, .8, -.7, .3); ctx.bezierCurveTo(-.7, -.1, -.4, -.3, -.35, -.6); ctx.bezierCurveTo(-.15, -.45, -.05, -.7, 0, -1); glFill('#fff'); ctx.beginPath(); ctx.moveTo(0, -.1); ctx.bezierCurveTo(.3, .15, .4, .45, .2, .7); ctx.bezierCurveTo(.1, .8, -.1, .8, -.2, .7); ctx.bezierCurveTo(-.4, .45, -.2, .2, 0, -.1); ctx.fillStyle = '#ffd23a'; ctx.fill(); },
  frost() { for (let k = 0; k < 3; k++) { const a = k*Math.PI/3 + Math.PI/6; glLine(Math.cos(a)*.95, Math.sin(a)*.95, -Math.cos(a)*.95, -Math.sin(a)*.95, .17); } ctx.beginPath(); ctx.arc(0, 0, .22, 0, TAU); glFill('#fff'); },
  poison() { glDrop(0, .05, .95, '#e8ffc0'); ctx.beginPath(); ctx.arc(-.22, .3, .14, 0, TAU); ctx.fillStyle = '#3f9a2a'; ctx.fill(); ctx.beginPath(); ctx.arc(.18, .5, .09, 0, TAU); ctx.fill(); },
  spark() { ctx.beginPath(); [[.25, -1], [-.55, .12], [-.05, .12], [-.25, 1], [.6, -.28], [.05, -.28]].forEach(([a, b]) => ctx.lineTo(a, b)); ctx.closePath(); glFill('#fff6a0'); },
  bomb() { ctx.beginPath(); ctx.arc(-.05, .2, .68, 0, TAU); glFill('#4a4a68'); ctx.beginPath(); ctx.arc(-.28, -.02, .17, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); glLine(.35, -.32, .62, -.62, .13); glStar4(.72, -.74, .26, '#ffd23a'); },
  split() { for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(k*.42, k*.1, .5, 0, TAU); glFill('#fff'); } },
  pierce() { glLine(0, 1, 0, -.35, .2); ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(.55, -.3); ctx.lineTo(-.55, -.3); ctx.closePath(); glFill('#fff'); glLine(-.4, .85, 0, .45, .14); glLine(.4, .85, 0, .45, .14); },
  vamp() { ctx.beginPath(); ctx.moveTo(0, .9); ctx.bezierCurveTo(-1.1, .1, -.75, -.9, 0, -.38); ctx.bezierCurveTo(.75, -.9, 1.1, .1, 0, .9); glFill('#ff9ab0'); ctx.beginPath(); ctx.arc(-.4, -.25, .13, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); },
  wind() { glArc(.72, Math.PI*1.05, Math.PI*2.15, .19); glArc(.38, 0, Math.PI*1.25, .17); glLine(.72, 0, .98, .22, .14); },
  giant() { for (let k = 0; k < 4; k++) { ctx.save(); ctx.rotate(k*Math.PI/2); ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(.42, -.5); ctx.lineTo(-.42, -.5); ctx.closePath(); glFill('#fff'); ctx.restore(); } ctx.beginPath(); ctx.arc(0, 0, .34, 0, TAU); glFill('#fff'); },
  homing() { glArc(.66, 0, TAU, .17); glLine(0, -1, 0, -.42, .17); glLine(0, 1, 0, .42, .17); glLine(-1, 0, -.42, 0, .17); glLine(1, 0, .42, 0, .17); ctx.beginPath(); ctx.arc(0, 0, .15, 0, TAU); glFill('#ff6a7a'); },
  curse() { ctx.beginPath(); ctx.arc(0, -.12, .72, 0, TAU); glFill('#fff'); ctx.beginPath(); ctx.rect(-.36, .35, .72, .5); glFill('#fff'); ctx.fillStyle = UI.ink; for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(k*.3, -.12, .2, .26, 0, 0, TAU); ctx.fill(); } ctx.beginPath(); ctx.moveTo(0, .12); ctx.lineTo(.1, .3); ctx.lineTo(-.1, .3); ctx.fill(); glLine(-.12, .4, -.12, .8, .07); glLine(.12, .4, .12, .8, .07); },
  bleed() { glDrop(-.22, .02, .9, '#ffd0d8'); glDrop(.5, .5, .5, '#ff9ab0'); glLine(-.75, -.65, .1, .45, .12); },
  crit() { glStar4(0, 0, 1, '#fff'); glStar4(.55, -.55, .34, '#fff6a0'); },
  stun() { for (const [a, b] of [[0, -.55], [-.55, .4], [.55, .4]]) { ctx.beginPath(); for (let k = 0; k < 10; k++) { const ang = -Math.PI/2 + k*Math.PI/5, d = k%2 ? .17 : .42; ctx.lineTo(a + Math.cos(ang)*d, b + Math.sin(ang)*d); } ctx.closePath(); glFill('#fff6a0'); } },
  echo() { ctx.beginPath(); ctx.arc(-.55, 0, .18, 0, TAU); glFill('#fff'); for (const r of [.5, .85, 1.2]) { ctx.beginPath(); ctx.arc(-.55, 0, r, -.9, .9); uiLine(UI.ink, .4); ctx.beginPath(); ctx.arc(-.55, 0, r, -.9, .9); uiLine('#fff', .18); } },
  meteor() { ctx.beginPath(); ctx.moveTo(-1, -1); ctx.lineTo(.12, -.28); ctx.lineTo(-.28, .12); ctx.closePath(); glFill('#ffe0b0'); ctx.beginPath(); ctx.arc(.38, .38, .5, 0, TAU); glFill('#ffb040'); ctx.beginPath(); ctx.arc(.24, .24, .14, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); },
  holy() { ctx.beginPath(); [[-.2, -1], [.2, -1], [.2, -.4], [.75, -.4], [.75, 0], [.2, 0], [.2, 1], [-.2, 1], [-.2, 0], [-.75, 0], [-.75, -.4], [-.2, -.4]].forEach(([a, b]) => ctx.lineTo(a, b)); ctx.closePath(); glFill('#fff'); glArc(1.0, Math.PI*1.2, Math.PI*1.8, .1); },
  lucky() { for (const [a, b] of [[0, -.45], [.45, 0], [0, .45], [-.45, 0]]) { ctx.beginPath(); ctx.arc(a, b, .42, 0, TAU); glFill('#e8ffd0'); } glLine(.1, .3, .45, 1, .14); },
  rot() { ctx.beginPath(); ctx.moveTo(-.7, .6); ctx.bezierCurveTo(-.9, -.2, -.4, -.9, 0, -.6); ctx.bezierCurveTo(.5, -.95, .95, -.2, .7, .6); ctx.closePath(); glFill('#e8dca8'); for (const [a, b] of [[-.25, 0], [.3, .15]]) { ctx.beginPath(); ctx.arc(a, b, .13, 0, TAU); ctx.fillStyle = '#6a5a30'; ctx.fill(); } },
  swift() { for (const k of [-.35, .35]) { ctx.beginPath(); ctx.moveTo(k - .35, -.7); ctx.lineTo(k + .35, 0); ctx.lineTo(k - .35, .7); ctx.lineTo(k - .55, .45); ctx.lineTo(k - .05, 0); ctx.lineTo(k - .55, -.45); ctx.closePath(); glFill('#fff'); } },
  acid() { ctx.beginPath(); ctx.moveTo(-.2, -1); ctx.lineTo(.2, -1); ctx.lineTo(.2, -.35); ctx.lineTo(.75, .7); ctx.lineTo(-.75, .7); ctx.lineTo(-.2, -.35); ctx.closePath(); glFill('#fff'); ctx.beginPath(); ctx.moveTo(-.45, .15); ctx.lineTo(.45, .15); ctx.lineTo(.68, .62); ctx.lineTo(-.68, .62); ctx.closePath(); ctx.fillStyle = '#9ad82a'; ctx.fill(); },
  ricochet() { glLine(-.9, .7, -.2, -.5, .17); glLine(-.2, -.5, .35, .45, .17); glLine(.35, .45, .75, -.3, .17); ctx.beginPath(); ctx.moveTo(.95, -.75); ctx.lineTo(.95, -.1); ctx.lineTo(.4, -.45); ctx.closePath(); glFill('#fff'); },
  shatter() { ctx.beginPath(); [[0, -1], [.35, -.3], [.95, -.1], [.4, .3], [.55, .95], [0, .5], [-.6, .9], [-.4, .25], [-.95, -.15], [-.3, -.35]].forEach(([a, b]) => ctx.lineTo(a, b)); ctx.closePath(); glFill('#e8f8ff'); ctx.beginPath(); ctx.moveTo(0, -.6); ctx.lineTo(.1, 0); ctx.lineTo(-.15, .35); uiLine(UI.ink, .1); },
  nova() { for (let k = 0; k < 8; k++) { const a = k*TAU/8; glLine(Math.cos(a)*.42, Math.sin(a)*.42, Math.cos(a)*.95, Math.sin(a)*.95, .13); } ctx.beginPath(); ctx.arc(0, 0, .3, 0, TAU); glFill('#fff6a0'); },
  gravity() { glArc(.8, 0, Math.PI*1.4, .15); glArc(.5, Math.PI, Math.PI*2.3, .15); ctx.beginPath(); ctx.arc(0, 0, .22, 0, TAU); glFill('#2a1450'); },
  execute() { glLine(-.6, .9, .55, -.45, .2); ctx.beginPath(); ctx.moveTo(.2, -.95); ctx.quadraticCurveTo(1.05, -.75, .95, .05); ctx.lineTo(.35, -.3); ctx.closePath(); glFill('#e8e8f0'); },
  prism() { ctx.beginPath(); ctx.moveTo(0, -.85); ctx.lineTo(.8, .6); ctx.lineTo(-.8, .6); ctx.closePath(); glFill('#fff'); for (const [c, a] of [['#ff6a6a', -.35], ['#ffe14a', 0], ['#6ac0ff', .35]]) { ctx.beginPath(); ctx.moveTo(.35, .05); ctx.lineTo(1, .05 + a); ctx.strokeStyle = c; ctx.lineWidth = .14; ctx.stroke(); } },
  chrono() { ctx.beginPath(); ctx.arc(0, 0, .85, 0, TAU); glFill('#fff'); glLine(0, 0, 0, -.55, .12); glLine(0, 0, .4, .2, .12); ctx.beginPath(); ctx.arc(0, 0, .1, 0, TAU); ctx.fillStyle = UI.ink; ctx.fill(); },
  phoenix() { for (const m of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, .3); ctx.quadraticCurveTo(m*.4, -.9, m*1, -.75); ctx.quadraticCurveTo(m*.75, -.3, m*.85, 0); ctx.quadraticCurveTo(m*.5, .1, 0, .6); ctx.closePath(); glFill(m < 0 ? '#ffd23a' : '#fff6a0'); } ctx.beginPath(); ctx.arc(0, .35, .22, 0, TAU); glFill('#fff'); },
};
function glDropAt(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); glDrop(0, 0, 1, '#9ad8ff'); ctx.restore(); } // 땀방울
const RIBBON = {pink:['#ff8ac0', '#d83a8a'], red:['#e8483a', '#a82a2a'], gold:['#ffb43a', '#c8701a'], gray:['#8a80a8', '#5a5078'], green:['#5ac84a', '#2f8a2a']};
function uiRibbon(cx, y, w, label, col = 'red', size = 34) { // 도트 리본 띠: 가운데 상자 + 양끝 계단식 꼬리 (팝업 제목·항복 띠)
  const [c1, c2] = RIBBON[col] || RIBBON.red, h = size*1.6, u = PXU, top = y - h*.26, bot = y + h*.7;
  for (const m of [-1, 1]) { const x0 = m < 0 ? cx - w/2 - 44 : cx + w/2 - 20, r = pxBox(x0, top, 64, bot - top, c2, {light:null, shade:'rgba(0,0,0,.2)', sh:1});
    const mid = Math.round((r.Y + r.H/2)/u)*u, ex = m < 0 ? r.X : r.X + r.W - u; ctx.fillStyle = UI.ink;           // 꼬리 끝을 V자로 파냄 (계단)
    for (let k = 0; k < 3; k++) ctx.fillRect(ex - m*k*u, mid - (3 - k)*u, u, (3 - k)*2*u); }
  pxBox(cx - w/2, y - h/2, w, h, c1, {light:lite(c1, .3), lh:2, shade:c2, sh:2});
  uiTxt(label, cx, y + size*.36, size);
}
function uiPopup(x, y, w, h, fill) { // 팝업 공통 틀: 화면 어둡게 + 도트 상자 + 안쪽 빛 테
  const v = ctx.createRadialGradient(W/2, H/2, 200, W/2, H/2, 900); v.addColorStop(0, 'rgba(20,8,50,.72)'); v.addColorStop(1, 'rgba(10,2,30,.92)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const r = pxBox(x, y, w, h, fill || UI.cream, {drop:'rgba(10,2,30,.6)', u:6, shade:null}), u = r.u;
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(r.X + 2*u, r.Y + 2*u, r.W - 4*u, u/2); ctx.fillRect(r.X + 2*u, r.Y + 2*u, u/2, r.H - 4*u);
  ctx.fillStyle = 'rgba(20,0,40,.15)'; ctx.fillRect(r.X + 2*u, r.Y + r.H - 2.5*u, r.W - 4*u, u/2); ctx.fillRect(r.X + r.W - 2.5*u, r.Y + 2*u, u/2, r.H - 4*u);
}
const charTV = id => TV[id] || {};
const IGLYPH = { // 아이템 문양 (단위 좌표, 흰 면 + 보라 윤곽)
  magnet() { const U = (c, w) => { ctx.beginPath(); ctx.moveTo(-.55, -.3); ctx.lineTo(-.55, .05); ctx.arc(0, .05, .55, Math.PI, 0, true); ctx.lineTo(.55, -.3); uiLine(c, w); }; U(UI.ink, .56); U('#fff', .32);
    for (const m of [-1, 1]) { ctx.beginPath(); ctx.moveTo(m*.55, -.82); ctx.lineTo(m*.55, -.36); uiLine(UI.ink, .56); ctx.beginPath(); ctx.moveTo(m*.55, -.82); ctx.lineTo(m*.55, -.4); uiLine('#c8d0e0', .32); } },
  feet() { ctx.beginPath(); ctx.moveTo(-.55, -.85); ctx.lineTo(.05, -.85); ctx.lineTo(.08, -.1); ctx.quadraticCurveTo(.85, .05, .9, .55); ctx.lineTo(.9, .75); ctx.lineTo(-.6, .75); ctx.closePath(); glFill('#fff'); glLine(-.6, .48, .9, .48, .08); for (const k of [-.5, -.75]) glLine(-.95, k + .6, -.7, k + .6, .06); },
  feather() { ctx.beginPath(); ctx.moveTo(-.65, .85); ctx.quadraticCurveTo(-.7, -.4, .75, -.85); ctx.quadraticCurveTo(.55, .5, -.65, .85); glFill('#fff'); glLine(-.65, .85, .45, -.5, .06); },
  plate() { ctx.beginPath(); ctx.moveTo(-.75, -.75); ctx.lineTo(-.3, -.85); ctx.quadraticCurveTo(0, -.55, .3, -.85); ctx.lineTo(.75, -.75); ctx.lineTo(.65, .4); ctx.quadraticCurveTo(0, .95, -.65, .4); ctx.closePath(); glFill('#fff'); glLine(0, -.5, 0, .55, .07); },
  onion() { ctx.beginPath(); ctx.moveTo(0, -.95); ctx.quadraticCurveTo(.15, -.5, .7, -.1); ctx.quadraticCurveTo(.85, .65, 0, .85); ctx.quadraticCurveTo(-.85, .65, -.7, -.1); ctx.quadraticCurveTo(-.15, -.5, 0, -.95); glFill('#fff'); glLine(-.3, -.05, -.22, .55, .05); glLine(.25, -.05, .28, .55, .05); },
  sword() { glLine(-.55, .55, .72, -.72, .24); glLine(-.75, .2, -.2, .75, .16); glLine(-.6, .6, -.88, .88, .16); },
  goblet() { ctx.beginPath(); ctx.moveTo(-.62, -.8); ctx.lineTo(.62, -.8); ctx.quadraticCurveTo(.6, .15, 0, .18); ctx.quadraticCurveTo(-.6, .15, -.62, -.8); glFill('#fff'); glLine(0, .18, 0, .66, .12); glLine(-.4, .76, .4, .76, .14); ctx.beginPath(); ctx.arc(.55, -.62, .14, 0, TAU); ctx.fillStyle = '#ff6a8a'; ctx.fill(); },
  thorns() { ctx.beginPath(); ctx.moveTo(-.82, .55); ctx.lineTo(-.82, -.55); ctx.lineTo(-.4, -.05); ctx.lineTo(0, -.75); ctx.lineTo(.4, -.05); ctx.lineTo(.82, -.55); ctx.lineTo(.82, .55); ctx.closePath(); glFill('#fff'); },
  collar() { ctx.beginPath(); ctx.arc(0, 0, .5, 0, TAU); uiLine(UI.ink, .36); ctx.beginPath(); ctx.arc(0, 0, .5, 0, TAU); uiLine('#fff', .2); for (let k = 0; k < 8; k++) { const a = k*TAU/8; ctx.beginPath(); ctx.moveTo(Math.cos(a - .22)*.66, Math.sin(a - .22)*.66); ctx.lineTo(Math.cos(a)*.98, Math.sin(a)*.98); ctx.lineTo(Math.cos(a + .22)*.66, Math.sin(a + .22)*.66); ctx.closePath(); glFill('#fff'); } },
  rattle() { glLine(.05, .05, .75, .75, .16); ctx.beginPath(); ctx.arc(-.25, -.25, .5, 0, TAU); glFill('#fff'); ctx.beginPath(); ctx.arc(-.25, -.25, .2, 0, TAU); ctx.fillStyle = '#ff9ac8'; ctx.fill(); },
  horn() { ctx.beginPath(); ctx.moveTo(-.88, -.14); ctx.lineTo(.05, -.14); ctx.lineTo(.85, -.72); ctx.lineTo(.85, .72); ctx.lineTo(.05, .14); ctx.lineTo(-.88, .14); ctx.closePath(); glFill('#fff'); },
  spear() { glLine(-.78, .78, .38, -.38, .13); ctx.beginPath(); ctx.moveTo(.9, -.9); ctx.lineTo(.2, -.55); ctx.lineTo(.55, -.2); ctx.closePath(); glFill('#fff'); },
  amulet() { ctx.beginPath(); ctx.arc(0, -.3, .55, Math.PI, 0); uiLine(UI.ink, .2); ctx.beginPath(); ctx.moveTo(0, -.25); ctx.lineTo(.45, .28); ctx.lineTo(0, .88); ctx.lineTo(-.45, .28); ctx.closePath(); glFill('#fff'); ctx.beginPath(); ctx.arc(0, .3, .13, 0, TAU); ctx.fillStyle = UI.ink; ctx.fill(); },
  cloak() { ctx.beginPath(); ctx.moveTo(0, -.9); ctx.quadraticCurveTo(.45, -.85, .45, -.4); ctx.lineTo(.85, .85); ctx.lineTo(-.85, .85); ctx.lineTo(-.45, -.4); ctx.quadraticCurveTo(-.45, -.85, 0, -.9); glFill('#fff'); ctx.beginPath(); ctx.ellipse(0, -.42, .22, .26, 0, 0, TAU); ctx.fillStyle = UI.ink; ctx.fill(); },
  corset() { ctx.beginPath(); ctx.moveTo(-.6, -.85); ctx.lineTo(.6, -.85); ctx.quadraticCurveTo(.25, 0, .6, .85); ctx.lineTo(-.6, .85); ctx.quadraticCurveTo(-.25, 0, -.6, -.85); glFill('#fff'); for (const y of [-.5, -.15, .2, .55]) glLine(-.14, y, .14, y + .14, .05); },
  silver() { ctx.save(); ctx.rotate(.6); ctx.beginPath(); ctx.moveTo(-.28, .85); ctx.lineTo(-.28, -.2); ctx.quadraticCurveTo(0, -1, .28, -.2); ctx.lineTo(.28, .85); ctx.closePath(); glFill('#fff'); glLine(-.28, .42, .28, .42, .06); ctx.restore(); },
  hourglass() { ctx.beginPath(); ctx.moveTo(-.6, -.8); ctx.lineTo(.6, -.8); ctx.lineTo(.08, 0); ctx.lineTo(.6, .8); ctx.lineTo(-.6, .8); ctx.lineTo(-.08, 0); ctx.closePath(); glFill('#fff'); ctx.beginPath(); ctx.moveTo(-.35, .65); ctx.lineTo(.35, .65); ctx.lineTo(0, .25); ctx.closePath(); ctx.fillStyle = '#e8b84a'; ctx.fill(); glLine(-.75, -.85, .75, -.85, .1); glLine(-.75, .85, .75, .85, .1); },
  wheel() { ctx.beginPath(); ctx.arc(0, 0, .78, 0, TAU); uiLine(UI.ink, .32); ctx.beginPath(); ctx.arc(0, 0, .78, 0, TAU); uiLine('#fff', .16); for (let k = 0; k < 3; k++) { const a = k*Math.PI/3; glLine(Math.cos(a)*.7, Math.sin(a)*.7, -Math.cos(a)*.7, -Math.sin(a)*.7, .07); } ctx.beginPath(); ctx.arc(0, 0, .18, 0, TAU); glFill('#fff'); },
  headband() { ctx.beginPath(); ctx.ellipse(0, 0, .82, .42, 0, 0, TAU); uiLine(UI.ink, .4); ctx.beginPath(); ctx.ellipse(0, 0, .82, .42, 0, 0, TAU); uiLine('#fff', .22); ctx.beginPath(); ctx.moveTo(.55, .3); ctx.lineTo(.95, .75); ctx.lineTo(.7, .85); ctx.closePath(); glFill('#fff'); },
  valve() { glLine(-.92, .1, .92, .1, .26); ctx.beginPath(); ctx.arc(0, .1, .45, 0, TAU); glFill('#fff'); glLine(0, -.35, 0, -.8, .1); glLine(-.35, -.82, .35, -.82, .14); },
  charm() { ctx.beginPath(); ctx.moveTo(0, -.9); ctx.lineTo(.65, -.2); ctx.lineTo(0, .9); ctx.lineTo(-.65, -.2); ctx.closePath(); glFill('#fff'); ctx.beginPath(); ctx.arc(0, -.05, .2, 0, TAU); ctx.fillStyle = '#4aa8ff'; ctx.fill(); },
  eye() { ctx.beginPath(); ctx.moveTo(-.92, 0); ctx.quadraticCurveTo(0, -.8, .92, 0); ctx.quadraticCurveTo(0, .8, -.92, 0); glFill('#fff'); ctx.beginPath(); ctx.arc(0, 0, .3, 0, TAU); ctx.fillStyle = UI.ink; ctx.fill(); ctx.beginPath(); ctx.arc(.1, -.1, .09, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); },
  staff() { glLine(-.65, .85, .25, -.2, .14); ctx.beginPath(); ctx.arc(.42, -.42, .34, 0, TAU); glFill('#fff'); ctx.beginPath(); ctx.arc(.42, -.42, .13, 0, TAU); ctx.fillStyle = '#b88aff'; ctx.fill(); },
  spike() { for (const [x, l] of [[-.5, .3], [0, .85], [.5, .45]]) { ctx.beginPath(); ctx.moveTo(x - .24, -.8); ctx.lineTo(x + .24, -.8); ctx.lineTo(x, l); ctx.closePath(); glFill('#fff'); } glLine(-.85, -.82, .85, -.82, .12); },
  fan() { ctx.beginPath(); ctx.moveTo(0, .75); ctx.arc(0, .75, 1.35, -Math.PI*.8, -Math.PI*.2); ctx.closePath(); glFill('#fff'); for (const a of [-.65, -.5, -.35]) glLine(0, .75, Math.cos(a*Math.PI)*1.25, .75 + Math.sin(a*Math.PI)*1.25, .05); },
  turret() { glLine(0, -.15, .55, -.85, .2); ctx.beginPath(); ctx.arc(0, .05, .45, Math.PI, 0); ctx.closePath(); glFill('#fff'); ctx.beginPath(); ctx.roundRect(-.7, .05, 1.4, .7, .15); glFill('#fff'); },
  mirror() { glLine(0, .45, 0, .95, .17); ctx.beginPath(); ctx.ellipse(0, -.22, .55, .65, 0, 0, TAU); glFill('#fff'); glLine(-.2, -.5, .05, -.65, .07); },
  quiver() { glLine(-.15, -.35, -.35, -.92, .07); glLine(.15, -.35, .38, -.92, .07); ctx.beginPath(); ctx.roundRect(-.38, -.42, .76, 1.28, .16); glFill('#fff'); ctx.beginPath(); ctx.moveTo(0, .55); ctx.bezierCurveTo(-.32, .25, -.2, 0, 0, .15); ctx.bezierCurveTo(.2, 0, .32, .25, 0, .55); ctx.fillStyle = '#ff5a8a'; ctx.fill(); },
};
function uiItem(id, x, y, r) { // 아이템 배지: 둥근 사각 + 흰 문양 (진화 아이템은 금테 + 별)
  const it = ITEM[id], c = it.col; uiPath(x - r, y - r, r*2, r*2, r*.4); const g = ctx.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, lite(c, .3)); g.addColorStop(1, c); ctx.fillStyle = g; ctx.fill(); uiLine(UI.ink, Math.max(3, r*.12));
  if (it.evo) { uiPath(x - r + 3, y - r + 3, r*2 - 6, r*2 - 6, r*.34); uiLine('#ffd23a', Math.max(2, r*.1)); }
  ctx.fillStyle = 'rgba(255,255,255,.3)'; uiPath(x - r + r*.2, y - r + r*.14, r*1.6, r*.36, r*.18); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.scale(r*.62, r*.62); IGLYPH[it.g || id](); ctx.restore();
  if (it.evo) uiStar(x + r*.78, y - r*.78, r*.36, UI.gold);
}
function uiGlyph(id, x, y, s) { const g = GLYPH[id]; if (!g) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); g(); ctx.restore(); }
const BALL_GLY = {"fire":["...x....","...xx...","..xxx...","..xxxx..",".xxxxxx.",".xxyyxx.",".xxyyxx.","..xxxx.."],"frost":["...x....",".x.x.x..","..xxx...","xxxxxxx.","..xxx...",".x.x.x..","...x....","........"],"poison":["...x....","..xxx...","..xxx...",".xxxxx..",".xyxxx..",".xxxyx..","..xxx...","........"],"spark":["....xx..","...xx...","..xx....",".xxxxx..","...xx...","..xx....",".xx.....","........"],"bomb":[".....x..","....x...","..xxx...",".xxxxx..",".xxxxx..",".xxxxx..","..xxx...","........"],"split":["........",".xx..xx.","x..xx..x","x..xx..x",".xx..xx.","........","........","........"],"pierce":["...x....","..xxx...",".x.x.x..","...x....","...x....","...x....","..x.x...","........"],"vamp":["........",".x....x.",".xx..xx.",".xxxxxx.","..xxxx..","..x..x..","..x..x..","........"],"wind":["........","xxxxx...",".....x..","xxxxxx..","....x...","xxx.....","........","........"],"giant":["........",".xxxxxx.","x......x","x.xx.x.x","x......x",".xxxxxx.","........","........"],"homing":["...x....","..x.x...",".x.x.x..","x.xxx.x.",".x.x.x..","..x.x...","...x....","........"],"curse":["..xxx...",".x...x..",".x.x.x..",".x...x..","..xxx...","..x.x...","..x.x...","........"],"bleed":["...x....","...x....","..xxx...","..xxx...",".xxxxx..",".xxxxx..","..xxx...","........"],"crit":["...x....","...x....",".xxxxx..","xx.x.xx.",".xxxxx..","...x....","...x....","........"],"stun":[".x...x..","..x.x...","...x....","..x.x...",".x...x..","........","........","........"],"echo":["........","..xxx...",".x...x..","x.xxx.x.","x.x.x.x.","x.xxx.x.",".x...x..","..xxx..."],"meteor":["x.......",".x......","..x.....","...xxx..","...xxxx.","...xxxx.","....xx..","........"],"holy":["...x....","...x....",".xxxxx..","...x....","...x....","...x....","...x....","........"],"lucky":["........",".xx.xx..",".xx.xx..","...x....",".xx.xx..",".xx.xx..","....x...","........"],"rot":["..xxx...",".x.x.x..",".xxxxx..","..x.x...","..xxx...","........","........","........"],"swift":["........","x..x....",".x..x...","..x..x..",".x..x...","x..x....","........","........"],"acid":["..x.....","..xx....",".xxxx...",".xxxx...","..xx..x.",".....xx.",".....xx.","........"],"ricochet":["x.......",".x....x.","..x..x..","...xx...","........","........","........","........"],"shatter":["x..x..x.",".x.x.x..","..xxx...","xxx.xxx.","..xxx...",".x.x.x..","x..x..x.","........"],"nova":["...x....",".x.x.x..","..xxx...","xxxxxxx.","..xxx...",".x.x.x..","...x....","........"],"gravity":["..xxx...",".x...x..","x..x..x.","x.x.x.x.","x..x..x.",".x...x..","..xxx...","........"],"execute":["......x.",".....xx.","....xx..","...xx...","..xx....",".x......","x.......","........"],"prism":["...x....","..x.x...","..x.x...",".x...x..",".x...x..","xxxxxxx.","........","........"],"chrono":["..xxx...",".x...x..","x..x..x.","x..xx.x.","x.....x.",".x...x..","..xxx...","........"],"phoenix":["x.....x.","xx...xx.",".xx.xx..","..xxx...","...x....","..x.x...","........","........"]}; // 공 문양 8×8 (x = 흰 칸, y = 밝은 바탕색 칸)
const ball16Cache = {};
function ball16(fns, step = 0) { // 16칸 공: 색(기능 수만큼 부채꼴)·문양은 step(16방향)만큼 돌고, 테·왼쪽 위 빛·오른쪽 아래 그늘은 제자리에 고정
  const key = fns.join() + ':' + step; if (ball16Cache[key]) return ball16Cache[key];
  const n = fns.length, paint = Array.from({length:16}, () => Array(16).fill(null));                         // 돌기 전 무늬
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const dx = i + .5 - 8, dy = j + .5 - 8; paint[j][i] = n ? FN[fns[Math.floor(((Math.atan2(dx, -dy) + TAU)%TAU)/TAU*n)%n]].color : '#e8e2f6'; }
  if (n === 1) { const g = BALL_GLY[fns[0]] || [], gc = ['holy', 'prism', 'execute'].includes(fns[0]) ? '#4a2394' : '#ffffff';
    g.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') paint[4 + j][4 + i] = ch === 'y' ? lite(FN[fns[0]].color, .2) : gc; })); }
  else if (n > 1) for (const [a, b] of [[7, 7], [8, 7], [7, 8], [8, 8]]) paint[b][a] = '#ffffff';
  const c = mkCanvas(16, 16), x = c.getContext('2d'), an = -step*TAU/16, cs = Math.cos(an), sn = Math.sin(an);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const dx = i + .5 - 8, dy = j + .5 - 8, d = Math.hypot(dx, dy); if (d > 7.6) continue;
    const si = Math.max(0, Math.min(15, Math.floor(8 + dx*cs - dy*sn))), sj = Math.max(0, Math.min(15, Math.floor(8 + dx*sn + dy*cs))); // 돌린 자리의 무늬를 가져옴 (가장 가까운 칸)
    let col = paint[sj][si];
    if (d > 6.6) col = UI.ink; else if (dx + dy > 6) col = dark(col, .35); else if (dx + dy < -7) col = lite(col, .45);
    x.fillStyle = col; x.fillRect(i, j, 1, 1); }
  x.fillStyle = '#ffffff'; x.fillRect(4, 3, 2, 1); x.fillRect(3, 4, 1, 2);                                          // 고정 빛
  return ball16Cache[key] = c;
}
const spinStep = rot => Math.round(((rot%TAU + TAU)%TAU)/TAU*16)&15;
function uiBall(x, y, r, fns, rot = 0) { // 메뉴·카드용 공: 16칸 도트를 지름 약 2r로 (정수 배율이라 칸이 고름). rot을 주면 무늬가 돎
  const k = Math.max(1, Math.round(r*2/16)), d = 16*k, sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ball16(fns, spinStep(rot)), Math.round(x - d/2), Math.round(y - d/2), d, d); ctx.imageSmoothingEnabled = sm;
}
function uiHeart(x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s*.9); ctx.bezierCurveTo(x - s*1.1, y + s*.1, x - s*.75, y - s*.9, x, y - s*.38); ctx.bezierCurveTo(x + s*.75, y - s*.9, x + s*1.1, y + s*.1, x, y + s*.9); ctx.fillStyle = '#ff5a6a'; ctx.fill(); uiLine(UI.ink, Math.max(3, s*.2)); ctx.beginPath(); ctx.arc(x - s*.4, y - s*.2, s*.15, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); }
function uiHouse(x, y, s) { // 로비 탭 아이콘
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s*1.1, y - s*.1); ctx.lineTo(x - s*1.1, y - s*.1); ctx.closePath(); ctx.fillStyle = '#ff6a5a'; ctx.fill(); uiLine(UI.ink, Math.max(3, s*.2));
  uiPath(x - s*.8, y - s*.1, s*1.6, s*1.05, s*.12); ctx.fillStyle = '#fff4d6'; ctx.fill(); uiLine(UI.ink, Math.max(3, s*.2)); uiPath(x - s*.2, y + s*.3, s*.4, s*.65, s*.1); ctx.fillStyle = '#a8683a'; ctx.fill(); uiLine(UI.ink, Math.max(2, s*.14));
}
function uiStar(x, y, r, fill) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI/2 + i*Math.PI/5, d = i%2 ? r*.46 : r; ctx.lineTo(x + Math.cos(a)*d, y + Math.sin(a)*d); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); uiLine(UI.ink, Math.max(3, r*.16)); }
function uiLeague(x, y, s, lg) { // 리그 배지: 리그 색 방패 + 높은 리그일수록 별·날개
  const l = RAID.leagues[lg];
  if (lg >= 3) for (const m of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + m*s*.8, y - s*.5); ctx.lineTo(x + m*s*1.7, y - s*.9); ctx.lineTo(x + m*s*1.5, y - s*.2); ctx.lineTo(x + m*s*1.8, y + s*.2); ctx.lineTo(x + m*s*.9, y + s*.4); ctx.closePath(); ctx.fillStyle = lite(l.c, .4); ctx.fill(); uiLine(UI.ink, Math.max(2, s*.12)); } // 날개
  uiShield(x, y, s, l.c); ctx.beginPath(); ctx.moveTo(x - s*.6, y - s*.55); ctx.lineTo(x + s*.6, y - s*.55); ctx.lineTo(x + s*.6, y - s*.1); ctx.quadraticCurveTo(x + s*.6, y + s*.5, x, y + s*.72); ctx.quadraticCurveTo(x - s*.6, y + s*.5, x - s*.6, y - s*.1); ctx.closePath(); ctx.fillStyle = lite(l.c, .35); ctx.fill();
  for (let k = 0; k <= Math.min(2, lg); k++) uiStar(x + (k - Math.min(2, lg)/2)*s*.55, y + s*.05, s*.24, k <= lg - 1 || lg === 0 ? '#fff6d0' : dark(l.c, .3)); // 리그 단계 별
}
function uiShield(x, y, s, fill) { ctx.beginPath(); ctx.moveTo(x - s, y - s*.9); ctx.lineTo(x + s, y - s*.9); ctx.lineTo(x + s, y); ctx.quadraticCurveTo(x + s, y + s*.9, x, y + s*1.15); ctx.quadraticCurveTo(x - s, y + s*.9, x - s, y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); uiLine(UI.ink, Math.max(3, s*.2)); }
function uiSword(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI/4); uiPath(-s*.14, -s*1.1, s*.28, s*1.5, s*.1); ctx.fillStyle = '#e8f0ff'; ctx.fill(); uiLine(UI.ink, Math.max(3, s*.14)); uiPath(-s*.5, s*.36, s, s*.2, s*.08); ctx.fillStyle = UI.gold; ctx.fill(); uiLine(UI.ink, Math.max(3, s*.14)); uiPath(-s*.12, s*.52, s*.24, s*.4, s*.08); ctx.fillStyle = '#a8683a'; ctx.fill(); uiLine(UI.ink, Math.max(3, s*.12)); ctx.restore(); }
function uiTurtle(x, y, s) { uiHero(x, y, s*.95, humanLook(META.sel), '', 0); } // 캐릭터 탭 아이콘: 지금 고른 캐릭터
function uiLock(x, y, s) { ctx.beginPath(); ctx.arc(x, y - s*.2, s*.5, Math.PI, 0); ctx.strokeStyle = UI.ink; ctx.lineWidth = s*.34; ctx.stroke(); ctx.strokeStyle = '#d8d0e8'; ctx.lineWidth = s*.18; ctx.stroke(); uiPath(x - s*.7, y - s*.15, s*1.4, s*1.1, s*.2); ctx.fillStyle = '#ffd23a'; ctx.fill(); uiLine(UI.ink, s*.16); }
function uiCheck(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#4ac84a'; ctx.fill(); uiLine(UI.ink, Math.max(3, r*.2)); ctx.beginPath(); ctx.moveTo(x - r*.45, y); ctx.lineTo(x - r*.1, y + r*.35); ctx.lineTo(x + r*.5, y - r*.35); ctx.strokeStyle = '#fff'; ctx.lineWidth = r*.28; ctx.stroke(); }
const SLOT_SYM = { // 잭팟 칸 릴 그림 7×7 도트: 좀비 머리·뇌·해골·핀볼·하트·보석
  Z:{rows:['.GGGGG.', 'GGGGGGG', 'GRGGGRG', 'GGGGGGG', 'GKKKKKG', 'GKWKWKG', '.GGGGG.'], pal:{G:'#8ab84a', R:'#ff3a3a', K:'#2a1a20', W:'#f4f0e0'}},
  B:{rows:['.PPpPP.', 'PPpPPpP', 'PpPPpPP', 'PPPpPPP', 'PpPPPpP', '.PPPPP.', '...PP..'], pal:{P:'#ff9ac0', p:'#d85a8a'}},
  S:{rows:['.WWWWW.', 'WWWWWWW', 'WKKWKKW', 'WKKWKKW', 'WWWKWWW', '.WWWWW.', '.W.W.W.'], pal:{W:'#f4f0e0', K:'#2a1a20'}},
  O:{rows:['..LLL..', '.LwLLL.', 'LwLLLLL', 'LLLLLLL', 'LLLLLLD', '.LLLLD.', '..DDD..'], pal:{L:'#c8ccdc', w:'#ffffff', D:'#8a8ea0'}},
  H:{rows:['.RR.RR.', 'RrRRRRR', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], pal:{R:'#e8203a', r:'#ff9aa8'}},
  D:{rows:['...C...', '..CcC..', '.CcCCC.', 'CCCCCCC', '.CCCCC.', '..CCC..', '...C...'], pal:{C:'#3ab8ff', c:'#c8f0ff'}},
};
const SLOT_ORDER = ['Z', 'B', 'S', 'O', 'H', 'D'];
let SLOT_CV = null;
function miniSlot(cx, cy, T) { // 핀볼 가운데 잭팟 칸: 도트 슬롯머신(30×28칸, 3배). 1.6초마다 릴 셋이 돌다 차례로 멈춰 좀비 머리 3개, 위 경광등 깜빡
  const cv = SLOT_CV || (SLOT_CV = mkCanvas(30, 28)), g = cv.getContext('2d'), INK = UI.ink, p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const box = (x, y, w, h, c, lt, dk) => { p(x, y, w, h, INK); p(x + 1, y + 1, w - 2, h - 2, c); p(x + 1, y + 1, w - 2, 1, lt); p(x + 1, y + h - 2, w - 2, 1, dk); };
  const sym = (k, x, y) => SLOT_SYM[k].rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') p(x + i, y + j, 1, 1, SLOT_SYM[k].pal[ch]); }));
  g.clearRect(0, 0, 30, 28);
  box(0, 4, 30, 24, '#d8302a', '#ff6a5a', '#a81a1a'); p(11, 0, 8, 5, INK); p(12, 1, 6, 3, Math.floor(T*6)%2 ? '#ffe14a' : '#ff8a2a'); // 몸통 + 경광등
  box(2, 7, 26, 13, '#ffd23a', '#fff0a0', '#c8901a');
  const c = T % 1.6, x0 = 4, y0 = 9; p(x0 - 1, y0 - 1, 25, 11, INK);
  for (let i = 0; i < 3; i++) { const rx = x0 + i*8, spin = c < .5 + i*.2; p(rx, y0, 7, 9, '#fff6e0');
    g.save(); g.beginPath(); g.rect(rx, y0, 7, 9); g.clip();
    const off = spin ? Math.floor(T*60)%8 : 0, base = Math.floor(T*8);
    for (let k = -1; k <= 1; k++) sym(spin ? SLOT_ORDER[(base + i*2 + k + 60)%6] : k ? SLOT_ORDER[(i + k + 6)%6] : 'Z', rx, y0 + 1 + k*8 + off);
    g.restore(); }
  p(x0 - 1, y0 + 4, 1, 1, '#ff3a5a'); p(x0 + 23, y0 + 4, 1, 1, '#ff3a5a');                       // 당첨 줄
  p(7, 22, 16, 4, INK); p(8, 23, 14, 2, '#ffd23a');                                                // 동전 받이
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(cv, Math.round(cx - 45), Math.round(cy - 42), 90, 84); ctx.imageSmoothingEnabled = sm;
}
function uiGift(x, y, s) { // 선물 상자 (분홍 상자 + 금 리본)
  const lw = Math.max(3, s*.14);
  uiPath(x - s, y - s*.35, s*2, s*1.3, s*.18); ctx.fillStyle = '#ff5a8a'; ctx.fill(); uiLine(UI.ink, lw);
  ctx.fillStyle = UI.gold; ctx.fillRect(x - s*.17, y - s*.35, s*.34, s*1.3);
  uiPath(x - s*1.15, y - s*.8, s*2.3, s*.5, s*.14); ctx.fillStyle = '#ff7aa8'; ctx.fill(); uiLine(UI.ink, lw); ctx.fillStyle = UI.gold; ctx.fillRect(x - s*.17, y - s*.8, s*.34, s*.5);
  for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + k*s*.36, y - s*1.02, s*.36, s*.22, k*.5, 0, TAU); ctx.fillStyle = UI.gold; ctx.fill(); uiLine(UI.ink, lw*.8); }
}
function uiGem(x, y, s) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s*.8, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s*.8, y); ctx.closePath(); ctx.fillStyle = '#7fd3f5'; ctx.fill(); uiLine(UI.ink, Math.max(3, s*.16)); ctx.beginPath(); ctx.moveTo(x - s*.3, y - s*.3); ctx.lineTo(x, y - s*.65); ctx.strokeStyle = '#fff'; ctx.lineWidth = s*.16; ctx.stroke(); } // 경험치 보석
function uiSymbol(kind, x, y, s) { if (kind === 'ball') uiBall(x, y, s*.36, ['fire', 'spark']); else if (kind === 'char') uiTurtle(x, y, s*.42); else if (kind === 'gift') uiGift(x, y, s*.42); else if (kind === 'xp') uiGem(x, y, s*.42); else uiBall(x, y, s*.34, []); } // 볼 = 색 구슬, 캐릭터 = 거북, 핀볼 = 흰 구슬
function uiPartIcon(part, x, y, s) { if (part === 'weapon') uiSword(x, y, s*.9); else if (part === 'head') { uiPath(x - s*.8, y - s*.7, s*1.6, s*1.3, s*.7); ctx.fillStyle = '#c8d4f0'; ctx.fill(); uiLine(UI.ink, 3); uiPath(x - s*.5, y - s*.1, s, s*.3, s*.1); ctx.fillStyle = UI.ink; ctx.fill(); } else if (part === 'chest') uiShield(x, y, s*.8, '#6ac0ff'); else if (part === 'legs') { uiPath(x - s*.7, y - s*.3, s*1.4, s*.8, s*.3); ctx.fillStyle = '#a8683a'; ctx.fill(); uiLine(UI.ink, 3); } else uiStar(x, y, s*.8, part === 'ring' ? '#ff8ac8' : '#ffd23a'); }

const RUINS = (() => { // 로비 배경: 해 질 녘 폐허 도시 (먼 빌딩 실루엣 → 가까운 빌딩·불 켜진 창 → 무너진 벽·잔해 더미), 연기·불씨
  const c = mkCanvas(W, H), g = c.getContext('2d'), r = mulberry32(21);
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2e1c4e'); sky.addColorStop(.4, '#8a4468'); sky.addColorStop(.62, '#e0844e'); sky.addColorStop(.75, '#6a3a34'); sky.addColorStop(1, '#2e1e1a'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,200,130,.25)'; g.beginPath(); g.arc(470, 690, 150, 0, TAU); g.fill(); g.fillStyle = '#ffcf80'; g.beginPath(); g.arc(470, 690, 78, 0, TAU); g.fill(); // 지는 해
  const town = (y0, col, win, hmin, hmax) => { for (let x = -30; x < W;) { const w = 54 + r()*80, top = y0 - hmin - r()*(hmax - hmin);
    g.fillStyle = col; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, top + r()*24); for (let k = 1; k <= 5; k++) g.lineTo(x + w*k/5, top + (r() < .55 ? r()*46 : 0)); g.lineTo(x + w, y0); g.closePath(); g.fill(); // 윗변이 깨진 빌딩
    if (win) for (let wy = top + 40; wy < y0 - 24; wy += 36) for (let wx = x + 10; wx < x + w - 16; wx += 24) if (r() < .4) { g.fillStyle = r() < .25 ? '#ffb85a' : 'rgba(10,4,16,.6)'; g.fillRect(wx, wy, 10, 14); }
    x += w + 4 + r()*14; } };
  town(800, '#6a3a5a', false, 130, 280); town(900, '#3e2638', true, 120, 330);
  g.fillStyle = '#2e1e1a'; g.fillRect(0, 900, W, H - 900);                                                           // 땅
  for (const [x0, w0, h0] of [[-20, 230, 260], [520, 230, 300]]) for (let y = 900 - h0, row = 0; y < 900 + 40; y += 22, row++) { // 앞쪽 무너진 벽돌 벽 (위로 갈수록 이가 빠짐)
    const cut = (900 - y)/h0; for (let x = x0 + (row%2)*20; x < x0 + w0; x += 40) { if (r() < cut*.75) continue; g.fillStyle = r() < .3 ? '#5a2a20' : '#74382a'; g.fillRect(x + 1, y + 1, 38, 20); g.fillStyle = 'rgba(255,190,150,.12)'; g.fillRect(x + 1, y + 1, 38, 4); } }
  for (let k = 0; k < 9; k++) { const x = r()*W, y = 960 + r()*300, rw = 60 + r()*120; g.fillStyle = '#3e2a22'; g.beginPath(); g.ellipse(x, y, rw, rw*.32, 0, Math.PI, 0); g.fill(); // 잔해 더미
    for (let n = 0; n < 7; n++) { g.fillStyle = r() < .5 ? '#74382a' : '#5a4a40'; g.fillRect(x - rw*.7 + r()*rw*1.4, y - r()*rw*.28, 12 + r()*12, 8 + r()*6); } }
  for (const [sx, sy] of [[150, 640], [610, 610], [330, 820]]) for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(60,40,60,' + (.28 - k*.016) + ')'; g.beginPath(); g.arc(sx + Math.sin(k*.9)*k*4, sy - k*26, 18 + k*4, 0, TAU); g.fill(); } // 연기 기둥
  for (let k = 0; k < 50; k++) { g.fillStyle = r() < .5 ? '#ffb84a' : '#ff6a2a'; const z = 2 + Math.floor(r()*3); g.fillRect(r()*W, 300 + r()*900, z, z); } // 불씨
  return c;
})();
const MENU_BG = (() => { // 메뉴 화면(볼·캐릭터·핀볼·출전) 배경: 짙은 보라 + 옅은 사선 줄무늬 + 아래쪽 먼 폐허 실루엣 + 잔별
  const c = mkCanvas(W, H), g = c.getContext('2d'), r = mulberry32(7);
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#24184e'); sky.addColorStop(.7, '#33205e'); sky.addColorStop(1, '#4a2a5a'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.035)'; for (let k = -H; k < W; k += 72) { g.beginPath(); g.moveTo(k, H); g.lineTo(k + 26, H); g.lineTo(k + 26 + H, 0); g.lineTo(k + H, 0); g.fill(); }
  for (let k = 0; k < 60; k++) { g.fillStyle = 'rgba(255,240,220,' + (.15 + r()*.35) + ')'; const z = r() < .2 ? 3 : 2; g.fillRect(r()*W, r()*900, z, z); }
  g.fillStyle = 'rgba(14,6,30,.45)'; for (let x = -20; x < W;) { const w = 50 + r()*70, top = 1060 - r()*150; g.beginPath(); g.moveTo(x, H); g.lineTo(x, top); for (let k = 1; k <= 4; k++) g.lineTo(x + w*k/4, top + (r() < .5 ? r()*30 : 0)); g.lineTo(x + w, H); g.fill(); x += w + 6; }
  return c;
})();

// ===== 전투 공 · 전장 벽돌 벽 · 아래 철망 받침대 =====
function drawBall(x, y, r, fns, rot = 0) { // 전투 공: 16칸 도트 공(메뉴와 같은 그림)을 지름 2r로, 무늬는 회전 방향으로 16단계 돌고 빛·그늘은 고정
  const d = Math.max(16, Math.round(r*2)), sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ball16(fns, spinStep(rot)), Math.round(x - d/2), Math.round(y - d/2), d, d); ctx.imageSmoothingEnabled = sm;
}
function drawWall(x0, w) { // 보드 밖 무너진 붉은 벽돌 벽 (군데군데 빠진 벽돌·그을음, 안쪽 가장자리는 잔해 띠)
  if (w <= 0) return;
  ctx.fillStyle = '#24160f'; ctx.fillRect(x0, TOP, w, BOT + 8 - TOP);
  for (let y = TOP, row = 0; y < BOT; y += 24, row++) for (let x = x0 - (row%2)*16; x < x0 + w; x += 32) {
    const a = Math.max(x0, x + 2), b = Math.min(x0 + w, x + 30), h = Math.sin(x*12.9898 + y*78.233)*43758.5453 % 1, q = Math.abs(h); if (b <= a || q < .12) continue; // 빠진 벽돌
    ctx.fillStyle = q < .3 ? '#40201a' : q < .6 ? '#552a20' : '#5e3024'; ctx.fillRect(a, y + 2, b - a, 20); ctx.fillStyle = 'rgba(255,200,170,.07)'; ctx.fillRect(a, y + 2, b - a, 3);
  }
  const e = x0 === 0 ? w - 8 : x0; ctx.fillStyle = '#5a4636'; ctx.fillRect(e, TOP, 8, BOT - TOP);
  for (let y = TOP; y < BOT; y += 14) { ctx.fillStyle = (y/14)%3 ? '#8a6a4a' : '#7a3a2c'; ctx.fillRect(e + ((y/14)%2)*3, y, 5, 6); }
}
function drawDeck() { // 보드 아래 조이스틱 받침대: 철망 울타리 + 기둥·가로대 (4px 도트, 보드 밖이라 좀비·공·주인공이 못 들어옴)
  const y0 = BOT + 8, h = SLOTY + 8 - y0, INK = UI.ink, G = 4, q = (x, y, w, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x/G)*G, Math.round(y/G)*G, Math.max(G, Math.round(w/G)*G), Math.max(G, Math.round(hh/G)*G)); };
  q(0, y0, W, h, '#120a18'); ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip(); ctx.strokeStyle = '#6a6e7a'; ctx.lineWidth = 4;
  for (let x = -h; x < W + h; x += 28) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + h, y0 + h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + h, y0); ctx.lineTo(x, y0 + h); ctx.stroke(); } ctx.restore(); // 마름모 철망
  for (let x = 40; x < W; x += 160) { q(x, y0 - 8, 16, h + 8, INK); q(x + 4, y0 - 8, 8, h + 8, '#9aa0ac'); }                 // 기둥
  q(0, y0, W, 8, '#9aa0ac'); q(0, y0, W, 4, INK);                                                                         // 위 가로대
  const g = ctx.createRadialGradient(W/2, y0 + h/2, 20, W/2, y0 + h/2, 200); g.addColorStop(0, 'rgba(10,4,20,.45)'); g.addColorStop(1, 'rgba(10,4,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, y0, W, h); // 조이스틱 자리는 어둡게
}
// ===== 핀볼 머신 판 배치 (아치·핀·범퍼·발사 레인·칸) =====
const MB = {x0:70, x1:610, top:230, slotY:860, slotH:100};
const LANE_TOP = 594; // 발사 레인 벽의 윗끝 (짧을수록 출구가 넓다)
const LANE = {x0:616, x1:648}; // PUSH하면 공이 이 레인(오른쪽 아래)에서 쏘아 올려진다
const SLOT_W = (MB.x1 - MB.x0)/PINBALL.slots.length;
const ARC = {cx:360, cy:514, R:290}; // 아치형 기계: 위는 반원, 아래는 직사각형
const PINS = (() => { const p = []; for (let j = 0; j < 9; j++) for (let x = MB.x0 + 30 + (j%2)*30; x < MB.x1 - 20; x += 60) { const y = 380 + j*50; if (y >= ARC.cy || Math.hypot(x - ARC.cx, y - ARC.cy) < ARC.R - 24) p.push({x, y, r:7}); } return p; })();
const BUMPERS = [{x:250, y:385, r:28, c:'#ff6ab0', hit:0}, {x:360, y:340, r:28, c:'#4aa8ff', hit:0}, {x:470, y:385, r:28, c:'#6ad03a', hit:0}];
for (let i = PINS.length - 1; i >= 0; i--) if (BUMPERS.some(b => Math.hypot(b.x - PINS[i].x, b.y - PINS[i].y) < b.r + PINS[i].r + 14)) PINS.splice(i, 1); // 범퍼와 겹치는 핀은 뺀다
const HUBN = {n:1}; // 선택한 발사 수
// ===== 핀볼 머신 그리기 (MS = 핀볼 연출 상태, 아래 기본값) =====
var MS = window.MS || {counts:[0,0,0,0,0], fx:[], balls:[], mult:1, flash:null, pushT:0};
function drawCabinet() {
  const {cx, cy, R} = ARC, T = performance.now()/1000;
  ctx.beginPath(); ctx.moveTo(36, 990); ctx.lineTo(36, cy); ctx.arc(cx, cy, R + 34, Math.PI, 0); ctx.lineTo(684, 990); ctx.closePath();
  const fg = ctx.createLinearGradient(0, 190, 0, 990); fg.addColorStop(0, '#ffb43a'); fg.addColorStop(1, '#e8452a'); ctx.fillStyle = fg; ctx.fill(); uiLine(UI.ink, 8);
  ctx.beginPath(); ctx.moveTo(70, 962); ctx.lineTo(70, cy); ctx.arc(cx, cy, R, Math.PI, 0); ctx.lineTo(650, 962); ctx.closePath();
  const ig = ctx.createRadialGradient(cx, 560, 40, cx, 560, 480); ig.addColorStop(0, '#7a45d8'); ig.addColorStop(1, '#3b1a82'); ctx.fillStyle = ig; ctx.fill();
  ctx.save(); ctx.clip(); // 판 장식: 천천히 도는 빛살 + 거북 등딱지 육각 무늬 + 가운데 희미한 선물 문장
  for (let k = 0; k < 16; k++) { const an = T*.12 + k*TAU/16; ctx.beginPath(); ctx.moveTo(cx, 560); ctx.lineTo(cx + Math.cos(an)*900, 560 + Math.sin(an)*900); ctx.lineTo(cx + Math.cos(an + TAU/32)*900, 560 + Math.sin(an + TAU/32)*900); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 3; for (let row = 0; row < 14; row++) for (let col = 0; col < 9; col++) { const hx = 70 + col*72 + (row%2)*36, hy = 200 + row*62; ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k*Math.PI/3 + Math.PI/6; ctx.lineTo(hx + Math.cos(an)*34, hy + Math.sin(an)*34); } ctx.closePath(); ctx.stroke(); }
  ctx.globalAlpha = .1; uiGift(cx, 600, 90); ctx.globalAlpha = 1; ctx.restore();
  ctx.beginPath(); ctx.moveTo(70, 962); ctx.lineTo(70, cy); ctx.arc(cx, cy, R, Math.PI, 0); ctx.lineTo(650, 962); ctx.closePath(); uiLine(UI.ink, 6);
  const bulb = (x, y, k) => { ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fillStyle = (k + Math.floor(T*3))%2 ? '#fff6a0' : '#ffd23a'; ctx.fill(); uiLine(UI.ink, 2.5); };
  for (let k = 0; k <= 22; k++) { const a = Math.PI + k*Math.PI/22; bulb(cx + Math.cos(a)*(R + 17), cy + Math.sin(a)*(R + 17), k); }
  for (let y = cy + 30, k = 0; y < 975; y += 36, k++) { bulb(53, y, k); bulb(667, y, k); }
  for (const p of PINS) { const g = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, p.r); g.addColorStop(0, '#fff6a0'); g.addColorStop(1, '#e8a81a'); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fillStyle = g; ctx.fill(); uiLine(UI.ink, 2.5); }
  for (const b of BUMPERS) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r + (b.hit > 0 ? 4 : 0), 0, TAU); ctx.fillStyle = b.hit > 0 ? '#fff' : b.c; ctx.fill(); uiLine(UI.ink, 5); ctx.save(); ctx.globalAlpha = .9; ctx.fillStyle = '#fff'; ctx.beginPath(); if (b.c === '#ff6ab0') { for (let k = 0; k < 10; k++) { const a = -Math.PI/2 + k*Math.PI/5, d = k%2 ? 6 : 14; ctx.lineTo(b.x + Math.cos(a)*d, b.y + Math.sin(a)*d); } } else if (b.c === '#4aa8ff') { ctx.moveTo(b.x, b.y - 14); ctx.lineTo(b.x + 11, b.y); ctx.lineTo(b.x, b.y + 14); ctx.lineTo(b.x - 11, b.y); } else { for (let k = 0; k < 4; k++) { const a = k*Math.PI/2; ctx.moveTo(b.x + Math.cos(a)*6 + 6, b.y + Math.sin(a)*6); ctx.arc(b.x + Math.cos(a)*7, b.y + Math.sin(a)*7, 6, 0, TAU); } } ctx.closePath(); ctx.fill(); ctx.restore(); } // 범퍼 문양: 별 / 보석 / 네잎
  { // 발사 레인 (오른쪽): 어두운 통로 + 위로 흐르는 화살표 + 플런저
    const ly = LANE_TOP; ctx.fillStyle = 'rgba(20,8,50,.4)'; ctx.fillRect(LANE.x0 + 2, ly, LANE.x1 - LANE.x0 + 6, 962 - ly);
    uiPath(LANE.x0 - 6, ly, 8, 962 - ly, 4); ctx.fillStyle = '#ffb43a'; ctx.fill(); uiLine(UI.ink, 3);
    for (let k = 0; k < 4; k++) { const yy = 900 - ((k*70 + T*160)%280); ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(LANE.x0 + 16, yy); ctx.lineTo(LANE.x0 + 26, yy + 14); ctx.lineTo(LANE.x0 + 6, yy + 14); ctx.closePath(); ctx.fillStyle = '#fff6a0'; ctx.fill(); ctx.globalAlpha = 1; }
    const po = (MS.pushT || 0) > 0 ? 12 : 0; uiPath(LANE.x0 + 6, 940 + po, 24, 22, 6); ctx.fillStyle = '#ff6a5a'; ctx.fill(); uiLine(UI.ink, 4);
  }
  PINBALL.slots.forEach((s, i) => {
    const x = MB.x0 + i*SLOT_W, cxs = x + SLOT_W/2, jp = s.id === 'gift';
    uiPath(x + 5, MB.slotY, SLOT_W - 10, MB.slotH, 14); const sg = ctx.createLinearGradient(0, MB.slotY, 0, MB.slotY + MB.slotH); sg.addColorStop(0, jp ? '#ffb43a' : '#8a55e8'); sg.addColorStop(1, jp ? '#e8731a' : '#4a2394'); ctx.fillStyle = sg; ctx.fill(); uiLine(UI.ink, 4);
    if (jp) miniSlot(cxs, MB.slotY + MB.slotH/2 + 2, performance.now()/1000);
    else { uiGem(cxs, MB.slotY + 38, 16 + s.v*1.6); uiTxt('EXP +' + s.v, cxs, MB.slotY + 88, 20, '#fff'); }
    if (MS.flash && MS.flash[i] > 0) { ctx.globalAlpha = MS.flash[i]/.35*.7; uiPath(x + 5, MB.slotY, SLOT_W - 10, MB.slotH, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1; } // 들어간 칸 번쩍
    if (MS.counts[i]) uiTxt('×' + MS.counts[i], cxs, MB.slotY - 14, 32, UI.gold);
  });
  for (let i = 1; i < PINBALL.slots.length; i++) { const x = MB.x0 + i*SLOT_W; uiPath(x - 7, MB.slotY - 30, 14, MB.slotH + 30, 7); ctx.fillStyle = '#ffb43a'; ctx.fill(); uiLine(UI.ink, 3.5); }
  { const tot = PINBALL.slots.reduce((a, sl, i) => a + (sl.v || 0)*MS.counts[i], 0)*(MS.mult || 1), gifts = MS.counts[PINBALL.slots.findIndex(sl => sl.id === 'gift')]; // 쌓이는 경험치 전광판
    uiPath(280, 240, 160, 66, 10); ctx.fillStyle = '#1a0a30'; ctx.fill(); uiLine('#ff9a2a', 5); ctx.fillStyle = '#ffd23a'; ctx.font = '900 28px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('EXP ' + tot, 360, 296);
    if (gifts) { ctx.font = '900 15px ' + FONT; ctx.fillStyle = '#ff9ac8'; ctx.fillText('잭팟 ×' + gifts, 360, 265); } }
  for (const f of MS.fx) { const a = Math.max(0, f.t/f.T); ctx.globalAlpha = a;
    if (f.k === 'dot') { ctx.fillStyle = f.c; ctx.fillRect(f.x - 4, f.y - 4, 8, 8); } else if (f.k === 'ring') { ctx.beginPath(); ctx.arc(f.x, f.y, f.r*(1 - a*.6), 0, TAU); ctx.strokeStyle = f.c; ctx.lineWidth = 6*a + 1; ctx.stroke(); } else uiTxt(f.s, f.x, f.y, 30, f.c);
    ctx.globalAlpha = 1; }
  for (const b of MS.balls) if (b.tr) for (let k = 0; k < b.tr.length; k += 2) { ctx.globalAlpha = k/b.tr.length*.45; ctx.beginPath(); ctx.arc(b.tr[k], b.tr[k + 1], 4 + k/b.tr.length*6, 0, TAU); ctx.fillStyle = '#fff6a0'; ctx.fill(); } ctx.globalAlpha = 1; // 꼬리
  for (const b of MS.balls) { ctx.globalAlpha = .35; ctx.beginPath(); ctx.arc(b.x, b.y, 14, 0, TAU); ctx.fillStyle = '#fff6a0'; ctx.fill(); ctx.globalAlpha = 1; const g = ctx.createRadialGradient(b.x - 3, b.y - 3, 2, b.x, b.y, 9); g.addColorStop(0, '#fff'); g.addColorStop(1, '#b8b0d8'); ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, TAU); ctx.fillStyle = g; ctx.fill(); uiLine(UI.ink, 3); }
}
