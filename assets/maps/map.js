'use strict';
const $=s=>document.querySelector(s),vp=$('#viewport'),world=$('#world');
const regions=[['NW','西北河口',.167,.25],['NC','北岸城堡',.5,.25],['NE','东北河谷',.833,.25],['SW','西南森林',.167,.75],['SC','维斯佩拉',.5,.75],['SE','月影学院',.833,.75]];
const anchors={castle:{name:'北岸古堡',x:.518,y:.12,zoom:7,icon:'♜',root:'castle'},northport:{name:'北岸港区',x:.48,y:.204,zoom:5,icon:'⚓',root:'northport'},city:{name:'维斯佩拉城区',x:.44,y:.81,zoom:3,icon:'⌂',root:'city'},station:{name:'维斯佩拉车站',x:.48,y:.872,zoom:6,icon:'▤',root:'station'},academy:{name:'月影学院',x:.744,y:.804,zoom:10,icon:'✧',root:'academy'},lake:{name:'银镜湖',x:.48,y:.47,zoom:1,icon:'≈',root:'lake'},flowers:{name:'天然湖岸花田',x:.72,y:.73,zoom:4,icon:'❀',root:'flowers'},mountains:{name:'暮霭山脉范围',x:.3,y:.045,zoom:2,icon:'△',root:'mountains'},west:{name:'湖西南旧坡',x:.16,y:.75,zoom:3,icon:'⌂',root:'night-lodge'}};
// Individual city locations follow the map's streets; exact plots are proposed cartography.
const cityLocations = {
  'southport': [.451, .747], 'south-bridge': [.522, .785],
  'old-port-street': [.420, .784], 'warehouse-street': [.493, .798],
  'warehouse-office': [.466, .777], 'darren-depot': [.505, .822],
  'auction-house': [.392, .804], 'post-office': [.447, .809],
  'town-hall': [.471, .837], 'investigation-office': [.501, .852],
  'local-office': [.438, .850], 'waterclock': [.399, .840],
  'sealed-lamp-lane': [.364, .823], 'bookbindery': [.345, .844],
  'children-home': [.332, .864], 'children-west-house': [.311, .870],
  'glass-street': [.570, .836], 'glass-workshop': [.595, .856],
  'bread-shop': [.620, .834], 'station': [.480, .875],
  'station-inn': [.518, .874], 'west-station': [.279, .884],
  'south-cemetery': [.382, .947], 'old-waterworks': [.250, .911],
  'waterworks-warehouse': [.270, .929]
};
const academyLocations = {"dormitory":[0.727,0.823],"academy-library":[0.745,0.794],"clocktower":[0.731,0.788],"reading-club":[0.73,0.778],"old-greenhouse":[0.706,0.813],"seed-greenhouse":[0.712,0.778],"observatory":[0.755,0.774],"engineering-building":[0.76,0.827],"river-workshop":[0.779,0.842],"math-physics-lab":[0.753,0.805],"materials-lab":[0.765,0.814],"practice-room":[0.774,0.805],"academy-stage":[0.744,0.822],"west-teaching":[0.718,0.8],"academy-north-slope":[0.74,0.756],"academy-south-slope":[0.735,0.848],"academy-south-gate":[0.748,0.855],"academy-telegraph":[0.764,0.849],"frost-court":[0.717,0.76],"library-tower":[0.745,0.782]};
function locationPoint(entry) {
  const campus = academyLocations[entry.id];
  if(campus) return {x:campus[0],y:campus[1],zoom:12};
  const point = cityLocations[entry.id];
  return point ? {x: point[0], y: point[1], zoom: 6} : anchors[anchorKey(entry)];
}
function renderAcademyPins(visible) {
  visible.forEach(entry => {
    const p=academyLocations[entry.id];
    if(!p || entry.scope!=='local') return;
    const b=document.createElement('button');
    b.className='pin academy-pin'; b.dataset.place=entry.id;
    b.style.left=p[0]*100+'%'; b.style.top=p[1]*100+'%';
    b.setAttribute('aria-label',entry.name);
    b.setAttribute('aria-pressed',String(selected?.id===entry.id));
    const dot=document.createElement('b'); dot.textContent='•';
    const label=document.createElement('span'); label.textContent=entry.name;
    const line=document.createElement('i'); line.className='label-leader';
    b.append(line,dot,label); b.onclick=()=>showDetail(entry,false);
    $('#pins').append(b);
  });
  layoutAcademyLabels();
}
function layoutAcademyLabels() {
  if(scale/base<4) return;
  const used=[];
  const pins=[...document.querySelectorAll('.academy-pin')];
  pins.sort((a,b)=>(a.dataset.place===selected?.id?-1:0)-(b.dataset.place===selected?.id?-1:0));
  pins.forEach(b=>{
    const p=academyLocations[b.dataset.place], label=b.querySelector('span'), line=b.querySelector('i');
    const px=x+p[0]*W*scale+9, py=y+p[1]*H*scale+9;
    const w=label.offsetWidth||120,h=label.offsetHeight||23;
    let best=null;
    for(const d of [15,40,65,90,115,140,170,200]) {
      for(const [dx,dy] of [[d,-h/2],[-w-d,-h/2],[-w/2,d],[-w/2,-h-d],[d,-h-d],[-w-d,d]]) {
        const r={l:px+dx,t:py+dy,r:px+dx+w,b:py+dy+h};
        const overlap=used.some(u=>r.l<u.r+5&&r.r>u.l-5&&r.t<u.b+5&&r.b>u.t-5);
        if(!overlap) {best={dx,dy,r};break;}
      }
      if(best)break;
    }
    if(!best) best={dx:15,dy:15,r:{l:px+15,t:py+15,r:px+15+w,b:py+15+h}};
    used.push(best.r);
    label.style.left=(9+best.dx)+'px';label.style.top=(9+best.dy)+'px';
    const ex=best.dx+w/2,ey=best.dy+h/2;
    line.style.width=Math.hypot(ex,ey)+'px';line.style.transform='rotate('+Math.atan2(ey,ex)+'rad)';
  });
}
function renderCityPins(visible) {
  visible.forEach(entry => {
    const point = cityLocations[entry.id];
    if (!point) return;
    const button = document.createElement('button');
    button.className = 'pin city-pin';
    button.dataset.place = entry.id;
    button.style.left = point[0] * 100 + '%';
    button.style.top = point[1] * 100 + '%';
    button.setAttribute('aria-label', entry.name);
    button.setAttribute('aria-pressed', String(selected?.id === entry.id));
    const dot = document.createElement('b');
    dot.textContent = entry.kind === 'transport' ? '▪' : '•';
    const label = document.createElement('span');
    label.textContent = entry.name;
    button.append(dot, label);
    button.onclick = () => showDetail(entry, false);
    $('#pins').append(button);
  });
}
const scopeNames={local:'图内范围',remote:'本图以外',unplaced:'位置待核'},kindNames={landmark:'建筑与聚落',interior:'内部场景',nature:'自然地貌',transport:'交通与库区',region:'地区与大陆',mobile:'移动场景'},volNames=['第零卷《初》','第一卷《名》','第二卷《济》','第三卷《承》','第四卷《渡》'];
let scale=1,base=1,x=0,y=0,W=1500,H=1000,catalog=null,selected=null,scope='all';
function draw(){world.classList.toggle('city-detail',scale/base>=2.8);world.classList.toggle('academy-detail',scale/base>=4);world.style.setProperty('--pin-scale',String(1/scale));world.style.width=W+'px';world.style.height=H+'px';world.style.transform=`translate(${x}px,${y}px) scale(${scale})`;$('#status').textContent=Math.round(scale/base*100)+'%';updateMapLabels();layoutAcademyLabels();}
function updateMapLabels() {
  const panel = $('#mapLabels');
  if (!panel || !catalog) return;
  const enabled = !world.classList.contains('no-labels') && scale / base >= 2;
  const candidates = Object.entries(anchors).map(([key, point]) => ({
    key, point, px: x + point.x * W * scale, py: y + point.y * H * scale
  })).filter(item => item.px >= 0 && item.px <= vp.clientWidth && item.py >= 0 && item.py <= vp.clientHeight);
  candidates.sort((a, b) => Math.hypot(a.px-vp.clientWidth/2,a.py-vp.clientHeight/2)-Math.hypot(b.px-vp.clientWidth/2,b.py-vp.clientHeight/2));
  const nearest = candidates[0];
  panel.hidden = !enabled || !nearest || (['city','station'].includes(nearest.key)||(nearest.key==='academy'&&scale/base>=4));
  if (panel.hidden) return;
  const entries = catalog.entries.filter(entry => anchorKey(entry) === nearest.key && matches(entry));
  const signature = entries.map(entry => entry.id).join(',') + ':' + selected?.id;
  if (panel.dataset.signature === signature) return;
  panel.dataset.signature = signature;
  panel.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = nearest.point.name + ' · 地点名称';
  const note = document.createElement('small');
  note.textContent = '以下地点按所属范围列出，点击查看出处';
  const list = document.createElement('div');
  list.className = 'map-label-list';
  entries.forEach(entry => {
    const button = document.createElement('button');
    button.textContent = entry.name;
    button.setAttribute('aria-pressed', String(selected?.id === entry.id));
    button.onclick = () => showDetail(entry, false);
    list.append(button);
  });
  panel.append(heading, note, list);
  panel.hidden = !entries.length;
}
function clamp(){const w=W*scale,h=H*scale;x=w<=vp.clientWidth?(vp.clientWidth-w)/2:Math.min(0,Math.max(vp.clientWidth-w,x));y=h<=vp.clientHeight?(vp.clientHeight-h)/2:Math.min(0,Math.max(vp.clientHeight-h,y));}
function reset(){base=Math.min(vp.clientWidth/W,vp.clientHeight/H);scale=base;x=(vp.clientWidth-W*scale)/2;y=(vp.clientHeight-H*scale)/2;draw();document.querySelectorAll('#regions button').forEach(b=>b.setAttribute('aria-pressed','false'));}
function zoom(f,cx=vp.clientWidth/2,cy=vp.clientHeight/2){const next=Math.min(base*12,Math.max(base,scale*f)),r=next/scale;x=cx-(cx-x)*r;y=cy-(cy-y)*r;scale=next;clamp();draw();}
function focusPoint(px,py,m=2.4){scale=base*m;x=vp.clientWidth/2-px*W*scale;y=vp.clientHeight/2-py*H*scale;clamp();draw();}
function anchorKey(e){if(e.scope!=='local')return null;return e.id==='flowers'?'flowers':e.zone in anchors?e.zone:null;}
function matches(e){const q=$('#search').value.trim().toLocaleLowerCase(),vol=$('#volumeFilter').value,zone=$('#zoneFilter').value,kind=$('#filter').value;return(scope==='all'||e.scope===scope)&&(vol==='all'||e.refs.some(r=>String(r.volume)===vol))&&(zone==='all'||e.zone===zone)&&(kind==='all'||e.kind===kind)&&[e.name,...e.aliases,catalog.zones[e.zone]].join(' ').toLocaleLowerCase().includes(q);}
let galleryItems=[],galleryIndex=0,photoReturnFocus=null;
const photoDialog=$('#photoViewer');
function writePlaceState(id,mode='replace'){history[mode+'State']({atlas:true,place:id||null},'',location.pathname+location.search+(id?'#'+id:''));}
function galleryFor(e){const out=[],direct={castle:'castle',city:'city',academy:'academy',bookbindery:'bookbindery'},scene=direct[e.id]||(['castle','city','academy'].includes(e.zone)&&e.scope==='local'?e.zone:null);if(scene)out.push({src:'assets/maps/photos/'+scene+'-real-v2.webp',label:direct[e.id]?'写实场景':'所在区域场景',caption:(direct[e.id]?e.name:catalog.zones[e.zone])+' · 场景设想，建筑外观尚非小说定稿',position:'center'});if(e.scope==='local'){const key=anchorKey(e),files={castle:['nc','center top'],northport:['nc','center center'],city:['sc','center bottom'],station:['sc','center bottom'],academy:['se','center bottom'],west:['sw','center bottom'],flowers:['se','center center'],mountains:['nc','center top']},region=files[key];out.push({src:region?'assets/maps/'+region[0]+'-scale3.webp':'assets/maps/photos/atlas-overview.webp',label:'所属区域图',caption:catalog.zones[e.zone]+' · 地图区域预览，圆点为范围定位',position:region?region[1]:'center'});}return out;}
function selectPhoto(index){if(!galleryItems.length)return;galleryIndex=(index+galleryItems.length)%galleryItems.length;const item=galleryItems[galleryIndex];$('#placePhoto').src=item.src;$('#placePhoto').alt=item.caption;$('#placePhoto').style.objectPosition=item.position;$('#photoLabel').textContent=item.caption;$('#photoFull').src=item.src;$('#photoFull').alt=item.caption;$('#photoCaption').textContent=item.caption;$('#photoCounter').textContent=(galleryIndex+1)+' / '+galleryItems.length;$('#photoViewerTitle').textContent=selected?.name||'地点图片';document.querySelectorAll('#photoChoices button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===galleryIndex)));$('#photoPrev').disabled=$('#photoNext').disabled=galleryItems.length<2;}
function renderGallery(e){galleryItems=galleryFor(e);galleryIndex=0;$('#placeGallery').hidden=!galleryItems.length;$('#photoUnavailable').hidden=Boolean(galleryItems.length);$('#photoUnavailable').textContent=e.scope==='remote'?'此地点位于本图以外，尚无专属场景图；可查看地点说明与正文出处。':'此地点位置或名称关系待核，尚无可对应的专属图片。';$('#photoChoices').replaceChildren();galleryItems.forEach((item,i)=>{const b=document.createElement('button');b.textContent=item.label;b.setAttribute('aria-pressed',String(i===0));b.onclick=()=>selectPhoto(i);$('#photoChoices').append(b);});if(galleryItems.length)selectPhoto(0);}
function dismissPhoto(){if(photoDialog.open)photoDialog.close();document.body.classList.remove('gallery-open');}
function openPhoto(push=true){if(!selected||!galleryItems.length)return;photoReturnFocus=document.activeElement;selectPhoto(galleryIndex);if(!photoDialog.open)photoDialog.showModal();document.body.classList.add('gallery-open');if(push&&!history.state?.gallery)history.pushState({atlas:true,place:selected.id,gallery:true},'',location.href);}
function closePhoto(){const isGalleryState=Boolean(history.state?.gallery);dismissPhoto();if(isGalleryState)history.back();else photoReturnFocus?.focus?.();}
function resetFilterValues(){scope='all';$('#search').value='';['#zoneFilter','#volumeFilter','#filter'].forEach(s=>$(s).value='all');document.querySelectorAll('[data-scope]').forEach(a=>a.setAttribute('aria-pressed',String(a.dataset.scope===scope)));}
function returnToOverview(updateHistory=true){dismissPhoto();resetFilterValues();resetDetail(updateHistory);render();reset();const panel=document.querySelector('aside');panel.scrollTop=0;if(window.matchMedia('(max-width:850px)').matches)document.querySelector('.workspace').scrollIntoView({block:'start',behavior:'smooth'});$('#home').focus({preventScroll:true});}
$('#photoOpen').onclick=()=>openPhoto();$('#photoClose').onclick=closePhoto;$('#photoPrev').onclick=()=>selectPhoto(galleryIndex-1);$('#photoNext').onclick=()=>selectPhoto(galleryIndex+1);$('#photoOverview').onclick=()=>returnToOverview();$('#detailBack').onclick=()=>returnToOverview();$('#closeDetail').onclick=()=>returnToOverview();$('#backToMap').onclick=()=>returnToOverview();photoDialog.addEventListener('cancel',e=>{e.preventDefault();closePhoto();});photoDialog.addEventListener('click',e=>{if(e.target!==photoDialog)return;const r=photoDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePhoto();});photoDialog.addEventListener('close',()=>document.body.classList.remove('gallery-open'));
document.addEventListener('keydown',e=>{if(photoDialog.open){if(e.key==='ArrowLeft'){e.preventDefault();selectPhoto(galleryIndex-1);}if(e.key==='ArrowRight'){e.preventDefault();selectPhoto(galleryIndex+1);}return;}if(e.key==='Escape'&&selected){e.preventDefault();returnToOverview();}});
window.addEventListener('popstate',()=>{if(!catalog)return;const id=location.hash.slice(1),entry=catalog.entries.find(e=>e.id===id);dismissPhoto();if(!entry){returnToOverview(false);return;}if(selected?.id!==entry.id){resetFilterValues();showDetail(entry,true,false);}if(history.state?.gallery)openPhoto(false);});

function showDetail(e,move=true,navigate=true){dismissPhoto();selected=e;$('#detailActions').hidden=false;$('#backToMap').hidden=false;renderGallery(e);$('#title').textContent=e.name;$('#tag').textContent=scopeNames[e.scope]+' · '+catalog.zones[e.zone];$('#description').textContent=e.id==='city'?'银镜湖南岸城市。北部为湖港与旧街，中部为市政及生活街区，东部为玻璃工坊街区，南缘连接铁路与车站。':e.desc;$('#precision').textContent=(cityLocations[e.id]||academyLocations[e.id])?'地图规划位置 · 已按故事关系安排，具体地块为补充设计':e.precision+(e.scope==='local'?' · 圆点表示所在范围，不是该建筑坐标':' · 不在湖盆内安放虚构坐标');const refs=$('#references');refs.replaceChildren();const seen=new Set();e.refs.forEach(r=>{const key=r.volume+':'+r.chapter;if(seen.has(key))return;seen.add(key);const a=document.createElement(r.volume<4?'a':'span');a.textContent=volNames[r.volume]+' · '+(r.volume===1?(r.number===0?'序章 ':r.number===25?'番外 ':'第'+r.number+'章 '):'')+r.chapter;if(r.volume<4)a.href='volume-0'+r.volume+'.html';refs.append(a);});const key=anchorKey(e),notice=$('#locationNotice');notice.hidden=Boolean(key);if(!key)notice.textContent=(e.scope==='remote'?'本图外：':'位置待核：')+e.name+'｜'+catalog.zones[e.zone]+'。请查看右侧正文出处与说明。';if(move&&key){const p=locationPoint(e);focusPoint(p.x,p.y,p.zoom);}if(navigate&&location.hash!=='#'+e.id)writePlaceState(e.id,'push');render();const panel=document.querySelector('aside');if(window.matchMedia('(min-width:851px)').matches)panel.scrollTo({top:Math.max(0,$('.detail').offsetTop-panel.offsetTop-12),behavior:'smooth'});else $('.detail').scrollIntoView({block:'start',behavior:'smooth'});}
function renderPins(visible){$('#pins').replaceChildren();Object.entries(anchors).forEach(([key,p])=>{const members=visible.filter(e=>anchorKey(e)===key);if(!members.length)return;const isSelected=selected&&members.some(e=>e.id===selected.id),b=document.createElement('button');b.className='pin';b.dataset.anchor=key;b.style.left=p.x*100+'%';b.style.top=p.y*100+'%';b.setAttribute('aria-pressed',String(Boolean(isSelected)));b.setAttribute('aria-label',p.name+'，'+members.length+'处地点，范围定位');const icon=document.createElement('b');icon.textContent=p.icon;icon.setAttribute('aria-hidden','true');const count=document.createElement('i');count.className='count';count.textContent=members.length;const label=document.createElement('span');label.textContent=isSelected?selected.name+' · 范围':p.name; b.append(icon,count,label);b.onclick=()=>{scope='local';$('#zoneFilter').value=p.root==='flowers'?'lake':key;document.querySelectorAll('[data-scope]').forEach(a=>a.setAttribute('aria-pressed',String(a.dataset.scope===scope)));const root=members.find(e=>e.id===p.root)||members[0];showDetail(root);};$('#pins').append(b);});renderCityPins(visible);renderAcademyPins(visible);}
function resetDetail(updateHistory=true){selected=null;galleryItems=[];$('#placeGallery').hidden=true;$('#photoUnavailable').hidden=true;$('#detailActions').hidden=true;$('#backToMap').hidden=true;$('#title').textContent='银镜湖';$('#tag').textContent='SILVER MIRROR LAKE';$('#description').textContent='选择地点查看正文出处。图上圆点按已知范围聚合；城区街址与建筑内部的位置尚未逐一测绘。';$('#precision').textContent='范围定位 · 不表示建筑实测坐标';$('#references').replaceChildren();$('#locationNotice').hidden=true;if(updateHistory)writePlaceState(null);}
function render(){if(!catalog)return;if(selected&&!matches(selected))resetDetail();const visible=catalog.entries.filter(matches);$('#resultCount').textContent='显示 '+visible.length+' / '+catalog.entries.length+' 条记录';$('#places').replaceChildren();Object.entries(catalog.zones).forEach(([zone,name])=>{const es=visible.filter(e=>e.zone===zone);if(!es.length)return;const group=document.createElement('details');group.className='place-group';group.open=true;const summary=document.createElement('summary');summary.textContent=name+' · '+es.length;const items=document.createElement('div');items.className='group-items';es.forEach(e=>{const b=document.createElement('button');b.dataset.place=e.id;b.setAttribute('aria-pressed',String(selected?.id===e.id));const name=document.createElement('span');name.textContent=e.name;const label=document.createElement('small');label.textContent=scopeNames[e.scope];b.append(name,label);b.onclick=()=>showDetail(e);items.append(b);});group.append(summary,items);$('#places').append(group);});if(!visible.length){const p=document.createElement('p');p.className='empty';p.textContent='没有匹配地点，试试别名或清除筛选。';$('#places').append(p);}renderPins(visible);updateMapLabels();}
function clearFilters(){dismissPhoto();resetDetail();resetFilterValues();render();}
$('#search').oninput=render;['#zoneFilter','#volumeFilter','#filter'].forEach(s=>$(s).onchange=render);$('#clearFilters').onclick=clearFilters;document.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;document.querySelectorAll('[data-scope]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));render();});
regions.forEach(([code,name,rx,ry])=>{const b=document.createElement('button');const small=document.createElement('small');small.textContent=code;b.append(small,document.createTextNode(name));b.setAttribute('aria-pressed','false');b.onclick=()=>{if(code==='SE')focusPoint(.744,.804,10);else focusPoint(rx,ry,2.5);document.querySelectorAll('#regions button').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));};$('#regions').append(b);});
function setEastRoad(on){$('#eastRoad').toggleAttribute('hidden',!on);$('#eastRoadToggle').setAttribute('aria-pressed',String(on));}
$('#eastRoadPath').setAttribute('d','M 518 82 L 535 87 L 565 93 C 600 89 625 71 650 71 C 680 66 690 85 712 83 C 740 74 760 79 790 91 L 817 102 Q 840 106 852 125');$('#eastRoadToggle').onclick=()=>setEastRoad($('#eastRoadToggle').getAttribute('aria-pressed')!=='true');
$('#ferryPath').setAttribute('d','M 480 136 Q 420 330 520 514');$('#home').onclick=()=>returnToOverview();$('#plus').onclick=()=>zoom(1.3);$('#minus').onclick=()=>zoom(1/1.3);$('#labels').onclick=e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',on);world.classList.toggle('no-labels',!on);updateMapLabels();};$('#ferry').onclick=e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',on);$('#route').toggleAttribute('hidden',!on);};$('#full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.workspace').requestFullscreen();}catch{$('#status').textContent='此浏览器未启用全屏';}};
vp.addEventListener('wheel',e=>{if(e.target.closest('#mapLabels'))return;e.preventDefault();const r=vp.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});const pointers=new Map();let drag=null,pinch=null;vp.onpointerdown=e=>{if(e.target.closest('button, #mapLabels'))return;vp.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});vp.classList.add('dragging');drag={x:e.clientX,y:e.clientY};pinch=null;};vp.onpointermove=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const a=[...pointers.values()];if(a.length===2){const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),r=vp.getBoundingClientRect();if(pinch)zoom(d/pinch,(a[0].x+a[1].x)/2-r.left,(a[0].y+a[1].y)/2-r.top);pinch=d;drag=null;}else if(drag){x+=e.clientX-drag.x;y+=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};clamp();draw();}};function end(e){pointers.delete(e.pointerId);drag=null;pinch=null;if(!pointers.size)vp.classList.remove('dragging');}vp.onpointerup=end;vp.onpointercancel=end;vp.onlostpointercapture=end;
vp.onkeydown=e=>{if(e.target!==vp)return;if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))e.preventDefault();if(e.key==='+'||e.key==='=')zoom(1.2);if(e.key==='-')zoom(1/1.2);if(e.key==='Home')reset();if(e.key==='ArrowLeft')x+=45;if(e.key==='ArrowRight')x-=45;if(e.key==='ArrowUp')y+=45;if(e.key==='ArrowDown')y-=45;clamp();draw();};new ResizeObserver(reset).observe(vp);reset();
(async()=>{try{const response=await fetch('assets/maps/novel-places.json?v=20261107-places1');if(!response.ok)throw Error('地点数据加载失败');catalog=await response.json();Object.entries(catalog.zones).forEach(([key,name])=>{const o=document.createElement('option');o.value=key;o.textContent=name;$('#zoneFilter').append(o);});const counts={local:0,remote:0,unplaced:0};catalog.entries.forEach(e=>counts[e.scope]++);$('#coverage').textContent=catalog.entries.length+'条地点与主要场景记录：'+counts.local+'条按图内范围定位，'+counts.remote+'条属于远方，'+counts.unplaced+'条位置或名称关系待核。可搜索别名，按卷筛选。';render();const oldAliases={ruins:'night-lodge',wetlands:'lake',valley:'mountains',eastroad:'castle'};const id=location.hash.slice(1),entry=catalog.entries.find(e=>e.id===(oldAliases[id]||id));writePlaceState(null);if(entry)showDetail(entry);}catch(error){$('#coverage').textContent='地点索引暂时未能加载，请刷新重试。';$('#resultCount').textContent='加载失败';console.error(error);}})();
