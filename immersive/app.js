const modes=[
 {name:'01 · Drift',title:'I make<br><em>ideas real.</em>',sub:'Three objects move through the whole field.'},
 {name:'02 · Field notes',title:'Made for<br><em>real life.</em>',sub:'A cinematic editorial frame.'},
 {name:'03 · Letterform',title:'BUILDING<br><em>with care.</em>',sub:'Oversized typography and a tactile object.'},
 {name:'04 · Orbit',title:'Ideas with<br><em>purpose.</em>',sub:'A quiet orbit across the full page.'},
 {name:'05 · Anatomy',title:'From idea<br><em>to matter.</em>',sub:'A full-screen concept that comes together.'},
 {name:'06 · Character',title:'Things with<br><em>character.</em>',sub:'Choose a friend to change the whole space.'},
 {name:'07 · Story',title:'Make it<br><em>matter.</em>',sub:'An immersive, scroll-led narrative.'},
 {name:'08 · Material',title:'Built with<br><em>intention.</em>',sub:'Tactile materials and oversized form.'},
 {name:'09 · Perspective',title:'THINK BIG.<br><em>build real.</em>',sub:'A photographic diagonal and moving type.'},
 {name:'10 · Living field',title:'Curiosity<br><em>in motion.</em>',sub:'A responsive field of objects and lines.'}
];
const obj=(letter,animal,depth,rate)=>`<div class="sprite ${letter} ${animal}" data-depth="${depth}" data-rate="${rate}"></div>`;
const sceneHtml=[
 obj('a','hedgehog',.7,-.10)+obj('b','ladybug',1.4,-.25)+obj('c','turtle',1,-.16),
 '<div class="scene-photo" data-depth="-.3" data-rate=".15"></div>',
 '<span class="floating-type" data-depth="-.4" data-rate="-.18">EMOZU</span>'+obj('a','ladybug',1.3,-.25),
 '<div class="ring one"></div><div class="ring two"></div>'+obj('a','turtle',1.3,-.25),
 '<div class="part one"></div><div class="part two"></div><div class="part three"></div>',
 obj('a chosen','hedgehog',1,-.12)+obj('b','ladybug',1,-.12)+obj('c','turtle',1,-.12),
 '<div class="scene-photo" data-depth="-.3" data-rate=".20"></div>',
 '<span class="floating-type" data-depth="-.4" data-rate="-.15">EMOZU</span>'+obj('a','hedgehog',1.2,-.2),
 '<div class="scene-photo" data-depth="-.2" data-rate=".15"></div><span class="floating-type" data-depth="-.4" data-rate="-.15">YURY</span>',
 '<div class="ring one"></div><div class="ring two"></div>'+obj('a','hedgehog',1.2,-.12)+obj('b','ladybug',1.6,-.2)+obj('c','turtle',.8,-.15)
];
const app=document.querySelector('#app'),hero=document.querySelector('#hero'),scene=document.querySelector('#scene'),tabs=document.querySelector('#tabs'),control=document.querySelector('#scene-control');let active=0,photoURL='';let mouseX=0,mouseY=0,scroll=0,queued=false;
tabs.innerHTML=modes.map((m,i)=>`<button data-i="${i}" aria-label="Hero ${m.name}" aria-pressed="${i===0}">${m.name}</button>`).join('');
function updateMotion(){queued=false;scene.querySelectorAll('[data-depth]').forEach(el=>{const d=Number(el.dataset.depth),r=Number(el.dataset.rate);el.style.setProperty('--x',(mouseX*d).toFixed(1)+'px');el.style.setProperty('--y',(mouseY*d).toFixed(1)+'px');el.style.setProperty('--scroll',(scroll*r).toFixed(1)+'px')})}
function schedule(){if(!queued){queued=true;requestAnimationFrame(updateMotion)}}
function draw(i){active=i;app.className='theme t'+(i+1);scene.innerHTML=sceneHtml[i];document.querySelector('#headline').innerHTML=modes[i].title;document.querySelector('#concept-name').textContent=modes[i].name.toUpperCase();tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.i===i)));control.innerHTML=i===4?'<button class="assembly-toggle" data-act="assemble" aria-pressed="false">ASSEMBLE ↗</button>':i===5?'<span class="control-label">CHANGE FRIEND</span><button data-animal="0" class="active" aria-label="Hedgehog" aria-pressed="true">01</button><button data-animal="1" aria-label="Ladybug" aria-pressed="false">02</button><button data-animal="2" aria-label="Turtle" aria-pressed="false">03</button>':'';history.replaceState(null,'','#'+(i+1));schedule()}
tabs.addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(!b)return;draw(+b.dataset.i);b.scrollIntoView({inline:'nearest',block:'nearest',behavior:'instant'});hero.scrollIntoView({block:'start',behavior:'instant'})});
control.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.act==='assemble'){const on=app.classList.toggle('assembled');b.setAttribute('aria-pressed',String(on));b.textContent=on?'EXPLODE ↗':'ASSEMBLE ↗'}if(b.dataset.animal!==undefined){let k=+b.dataset.animal;app.classList.remove('animal0','animal1','animal2');app.classList.add('animal'+k);scene.querySelectorAll('.sprite').forEach((x,j)=>x.classList.toggle('chosen',j===k));control.querySelectorAll('button').forEach((x,j)=>{x.classList.toggle('active',j===k);x.setAttribute('aria-pressed',String(j===k))})}});
hero.addEventListener('pointermove',e=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=hero.getBoundingClientRect();mouseX=(e.clientX-r.left-r.width/2)*.035;mouseY=(e.clientY-r.top-r.height/2)*.035;schedule()},{passive:true});hero.addEventListener('pointerleave',()=>{mouseX=mouseY=0;schedule()});window.addEventListener('scroll',()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;scroll=Math.min(scrollY,innerHeight);schedule()},{passive:true});
document.querySelector('#photo').addEventListener('change',e=>{let f=e.target.files[0];if(!f)return;if(photoURL)URL.revokeObjectURL(photoURL);photoURL=URL.createObjectURL(f);let img=document.createElement('img');img.src=photoURL;img.alt='Your selected portrait';document.querySelector('#avatar').replaceChildren(img)});
let initial=Number(location.hash.slice(1));draw(initial>=1&&initial<=10?initial-1:0);
