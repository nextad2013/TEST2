import{Battle,DIRS,visualPosition}from'./battle.js';
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
// Two shared team silhouettes: fuse pigtails and a beak-shaped bow.
function headwear(a,S){
 ctx.save();ctx.scale(S,S);const color=characterColors[a.id];
 const shape=(points,fill)=>{ctx.fillStyle=fill;ctx.strokeStyle='#f9e9d5';ctx.lineWidth=.018;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();};
 const circle=(x,y,r,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
 // Keep every accessory seated inside the hairline, overlapping the bangs.
 if(a.team===1){
  // A cloth headband follows the skull; the single beak bow is sewn onto it.
  ctx.strokeStyle='#fff0dc';ctx.lineWidth=.085;ctx.beginPath();ctx.moveTo(-.24,-.17);ctx.quadraticCurveTo(0,-.38,.24,-.17);ctx.stroke();
  ctx.strokeStyle=color;ctx.lineWidth=.05;ctx.beginPath();ctx.moveTo(-.24,-.17);ctx.quadraticCurveTo(0,-.38,.24,-.17);ctx.stroke();
  shape([[.10,-.22],[-.015,-.125],[.055,-.12],[.145,-.22]],color);
  shape([[.15,-.22],[.25,-.105],[.27,-.18],[.19,-.27]],color);
  ctx.fillStyle='#ffe276';ctx.strokeStyle='#9d683b';ctx.lineWidth=.018;ctx.beginPath();ctx.moveTo(.14,-.25);ctx.arc(.14,-.25,.135,Math.PI*.23,Math.PI*1.77);ctx.closePath();ctx.fill();ctx.stroke();
  circle(.105,-.308,.016,'#362b36');
  ctx.beginPath();ctx.moveTo(.04,-.285);ctx.quadraticCurveTo(.06,-.34,.13,-.34);ctx.strokeStyle='#fff8cf';ctx.lineWidth=.018;ctx.stroke();
  circle(.105,-.205,.024,'#f3a2a5');
 }
 ctx.restore();
}
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
function girl(a,S){
 if(a.team===0){bombGirl(a,S);return;}
 const x=(a.x+.5)*S,y=(a.y+.5)*S,hair=a.team?'#754329':'#42324f',accent=characterColors[a.id];
 ctx.save();ctx.translate(x,y);if(!a.alive)ctx.globalAlpha=.18;
 if(a.human){ctx.strokeStyle='#a8f4e0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,S*.46,0,7);ctx.stroke();}
 const shape=(points,fill)=>{ctx.fillStyle=fill;ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px*S,py*S):ctx.moveTo(px*S,py*S));ctx.closePath();ctx.fill();};
 // Brown shoulder-length hair / dark violet bob; team colors belong to clothes.
 rect(-S*.29,-S*.31,S*.58,S*(a.team?.65:.56),hair,S*.20);
 if(a.team){shape([[-.28,-.05],[-.32,.29],[-.20,.24],[-.14,.07]],hair);shape([[.28,-.05],[.32,.29],[.20,.24],[.14,.07]],hair);}
 rect(-S*.20,S*.09,S*.40,S*.24,accent,S*.06);
 shape([[-.15,.11],[0,.20],[.15,.11],[.10,.25],[-.10,.25]],'#fff3e5');
 if(!a.team){rect(-S*.105,S*.105,S*.21,S*.045,'#24202f',S*.015);ctx.strokeStyle='#d2cbdf';ctx.lineWidth=S*.012;ctx.beginPath();ctx.arc(0,S*.15,S*.026,0,7);ctx.stroke();}
 else{shape([[-.10,.19],[-.015,.16],[-.015,.25]],accent);shape([[.10,.19],[.015,.16],[.015,.25]],accent);}
 ctx.fillStyle='#ffe0d0';ctx.beginPath();ctx.ellipse(0,-S*.027,S*.224,S*.235,0,0,7);ctx.fill();
 // Contrasting pointed bangs extend visibly below the accessory, toward the eyes.
 if(a.team){shape([[-.24,-.17],[-.19,-.27],[.17,-.27],[.24,-.16],[.19,-.04],[.12,-.16],[.075,-.07],[.015,-.17],[-.04,-.06],[-.105,-.17],[-.18,-.04]],hair);}
 else{shape([[-.25,-.17],[-.16,-.29],[.15,-.28],[.24,-.16],[.17,-.035],[.085,-.14],[-.005,.005],[-.035,-.14],[-.17,-.04]],hair);}
 ctx.strokeStyle=a.team?'#ac7750':'#796089';ctx.lineWidth=S*.014;ctx.beginPath();ctx.moveTo(-S*.18,-S*.18);ctx.quadraticCurveTo(-S*.07,-S*.23,S*.01,-S*.18);ctx.stroke();
 for(const k of[-1,1]){ctx.fillStyle='#302735';ctx.beginPath();ctx.ellipse(k*S*.088,S*.015,S*.045,S*.069,0,0,7);ctx.fill();ctx.fillStyle=a.team?'#ad7539':'#659b82';ctx.beginPath();ctx.ellipse(k*S*.088,S*.037,S*.029,S*.035,0,0,7);ctx.fill();ctx.strokeStyle='#302735';ctx.lineWidth=S*.018;ctx.beginPath();ctx.moveTo(k*S*.045,-S*.03);ctx.lineTo(k*S*.135,-S*.052);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(k*S*.088-S*.012,-S*.013,S*.018,0,7);ctx.fill();ctx.fillStyle='#ef98a6';ctx.beginPath();ctx.ellipse(k*S*.15,S*.09,S*.044,S*.02,0,0,7);ctx.fill();}
 text('ᴗ',0,S*.14,S*.14,'#8c4e59');headwear(a,S);
 text(a.human?'YOU':a.id%4+1,0,S*.45,S*.14,a.human?'#a8f4e0':'#d5d7e7');
 const[dx,dy]=DIRS[a.dir];ctx.fillStyle=accent;ctx.beginPath();ctx.arc(dx*S*.37,dy*S*.37,S*.045,0,7);ctx.fill();ctx.restore();
}
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
 $('#left').textContent=`${scores[0]} · ${game.actors.filter(a=>a.team===0&&a.alive).length}人`;$('#right').textContent=`${scores[1]} · ${game.actors.filter(a=>a.team===1&&a.alive).length}人`;$('#time').textContent=Math.ceil(game.time);$('#round').textContent=`ROUND ${String(round).padStart(2,'0')}`;const p=game.player,dots=n=>'●'.repeat(n)+'○'.repeat(3-n);$('#powers').textContent=p.team?`速度 ${dots(p.level[0])}  ${[1,1.5,2][p.level[0]-1]}倍\n捕食 ${dots(p.level[1])}  ${p.level[1]}マス`:`爆風 ${dots(p.level[0])}  ${['1/3','2/3','MAX'][p.level[0]-1]}\n設置 ${dots(p.level[1])}  ${p.level[1]}個`;$('#status').textContent=paused?'● PAUSED':!playing?'● READY TO PLAY':p.alive?'● BATTLE IN PROGRESS':'● 退場 — CPUの対戦を観戦中';}
document.querySelectorAll('[data-portrait]').forEach(preview=>{const t=Number(preview.dataset.portrait),boardContext=ctx;ctx=preview.getContext('2d');ctx.save();ctx.translate(10,15);girl({x:0,y:0,id:t*4,team:t,alive:true,human:false,dir:2},80);ctx.restore();ctx=boardContext;});
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(playing&&!paused){let dir=touchDir;if(keys.has('ArrowUp')||keys.has('KeyW'))dir=0;if(keys.has('ArrowRight')||keys.has('KeyD'))dir=1;if(keys.has('ArrowDown')||keys.has('KeyS'))dir=2;if(keys.has('ArrowLeft')||keys.has('KeyA'))dir=3;game.update(dt,{dir,attack:keys.has('Space')});for(const e of game.events.splice(0))sound(e);if(game.finished){playing=false;const r=game.result;if(r>=0)scores[r]++;const done=scores.some(s=>s>=3);overlay(done?'MATCH FINISHED':'ROUND FINISHED',r<0?'引き分け！':`${r===0?'爆弾娘':'パックガール'}の勝利！`,done?'3ラウンド先取！ もう一度挑戦しよう。':`${scores[0]} 対 ${scores[1]} — 次のラウンドへ。`,done?'もう一度対戦':'次のラウンド ↗');if(!done)round++;}}render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
