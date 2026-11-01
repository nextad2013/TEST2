import{Battle,DIRS,visualPosition,speedMultiplier}from'./battle.js';
const $=s=>document.querySelector(s),canvas=$('#game');let ctx=canvas.getContext('2d');let team=0,game=new Battle(2,0),playing=false,paused=false,scores=[0,0],round=1,keys=new Set(),touchDir,muted=true,audio;const colors=['#ff7dab','#ffdc72'];const characterColors=['#f24f61','#508fff','#252936','#f4f2ed','#ffdb54','#ff933f','#f78fbd','#63ce91'];
function overlay(label,title,text,button){$('#overlay').hidden=false;$('#overlabel').textContent=label;$('#overtitle').textContent=title;$('#overtext').textContent=text;$('#start').textContent=button;}
function next(){if(scores.some(s=>s>=3)){scores=[0,0];round=1;}game=new Battle(Number($('#size').value),team);playing=true;paused=false;$('#pause').textContent='一時停止';$('#overlay').hidden=true;$('#size').disabled=true;document.querySelectorAll('.team').forEach(b=>b.disabled=true);}
$('#start').onclick=next;$('#reset').onclick=()=>{playing=false;paused=false;scores=[0,0];round=1;game=new Battle(Number($('#size').value),team);$('#size').disabled=false;document.querySelectorAll('.team').forEach(b=>b.disabled=false);overlay('CHOOSE YOUR SIDE','その一手で、ひっくり返せ。','チームと人数を選んでバトル開始。あなた以外はCPUです。','バトル開始 ↗');};
function pause(){if(!playing)return;paused=!paused;$('#pause').textContent=paused?'再開':'一時停止';if(paused)overlay('PAUSED','ひと休み。','再開ボタン、またはPキーで対戦に戻ります。','再開');else $('#overlay').hidden=true;}
$('#pause').onclick=pause;$('#start').onclick=()=>paused?pause():next();document.querySelectorAll('.team').forEach(b=>b.onclick=()=>{team=+b.dataset.team;document.querySelectorAll('.team').forEach(x=>x.classList.toggle('selected',x===b));game=new Battle(Number($('#size').value),team);});$('#size').onchange=()=>game=new Battle(Number($('#size').value),team);
window.addEventListener('keydown',e=>{if(/^(Arrow|Space)/.test(e.code))e.preventDefault();keys.add(e.code);if(!e.repeat&&e.code==='KeyP')pause();if(!e.repeat&&e.code==='Enter'&&!playing)next();});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touchDir=undefined;if(playing&&!paused)pause();});
const touchMap={up:0,right:1,down:2,left:3};document.querySelectorAll('[data-dir]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touchDir=touchMap[b.dataset.dir];};b.onpointerup=b.onpointercancel=()=>touchDir=undefined;});$('#attack').onpointerdown=e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.add('Space');};$('#attack').onpointerup=$('#attack').onpointercancel=()=>keys.delete('Space');$('#mute').onclick=()=>{muted=!muted;$('#mute').textContent=muted?'音 OFF':'音 ON';if(!muted){audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();}};
function sound(type){if(muted||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type=type==='boom'?'sawtooth':'sine';o.frequency.setValueAtTime(({boom:95,pickup:720,out:180,bite:280,place:350,eat:520})[type]||300,audio.currentTime);o.frequency.exponentialRampToValueAtTime(45,audio.currentTime+.15);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.start();o.stop(audio.currentTime+.2);}
function rect(x,y,w,h,color,r=5){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function text(s,x,y,size,color='#fff'){ctx.fillStyle=color;ctx.font=`bold ${size}px Arial`;ctx.textAlign='center';ctx.fillText(s,x,y);}
// Separate drawing path keeps the approved Pack Girl artwork unchanged.
function bombGirl(a,S){
 const accent=characterColors[a.id],hair='#3b294b',edge='#211a30';
 ctx.save();ctx.translate((a.x+.5)*S,(a.y+.5)*S);if(!a.alive)ctx.globalAlpha=.18;
 if(a.human){ctx.strokeStyle='#a8f4e0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,S*.46,0,7);ctx.stroke();}
 const shape=(points,fill,stroke)=>{ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*S,y*S):ctx.moveTo(x*S,y*S));ctx.closePath();ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=S*.014;ctx.stroke();}};
 const oval=(x,y,rx,ry,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x*S,y*S,rx*S,ry*S,0,0,Math.PI*2);ctx.fill();};
 // Dark purple hair, gathered low at the nape rather than a hat or pigtail.
 oval(.20,.12,.105,.13,'#30233f');oval(0,-.09,.285,.30,hair);
 shape([[-.26,-.08],[-.27,.15],[-.16,.20],[-.15,.01]],hair);
 shape([[.24,-.10],[.26,.14],[.16,.18],[.15,-.015]],hair);
 // White sleeveless blouse with the identifying color on the waist and arm bands.
 shape([[-.11,.13],[-.21,.20],[-.19,.34],[.19,.34],[.21,.20],[.11,.13]],'#fff4e8',edge);
 shape([[-.21,.20],[-.255,.31],[-.21,.33],[-.16,.22]],'#f9d4c7');
 shape([[.21,.20],[.255,.31],[.21,.33],[.16,.22]],'#f9d4c7');
 rect(-S*.245,S*.235,S*.065,S*.045,accent,S*.01);rect(S*.18,S*.235,S*.065,S*.045,accent,S*.01);
 rect(-S*.19,S*.30,S*.38,S*.055,accent,S*.015);
 shape([[-.10,.255],[0,.30],[-.055,.325],[-.16,.27]],'#fffefa',edge);
 shape([[.10,.255],[0,.30],[.055,.325],[.16,.27]],'#fffefa',edge);
 shape([[0,.285],[-.025,.31],[-.015,.342],[.015,.342],[.025,.31]],'#292330');
 oval(0,-.025,.216,.224,'#ffe0d2');
 // Exposed neck separates the real mouth and chin from the choker.
 rect(-S*.075,S*.190,S*.15,S*.085,'#f6cdbf',S*.018);
 rect(-S*.085,S*.232,S*.17,S*.034,'#211e29',S*.006);
 ctx.strokeStyle='#e1dce8';ctx.lineWidth=S*.012;ctx.beginPath();ctx.arc(0,S*.273,S*.020,0,Math.PI*2);ctx.stroke();
 // Green eyes, soft lids and small highlights.
 for(const k of[-1,1]){
  oval(k*.088,.014,.047,.060,'#302536');oval(k*.088,.032,.032,.040,'#6ea98a');oval(k*.088,.032,.014,.030,'#273e36');
  ctx.strokeStyle='#302536';ctx.lineWidth=S*.018;ctx.beginPath();ctx.moveTo(k*S*.043,-S*.024);ctx.quadraticCurveTo(k*S*.09,-S*.045,k*S*.141,-S*.034);ctx.stroke();
  oval(k*.088-.012,-.010,.015,.018,'#fff9ef');oval(k*.15,.082,.035,.014,'#efadb1');
 }
 // Long, asymmetrical fringe sweeps across one side of the face.
 shape([[-.27,-.15],[-.21,-.31],[-.075,-.37],[.11,-.33],[.235,-.19],[.21,-.06],[.15,-.17],[.07,-.22],[.025,-.12],[-.045,-.015],[-.09,.045],[-.13,-.11],[-.19,-.065],[-.20,-.18]],hair);
 ctx.strokeStyle='#765583';ctx.lineWidth=S*.014;ctx.beginPath();ctx.moveTo(-S*.18,-S*.25);ctx.bezierCurveTo(-S*.11,-S*.32,S*.015,-S*.31,S*.10,-S*.25);ctx.stroke();
 ctx.strokeStyle='#604568';ctx.lineWidth=S*.01;ctx.beginPath();ctx.moveTo(S*.055,-S*.23);ctx.quadraticCurveTo(-S*.04,-S*.15,-S*.085,S*.012);ctx.stroke();
 ctx.strokeStyle='#9c5965';ctx.lineWidth=S*.012;ctx.beginPath();ctx.moveTo(-S*.035,S*.115);ctx.quadraticCurveTo(S*.008,S*.143,S*.050,S*.111);ctx.stroke();
 text(a.human?'YOU':a.id%4+1,0,S*.45,S*.14,a.human?'#a8f4e0':'#d5d7e7');
 const[dx,dy]=DIRS[a.dir];oval(dx*.37,dy*.37,.045,.045,accent);ctx.restore();
}
function packGirl(a,S){
 const hair='#b9513d',edge='#592c32',accent=characterColors[a.id];
 ctx.save();ctx.translate((a.x+.5)*S,(a.y+.5)*S);if(!a.alive)ctx.globalAlpha=.18;
 if(a.human){ctx.strokeStyle='#a8f4e0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,S*.46,0,7);ctx.stroke();}
 const shape=(points,fill,stroke)=>{ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*S,y*S):ctx.moveTo(x*S,y*S));ctx.closePath();ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=S*.014;ctx.stroke();}};
 const oval=(x,y,rx,ry,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x*S,y*S,rx*S,ry*S,0,0,Math.PI*2);ctx.fill();};
 const walking=a.alive&&a.wait>0&&a.motion,phase=walking?1-a.wait/a.motion.duration:0,swing=walking?Math.sin(phase*Math.PI*2)*.018:0;
 // Copper hair and a compact side braid, readable in a single maze cell.
 oval(0,-.085,.282,.285,hair);
 for(let i=0;i<3;i++){oval(-.23+swing,.12+i*.065,.065-i*.006,.052,'#8f3c35');oval(-.24+swing,.10+i*.065,.049-i*.005,.042,i%2?'#d16b4a':'#be5842');}
 shape([[-.26+swing,.25],[-.29+swing,.32],[-.20+swing,.30]],hair);
 // White shirt, black tie, and four identifying colors on the belt and sleeves.
 shape([[-.12,.15],[-.20,.21],[-.18,.33],[.18,.33],[.20,.21],[.12,.15]],'#fff7e9',edge);
 oval(-.205,.25+swing,.043,.061,'#ffdfcb');oval(.205,.25-swing,.043,.061,'#ffdfcb');
 rect(-S*.23,S*.205,S*.065,S*.045,accent,S*.012);rect(S*.165,S*.205,S*.065,S*.045,accent,S*.012);
 // Bare neck, open white collar, and a distinctly vertical tie below the jaw.
 rect(-S*.065,S*.165,S*.13,S*.078,'#ffdfcb',S*.014);
 shape([[-.085,.225],[0,.26],[-.055,.285],[-.145,.24]],'#ffffff',edge);
 shape([[.085,.225],[0,.26],[.055,.285],[.145,.24]],'#ffffff',edge);
 shape([[0,.25],[-.025,.275],[0,.292],[.025,.275]],'#302a35');
 shape([[0,.285],[-.021,.307],[0,.335],[.021,.307]],'#302a35');
 rect(-S*.16,S*.31,S*.32,S*.045,accent,S*.012);
 oval(-.085,.355+swing,.057,.036,'#342a39');oval(.085,.355-swing,.057,.036,'#342a39');
 // Taper the cheeks toward a small V-shaped chin instead of a round face.
 ctx.fillStyle='#ffe1ce';ctx.beginPath();ctx.moveTo(-S*.218,-S*.065);
 ctx.bezierCurveTo(-S*.225,-S*.235,S*.225,-S*.235,S*.218,-S*.065);
 ctx.bezierCurveTo(S*.216,S*.070,S*.120,S*.145,S*.022,S*.188);
 ctx.quadraticCurveTo(0,S*.200,-S*.022,S*.188);
 ctx.bezierCurveTo(-S*.120,S*.145,-S*.216,S*.070,-S*.218,-S*.065);
 ctx.closePath();ctx.fill();
 ctx.strokeStyle='#d3a18d';ctx.lineWidth=S*.009;ctx.stroke();
 // Makima's golden ringed eyes: strong outer shape, amber iris, concentric ring.
 for(const k of[-1,1]){
  oval(k*.091,.012,.049,.067,'#522c32');oval(k*.091,.025,.037,.052,'#ffc04e');
  ctx.strokeStyle='#b8672a';ctx.lineWidth=S*.011;ctx.beginPath();ctx.ellipse(k*S*.091,S*.025,S*.025,S*.036,0,0,Math.PI*2);ctx.stroke();
  oval(k*.091,.025,.011,.024,'#75402a');oval(k*.091-.014,-.015,.014,.017,'#fffbed');
  ctx.strokeStyle='#522c32';ctx.lineWidth=S*.018;ctx.beginPath();ctx.moveTo(k*S*.043,-S*.035);ctx.quadraticCurveTo(k*S*.09,-S*.060,k*S*.145,-S*.041);ctx.stroke();
  oval(k*.153,.085,.033,.013,'#ee9a96');
 }
 // Clearly separated straight fringe, with a long side lock framing each cheek.
 shape([[-.263,-.16],[-.20,-.30],[-.05,-.35],[.16,-.31],[.26,-.16],[.20,-.075],[.145,-.155],[.11,-.065],[.055,-.15],[.005,-.065],[-.045,-.155],[-.10,-.075],[-.16,-.16],[-.205,-.08]],hair);
 shape([[-.255,-.14],[-.19,-.10],[-.17,.19],[-.24,.13]],hair);shape([[.255,-.14],[.19,-.10],[.17,.19],[.24,.13]],hair);
 ctx.strokeStyle='#e98862';ctx.lineWidth=S*.014;ctx.beginPath();ctx.moveTo(-S*.17,-S*.235);ctx.quadraticCurveTo(-S*.04,-S*.29,S*.075,-S*.245);ctx.stroke();
 ctx.strokeStyle='#9e4e4d';ctx.lineWidth=S*.012;ctx.beginPath();ctx.moveTo(-S*.034,S*.116);ctx.quadraticCurveTo(S*.005,S*.137,S*.044,S*.108);ctx.stroke();
 // Candidate 2's ribbon: one open-mouth yellow ornament on the left temple.
 shape([[-.205,-.27],[-.37,-.34],[-.36,-.19],[-.205,-.24]],accent,edge);
 shape([[-.23,-.235],[-.34,-.115],[-.29,-.11],[-.20,-.23]],accent,edge);
 ctx.fillStyle='#ffdc59';ctx.strokeStyle='#70452b';ctx.lineWidth=S*.018;ctx.beginPath();ctx.moveTo(-S*.22,-S*.285);ctx.arc(-S*.22,-S*.285,S*.108,Math.PI*.22,Math.PI*1.78);ctx.closePath();ctx.fill();ctx.stroke();
 oval(-.24,-.332,.014,.014,'#392b31');oval(-.277,-.32,.014,.019,'#fff7c2');
 text(a.human?'YOU':a.id%4+1,0,S*.45,S*.14,a.human?'#a8f4e0':'#d5d7e7');
 const[dx,dy]=DIRS[a.dir];oval(dx*.37,dy*.37,.045,.045,accent);ctx.restore();
}
function girl(a,S){if(a.team===0)bombGirl(a,S);else packGirl(a,S);}
function biteIcon(b,x,y,S){
 const owner=game.actors.find(a=>a.id===b.actor);if(!owner?.alive)return;
 const ownCell=x===owner.x&&y===owner.y,active=b.t<=0&&!b.done;
 ctx.save();ctx.translate((x+.5)*S,(y+(ownCell?.20:.5))*S);ctx.rotate((b.dir-1)*Math.PI/2);
 const r=S*(ownCell?.19:.31),mouth=active?.17:.31;
 ctx.globalAlpha=b.done?.45:1;ctx.shadowColor='#ffec89';ctx.shadowBlur=active?9:3;
 ctx.fillStyle=active?'#ffcf4c':'#ffe68a';ctx.strokeStyle='#5b3629';ctx.lineWidth=Math.max(1.5,S*.035);
 ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,Math.PI*mouth,Math.PI*(2-mouth));ctx.closePath();ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;ctx.fillStyle='#332939';ctx.beginPath();ctx.arc(-r*.13,-r*.56,r*.095,0,7);ctx.fill();
 ctx.fillStyle='#fff8cc';ctx.beginPath();ctx.ellipse(-r*.48,-r*.37,r*.13,r*.23,.5,0,7);ctx.fill();
 // A small bite spark at the tip makes the actual hit window clear.
 if(active){ctx.strokeStyle='#fff6d0';ctx.lineWidth=S*.025;for(const sign of[-1,1]){ctx.beginPath();ctx.moveTo(r*1.12,sign*r*.16);ctx.lineTo(r*1.38,sign*r*.39);ctx.stroke();}}
 ctx.restore();
}
function render(){const S=canvas.width/game.w;if(canvas.height!==game.h*S)canvas.height=game.h*S;ctx.clearRect(0,0,canvas.width,canvas.height);game.map.forEach((row,y)=>row.forEach((v,x)=>{rect(x*S+1,y*S+1,S-2,S-2,(x+y)%2?'#202738':'#242c3e',3);if(v===1){rect(x*S+2,y*S+2,S-4,S-4,'#414b66',6);rect(x*S+5,y*S+4,S-10,5,'#5c6985',2);}if(v===2){rect(x*S+4,y*S+4,S-8,S-8,'#756080',5);rect(x*S+8,y*S+8,S-16,3,'#aa89ad',1);text('×',x*S+S/2,y*S+S*.67,S*.37,'#a68aaa');}}));
 for(const b of game.bombs)if(b.t<.65)for(const[x,y]of game.cells(b))rect(x*S+3,y*S+3,S-6,S-6,`rgba(255,100,124,${.12+Math.sin(performance.now()/70)*.08})`);
 for(const i of game.items){const x=i.x*S,y=i.y*S;rect(x+S*.12,y+S*.12,S*.76,S*.76,'#fff2da',7);rect(x+S*.16,y+S*.16,S*.68,S*.68,i.kind?'#925a34':'#9853d6',5);text('UP',x+S*.5,y+S*.59,S*.30,'#ffffff');text(i.kind?'Ⅱ':'Ⅰ',x+S*.5,y+S*.79,S*.13,'#fff2da');}
 for(const b of game.bombs){const x=(b.x+.5)*S,y=(b.y+.55)*S;ctx.fillStyle=b.t<.55&&Math.sin(performance.now()/55)>0?'#ff6582':'#111728';ctx.beginPath();ctx.arc(x,y,S*.27,0,7);ctx.fill();text('✧',x-S*.07,y,S*.25,'#b6c0dd');text('✹',x+S*.15,y-S*.25,S*.25,'#ffce72');}
 for(const b of game.bites){for(const[x,y]of game.biteCells(b))rect(x*S+5,y*S+5,S-10,S-10,b.t<=0&&!b.done?'#ffe49eaa':'#ffe49e33');}
 for(const a of game.actors)girl({...a,...visualPosition(a)},S);
 for(const b of game.bites)for(const[x,y]of game.biteCells(b))biteIcon(b,x,y,S);
 for(const f of game.fire)for(const[x,y]of f.cells){rect(x*S+2,y*S+2,S-4,S-4,'#ff9c58cc',6);text('✦',(x+.5)*S,(y+.74)*S,S*.68,'#fff3af');}
 $('#left').textContent=`${scores[0]} · ${game.actors.filter(a=>a.team===0&&a.alive).length}人`;$('#right').textContent=`${scores[1]} · ${game.actors.filter(a=>a.team===1&&a.alive).length}人`;$('#time').textContent=Math.ceil(game.time);$('#round').textContent=`ROUND ${String(round).padStart(2,'0')}`;const p=game.player,dots=n=>'●'.repeat(n)+'○'.repeat(3-n);$('#powers').textContent=p.team?`速度 ${dots(p.level[0])}  ${[1,1.5,2][p.level[0]-1]}倍\n捕食 ${dots(p.level[1])}  ${p.level[1]===1?'自分のみ':'正面'+(p.level[1]-1)+'マス'}`:`爆風 ${dots(p.level[0])}  ${['1/3','2/3','MAX'][p.level[0]-1]}\n設置 ${dots(p.level[1])}  ${p.level[1]}個\n速度 ${speedMultiplier(p)}倍`;$('#status').textContent=paused?'● PAUSED':!playing?'● READY TO PLAY':p.alive?'● BATTLE IN PROGRESS':'● 退場 — CPUの対戦を観戦中';}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(playing&&!paused){let dir=touchDir;if(keys.has('ArrowUp')||keys.has('KeyW'))dir=0;if(keys.has('ArrowRight')||keys.has('KeyD'))dir=1;if(keys.has('ArrowDown')||keys.has('KeyS'))dir=2;if(keys.has('ArrowLeft')||keys.has('KeyA'))dir=3;game.update(dt,{dir,attack:keys.has('Space')});for(const e of game.events.splice(0))sound(e);if(game.finished){playing=false;const r=game.result;if(r>=0)scores[r]++;const done=scores.some(s=>s>=3);overlay(done?'MATCH FINISHED':'ROUND FINISHED',r<0?'引き分け！':`${r===0?'爆弾娘':'パックガール'}の勝利！`,done?'3ラウンド先取！ もう一度挑戦しよう。':`${scores[0]} 対 ${scores[1]} — 次のラウンドへ。`,done?'もう一度対戦':'次のラウンド ↗');if(!done)round++;}}render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
