/* ================= ORG CHART ================= */
let ocScale=1,ocX=24,ocY=24,ocDrag=null,ocMoved=false,ocInit=false,ocSplitMode='auto';
function ocApply(){const c=document.getElementById('ocCanvas');c.style.transform=`translate(${ocX}px,${ocY}px) scale(${ocScale})`;document.getElementById('ocPct').textContent=Math.round(ocScale*100)+'%'}
function ocZoomAt(factor,cx,cy){const ns=Math.min(3,Math.max(0.15,ocScale*factor));const k=ns/ocScale;ocX=cx-(cx-ocX)*k;ocY=cy-(cy-ocY)*k;ocScale=ns;ocApply()}
function ocZoomBtn(dir){const vp=document.getElementById('ocViewport');ocZoomAt(dir>0?1.2:1/1.2,vp.clientWidth/2,vp.clientHeight/2)}
function ocFit(){const vp=document.getElementById('ocViewport'),c=document.getElementById('ocCanvas');const vw=vp.clientWidth,vh=vp.clientHeight,cw=c.offsetWidth,ch=c.offsetHeight;if(!cw||!ch)return;ocScale=Math.min(vw/cw,vh/ch,1);ocScale=Math.max(ocScale,0.15);ocX=Math.max(0,(vw-cw*ocScale)/2);ocY=16;ocApply()}
function ocReset(){const vp=document.getElementById('ocViewport'),c=document.getElementById('ocCanvas');ocScale=1;ocX=Math.max(0,(vp.clientWidth-c.offsetWidth)/2);ocY=16;ocApply()}
function ocExpandAll(){ocCollapsed=new Set();const s=document.getElementById('ocLevel');if(s)s.value='all';renderOrgChart();setTimeout(ocFit,30)}
function ocCollapseAll(){ocCollapsed=new Set();state.units.forEach(u=>{if(childrenOf(u.id).length&&levelOf(u.id)>=0&&u.parentId&&unitById(u.parentId))ocCollapsed.add(u.id)});rootUnits().forEach(u=>{if(childrenOf(u.id).length)ocCollapsed.add(u.id)});renderOrgChart();setTimeout(ocFit,30)}
function ocSetLevel(v){ocCollapsed=new Set();if(v!=='all'){const n=+v;state.units.forEach(u=>{if(childrenOf(u.id).length&&levelOf(u.id)>=n-1)ocCollapsed.add(u.id)})}renderOrgChart();setTimeout(ocFit,30)}
function ocSetSplit(v){ocSplitMode=v;renderOrgChart();setTimeout(ocFit,30)}

function initOrgChart(){
  if(ocInit)return;ocInit=true;
  const vp=document.getElementById('ocViewport'),canvas=document.getElementById('ocCanvas');
  vp.addEventListener('mousedown',e=>{ocDrag={x:e.clientX,y:e.clientY,ox:ocX,oy:ocY};ocMoved=false;vp.classList.add('grabbing')});
  window.addEventListener('mousemove',e=>{if(!ocDrag)return;const dx=e.clientX-ocDrag.x,dy=e.clientY-ocDrag.y;if(Math.abs(dx)+Math.abs(dy)>3)ocMoved=true;ocX=ocDrag.ox+dx;ocY=ocDrag.oy+dy;ocApply()});
  window.addEventListener('mouseup',()=>{if(ocDrag){ocDrag=null;vp.classList.remove('grabbing')}});
  vp.addEventListener('wheel',e=>{e.preventDefault();const r=vp.getBoundingClientRect();ocZoomAt(e.deltaY<0?1.1:1/1.1,e.clientX-r.left,e.clientY-r.top)},{passive:false});
  canvas.addEventListener('click',e=>{
    if(ocMoved)return;
    const node=e.target.closest('.oc-node');if(!node)return;const id=node.dataset.id;
    if(e.target.closest('.oc-edit')){openUnitModal(id);return}
    if(childrenOf(id).length){ocCollapsed.has(id)?ocCollapsed.delete(id):ocCollapsed.add(id);renderOrgChart()}
  });
}

/* первый уровень с ветвлением = уровень колонок (для режима «авто») */
function ocAutoSplit(){
  let level=rootUnits(),d=0;
  if(level.length!==1)return 0;
  while(level.length===1){const kids=childrenOf(level[0].id);if(!kids.length)break;level=kids;d++;}
  return d;
}
function ocColDepth(){ return ocSplitMode==='auto'?ocAutoSplit():Math.max(0,(+ocSplitMode)-1); }

function renderOrgChart(){
  const canvas=document.getElementById('ocCanvas');
  const roots=rootUnits();
  if(!roots.length){canvas.innerHTML='<div class="empty-state" style="border:none"><div class="big">🏛</div>Постройте структуру во вкладке «Структура».</div>';ocApply();return}
  const showM=document.getElementById('ocMetrics').checked;
  const colDepth=ocColDepth();
  canvas.innerHTML='';
  if(colDepth<=0){
    const cols=document.createElement('div');cols.className='oc-columns oc-columns-root';
    roots.forEach(u=>cols.appendChild(ocColumn(u,0,showM)));
    canvas.appendChild(cols);
  }else{
    const ul=document.createElement('ul');ul.className='oc-tree';
    roots.forEach(u=>ul.appendChild(ocTrunk(u,0,colDepth,showM)));
    canvas.appendChild(ul);
  }
  ocApply();
}

/* коробка узла */
function ocBox(u,lvl,showM){
  const kids=childrenOf(u.id),isColl=ocCollapsed.has(u.id);
  const box=document.createElement('div');box.className='oc-node lvl'+Math.min(lvl,4);box.dataset.id=u.id;
  const caret=kids.length?`<span class="oc-caret">${isColl?'▸':'▾'}</span>`:'';
  const hidden=kids.length&&isColl?` · +${kids.length} скрыто`:'';
  const metrics=showM?`<div class="m">👥 ${rollupCount(u.id)} · ${money(rollupPayroll(u.id))}${hidden}</div>`:'';
  box.innerHTML=`<span class="lvltag">ур. ${lvl+1}</span><button class="oc-edit" title="Редактировать">✎</button>
    <div class="oc-top">${caret}<span class="n">${esc(u.name)}</span></div>${metrics}`;
  return box;
}

/* ствол — сверху-вниз, пока не дойдём до уровня колонок */
function ocTrunk(u,lvl,colDepth,showM){
  const li=document.createElement('li');
  li.appendChild(ocBox(u,lvl,showM));
  const kids=childrenOf(u.id);
  if(kids.length&&!ocCollapsed.has(u.id)){
    if(lvl+1<colDepth){
      const ul=document.createElement('ul');
      kids.forEach(c=>ul.appendChild(ocTrunk(c,lvl+1,colDepth,showM)));
      li.appendChild(ul);
    }else{
      const cols=document.createElement('div');cols.className='oc-columns';
      kids.forEach(c=>cols.appendChild(ocColumn(c,lvl+1,showM)));
      li.appendChild(cols);
    }
  }
  return li;
}

/* колонка: заголовок сверху, подчинённые — вертикальным списком */
function ocColumn(u,lvl,showM){
  const col=document.createElement('div');col.className='oc-column';
  col.appendChild(ocBox(u,lvl,showM));
  const kids=childrenOf(u.id);
  if(kids.length&&!ocCollapsed.has(u.id)){
    const v=document.createElement('div');v.className='oc-col';
    kids.forEach(c=>v.appendChild(ocColItem(c,lvl+1,showM)));
    col.appendChild(v);
  }
  return col;
}
/* элемент вертикального списка (+ вложенные с отступом: отделы, кафедры и т.д.) */
function ocColItem(u,lvl,showM){
  const wrap=document.createElement('div');wrap.className='oc-colitem';
  wrap.appendChild(ocBox(u,lvl,showM));
  const kids=childrenOf(u.id);
  if(kids.length&&!ocCollapsed.has(u.id)){
    const sub=document.createElement('div');sub.className='oc-col oc-sub';
    kids.forEach(c=>sub.appendChild(ocColItem(c,lvl+1,showM)));
    wrap.appendChild(sub);
  }
  return wrap;
}
