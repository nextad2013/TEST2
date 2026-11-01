import{directionFromStick}from'./controls.js';
import{Battle,DIRS,visualPosition,bombVisualPosition,speedMultiplier,POWER,attackCooldown}from'./battle.js';
const $=s=>document.querySelector(s),canvas=$('#game');let ctx=canvas.getContext('2d');let team=0,game=new Battle(2,0),playing=false,paused=false,scores=[0,0],round=1,keys=new Set(),touchDir,specialQueued=false,muted=true,audio;const colors=['#ff7dab','#ffdc72'];const characterColors=['#f24f61','#508fff','#252936','#f4f2ed','#ffdb54','#ff933f','#f78fbd','#63ce91'];
function overlay(label,title,text,button){$('#overlay').hidden=false;$('#overlabel').textContent=label;$('#overtitle').textContent=title;$('#overtext').textContent=text;$('#start').textContent=button;}
function next(){releaseStick();keys.delete('Enter');keys.delete('NumpadEnter');keys.delete('Digit0');keys.delete('Numpad0');specialQueued=false;if(scores.some(s=>s>=3)){scores=[0,0];round=1;}game=new Battle(Number($('#size').value),team);playing=true;paused=false;$('#pause').textContent='一時停止';$('#overlay').hidden=true;$('#size').disabled=true;document.querySelectorAll('.team').forEach(b=>b.disabled=true);}
$('#start').onclick=next;$('#reset').onclick=()=>{releaseStick();specialQueued=false;keys.clear();playing=false;paused=false;scores=[0,0];round=1;game=new Battle(Number($('#size').value),team);$('#size').disabled=false;document.querySelectorAll('.team').forEach(b=>b.disabled=false);overlay('CHOOSE YOUR SIDE','その一手で、ひっくり返せ。','チームと人数を選んでバトル開始。あなた以外はCPUです。','バトル開始 ↗');};
function pause(){if(!playing)return;paused=!paused;$('#pause').textContent=paused?'再開':'一時停止';if(paused)overlay('PAUSED','ひと休み。','再開ボタン、またはPキーで対戦に戻ります。','再開');else $('#overlay').hidden=true;}
$('#pause').onclick=pause;$('#start').onclick=()=>paused?pause():next();document.querySelectorAll('.team').forEach(b=>b.onclick=()=>{team=+b.dataset.team;document.querySelectorAll('.team').forEach(x=>x.classList.toggle('selected',x===b));game=new Battle(Number($('#size').value),team);});$('#size').onchange=()=>game=new Battle(Number($('#size').value),team);
window.addEventListener('keydown',e=>{
 if(/^(Arrow|Space|Enter|Digit0|Numpad)/.test(e.code))e.preventDefault();
 const enter=e.code==='Enter'||e.code==='NumpadEnter';
 if(enter&&!playing&&!e.repeat){next();return;}
 if(enter&&(!playing||paused||game.finished))return;
 keys.add(e.code);if(enter&&!e.repeat)specialQueued=true;
 if(!e.repeat&&e.code==='KeyP')pause();
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();specialQueued=false;releaseStick();if(playing&&!paused)pause();});
const joystick=$('#joystick'),stickThumb=$('#stick-thumb');let stickPointer=null;
function releaseStick(){stickPointer=null;touchDir=undefined;stickThumb.style.transform='translate(0,0)';joystick.removeAttribute?.('data-direction');}
function updateStick(e){const box=joystick.getBoundingClientRect(),dx=e.clientX-(box.left+box.width/2),dy=e.clientY-(box.top+box.height/2);touchDir=directionFromStick(dx,dy,box.width*.10);const distance=Math.hypot(dx,dy),scale=distance?Math.min(1,box.width*.23/distance):0;stickThumb.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;joystick.setAttribute?.('data-direction',touchDir===undefined?'center':['up','right','down','left'][touchDir]);}
joystick.onpointerdown=e=>{e.preventDefault();if(stickPointer!==null)return;stickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);updateStick(e);};
joystick.onpointermove=e=>{if(e.pointerId===stickPointer){e.preventDefault();updateStick(e);}};
joystick.onpointerup=joystick.onpointercancel=joystick.onlostpointercapture=e=>{if(e.pointerId===stickPointer)releaseStick();};
$('#attack').onpointerdown=e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);keys.add('Digit0');};$('#attack').onpointerup=$('#attack').onpointercancel=()=>keys.delete('Digit0');
$('#mute').onclick=()=>{muted=!muted;$('#mute').textContent=muted?'音 OFF':'音 ON';if(!muted){audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();}};
for(const id of['#special','#touch-special']){
 const button=$(id);button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add('Enter');specialQueued=true;};
 button.onpointerup=button.onpointercancel=()=>keys.delete('Enter');
 button.onclick=e=>{if(e.detail===0)specialQueued=true;};
}
function sound(type){if(muted||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type=type==='boom'?'sawtooth':'sine';o.frequency.setValueAtTime(({boom:95,pickup:720,out:180,bite:280,place:350,eat:520,dash:950,shield:640,kick:430})[type]||300,audio.currentTime);o.frequency.exponentialRampToValueAtTime(45,audio.currentTime+.15);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.start();o.stop(audio.currentTime+.2);}
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
 const ownCell=x===owner.x&&y===owner.y,active=b.contact?b.visible>.25:b.t<=0&&!b.done;
 ctx.save();ctx.translate((x+.5)*S,(y+(ownCell?.20:.5))*S);ctx.rotate((b.dir-1)*Math.PI/2);
 const r=S*(ownCell?.19:.31),mouth=active?.17:.31;
 ctx.globalAlpha=b.done&&!b.contact?.45:1;ctx.shadowColor='#ffec89';ctx.shadowBlur=active?9:3;
 ctx.fillStyle=active?'#ffcf4c':'#ffe68a';ctx.strokeStyle='#5b3629';ctx.lineWidth=Math.max(1.5,S*.035);
 ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,Math.PI*mouth,Math.PI*(2-mouth));ctx.closePath();ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;ctx.fillStyle='#332939';ctx.beginPath();ctx.arc(-r*.13,-r*.56,r*.095,0,7);ctx.fill();
 ctx.fillStyle='#fff8cc';ctx.beginPath();ctx.ellipse(-r*.48,-r*.37,r*.13,r*.23,.5,0,7);ctx.fill();
 // A small bite spark at the tip makes the actual hit window clear.
 if(active){ctx.strokeStyle='#fff6d0';ctx.lineWidth=S*.025;for(const sign of[-1,1]){ctx.beginPath();ctx.moveTo(r*1.12,sign*r*.16);ctx.lineTo(r*1.38,sign*r*.39);ctx.stroke();}}
 ctx.restore();
}
const powerTypes=[{code:'SP',name:'スピード',color:'#328bb5',path:'M5 5h6v7l4 3h5v5H4v-7h3V5m0 11h4'}, {code:'AT',name:'攻撃',color:'#ba593d',path:'M12 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14m3 0 2-4 4 1m-4-3 2-2'}, {code:'RG',name:'範囲',color:'#9654bc',path:'M3 12h18M12 3v18M3 12l4-4m-4 4 4 4m14-4-4-4m4 4-4 4M12 3l-4 4m4-4 4 4m-4 14-4-4m4 4 4-4'}];
function renderPowers(p){
 const values=[speedMultiplier(p)+'倍',p.team?(attackCooldown(p)===0?'待ち時間なし':'待ち '+attackCooldown(p)+'秒'):p.level[POWER.AT]+'個',p.team?(p.level[POWER.RG]===1?'自分のみ':'正面'+(p.level[POWER.RG]-1)+'マス'):['2マス','5マス','MAX'][p.level[POWER.RG]-1]];
 const markup=powerTypes.map((power,i)=>`<div class="power-row" style="--power:${power.color}" aria-label="${power.code} ${power.name} レベル${p.level[i]} ${values[i]}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${i===POWER.AT&&p.team?'M20 6A9 9 0 1 0 20 18L12 12Z M9 7h.01':power.path}"/></svg><div class="power-info"><b>${power.code} <small>${power.name}</small></b><div class="power-steps">${[1,2,3].map(n=>`<span class="${n<=p.level[i]?'filled':''}">${n}</span>`).join('')}</div></div><strong>${values[i]}</strong></div>`).join('');
 if($('#powers').innerHTML!==markup)$('#powers').innerHTML=markup;
 const button=$('#attack'),cool=p.cool>0?Math.ceil(p.cool*10)/10:0;button.disabled=!playing||paused||game.finished||!p.alive||p.shield>0;button.innerHTML=`<span aria-hidden="true">${p.team?'◕':'✹'}</span><b>${cool?'待ち '+cool.toFixed(1)+'秒':'攻撃'}</b><small>0 KEY</small>`;
 const name=p.team?'不死':'瞬速',symbol=p.team?'⬡':'⟫';
 for(const id of['#special','#touch-special']){const special=$(id);special.disabled=!playing||paused||game.finished||!p.alive||p.specialLeft<=0||p.shield>0;special.innerHTML=`<span aria-hidden="true">${symbol}</span><b>${name} ×${p.specialLeft}</b><small>${p.shield>0?'不死中 '+p.shield.toFixed(1)+'秒':'ENTER / 1ラウンド3回'}</small>`;special.setAttribute?.('aria-label',`${name} 残り${p.specialLeft}回 Enterキー`);}
 $('#special-note').textContent=p.team?'1.5秒静止して無敵。使用後1.5秒点滅。':'2マス移動・ブロック破壊・爆弾通過。発光・残像0.3秒。';

}
function drawActor(a,S){
 ctx.save();
 if(a.glow>0){const flashing=Math.floor(((a.team?1.5:.3)-a.glow)*10)%2===0;ctx.shadowColor=a.team?'#9cecff':'#ffe79d';ctx.shadowBlur=S*.3;ctx.filter=flashing?'brightness(1.8)':'brightness(1.15)';ctx.globalAlpha=flashing?1:.65;}
 if(a.shield>0){const x=(a.x+.5)*S,y=(a.y+.5)*S;ctx.fillStyle='#90e7ff30';ctx.strokeStyle='#9feeff';ctx.lineWidth=S*.045;ctx.beginPath();ctx.arc(x,y,S*.46,0,Math.PI*2);ctx.fill();ctx.stroke();}
 girl(a,S);ctx.restore();
}
function angel(a,S){
 const elapsed=a.death.elapsed;if(elapsed>=2.1)return;const progress=Math.min(1,elapsed/2),x=(a.death.x+.5)*S,y=(a.death.y+.5-progress*1.7)*S;
 ctx.save();ctx.globalAlpha=Math.min(1,(2.1-elapsed)*2);ctx.translate(x,y);
 // Two soft wings and a halo accompany the unchanged character face.
 ctx.fillStyle='#f4faff';for(const side of[-1,1]){ctx.beginPath();ctx.ellipse(side*S*.29,S*.06,S*.22,S*(.09+Math.sin(elapsed*8)*.02),side*.4,0,Math.PI*2);ctx.fill();}
 ctx.save();ctx.scale(.78,.78);girl({...a,x:-.5,y:-.5,alive:true,human:false},S);ctx.restore();
 ctx.strokeStyle='#ffe188';ctx.lineWidth=S*.035;ctx.beginPath();ctx.ellipse(0,-S*.43,S*.16,S*.055,0,0,Math.PI*2);ctx.stroke();
 text('✧',S*.36*Math.sin(elapsed*3),-S*.56,S*.17,'#fff6c8');ctx.restore();
}
function render(){const S=canvas.width/game.w;if(canvas.height!==game.h*S)canvas.height=game.h*S;ctx.clearRect(0,0,canvas.width,canvas.height);game.map.forEach((row,y)=>row.forEach((v,x)=>{rect(x*S+1,y*S+1,S-2,S-2,(x+y)%2?'#202738':'#242c3e',3);if(v===1){rect(x*S+2,y*S+2,S-4,S-4,'#414b66',6);rect(x*S+5,y*S+4,S-10,5,'#5c6985',2);}if(v===2){rect(x*S+4,y*S+4,S-8,S-8,'#756080',5);rect(x*S+8,y*S+8,S-16,3,'#aa89ad',1);text('×',x*S+S/2,y*S+S*.67,S*.37,'#a68aaa');}}));
 for(const b of game.bombs)if(b.t<.65)for(const[x,y]of game.cells(b))rect(x*S+3,y*S+3,S-6,S-6,`rgba(255,100,124,${.12+Math.sin(performance.now()/70)*.08})`);
 for(const i of game.items){const x=i.x*S,y=i.y*S,power=powerTypes[i.kind];rect(x+S*.10,y+S*.10,S*.80,S*.80,'#fff5de',7);rect(x+S*.14,y+S*.14,S*.72,S*.72,power.color,5);text(power.code,x+S*.5,y+S*.59,S*.30,'#fff');text('UP',x+S*.5,y+S*.79,S*.13,'#fff2da');}
 for(const b of game.bombs){const position=bombVisualPosition(b),x=(position.x+.5)*S,y=(position.y+.55)*S;ctx.fillStyle=b.t<.55&&Math.sin(performance.now()/55)>0?'#ff6582':'#111728';ctx.beginPath();ctx.arc(x,y,S*.27,0,7);ctx.fill();if(b.rollDir!==undefined&&b.rollDir!==null){const[dx,dy]=DIRS[b.rollDir];text('·',x-dx*S*.4,y-dy*S*.4,S*.4,'#ffd494');}text('✧',x-S*.07,y,S*.25,'#b6c0dd');text('✹',x+S*.15,y-S*.25,S*.25,'#ffce72');}
 for(const b of game.bites){for(const[x,y]of game.biteCells(b))rect(x*S+5,y*S+5,S-10,S-10,b.contact||b.t<=0&&!b.done?'#ffe49eaa':'#ffe49e33');}
 for(const ghost of game.afterimages){ctx.save();ctx.globalAlpha=.35*ghost.t/.3;ctx.filter='brightness(1.7)';girl(ghost.actor,S);ctx.restore();}
 for(const a of game.actors)if(a.alive){const position=visualPosition(a);if(game.escaped&&a.team===0){const progress=Math.min(1,game.endElapsed/1.8),exit=a.x<game.w/2?-1:game.w;position.x+=(exit-position.x)*progress;position.y+=Math.sin(game.endElapsed*24)*.04;ctx.save();ctx.globalAlpha=1-progress;const trailDirection=a.x<game.w/2?1:-1;for(let n=1;n<=3;n++)text('·',(position.x+.5+trailDirection*n*.25)*S,(position.y+.72)*S,S*.35,'#ffdfb0');ctx.restore();}drawActor({...a,...position},S);}
 for(const b of game.bites)for(const[x,y]of game.biteCells(b))biteIcon(b,x,y,S);
 for(const f of game.fire)for(const[x,y]of f.cells){rect(x*S+2,y*S+2,S-4,S-4,'#ff9c58cc',6);text('✦',(x+.5)*S,(y+.74)*S,S*.68,'#fff3af');}
 for(const a of game.actors)if(a.death)angel(a,S);
 $('#left').textContent=`${scores[0]} · ${game.actors.filter(a=>a.team===0&&a.alive).length}人`;$('#right').textContent=`${scores[1]} · ${game.actors.filter(a=>a.team===1&&a.alive).length}人`;$('#time').textContent=Math.ceil(game.time);$('#round').textContent=`ROUND ${String(round).padStart(2,'0')}`;const p=game.player;renderPowers(p);$('#status').textContent=paused?'● PAUSED':game.finished&&!game.resultReady?(game.escaped?'↗ ボムガール逃亡中！':'✧ 昇天中…'):!playing?'● READY TO PLAY':p.alive?'● BATTLE IN PROGRESS':'● 退場 — CPUの対戦を観戦中';}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(playing&&!paused){let dir=touchDir;if(keys.has('ArrowUp')||keys.has('KeyW'))dir=0;if(keys.has('ArrowRight')||keys.has('KeyD'))dir=1;if(keys.has('ArrowDown')||keys.has('KeyS'))dir=2;if(keys.has('ArrowLeft')||keys.has('KeyA'))dir=3;game.update(dt,{dir,attack:keys.has('Space')||keys.has('Digit0')||keys.has('Numpad0'),special:specialQueued||keys.has('Enter')||keys.has('NumpadEnter')});specialQueued=false;for(const e of game.events.splice(0))sound(e);if(game.resultReady){playing=false;const r=game.result;if(r>=0)scores[r]++;const done=scores.some(s=>s>=3);overlay(done?'MATCH FINISHED':'ROUND FINISHED',r<0?'引き分け！':game.escaped?'逃亡成功！ ボムガールの勝利！':`${r===0?'ボムガール':'パックマスター'}の勝利！`,done?'3ラウンド先取！ もう一度挑戦しよう。':`${scores[0]} 対 ${scores[1]} — 次のラウンドへ。`,done?'もう一度対戦':'次のラウンド ↗');if(!done)round++;}}render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
