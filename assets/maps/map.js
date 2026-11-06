'use strict';
const $=s=>document.querySelector(s), vp=$('#viewport'), world=$('#world');
const regions=[['NW','西北河口',.167,.25],['NC','北岸城堡',.5,.25],['NE','东北河谷',.833,.25],['SW','西南森林',.167,.75],['SC','维斯佩拉',.5,.75],['SE','月影学院',.833,.75]];
const places=[
{id:'castle',name:'露涅维尔城堡',region:'NC',type:'landmark',x:.51,y:.14,icon:'♜',desc:'北岸的城堡与庭园俯瞰银镜湖。宽阔湖面将城堡与南岸维斯佩拉分隔开来。'},
{id:'northport',name:'北岸湖港',region:'NC',type:'transport',x:.43,y:.32,icon:'⚓',desc:'北岸沿湖港口，与南岸维斯佩拉之间有客货渡轮往来。'},
{id:'city',name:'维斯佩拉',region:'SC',type:'landmark',x:.46,y:.72,icon:'⌂',desc:'银镜湖南岸的城市。湖港、街区与工坊沿着岸线和陆路展开，与北岸城堡隔湖相望。'},
{id:'station',name:'维斯佩拉总站',region:'SC',type:'transport',x:.40,y:.79,icon:'▤',desc:'城市南侧的铁路节点。地图上的铁路从西南陆地进入城站，再沿南岸陆地向东南延伸。'},
{id:'southport',name:'南岸湖港',region:'SC',type:'transport',x:.56,y:.67,icon:'⚓',desc:'维斯佩拉面向银镜湖的港区，客货船在这里与北岸往来。'},
{id:'academy',name:'月影学院',region:'SE',type:'landmark',x:.84,y:.68,icon:'✧',desc:'位于银镜湖东南岸、毗邻维斯佩拉的学院。校园、林地与沿湖道路在此相接。'},
{id:'wetlands',name:'西北河口湿地',region:'NW',type:'nature',x:.16,y:.35,icon:'≈',desc:'河流在西北方向汇入湖泊，水道、浅滩与林地构成湖岸景观。'},
{id:'ruins',name:'西南古道遗迹',region:'SW',type:'nature',x:.11,y:.62,icon:'∩',desc:'西南森林中的古道与残存石拱。此处表现森林与遗迹的美术布局。'},
{id:'valley',name:'东北河谷',region:'NE',type:'nature',x:.82,y:.25,icon:'♧',desc:'东北山地之间的河谷，农田、村落与山间道路沿水系分布。'},
{id:'flowers',name:'湖岸银镜花田',region:'SE',type:'nature',x:.76,y:.79,icon:'❀',desc:'银镜花是湖岸原生药材。图中花田表现沿湖自然生长景观，不限定其唯一繁殖地或保护区边界。'}
];
let scale=1,base=1,x=0,y=0,W=1500,H=1000;
function draw(){world.style.width=W+'px';world.style.height=H+'px';world.style.transform=`translate(${x}px,${y}px) scale(${scale})`;$('#status').textContent=Math.round(scale/base*100)+'%';}
function clamp(){const w=W*scale,h=H*scale;x=w<=vp.clientWidth?(vp.clientWidth-w)/2:Math.min(0,Math.max(vp.clientWidth-w,x));y=h<=vp.clientHeight?(vp.clientHeight-h)/2:Math.min(0,Math.max(vp.clientHeight-h,y));}
function reset(){base=Math.min(vp.clientWidth/W,vp.clientHeight/H);scale=base;x=(vp.clientWidth-W*scale)/2;y=(vp.clientHeight-H*scale)/2;draw();document.querySelectorAll('#regions button').forEach(b=>b.setAttribute('aria-pressed','false'));}
function zoom(f,cx=vp.clientWidth/2,cy=vp.clientHeight/2){const next=Math.min(base*6,Math.max(base,scale*f)),r=next/scale;x=cx-(cx-x)*r;y=cy-(cy-y)*r;scale=next;clamp();draw();}
function focusPoint(px,py,m=2.4){scale=base*m;x=vp.clientWidth/2-px*W*scale;y=vp.clientHeight/2-py*H*scale;clamp();draw();}
function select(p,move=true){$('#title').textContent=p.name;$('#description').textContent=p.desc;$('#tag').textContent=p.region+' · '+({landmark:'城堡与聚落',nature:'自然与遗迹',transport:'交通'}[p.type]);document.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.place===p.id)));history.replaceState(null,'','#'+p.id);if(move)focusPoint(p.x,p.y);}
function render(){const q=$('#search').value.trim().toLowerCase(),cat=$('#filter').value;$('#places').replaceChildren();let n=0;places.forEach(p=>{const show=p.name.toLowerCase().includes(q)&&(cat==='all'||cat===p.type);const pin=document.querySelector('.pin[data-place="'+p.id+'"]');pin.hidden=!show;if(show){n++;const b=document.createElement('button');b.dataset.place=p.id;b.innerHTML='<span>'+p.name+'</span><small>'+p.region+'</small>';b.onclick=()=>select(p);$('#places').append(b);}});if(!n){const e=document.createElement('div');e.className='empty';e.textContent='没有找到地点，试试其他名称。';$('#places').append(e);}}
places.forEach(p=>{const b=document.createElement('button');b.className='pin';b.dataset.place=p.id;b.style.left=p.x*100+'%';b.style.top=p.y*100+'%';b.setAttribute('aria-label',p.name);b.setAttribute('aria-pressed','false');b.innerHTML='<b aria-hidden="true">'+p.icon+'</b><span>'+p.name+'</span>';b.onclick=()=>select(p,false);$('#pins').append(b);});
regions.forEach(([code,name,rx,ry])=>{const b=document.createElement('button');b.innerHTML='<small>'+code+'</small>'+name;b.setAttribute('aria-pressed','false');b.onclick=()=>{focusPoint(rx,ry,2.5);document.querySelectorAll('#regions button').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));};$('#regions').append(b);});
const n=places.find(p=>p.id==='northport'),s=places.find(p=>p.id==='southport');$('#ferryPath').setAttribute('d',`M ${n.x*1000} ${n.y*667} Q 580 330 ${s.x*1000} ${s.y*667}`);
$('#search').oninput=render;$('#filter').onchange=render;$('#home').onclick=reset;$('#plus').onclick=()=>zoom(1.3);$('#minus').onclick=()=>zoom(1/1.3);$('#labels').onclick=e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',on);world.classList.toggle('no-labels',!on);};$('#ferry').onclick=e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',on);$('#route').toggleAttribute('hidden',!on);};$('#full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.workspace').requestFullscreen();}catch{ $('#status').textContent='此浏览器未启用全屏';}};
vp.addEventListener('wheel',e=>{e.preventDefault();const r=vp.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
const pointers=new Map();let drag=null,pinch=null;
vp.onpointerdown=e=>{if(e.target.closest('button'))return;vp.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});vp.classList.add('dragging');drag={x:e.clientX,y:e.clientY};pinch=null;};
vp.onpointermove=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const a=[...pointers.values()];if(a.length===2){const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),r=vp.getBoundingClientRect();if(pinch)zoom(d/pinch,(a[0].x+a[1].x)/2-r.left,(a[0].y+a[1].y)/2-r.top);pinch=d;drag=null;}else if(drag){x+=e.clientX-drag.x;y+=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};clamp();draw();}};
function end(e){pointers.delete(e.pointerId);drag=null;pinch=null;if(!pointers.size)vp.classList.remove('dragging');}vp.onpointerup=end;vp.onpointercancel=end;vp.onlostpointercapture=end;
vp.onkeydown=e=>{if(e.target!==vp)return;if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))e.preventDefault();if(e.key==='+'||e.key==='=')zoom(1.2);if(e.key==='-')zoom(1/1.2);if(e.key==='Home')reset();if(e.key==='ArrowLeft')x+=45;if(e.key==='ArrowRight')x-=45;if(e.key==='ArrowUp')y+=45;if(e.key==='ArrowDown')y-=45;clamp();draw();};
let firstResize=true;new ResizeObserver(()=>{reset();if(firstResize){firstResize=false;const initial=places.find(p=>p.id===location.hash.slice(1));if(initial)select(initial);}}).observe(vp);render();reset();
