/* ══════════════════════════════════════════════
   Ferretería El Greengo – Sistema de Gestión
   script/app.js – Lógica de la aplicación
   ══════════════════════════════════════════════ */

/* ── Helpers ── */
const BADGE_MAP = {unidad:'b-unidad',bolsa:'b-bolsa',caja:'b-caja',tira:'b-tira',rollo:'b-rollo',metros:'b-metros',litros:'b-litros',kg:'b-kg'};
const badgeCls = f => BADGE_MAP[(f||'').toLowerCase()] || 'b-other';
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt$ = n => '$' + Math.abs(Number(n)).toLocaleString('es-CL');
const now = () => new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});
const today= () => new Date().toLocaleDateString('es-CL');
const save = (k,v) => localStorage.setItem(k,JSON.stringify(v));
const load = k => JSON.parse(localStorage.getItem(k)||'null');

let _toast;
function showToast(msg,isErr=false){
 const el=document.getElementById('toast');
 el.textContent=msg; el.className=isErr?'error show':'show';
 clearTimeout(_toast); _toast=setTimeout(()=>el.className='',2800);
}
function shake(id){
 const el=document.getElementById(id);
 el.style.borderColor='var(--red)'; el.style.boxShadow='0 0 0 3px rgba(220,38,38,.2)';
 el.focus(); setTimeout(()=>{el.style.borderColor='';el.style.boxShadow='';},1300);
}
function downloadTxt(nombre,contenido){
 const blob=new Blob([contenido],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a'); a.href=url; a.download=nombre;
 document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ── Helpers de ordenamiento y filtrado (anti-duplicación) ── */
function ordenarLista(arr, col, asc){
 return [...arr].sort((a,b)=>{
  let va=a[col], vb=b[col];
  if(typeof va==='string'){va=va.toLowerCase();vb=vb.toLowerCase();}
  return asc?(va>vb?1:-1):(va<vb?1:-1);
 });
}
function filtrarCatalogo(q){
 const query=(q||'').toLowerCase();
 return catalogo.filter(c=>c.nombre.toLowerCase().includes(query)||c.formato.toLowerCase().includes(query)||(c.codigo||'').toLowerCase().includes(query));
}

/* ── Tab navigation ── */
function showTab(name){
 if(carrito.length && !confirm('Tienes productos en el carrito. ¿Cambiar de pestaña? Se perderán los productos seleccionados.'))return;
 ['pedidos','ventas','catalogo'].forEach(t=>{
 document.getElementById('panel-'+t).classList.toggle('active',t===name);
 document.getElementById('tab-'+t).classList.toggle('active',t===name);
 });
 if(name==='ventas') { ventasRenderGrid(); ventasCheckCaja(); }
 if(name==='catalogo') catalogoRender();
}

/* ── Sidebar (Caja) ── */
function toggleSidebar(){
 const sidebar=document.getElementById('sidebar-caja');
 const overlay=document.getElementById('sidebar-overlay');
 const opening=!sidebar.classList.contains('open');
 sidebar.classList.toggle('open');
 overlay.classList.toggle('open');
 if(opening) { cajaRender(); libretaRender(); configRender(); }
}

/* ── Sidebar: cambiar sección (Caja | Libreta) ── */
function sidebarSeccion(seccion){
 document.getElementById('side-nav-caja').classList.toggle('active',seccion==='caja');
 document.getElementById('side-nav-libreta').classList.toggle('active',seccion==='libreta');
 const auditBtn=document.getElementById('side-nav-audit');
 if(auditBtn)auditBtn.classList.toggle('active',seccion==='audit');
 const datosBtn=document.getElementById('side-nav-datos');
 if(datosBtn)datosBtn.classList.toggle('active',seccion==='datos');
 const usuariosBtn=document.getElementById('side-nav-usuarios');
 if(usuariosBtn)usuariosBtn.classList.toggle('active',seccion==='usuarios');
 document.getElementById('sidebar-seccion-caja').style.display=(seccion==='caja')?'block':'none';
 document.getElementById('sidebar-seccion-libreta').style.display=(seccion==='libreta')?'block':'none';
 const auditSec=document.getElementById('sidebar-seccion-audit');
 if(auditSec)auditSec.style.display=(seccion==='audit')?'block':'none';
 const datosSec=document.getElementById('sidebar-seccion-datos');
 if(datosSec)datosSec.style.display=(seccion==='datos')?'block':'none';
 const usuariosSec=document.getElementById('sidebar-seccion-usuarios');
 if(usuariosSec)usuariosSec.style.display=(seccion==='usuarios')?'block':'none';
 if(seccion==='caja') cajaRender();
 if(seccion==='libreta') libretaRender();
 if(seccion==='audit') auditRender();
 if(seccion==='usuarios') usuariosRender();
}

/* ══════════════════════════════════════════════
 MÓDULO PEDIDOS
══════════════════════════════════════════════ */
let pedidos = load('pedidos_ferreteria') || [];
let pNextId = pedidos.length ? Math.max(...pedidos.map(p=>p.id))+1 : 1;
let pSortCol = 'id', pSortAsc = true;

function pedidoAgregar(){
 const nombre=document.getElementById('p-nombre').value.trim();
 const cantStr=document.getElementById('p-cantidad').value;
 const cantidad=parseInt(cantStr);
 const formato=document.getElementById('p-formato').value;
 if(!nombre){shake('p-nombre');return;}
 if(!cantStr||cantidad<1||isNaN(cantidad)){shake('p-cantidad');return;}
 if(!formato){shake('p-formato');return;}
 pedidos.push({id:pNextId++,nombre,cantidad,formato});
 save('pedidos_ferreteria',pedidos); pedidoRender();
 showToast(`"${nombre}" agregado al pedido ✓`);
 document.getElementById('p-nombre').value='';
 document.getElementById('p-cantidad').value='';
 document.getElementById('p-formato').value='';
 document.getElementById('p-nombre').focus();
}
function pedidoEliminar(id){ pedidos=pedidos.filter(p=>p.id!==id); save('pedidos_ferreteria',pedidos); pedidoRender(); showToast('Producto eliminado'); }
function pedidoLimpiar(){ if(!pedidos.length)return; if(!confirm('¿Eliminar todos los productos del pedido?'))return; pedidos=[];pNextId=1; save('pedidos_ferreteria',pedidos); pedidoRender(); showToast('Pedido limpiado'); }
function pedidoSort(col){ pSortAsc=pSortCol===col?!pSortAsc:true; pSortCol=col; pedidoRender(); }
function pedidoRender(){
 const q=document.getElementById('p-buscar').value.toLowerCase();
 const data=ordenarLista(pedidos.filter(p=>p.nombre.toLowerCase().includes(q)||p.formato.toLowerCase().includes(q)), pSortCol, pSortAsc);
 document.querySelectorAll('#panel-pedidos thead th').forEach(th=>{
 th.classList.remove('sorted');
 const m=(th.getAttribute('onclick')||'').match(/pedidoSort\('(.+?)'\)/);
 const col=m?m[1]:null;const arr=th.querySelector('.arrow');
 if(col===pSortCol){th.classList.add('sorted');if(arr)arr.textContent=pSortAsc?'↑':'↓';}else if(arr)arr.textContent='↕';
 });
 const tbody=document.getElementById('p-tbody');
 const empty=document.getElementById('p-empty');
 if(!data.length){tbody.innerHTML='';empty.style.display='block';}
 else{
 empty.style.display='none';
 tbody.innerHTML=data.map((p,i)=>`<tr>
 <td style="color:var(--muted);font-size:.76rem">${i+1}</td>
 <td><strong>${esc(p.nombre)}</strong></td>
 <td><strong>${p.cantidad.toLocaleString('es-CL')}</strong></td>
 <td><span class="badge ${badgeCls(p.formato)}">${esc(p.formato)}</span></td>
 <td><button class="btn-del" onclick="pedidoEliminar(${p.id})">✕</button></td>
 </tr>`).join('');
 }
 document.getElementById('p-stat-prod').textContent=pedidos.length;
 document.getElementById('p-stat-items').textContent=pedidos.reduce((s,p)=>s+p.cantidad,0).toLocaleString('es-CL');
}

/* ══════════════════════════════════════════════
 MÓDULO CATÁLOGO
══════════════════════════════════════════════ */
let catalogo = load('catalogo_ferreteria') || [];
let cNextId = catalogo.length ? Math.max(...catalogo.map(c=>c.id))+1 : 1;
let cSortCol = 'id', cSortAsc = true;
let cPagina = 1;
const C_POR_PAGINA = 10;

function catalogoAgregar(){
 const nombre=document.getElementById('c-nombre').value.trim();
 const codigo=document.getElementById('c-codigo').value.trim();
 const precioS=document.getElementById('c-precio').value;
 const precio=Math.round(parseFloat(precioS));
 const stockS=document.getElementById('c-stock').value;
 const stock=parseInt(stockS);
 const formato=document.getElementById('c-formato').value;
 if(!nombre){shake('c-nombre');return;}
 if(!precioS||isNaN(precio)||precio<0){shake('c-precio');return;}
 if(!stockS||isNaN(stock)||stock<0){shake('c-stock');return;}
 if(!formato){shake('c-formato');return;}
 catalogo.push({id:cNextId++,nombre,codigo,precio,stock,formato});
 save('catalogo_ferreteria',catalogo); catalogoRender();
 auditRegistrar('CATALOGO_AGREGAR',`"${nombre}" $${precio} stock=${stock}`);
 showToast(`"${nombre}" agregado al catálogo ✓`);
 document.getElementById('c-nombre').value='';
 document.getElementById('c-codigo').value='';
 document.getElementById('c-precio').value='';
 document.getElementById('c-stock').value='';
 document.getElementById('c-formato').value='';
 document.getElementById('c-nombre').focus();
}
function catalogoEliminar(id){
 const prod=catalogo.find(c=>c.id===id);
 const nombre=prod?prod.nombre:'?';
 if(!loginEsAdmin()){showToast('⚠ Solo administrador puede eliminar productos',true);return;}
 if(!confirm(`¿Eliminar "${nombre}" del catálogo? Esta acción no se puede deshacer.`))return;
 catalogo=catalogo.filter(c=>c.id!==id);
 save('catalogo_ferreteria',catalogo); catalogoRender();
 auditRegistrar('CATALOGO_ELIMINAR',`"${nombre}"`);
 showToast('Producto eliminado del catálogo');
}
function catalogoLimpiar(){ if(!catalogo.length)return; if(!loginEsAdmin()){showToast('⚠ Solo administrador puede limpiar catálogo',true);return;} if(!confirm('¿Eliminar todos los productos del catálogo?'))return; const n=catalogo.length; catalogo=[];cNextId=1; save('catalogo_ferreteria',catalogo); catalogoRender();
 auditRegistrar('CATALOGO_LIMPIEZA',`${n} productos eliminados`);
 showToast('Catálogo limpiado'); }
function catSort(col){ cSortAsc=cSortCol===col?!cSortAsc:true; cSortCol=col; cPagina=1; catalogoRender(); }
function catIrPagina(dir){
 const q=document.getElementById('c-buscar').value.toLowerCase();
 const data=ordenarLista(filtrarCatalogo(q), cSortCol, cSortAsc);
 const totalPaginas=Math.max(1,Math.ceil(data.length/C_POR_PAGINA));
 if(dir==='prev'&&cPagina>1)cPagina--;
 if(dir==='next'&&cPagina<totalPaginas)cPagina++;
 if(typeof dir==='number')cPagina=Math.max(1,Math.min(dir,totalPaginas));
 catalogoRender();
}
function catalogoRender(){
 const q=document.getElementById('c-buscar').value.toLowerCase();
 const fullData=ordenarLista(filtrarCatalogo(q), cSortCol, cSortAsc);
 const totalPaginas=Math.max(1,Math.ceil(fullData.length/C_POR_PAGINA));
 if(cPagina>totalPaginas)cPagina=totalPaginas;
 const start=(cPagina-1)*C_POR_PAGINA;
 const data=fullData.slice(start,start+C_POR_PAGINA);
 // arrow sort
 document.querySelectorAll('#panel-catalogo thead th').forEach(th=>{
 th.classList.remove('sorted');
 const m=(th.getAttribute('onclick')||'').match(/catSort\('(.+?)'\)/);
 const col=m?m[1]:null;const arr=th.querySelector('.arrow');
 if(col===cSortCol){th.classList.add('sorted');if(arr)arr.textContent=cSortAsc?'↑':'↓';}else if(arr)arr.textContent='↕';
 });
 const tbody=document.getElementById('c-tbody');
 const empty=document.getElementById('c-empty');
 if(!fullData.length){tbody.innerHTML='';empty.style.display='block';document.getElementById('c-pagination').style.display='none';}
 else{
 empty.style.display='none';
 tbody.innerHTML=data.map((c,i)=>`<tr>
 <td style="color:var(--muted);font-size:.76rem">${start+i+1}</td>
 <td style="font-size:.78rem;color:var(--muted);font-family:monospace">${esc(c.codigo)||'—'}</td>
 <td><strong>${esc(c.nombre)}</strong></td>
 <td style="font-weight:700;color:var(--accent)">${fmt$(c.precio)}</td>
 <td><strong>${c.stock.toLocaleString('es-CL')}</strong>${c.stock===0?' <span style="color:var(--red);font-size:.7rem;font-weight:600;margin-left:4px">SIN STOCK</span>':''}</td>
 <td><span class="badge ${badgeCls(c.formato)}">${esc(c.formato)}</span></td>
 <td><div style="display:flex;gap:6px"><button class="btn-del" onclick="catalogoEditar(${c.id})" title="Editar">✏️</button><button class="btn-del" onclick="catalogoEliminar(${c.id})">✕</button></div></td>
 </tr>`).join('');
 // pagination
 const pagEl=document.getElementById('c-pagination');
 pagEl.style.display='flex';
 document.getElementById('c-page-prev').disabled=cPagina<=1;
 document.getElementById('c-page-next').disabled=cPagina>=totalPaginas;
 const desde=Math.min(fullData.length,start+1);
 const hasta=Math.min(fullData.length,start+C_POR_PAGINA);
 document.getElementById('c-page-info').textContent=`${desde}–${hasta} de ${fullData.length}`;
 }
 document.getElementById('c-stat-prod').textContent=catalogo.length;
 document.getElementById('c-stat-stock').textContent=catalogo.reduce((s,c)=>s+c.stock,0).toLocaleString('es-CL');
}

/* ══════════════════════════════════════════════
 MÓDULO VENTAS (POS)
══════════════════════════════════════════════ */
let carrito = [];
let ventas = load('ventas_ferreteria') || [];
let vPagina = 1;
const V_POR_PAGINA = 6;
let histPagina = 1;
const HIST_POR_PAGINA = 3;

// Ranking de más vendidos (por cantidad total vendida, basado en historial)
function ventasRanking(){
 const rank={};
 ventas.forEach(v=>v.items.forEach(i=>{rank[i.nombre]=(rank[i.nombre]||0)+i.qty;}));
 return rank;
}

function ventasCheckCaja(){
 const caja=load('caja_ferreteria');
 const warn=document.getElementById('v-caja-warning');
 warn.style.display=(!caja||!caja.abierta)?'flex':'none';
}
function ventasIrPagina(dir){
 const q=document.getElementById('v-buscar').value.toLowerCase();
 const rank=ventasRanking();
 const data=filtrarCatalogo(q).sort((a,b)=>(rank[b.nombre]||0)-(rank[a.nombre]||0));
 const totalPaginas=Math.max(1,Math.ceil(data.length/V_POR_PAGINA));
 if(dir==='prev'&&vPagina>1)vPagina--;
 if(dir==='next'&&vPagina<totalPaginas)vPagina++;
 ventasRenderGrid();
}

// Scanner de código de barras: si el texto coincide EXACTO con un código del catálogo → agregar al carrito
function ventasScanCodigo(inputId='v-buscar'){
 const input=document.getElementById(inputId);
 const q=input.value.trim();
 if(!q)return;
 const prod=catalogo.find(c=>c.codigo && c.codigo.trim().toLowerCase()===q.toLowerCase());
 if(!prod){showToast(`⚠ Código "${esc(q)}" no encontrado en el catálogo`,true);input.value='';input.focus();return;}
 if(prod.stock<=0){showToast(`"${prod.nombre}" sin stock`,true);input.value='';input.focus();return;}
 carritoAgregar(prod.id);
 input.value='';
 input.focus(); // mantener foco para el siguiente escaneo
 ventasRenderGrid();
 showToast(`✓ ${prod.nombre} agregado al carrito`);
}
function ventasRenderGrid(){
 const q=document.getElementById('v-buscar').value.toLowerCase();
 const rank=ventasRanking();
 // reset página al buscar
 vPagina=1;
 // ordenar: más vendidos primero, empate por nombre
 const fullData=filtrarCatalogo(q).sort((a,b)=>{
  const r=(rank[b.nombre]||0)-(rank[a.nombre]||0);
  return r!==0?r:a.nombre.localeCompare(b.nombre);
 });
 const grid=document.getElementById('v-prod-grid');
 const empty=document.getElementById('v-grid-empty');
 const pagEl=document.getElementById('v-pagination');
 if(!fullData.length){
  grid.innerHTML='';
  empty.style.display='block';
  if(pagEl)pagEl.style.display='none';
  return;
 }
 empty.style.display='none';
 const totalPaginas=Math.max(1,Math.ceil(fullData.length/V_POR_PAGINA));
 if(vPagina>totalPaginas)vPagina=totalPaginas;
 const start=(vPagina-1)*V_POR_PAGINA;
 const data=fullData.slice(start,start+V_POR_PAGINA);
 grid.innerHTML=data.map(c=>`
 <div class="prod-card ${c.stock<=0?'disabled':''}" onclick="${c.stock>0?`carritoAgregar(${c.id})`:''}">
 <div class="prod-card-name">${esc(c.nombre)}</div>
 <div class="prod-card-price">${fmt$(c.precio)}</div>
 <div class="prod-card-stock">Stock: ${c.stock} ${esc(c.formato)}</div>
 <div class="prod-card-badge"><span class="badge ${badgeCls(c.formato)}">${esc(c.formato)}</span></div>
 </div>`).join('');
 // paginación
 if(pagEl){
  pagEl.style.display='flex';
  document.getElementById('v-page-prev').disabled=vPagina<=1;
  document.getElementById('v-page-next').disabled=vPagina>=totalPaginas;
  const desde=Math.min(fullData.length,start+1);
  const hasta=Math.min(fullData.length,start+V_POR_PAGINA);
  document.getElementById('v-page-info').textContent=`${desde}–${hasta} de ${fullData.length}`;
 }
}
function carritoAgregar(catId){
 const prod=catalogo.find(c=>c.id===catId);
 if(!prod||prod.stock<=0)return;
 const item=carrito.find(i=>i.id===catId);
 if(item){if(item.qty>=prod.stock){showToast('Sin stock suficiente',true);return;}item.qty++;}
 else carrito.push({id:catId,nombre:prod.nombre,precio:prod.precio,formato:prod.formato,qty:1});
 carritoRender();
}
function carritoQty(catId,delta){
 const idx=carrito.findIndex(i=>i.id===catId);if(idx<0)return;
 const prod=catalogo.find(c=>c.id===catId);
 carrito[idx].qty+=delta;
 if(carrito[idx].qty<1)carrito.splice(idx,1);
 else if(prod&&carrito[idx].qty>prod.stock){carrito[idx].qty=prod.stock;showToast('Límite de stock alcanzado',true);}
 carritoRender();
}
function carritoRemover(catId){carrito=carrito.filter(i=>i.id!==catId);carritoRender();}
function abrirModalVaciar(){
 if(!carrito.length){showToast('🛒 El carrito ya está vacío',true);return;}
 document.getElementById('vaciar-modal').classList.add('open');
}
function cerrarModalVaciar(){ document.getElementById('vaciar-modal').classList.remove('open'); }
function confirmarVaciar(){ carrito=[]; carritoRender(); cerrarModalVaciar(); showToast('🛒 Carrito vaciado'); }
function carritoRender(){
 const el=document.getElementById('v-cart-items');
 const desc=parseFloat(document.getElementById('v-descuento').value)||0;
 const clamp=Math.min(100,Math.max(0,desc));
 if(!carrito.length){
 el.innerHTML='<div class="cart-empty">El carrito está vacío.<br/>Haz clic en un producto para agregar.</div>';
 document.getElementById('v-total').textContent='$0'; return;
 }
 const subtotal=carrito.reduce((s,i)=>s+i.precio*i.qty,0);
 const total=subtotal*(1-clamp/100);
 el.innerHTML=carrito.map(i=>`
 <div class="cart-item">
 <div style="flex:1">
 <div class="cart-item-name">${esc(i.nombre)}</div>
 <div class="cart-item-sub">${fmt$(i.precio)} × ${i.qty} = <strong>${fmt$(i.precio*i.qty)}</strong></div>
 </div>
 <div class="cart-qty">
 <button class="qty-btn" onclick="carritoQty(${i.id},-1)">−</button>
 <span class="qty-num">${i.qty}</span>
 <button class="qty-btn" onclick="carritoQty(${i.id},+1)">+</button>
 </div>
 <button class="btn-del" onclick="carritoRemover(${i.id})" style="margin-left:5px">✕</button>
 </div>`).join('');
 document.getElementById('v-total').textContent=fmt$(Math.round(total));
}
function ventasRenderHistorial(){
 const q=document.getElementById('v-hist-buscar').value.trim().toLowerCase();
 let fullData=ventas;
 if(q){
  const num=parseInt(q);
  if(!isNaN(num)) fullData=ventas.filter(v=>v.boleta===num);
  else fullData=ventas.filter(v=>v.items.some(i=>i.nombre.toLowerCase().includes(q)));
 }
 fullData=[...fullData].reverse();
 const el=document.getElementById('v-historial');
 const empty=document.getElementById('v-hist-empty');
 const pagEl=document.getElementById('v-hist-pagination');
 if(!fullData.length){el.innerHTML='';empty.style.display='block';if(pagEl)pagEl.style.display='none';return;}
 empty.style.display='none';
 const totalPaginas=Math.max(1,Math.ceil(fullData.length/HIST_POR_PAGINA));
 if(histPagina>totalPaginas)histPagina=totalPaginas;
 const start=(histPagina-1)*HIST_POR_PAGINA;
 const data=fullData.slice(start,start+HIST_POR_PAGINA);
 el.innerHTML=data.map(v=>`
 <div class="sale-entry">
 <div class="sale-head">
  <div class="sale-boleta-wrap">
  <span class="sale-boleta-label">Nro. Boleta Interna</span>
  <span class="sale-boleta">${v.boleta?`#${String(v.boleta).padStart(4,'0')}`:'—'}</span>
  </div>
  <span class="sale-time">${v.hora}</span>
 </div>
 <div class="sale-items">${v.items.map(i=>`<span>${i.qty}× ${esc(i.nombre)}</span>`).join(' &nbsp;·&nbsp; ')}${v.descuento>0?`<br/><span style="color:var(--muted);font-size:.74rem">Descuento ${v.descuento}%</span>`:''}</div>
 <div class="sale-footer"><span class="sale-pago">${({'efectivo':'💵 Efectivo','debito':'💳 Débito','credito':'💳 Crédito','transferencia':'🏦 Transferencia','libreta':'📒 Libreta'})[v.medioPago]||'—'}</span><div class="sale-total">${fmt$(v.total)}</div></div>
 </div>`).join('');
 if(pagEl){
  pagEl.style.display='flex';
  document.getElementById('v-hist-prev').disabled=histPagina<=1;
  document.getElementById('v-hist-next').disabled=histPagina>=totalPaginas;
  const desde=Math.min(fullData.length,start+1);
  const hasta=Math.min(fullData.length,start+HIST_POR_PAGINA);
  document.getElementById('v-hist-info').textContent=`${desde}–${hasta} de ${fullData.length}`;
 }
}

function histIrPagina(dir){
 const totalPaginas=Math.max(1,Math.ceil(ventas.length/HIST_POR_PAGINA));
 if(dir==='prev'&&histPagina>1)histPagina--;
 if(dir==='next'&&histPagina<totalPaginas)histPagina++;
 ventasRenderHistorial();
}
function ventasStats(){
 const total=ventas.reduce((s,v)=>s+v.total,0);
 document.getElementById('v-stat-ventas').textContent=ventas.length;
 document.getElementById('v-stat-ingresos').textContent=fmt$(total);
}
function ventasLimpiarHistorial(){
 if(!ventas.length)return;
 if(!loginEsAdmin()){showToast('⚠ Solo administrador puede limpiar historial',true);return;}
 if(!confirm('¿Limpiar TODO el historial de ventas? No solo las del día de hoy, sino TODAS las ventas registradas. Esta acción no se puede deshacer.'))return;
 const n=ventas.length;
 ventas=[];save('ventas_ferreteria',[]);
 ventasRenderHistorial();ventasStats();
 auditRegistrar('HISTORIAL_LIMPIEZA',`${n} ventas eliminadas`);
 showToast('Historial limpiado');
}
function confirmarVenta(){
 if(!carrito.length){showToast('El carrito está vacío',true);return;}
 const caja=load('caja_ferreteria');
 if(!caja||!caja.abierta){showToast('⚠ Abre la caja antes de vender',true);return;}
 const desc=parseFloat(document.getElementById('v-descuento').value)||0;
 const clamp=Math.min(100,Math.max(0,desc));
 const subtotal=carrito.reduce((s,i)=>s+i.precio*i.qty,0);
 const total=Math.round(subtotal*(1-clamp/100));
 // abrir modal de medio de pago
 abrirModalPago(total,subtotal,clamp);
}

/* ══════════════════════════════════════════════
 MEDIO DE PAGO (MODAL)
══════════════════════════════════════════════ */
let pagoPendiente = null;
let pagoSeleccionado = null;

// Validación de RUT chileno (módulo 11)
function validarRUT(rut){
 const limpio=rut.replace(/\./g,'').toUpperCase();
 const match=limpio.match(/^(\d{1,8})-(\d|K)$/);
 if(!match)return false;
 const cuerpo=parseInt(match[1],10);
 const dv=match[2];
 let suma=0,mult=2;
 let temp=cuerpo;
 while(temp>0){
  suma+=(temp%10)*mult;
  temp=Math.floor(temp/10);
  mult=mult<7?mult+1:2;
 }
 const dvCalc=11-(suma%11);
 const dvEsperado=dvCalc===11?'0':dvCalc===10?'K':String(dvCalc);
 return dv===dvEsperado;
}

function abrirModalPago(total,subtotal,clamp){
 pagoPendiente={total,subtotal,clamp};
 pagoSeleccionado=null;
 document.getElementById('pago-total').textContent=fmt$(total);
 document.querySelectorAll('.pago-option').forEach(o=>o.classList.remove('active'));
 document.getElementById('pago-extra-efectivo').style.display='none';
 document.getElementById('pago-extra-tarjeta').style.display='none';
 document.getElementById('pago-extra-libreta').style.display='none';
 document.getElementById('pago-recibido').value='';
 document.getElementById('pago-vuelto').textContent='';
 document.getElementById('pago-vuelto').className='pago-vuelto';
 document.getElementById('pago-operacion').value='';
 document.getElementById('pago-rut').value='';
 document.getElementById('pago-modal').classList.add('open');
}

function seleccionarPago(tipo){
 pagoSeleccionado=tipo;
 document.querySelectorAll('.pago-option').forEach(o=>o.classList.remove('active'));
 const btn=document.getElementById('pago-'+tipo);
 if(btn)btn.classList.add('active');
 document.getElementById('pago-extra-efectivo').style.display=(tipo==='efectivo')?'flex':'none';
 document.getElementById('pago-extra-tarjeta').style.display=(tipo==='debito'||tipo==='credito')?'flex':'none';
 document.getElementById('pago-extra-libreta').style.display=(tipo==='libreta')?'flex':'none';
 if(tipo==='efectivo'){ const r=document.getElementById('pago-recibido'); r.value=pagoPendiente?pagoPendiente.total:''; r.focus(); calcularVuelto(); }
 if(tipo==='debito'||tipo==='credito'){ document.getElementById('pago-operacion').focus(); }
 if(tipo==='libreta'){ document.getElementById('pago-rut').focus(); }
}

function calcularVuelto(){
 if(!pagoPendiente)return;
 const recibido=parseFloat(document.getElementById('pago-recibido').value)||0;
 const total=pagoPendiente.total;
 const vueltoEl=document.getElementById('pago-vuelto');
 if(recibido>=total){
  vueltoEl.textContent=`Vuelto: ${fmt$(recibido-total)}`;
  vueltoEl.className='pago-vuelto ok';
 } else {
  vueltoEl.textContent=`Faltan: ${fmt$(total-recibido)}`;
  vueltoEl.className='pago-vuelto warn';
 }
}

function cerrarModalPago(){
 document.getElementById('pago-modal').classList.remove('open');
 pagoPendiente=null;
 pagoSeleccionado=null;
}

// Cancelar: solo cierra el modal, conserva el carrito
function cancelarPago(){
 cerrarModalPago();
}

 function confirmarVentaPago(){
 if(!pagoPendiente){cerrarModalPago();return;}
 if(!pagoSeleccionado){showToast('Selecciona un medio de pago',true);return;}
 const {total,subtotal,clamp}=pagoPendiente;
 let extra=null;
 if(pagoSeleccionado==='efectivo'){
  const recibido=parseFloat(document.getElementById('pago-recibido').value)||0;
  if(recibido<total){showToast('El monto recibido no alcanza',true);return;}
  extra={recibido,vuelto:recibido-total};
 }
 if(pagoSeleccionado==='debito'||pagoSeleccionado==='credito'){
  const operacion=document.getElementById('pago-operacion').value.trim();
  if(!operacion){shake('pago-operacion');return;}
  extra={operacion};
 }
 if(pagoSeleccionado==='libreta'){
  const rutRaw=document.getElementById('pago-rut').value.trim();
  if(!rutRaw||!validarRUT(rutRaw)){showToast('RUT inválido. Usa formato 12.345.678-5',true);shake('pago-rut');return;}
  extra={rut:rutRaw.replace(/\./g,'')};
 }
 ejecutarVenta(total,subtotal,clamp,pagoSeleccionado,extra);
 cerrarModalPago();
}

function ejecutarVenta(total,subtotal,clamp,medioPago,extra){
 const hora=now();
 const ultimaBoleta=ventas.reduce((m,v)=>Math.max(m,v.boleta||0),0);
 const boleta=ultimaBoleta+1;
 // descontar stock
 carrito.forEach(item=>{const p=catalogo.find(c=>c.id===item.id);if(p)p.stock=Math.max(0,p.stock-item.qty);});
 save('catalogo_ferreteria',catalogo);
 // guardar venta
 const venta={boleta,hora,items:carrito.map(i=>({nombre:i.nombre,qty:i.qty,precio:i.precio,formato:i.formato})),subtotal,descuento:clamp,total,medioPago,extra};
 ventas.push(venta); save('ventas_ferreteria',ventas);
 // registrar en caja
 cajaRegistrarVenta(hora, `Venta – ${carrito.length} producto(s)`, total);
 auditRegistrar('VENTA',`boleta=#${String(boleta).padStart(4,'0')} total=${fmt$(total)} pago=${medioPago}`);
 showToast(`Venta confirmada · ${fmt$(total)} ✓`);
 carrito=[];
 document.getElementById('v-descuento').value='';
 carritoRender(); ventasRenderGrid(); ventasRenderHistorial(); ventasStats();
}

/* ══════════════════════════════════════════════
 MÓDULO CAJA
══════════════════════════════════════════════ */
function cajaGetState(){ return load('caja_ferreteria') || {abierta:false,fecha:'',horaApertura:'',montoInicial:0,responsable:'',movimientos:[]}; }
function cajaSave(state){ save('caja_ferreteria',state); }

function cajaAbrir(){
 const montoS=document.getElementById('caja-monto-ini').value;
 const monto=parseFloat(montoS);
 const responsable=document.getElementById('caja-responsable').value.trim();
 if(!montoS||isNaN(monto)||monto<0){shake('caja-monto-ini');return;}
 if(!responsable){shake('caja-responsable');return;}
 const state={abierta:true,fecha:today(),horaApertura:now(),montoInicial:monto,responsable,movimientos:[]};
 cajaSave(state); cajaRender();
 ventasCheckCaja();
 auditRegistrar('CAJA_APERTURA',`monto=${fmt$(monto)} resp=${responsable}`);
 showToast(`Caja abierta con ${fmt$(monto)} ✓`);
}

function cajaRegistrarVenta(hora, desc, monto){
 const state=cajaGetState();
 if(!state.abierta)return;
 state.movimientos.push({hora,tipo:'venta',descripcion:desc,monto});
 cajaSave(state);
 if(document.getElementById('sidebar-caja').classList.contains('open')) cajaRender();
}

function cajaRegistrarMovimiento(){
 const desc=document.getElementById('caja-desc').value.trim();
 const tipo=document.getElementById('caja-tipo').value;
 const montoS=document.getElementById('caja-monto').value;
 const monto=parseFloat(montoS);
 if(!desc){shake('caja-desc');return;}
 if(!montoS||isNaN(monto)||monto<=0){shake('caja-monto');return;}
 const state=cajaGetState();
 const montoFinal=(tipo==='ingreso'?1:-1)*monto;
 state.movimientos.push({hora:now(),tipo,descripcion:desc,monto:montoFinal});
 cajaSave(state); cajaRender();
 showToast(`Movimiento registrado: ${tipo==='ingreso'?'+':'-'}${fmt$(monto)} ✓`);
 document.getElementById('caja-desc').value='';
 document.getElementById('caja-monto').value='';
}

function cajaCerrar(){
 const state=cajaGetState();
 if(!state.abierta)return;
 if(!loginEsAdmin()){showToast('⚠ Solo administrador puede cerrar caja',true);return;}
 abrirModalCierre(state);
}

function abrirModalCierre(state){
 document.getElementById('cierre-modal').classList.add('open');
 document.getElementById('cierre-total-ventas').textContent=fmt$(state.movimientos.filter(m=>m.tipo==='venta').reduce((s,m)=>s+m.monto,0));
 document.getElementById('cierre-total-egresos').textContent=fmt$(Math.abs(state.movimientos.filter(m=>m.tipo!=='venta').reduce((s,m)=>s+m.monto,0)));
 document.getElementById('cierre-saldo').textContent=fmt$(state.montoInicial+state.movimientos.reduce((s,m)=>s+m.monto,0));
}

function cerrarModalCierre(){
 document.getElementById('cierre-modal').classList.remove('open');
}

function ejecutarCierre(){
 const state=cajaGetState();
 if(!state.abierta){cerrarModalCierre();return;}
 // calcular totales
 const totalVentas=state.movimientos.filter(m=>m.tipo==='venta').reduce((s,m)=>s+m.monto,0);
 const totalEgresos=state.movimientos.filter(m=>m.tipo!=='venta').reduce((s,m)=>s+m.monto,0);
 const saldoFinal=state.montoInicial+totalVentas+totalEgresos;
 const horaCierre=now();
 auditRegistrar('CAJA_CIERRE',`inicial=${fmt$(state.montoInicial)} ventas=${fmt$(totalVentas)} saldo=${fmt$(saldoFinal)}`);
 // generar resumen
 const lineas=state.movimientos.map((m,i)=>{
 const signo=m.monto>=0?'+':'-';
 return `${String(i+1).padStart(2,' ')}. [${m.hora}] ${m.tipo.toUpperCase().padEnd(8)} | ${m.descripcion.padEnd(35,' ')} | ${signo}${fmt$(Math.abs(m.monto))}`;
 }).join('\n');
 const resumen=
`FERRETERÍA EL GREENGO – CIERRE DE CAJA
${'═'.repeat(55)}
Fecha : ${state.fecha}
Responsable : ${state.responsable}
Hora apertura : ${state.horaApertura}
Hora cierre : ${horaCierre}
${'─'.repeat(55)}
Monto inicial : ${fmt$(state.montoInicial)}
Ventas del día : +${fmt$(totalVentas)}
Egresos/Ret. : ${fmt$(Math.abs(totalEgresos))} (${totalEgresos<0?'-':''})
${'─'.repeat(55)}
SALDO FINAL : ${fmt$(saldoFinal)}
${'═'.repeat(55)}

DETALLE DE MOVIMIENTOS:
${'─'.repeat(55)}
${lineas || '(Sin movimientos)'}
${'─'.repeat(55)}
Total movimientos: ${state.movimientos.length}
`;
 downloadTxt(`Cierre_Caja_${state.fecha.replace(/\//g,'-')}.txt`, resumen);
 // guardar cierre en historial
 const cierres=load('cierres_ferreteria')||[];
 const cierre={fecha:state.fecha,horaApertura:state.horaApertura,horaCierre,responsable:state.responsable,montoInicial:state.montoInicial,totalVentas,totalEgresos,saldoFinal,movimientos:state.movimientos};
 cierres.push(cierre);
 save('cierres_ferreteria',cierres);
 // resetear caja
 cajaSave({abierta:false,fecha:'',horaApertura:'',montoInicial:0,responsable:'',movimientos:[]});
 cajaRender();
 ventasCheckCaja();
 cerrarModalCierre();
 cierreRenderHistorial();
 showToast('Caja cerrada. Resumen descargado ✓');
}

function cierreRenderHistorial(){
 const cierres=load('cierres_ferreteria')||[];
 const el=document.getElementById('cierre-historial');
 const empty=document.getElementById('cierre-hist-empty');
 const btn=document.getElementById('btn-reabrir-cierre');
 if(!cierres.length){if(el)el.innerHTML='';if(empty)empty.style.display='block';if(btn)btn.disabled=true;return;}
 if(empty)empty.style.display='none';
 if(el)el.innerHTML=[...cierres].reverse().slice(0,10).map(c=>
 `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:6px;font-size:.76rem">
 <div style="display:flex;justify-content:space-between;align-items:center">
 <span style="font-weight:800;font-size:.82rem">${esc(c.fecha)}</span>
 <span style="color:var(--muted);font-size:.7rem">${esc(c.horaApertura)} → ${esc(c.horaCierre)}</span>
 </div>
 <div style="display:flex;justify-content:space-between;margin-top:4px">
 <span>Inicial: ${fmt$(c.montoInicial)}</span>
 <span>Ventas: <span style="color:var(--green);font-weight:700">+${fmt$(c.totalVentas)}</span></span>
 <span style="font-weight:800;color:var(--accent)">${fmt$(c.saldoFinal)}</span>
 </div>
 <div style="font-size:.7rem;color:var(--muted);margin-top:3px">Resp: ${esc(c.responsable)}</div>
 </div>`).join('');
 if(btn){btn.disabled=false;btn.onclick=function(){cierreExportar();}}
}

function cierreExportar(){
 const cierres=load('cierres_ferreteria')||[];
 if(!cierres.length){showToast('No hay cierres para exportar',true);return;}
 const txt=cierres.map((c,i)=>{
 return `CIERRE #${i+1}\n${'─'.repeat(40)}\nFecha: ${c.fecha}\nResponsable: ${c.responsable}\nApertura: ${c.horaApertura} → Cierre: ${c.horaCierre}\nInicial: ${fmt$(c.montoInicial)}\nVentas: +${fmt$(c.totalVentas)}\nEgresos: ${fmt$(Math.abs(c.totalEgresos))}\nSALDO: ${fmt$(c.saldoFinal)}`;
 }).join('\n\n');
 downloadTxt('Historial_Cierres.txt',txt);
 showToast('📁 Historial de cierres descargado');
}

function cajaRender(){
 const state=cajaGetState();
 const bar=document.getElementById('caja-status-bar');
 const dot=document.getElementById('caja-dot');
 const title=document.getElementById('caja-status-title');
 const sub=document.getElementById('caja-status-sub');
 const actions=document.getElementById('caja-status-actions');
 const panelAp=document.getElementById('caja-panel-apertura');
 const panelOp=document.getElementById('caja-panel-operacion');

 if(state.abierta){
 bar.className='caja-status open';
 dot.className='caja-dot on';
 title.textContent='Caja Abierta';
 sub.textContent=`Apertura: ${state.horaApertura} · ${state.fecha} · Resp: ${state.responsable}`;
 actions.innerHTML='';
 panelAp.style.display='none';
 panelOp.style.display='block';
 // calcular
 const totalVentas=state.movimientos.filter(m=>m.tipo==='venta').reduce((s,m)=>s+m.monto,0);
 const totalEgresos=state.movimientos.filter(m=>m.tipo!=='venta').reduce((s,m)=>s+m.monto,0);
 const nVentas=state.movimientos.filter(m=>m.tipo==='venta').length;
 const nEgresos=state.movimientos.filter(m=>m.tipo!=='venta').length;
 const saldo=state.montoInicial+totalVentas+totalEgresos;
 document.getElementById('cj-inicial').textContent=fmt$(state.montoInicial);
 document.getElementById('cj-responsable').textContent=`Resp: ${state.responsable}`;
 document.getElementById('cj-ventas').textContent=fmt$(totalVentas);
 document.getElementById('cj-nventas').textContent=`${nVentas} transacción${nVentas!==1?'es':''}`;
 document.getElementById('cj-egresos').textContent=fmt$(Math.abs(totalEgresos));
 document.getElementById('cj-negresos').textContent=`${nEgresos} movimiento${nEgresos!==1?'s':''}`;
 document.getElementById('cj-saldo').textContent=fmt$(saldo);
 document.getElementById('cj-saldo').className='caja-card-value big '+(saldo>=0?'green':'red');
 // movimientos
 const movEl=document.getElementById('caja-movimientos-list');
 const movEmpty=document.getElementById('caja-mov-empty');
 if(!state.movimientos.length){movEl.innerHTML='';movEmpty.style.display='block';}
 else{
 movEmpty.style.display='none';
 let acum=state.montoInicial;
 movEl.innerHTML=state.movimientos.map((m,i)=>{
 acum+=m.monto;
 const tipoCls={'venta':'b-venta','ingreso':'b-ingreso','retiro':'b-retiro','gasto':'b-gasto'}[m.tipo]||'b-other';
 const tipoLabel={'venta':'Venta','ingreso':'Ingreso','retiro':'Retiro Admin','gasto':'Gasto'}[m.tipo]||m.tipo;
 return `<div class="mov-row">
 <span class="mov-hora">${m.hora}</span>
 <span class="badge ${tipoCls}" style="flex-shrink:0">${tipoLabel}</span>
 <span class="mov-desc">${esc(m.descripcion)}</span>
 <span class="mov-monto ${m.monto>=0?'pos':'neg'}">${m.monto>=0?'+':'-'}${fmt$(Math.abs(m.monto))}</span>
 <span class="mov-saldo">Saldo: ${fmt$(acum)}</span>
 </div>`;
 }).join('');
 }
 } else {
 bar.className='caja-status closed';
 dot.className='caja-dot off';
 title.textContent='Caja Cerrada';
 sub.textContent='No hay apertura registrada para hoy.';
 actions.innerHTML='';
 panelAp.style.display='block';
 panelOp.style.display='none';
 }
}

/* ══════════════════════════════════════════════
 EDITAR PRODUCTO (MODAL)
══════════════════════════════════════════════ */
let editProductId = null;

function catalogoEditar(id){
 const prod=catalogo.find(c=>c.id===id);
 if(!prod)return;
 editProductId=id;
 document.getElementById('e-nombre').value=prod.nombre;
 document.getElementById('e-codigo').value=prod.codigo||'';
 document.getElementById('e-precio').value=prod.precio;
 document.getElementById('e-stock').value=prod.stock;
 document.getElementById('e-formato').value=prod.formato;
 document.getElementById('edit-modal').classList.add('open');
}

function catalogoCerrarEdicion(){
 document.getElementById('edit-modal').classList.remove('open');
 editProductId=null;
}

function catalogoGuardarEdicion(){
 if(editProductId===null)return;
 const prod=catalogo.find(c=>c.id===editProductId);
 if(!prod)return;
 const nombre=document.getElementById('e-nombre').value.trim();
 const codigo=document.getElementById('e-codigo').value.trim();
 const precioS=document.getElementById('e-precio').value;
 const precio=Math.round(parseFloat(precioS));
 const stockS=document.getElementById('e-stock').value;
 const stock=parseInt(stockS);
 const formato=document.getElementById('e-formato').value;
 if(!nombre){shake('e-nombre');return;}
 if(!precioS||isNaN(precio)||precio<0){shake('e-precio');return;}
 if(!stockS||isNaN(stock)||stock<0){shake('e-stock');return;}
 if(!formato){shake('e-formato');return;}
 prod.nombre=nombre;
 prod.codigo=codigo;
 prod.precio=precio;
 prod.stock=stock;
 prod.formato=formato;
 save('catalogo_ferreteria',catalogo);
 catalogoRender();
 catalogoCerrarEdicion();
 auditRegistrar('CATALOGO_EDITAR',`"${nombre}" $${precio} stock=${stock}`);
 showToast(`"${nombre}" actualizado ✓`);
}

/* ══════════════════════════════════════════════
 LIBRETA DEUDA
══════════════════════════════════════════════ */
function libretaClientes(){
 const clientes={};
 ventas.forEach(v=>{
  if(v.medioPago!=='libreta')return;
  const rut=v.extra && v.extra.rut ? v.extra.rut : 'S/RUT';
  if(!clientes[rut])clientes[rut]={rut,compras:0,total:0,ventas:[]};
  clientes[rut].compras++;
  clientes[rut].total+=v.total;
  clientes[rut].ventas.push(v);
 });
 return Object.values(clientes).sort((a,b)=>b.total-a.total);
}

function libretaRender(){
 const el=document.getElementById('libreta-lista');
 const empty=document.getElementById('libreta-empty');
 const btn=document.getElementById('btn-libreta-pagar');
 const clientes=libretaClientes();
 if(!clientes.length){el.innerHTML='';empty.style.display='block';if(btn)btn.style.display='none';return;}
 empty.style.display='none';
 if(btn)btn.style.display='block';
 el.innerHTML=clientes.map(c=>`
 <div class="libreta-cliente">
  <div class="libreta-head"><span class="libreta-rut">${esc(c.rut)}</span><span class="libreta-total">${fmt$(c.total)}</span></div>
  <div class="libreta-sub">${c.compras} compra${c.compras!==1?'s':''} · Última: ${c.ventas[c.ventas.length-1].hora}</div>
 </div>`).join('');
 if(btn)btn.onclick=function(){libretaSeleccionarPago();};
}

function libretaSeleccionarPago(){
 const clientes=libretaClientes();
 if(!clientes.length){showToast('No hay deudas pendientes',true);return;}
 const rutStr=clientes.map((c,i)=>`${i+1}. ${c.rut} — ${fmt$(c.total)} (${c.compras} compra${c.compras!==1?'s':''})`).join('\n');
 const idx=prompt(`Selecciona el cliente a pagar (ingresa el número):\n\n${rutStr}`);
 if(idx===null)return;
 const n=parseInt(idx);
 if(isNaN(n)||n<1||n>clientes.length){showToast('Número inválido',true);return;}
 const cliente=clientes[n-1];
 if(!confirm(`¿Registrar pago de ${fmt$(cliente.total)} del cliente ${cliente.rut}?`))return;
 // Marcar todas las ventas libreta de este cliente como pagadas
 ventas.forEach(v=>{if(v.medioPago==='libreta'&&v.extra&&v.extra.rut===cliente.rut)v.pagada=true;});
 save('ventas_ferreteria',ventas);
 libretaRender();
 auditRegistrar('LIBRETA_PAGO',`Cliente ${cliente.rut} — ${fmt$(cliente.total)}`);
 showToast(`✅ Pago registrado: ${cliente.rut} — ${fmt$(cliente.total)}`);
}
const CONFIG_KEY = 'ferreteria_config';
function configGet(){ return load(CONFIG_KEY) || {}; }
function configSave(c){ save(CONFIG_KEY,c); }
function configGetMail(){ const c=configGet(); return (c.mailDestino||'').trim() || 'ferreteria.elgreengo@gmail.com'; }
function configSetMail(mail){ const c=configGet(); c.mailDestino=(mail||'').trim(); configSave(c); }

function configRender(){
 const mail=configGetMail();
 const el=document.getElementById('config-mail-input');
 if(el) el.value=mail;
}
function configGuardarMail(){
 const input=document.getElementById('config-mail-input');
 const mail=input.value.trim();
 if(!mail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)){showToast('⚠ Correo inválido',true);shake('config-mail-input');return;}
 configSetMail(mail);
 auditRegistrar('CONFIG_MAIL',`Destino de pedidos: ${mail}`);
 showToast('📧 Correo destino actualizado ✓');
}

function enviarPorMail(){
 if(!pedidos.length){showToast('No hay productos en el pedido para enviar.',true);return;}
 const fecha=new Date().toLocaleDateString('es-CL',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
 const total=pedidos.reduce((s,p)=>s+p.cantidad,0);
 const lineas=pedidos.map((p,i)=>`${String(i+1).padStart(2,' ')}. ${p.nombre.padEnd(35,' ')} | Cant: ${String(p.cantidad).padStart(4,' ')} | ${p.formato}`).join('\n');
 const contenido=`FERRETERÍA EL GREENGO\n${'='.repeat(50)}\nPedido del día: ${fecha}\n${'='.repeat(50)}\n\n${lineas}\n\n${'-'.repeat(50)}\nTotal de productos : ${pedidos.length}\nTotal de unidades : ${total}\n${'-'.repeat(50)}\n`;
 downloadTxt('Pedido_ElGreengo.txt',contenido);
 const asunto=encodeURIComponent(`Pedido Ferretería El Greengo – ${fecha}`);
 const cuerpo=encodeURIComponent(`Estimados,\n\nAdjunto el pedido del día ${fecha}.\n\nDetalle:\n${lineas}\n\nTotal de productos : ${pedidos.length}\nTotal de unidades : ${total}\n\nSaludos,\nFerretería El Greengo`);
 window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(configGetMail())}&su=${asunto}&body=${cuerpo}`,'_blank');
 document.getElementById('mail-modal').classList.add('open');
}
function cerrarModalMail(){document.getElementById('mail-modal').classList.remove('open');}

/* ══════════════════════════════════════════════
 EXPORTAR / IMPORTAR DATOS
══════════════════════════════════════════════ */
function exportarDatos(){
 if(!loginEsAdmin()){showToast('⚠ Solo administrador puede exportar datos',true);return;}
 const datos={
  fecha:new Date().toISOString(),
  catalogo:load('catalogo_ferreteria'),
  ventas:load('ventas_ferreteria'),
  pedidos:load('pedidos_ferreteria'),
  caja:load('caja_ferreteria'),
  cierres:load('cierres_ferreteria'),
  usuarios:loginGetUsers(),
  auditoria:auditGetLog(),
  seeded:load('ferreteria_seeded')
 };
 const json=JSON.stringify(datos,null,2);
 const blob=new Blob([json],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url; a.download=`Ferreteria_Backup_${new Date().toISOString().slice(0,10)}.json`;
 document.body.appendChild(a); a.click();
 document.body.removeChild(a); URL.revokeObjectURL(url);
 auditRegistrar('EXPORTAR_DATOS','Backup descargado');
 showToast('📤 Backup exportado');
}

function importarDatos(event){
 if(!loginEsAdmin()){showToast('⚠ Solo administrador puede importar datos',true);return;}
 const file=event.target.files[0];
 if(!file)return;
 const reader=new FileReader();
 reader.onload=function(e){
  try{
   const datos=JSON.parse(e.target.result);
   if(!datos.catalogo&&!datos.ventas){showToast('⚠ Archivo inválido',true);return;}
   if(!confirm('¿Importar datos? Esto reemplazará TODO el catálogo, ventas, caja, usuarios y auditoría actuales.'))return;
   if(datos.catalogo!==undefined)save('catalogo_ferreteria',datos.catalogo);
   if(datos.ventas!==undefined)save('ventas_ferreteria',datos.ventas);
   if(datos.pedidos!==undefined)save('pedidos_ferreteria',datos.pedidos);
   if(datos.caja!==undefined)save('caja_ferreteria',datos.caja);
   if(datos.cierres!==undefined)save('cierres_ferreteria',datos.cierres);
   if(datos.usuarios!==undefined)loginSaveUsers(datos.usuarios);
   if(datos.auditoria!==undefined)auditSaveLog(datos.auditoria);
   if(datos.seeded!==undefined)save('ferreteria_seeded',datos.seeded);
   auditRegistrar('IMPORTAR_DATOS','Backup restaurado');
   showToast('📥 Datos importados. Recargando…');
   setTimeout(()=>location.reload(),1200);
  }catch(err){showToast('⚠ Error al leer el archivo',true);}
 };
 reader.readAsText(file);
 event.target.value='';
}

/* ══════════════════════════════════════════════
 LOG DE AUDITORÍA
══════════════════════════════════════════════ */
const AUDIT_KEY = 'ferreteria_audit';

function auditGetLog(){ return load(AUDIT_KEY)||[]; }
function auditSaveLog(log){ save(AUDIT_KEY,log); }

function auditRegistrar(accion, detalle){
 const session=loginGetSession();
 const usuario=session?session.usuario:'?';
 const log=auditGetLog();
 log.unshift({
  ts:new Date().toLocaleString('es-CL'),
  usuario,
  accion,
  detalle:detalle||''
 });
 // Máximo 500 entradas para no saturar localStorage
 if(log.length>500)log.length=500;
 auditSaveLog(log);
}

function auditRender(){
 const el=document.getElementById('audit-lista');
 const empty=document.getElementById('audit-empty');
 const log=auditGetLog();
 if(!log.length){if(el)el.innerHTML='';if(empty)empty.style.display='block';return;}
 if(empty)empty.style.display='none';
 if(el)el.innerHTML=log.slice(0,50).map(e=>`
 <div class="audit-entry">
  <div class="audit-head"><span class="audit-accion badge ${auditBadgeCls(e.accion)}">${esc(e.accion)}</span><span class="audit-ts">${esc(e.ts)}</span></div>
  <div class="audit-user">👤 ${esc(e.usuario)}</div>
  ${e.detalle?`<div class="audit-detalle">${esc(e.detalle)}</div>`:''}
 </div>`).join('');
}

function auditBadgeCls(accion){
 if(accion.includes('VENTA'))return 'b-venta';
 if(accion.includes('CAJA')||accion.includes('APERTURA')||accion.includes('CIERRE'))return 'b-caja';
 if(accion.includes('PAGO')||accion.includes('LIBRETA'))return 'b-ingreso';
 if(accion.includes('EDIT')||accion.includes('ELIMIN')||accion.includes('LIMPIEZA')||accion.includes('BORR'))return 'b-gasto';
 return 'b-other';
}

function auditExportar(){
 const log=auditGetLog();
 if(!log.length){showToast('No hay registros de auditoría para exportar',true);return;}
 const txt=log.map((e,i)=>`${i+1}. [${e.ts}] ${e.usuario} | ${e.accion}${e.detalle?' | '+e.detalle:''}`).join('\n');
 const header=`FERRETERÍA EL GREENGO – LOG DE AUDITORÍA\n${'═'.repeat(60)}\nExportado: ${new Date().toLocaleString('es-CL')}\nTotal registros: ${log.length}\n${'═'.repeat(60)}\n\n`;
 downloadTxt('Auditoria_ElGreengo.txt',header+txt);
 showToast('📤 Log de auditoría exportado');
}

/* ══════════════════════════════════════════════
 SISTEMA DE LOGIN (PIN + ROLES)
══════════════════════════════════════════════ */
const USERS_KEY = 'ferreteria_usuarios';
const SESSION_KEY = 'ferreteria_sesion';
const LOGIN_ATTEMPTS_KEY = 'ferreteria_intentos';
const SESION_MAX_HORAS = 8;
const MAX_INTENTOS = 3;
const LOCKOUT_MS = 30000; // 30 segundos

// Hash: usa SHA-256 si crypto.subtle está disponible (HTTPS/localhost), fallback a hash simple en HTTP
async function hashPIN(pin) {
 try {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
   const encoder = new TextEncoder();
   const data = encoder.encode(pin);
   const hashBuffer = await crypto.subtle.digest('SHA-256', data);
   const hashArray = Array.from(new Uint8Array(hashBuffer));
   return 'h' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
 } catch(e) { /* fallback */ }
 // Fallback: hash simple compatible con HTTP
 let h = 0;
 for(let i = 0; i < pin.length; i++) { h = ((h << 5) - h) + pin.charCodeAt(i); h |= 0; }
 return 'h' + Math.abs(h).toString(36);
}

function loginGetUsers(){ return load(USERS_KEY)||{}; }
function loginSaveUsers(u){ save(USERS_KEY,u); }

function loginGetSession(){ return load(SESSION_KEY); }
function loginSaveSession(s){ save(SESSION_KEY,{...s,ts:Date.now()}); }
function loginCerrarSesion(){ localStorage.removeItem(SESSION_KEY); location.reload(); }

function cerrarTurno(){
 document.getElementById('turno-modal').classList.add('open');
}

function confirmarCerrarTurno(){
 document.getElementById('turno-modal').classList.remove('open');
 loginCerrarSesion();
}

function cerrarModalTurno(){
 document.getElementById('turno-modal').classList.remove('open');
}

// Estado de intentos fallidos (anti brute force)
function loginGetIntentos(){ const i=load(LOGIN_ATTEMPTS_KEY); if(!i) return {n:0,lockedHasta:0}; return i; }
function loginSaveIntentos(i){ save(LOGIN_ATTEMPTS_KEY,i); }
function loginResetIntentos(){ loginSaveIntentos({n:0,lockedHasta:0}); }
function loginEstaBloqueado(){
 const i=loginGetIntentos();
 if(i.n>=MAX_INTENTOS && Date.now()<i.lockedHasta) return Math.ceil((i.lockedHasta-Date.now())/1000);
 if(Date.now()>=i.lockedHasta) loginResetIntentos();
 return 0;
}

function loginObtenerUsuarioActual(){ return loginGetSession(); }

function loginEsAdmin(){ const s=loginGetSession(); return s&&s.rol==='admin'; }
function loginEsCajero(){ const s=loginGetSession(); return s&&(s.rol==='cajero'||s.rol==='admin'); }

// Setup inicial — detectar si hay usuarios
function loginCheck(){
 const users=loginGetUsers();
 const session=loginGetSession();
 const overlay=document.getElementById('login-modal');

  // Si ya hay sesión activa → verificar expiración
 if(session && users[session.usuario]){
  // S2: sesión expira tras SESION_MAX_HORAS
  const antiguedadMs=Date.now()-(session.ts||0);
  if(session.ts && antiguedadMs > SESION_MAX_HORAS*3600*1000){
   loginCerrarSesion();
   return false;
  }
  overlay.style.display='none';
  const badge=document.getElementById('header-username');
  if(badge) badge.textContent='👤 '+session.usuario;
  return true;
 }

 // No hay sesión → mostrar login
 overlay.style.display='flex';
 const stepChoose=document.getElementById('login-step-choose');
 const stepSetup=document.getElementById('login-step-setup');
 const btnSetup=document.getElementById('login-btn-setup');

 // Poblar lista de usuarios
 const sel=document.getElementById('login-usuario');
 sel.innerHTML=Object.keys(users).map(u=>`<option value="${esc(u)}">${esc(u)}</option>`).join('');

 if(!Object.keys(users).length){
  // No hay usuarios → ir a setup directamente
  stepChoose.style.display='none';
  stepSetup.style.display='block';
  document.getElementById('setup-usuario').focus();
 } else {
  stepChoose.style.display='block';
  stepSetup.style.display='none';
  btnSetup.style.display='none';
  document.getElementById('login-pin').value='';
  document.getElementById('login-pin').focus();
 }
 return false;
}

function loginSetup(){
 document.getElementById('login-step-choose').style.display='none';
 document.getElementById('login-step-setup').style.display='block';
 document.getElementById('setup-usuario').focus();
 document.getElementById('setup-error').style.display='none';
}

async function loginCrearAdmin(){
 const usuario=document.getElementById('setup-usuario').value.trim();
 const pin=document.getElementById('setup-pin').value;
 const pin2=document.getElementById('setup-pin2').value;
 const errEl=document.getElementById('setup-error');

 if(!usuario){errEl.textContent='Ingresa un nombre de usuario';errEl.style.display='block';shake('setup-usuario');return;}
 if(!pin||pin.length<4||pin.length>6||!/^\d+$/.test(pin)){errEl.textContent='El PIN debe tener 4 a 6 dígitos numéricos';errEl.style.display='block';shake('setup-pin');return;}
 if(pin!==pin2){errEl.textContent='Los PIN no coinciden';errEl.style.display='block';shake('setup-pin2');return;}
 errEl.style.display='none';

 const users=loginGetUsers();
 users[usuario]={usuario,pinHash:await hashPIN(pin),rol:'admin',creado:new Date().toISOString()};
 loginSaveUsers(users);
 loginSaveSession({usuario,rol:'admin'});
 showToast(`✅ Admin "${usuario}" creado`);
 location.reload();
}

async function loginIngresar(){
 const usuario=document.getElementById('login-usuario').value;
 const pin=document.getElementById('login-pin').value;
 const errEl=document.getElementById('login-error');

 // S1: verificar bloqueo por intentos fallidos
 const segundosBloqueo=loginEstaBloqueado();
 if(segundosBloqueo>0){
  errEl.textContent=`Demasiados intentos. Espera ${segundosBloqueo}s e inténtalo de nuevo.`;
  errEl.style.display='block';
  return;
 }

 if(!pin){errEl.textContent='Ingresa tu PIN';errEl.style.display='block';return;}

 const users=loginGetUsers();
 const user=users[usuario];
 if(!user||user.pinHash!==await hashPIN(pin)){
  const intentos=loginGetIntentos();
  intentos.n++;
  if(intentos.n>=MAX_INTENTOS){
   intentos.lockedHasta=Date.now()+LOCKOUT_MS;
   intentos.n=0;
   loginSaveIntentos(intentos);
   errEl.textContent=`PIN incorrecto. Demasiados intentos: bloqueado por ${LOCKOUT_MS/1000}s.`;
  }else{
   loginSaveIntentos(intentos);
   errEl.textContent=`PIN incorrecto. Quedan ${MAX_INTENTOS-intentos.n} intento${MAX_INTENTOS-intentos.n!==1?'s':''}. Tras ${MAX_INTENTOS} fallos se bloquea ${LOCKOUT_MS/1000}s.`;
  }
  errEl.style.display='block';
  document.getElementById('login-pin').value='';
  document.getElementById('login-pin').focus();
  return;
 }
 errEl.style.display='none';
 loginResetIntentos();
 loginSaveSession({usuario,rol:user.rol});
 showToast(`👋 Bienvenido, ${usuario}`);
 location.reload();
}

async function loginAgregarCajero(usuario,pin){
 const users=loginGetUsers();
 if(users[usuario])return false;
 users[usuario]={usuario,pinHash:await hashPIN(pin),rol:'cajero',creado:new Date().toISOString()};
 loginSaveUsers(users);
 return true;
}

function usuariosRender(){
 const users=loginGetUsers();
 const el=document.getElementById('usuarios-lista');
 const empty=document.getElementById('usuarios-empty');
 const btn=document.getElementById('side-nav-usuarios');
 if(btn)btn.style.display=loginEsAdmin()?'block':'none';
 if(!Object.keys(users).length){if(el)el.innerHTML='';if(empty)empty.style.display='block';return;}
 if(empty)empty.style.display='none';
 if(el)el.innerHTML=Object.entries(users).sort((a,b)=>a[1].rol.localeCompare(b[1].rol)).map(([u,d])=>
 `<div class="audit-entry" style="margin-bottom:6px">
  <div style="display:flex;justify-content:space-between;align-items:center">
   <span style="font-weight:800;font-size:.82rem">${esc(u)}</span>
   <span style="display:flex;align-items:center;gap:6px">
    <span class="badge ${d.rol==='admin'?'b-venta':'b-other'}">${d.rol==='admin'?'👑 Admin':'👤 Cajero'}</span>
    ${loginEsAdmin()?`<button class="btn-del" onclick="abrirModalEditarPin('${esc(u)}')" title="Cambiar PIN">🔑</button>`:''}
   </span>
  </div>
  <div style="font-size:.7rem;color:var(--muted);margin-top:4px">Creado: ${d.creado?new Date(d.creado).toLocaleDateString('es-CL'):'—'}</div>
 </div>`).join('');
}

function agregarCajeroUI(){
 if(!loginEsAdmin()){showToast('⚠ Solo administrador puede crear usuarios',true);return;}
 const usuario=document.getElementById('usuario-nuevo').value.trim();
 const pin=document.getElementById('usuario-pin').value;
 const pin2=document.getElementById('usuario-pin2').value;
 const errEl=document.getElementById('usuario-error');
 if(!usuario){errEl.textContent='Ingresa un nombre de usuario';errEl.style.display='block';shake('usuario-nuevo');return;}
 if(!pin||pin.length<4||pin.length>6||!/^\d+$/.test(pin)){errEl.textContent='El PIN debe tener 4 a 6 dígitos numéricos';errEl.style.display='block';shake('usuario-pin');return;}
 if(pin!==pin2){errEl.textContent='Los PIN no coinciden';errEl.style.display='block';shake('usuario-pin2');return;}
 const users=loginGetUsers();
 if(users[usuario]){errEl.textContent='El usuario ya existe';errEl.style.display='block';shake('usuario-nuevo');return;}
 errEl.style.display='none';
 loginAgregarCajero(usuario,pin).then(()=>{
  usuariosRender();
  showToast(`✅ Cajero "${usuario}" creado`);
  document.getElementById('usuario-nuevo').value='';
  document.getElementById('usuario-pin').value='';
  document.getElementById('usuario-pin2').value='';
  document.getElementById('usuario-nuevo').focus();
 });
}
let _editPinUsuario='';
function abrirModalEditarPin(usuario){
 _editPinUsuario=usuario;
 document.getElementById('editar-pin-usuario').textContent=usuario;
 document.getElementById('editar-pin-nuevo').value='';
 document.getElementById('editar-pin-confirmar').value='';
 document.getElementById('editar-pin-error').style.display='none';
 document.getElementById('editar-pin-modal').classList.add('open');
 document.getElementById('editar-pin-nuevo').focus();
}
function cerrarModalEditarPin(){ document.getElementById('editar-pin-modal').classList.remove('open'); _editPinUsuario=''; }
async function confirmarEditarPin(){ const pin=document.getElementById('editar-pin-nuevo').value; const pin2=document.getElementById('editar-pin-confirmar').value; const errEl=document.getElementById('editar-pin-error'); if(!pin||pin.length<4||pin.length>6||!/^\d+$/.test(pin)){errEl.textContent='El PIN debe tener 4 a 6 dígitos numéricos';errEl.style.display='block';return;} if(pin!==pin2){errEl.textContent='Los PIN no coinciden';errEl.style.display='block';return;} errEl.style.display='none'; const users=loginGetUsers(); if(!users[_editPinUsuario]){showToast('⚠ Usuario no encontrado',true);cerrarModalEditarPin();return;} users[_editPinUsuario].pinHash=await hashPIN(pin); users[_editPinUsuario].creado=users[_editPinUsuario].creado||new Date().toISOString(); loginSaveUsers(users); cerrarModalEditarPin(); showToast('✅ PIN actualizado para '+_editPinUsuario); }

/* ── Init ── */
(function(){
 // Verificar login primero — si no hay sesión, no se ejecuta nada más
 if(!loginCheck()) return;

 document.getElementById('mail-modal').addEventListener('click',function(e){if(e.target===this)cerrarModalMail();});
 document.getElementById('edit-modal').addEventListener('click',function(e){if(e.target===this)catalogoCerrarEdicion();});
 document.getElementById('pago-modal').addEventListener('click',function(e){if(e.target===this)cancelarPago();});
 document.getElementById('cierre-modal').addEventListener('click',function(e){if(e.target===this)cerrarModalCierre();});

 // Scanner: Enter en el buscador de ventas → auto-agregar por código exacto
 // Scanner: Enter en campo dedicado → auto-agregar por código exacto
 document.getElementById('v-scanner').addEventListener('keydown',e=>{
  if(e.key==='Enter'){ e.preventDefault(); ventasScanCodigo('v-scanner'); }
 });
 // Buscador: Enter filtra resultados sin interferir con scanner
 document.getElementById('v-buscar').addEventListener('keydown',e=>{
  if(e.key==='Enter'){ e.preventDefault(); ventasRenderGrid(); }
 });

 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   if(document.getElementById('mail-modal').classList.contains('open')) cerrarModalMail();
   if(document.getElementById('edit-modal').classList.contains('open')) catalogoCerrarEdicion();
   if(document.getElementById('pago-modal').classList.contains('open')) cancelarPago();
   if(document.getElementById('cierre-modal').classList.contains('open')) cerrarModalCierre();
   return;
  }
  if(e.key!=='Enter')return;
  const active=document.querySelector('.tab-panel.active').id;
  if(active==='panel-pedidos' &&e.target.id!=='p-buscar') pedidoAgregar();
  if(active==='panel-catalogo' &&e.target.id!=='c-buscar') catalogoAgregar();
 });

 // Seed 100 productos de muestra (solo una vez, flag persistente + catálogo vacío)
 const catalogoExistente=load('catalogo_ferreteria');
 if(!load('ferreteria_seeded') && (!catalogoExistente || !catalogoExistente.length)){
  catalogo=[];
  const muestras=[];
  let seedIdx=1;
  const add=(nombre,precio,stock,formato)=>muestras.push({nombre,codigo:`FER-${String(seedIdx++).padStart(3,'0')}`,precio,stock,formato});
  // 1. Tornillos (12)
  ['1/4" x 2"','1/4" x 3"','1/4" x 4"','5/16" x 2"','5/16" x 3"','3/8" x 2"','3/8" x 3"','3/8" x 4"','1/2" x 3"','1/2" x 4"','1/2" x 6"','5/8" x 6"'].forEach((t,i)=>add(`Tornillo cabeza plana ${t}`,120+i*15,300+i*25,'Unidad'));
  // 2. Clavos (8)
  ['1"','1 1/2"','2"','2 1/2"','3"','3 1/2"','4"','5"'].forEach((t,i)=>add(`Clavo forjado ${t}`,70+i*12,900-i*60,'Kg'));
  // 3. Tuercas (8)
  ['1/4"','5/16"','3/8"','7/16"','1/2"','9/16"','5/8"','3/4"'].forEach((t,i)=>add(`Tuerca hexagonal ${t}`,60+i*20,500-i*30,'Bolsa'));
  // 4. Arandelas (8)
  ['1/4"','5/16"','3/8"','7/16"','1/2"','9/16"','5/8"','3/4"'].forEach((t,i)=>add(`Arandela plana ${t}`,40+i*12,1000-i*60,'Bolsa'));
  // 5. Pernos (8)
  ['3/8" x 2"','3/8" x 3"','3/8" x 4"','1/2" x 3"','1/2" x 4"','1/2" x 5"','5/8" x 4"','5/8" x 6"'].forEach((t,i)=>add(`Perno galvanizado ${t}`,180+i*40,250+i*20,'Unidad'));
  // 6. Brocas (10)
  ['3mm','4mm','5mm','6mm','8mm','10mm','1/4"','3/8"','1/2"','5/8"'].forEach((t,i)=>add(`Broca para metal ${t}`,490+i*90,150-i*8,'Unidad'));
  // 7. Discos (6)
  ['4 1/2" x 1/16"','4 1/2" x 3/64"','7" x 1/16"','7" x 1/8"','9" x 1/8"','12" x 1/8"'].forEach((t,i)=>add(`Disco de corte ${t}`,990+i*250,80+i*10,'Unidad'));
  // 8. Lijas (8)
  ['#80','#100','#120','#150','#180','#220','#320','#400'].forEach((t,i)=>add(`Lija al agua ${t} lote 10u`,790+i*20,180+i*15,'Bolsa'));
  // 9. Cintas (6)
  ['3M 18mm x 10m','3M 18mm x 20m','3M 24mm x 10m','3M 24mm x 20m','Aislante 18mm x 10m','Aislante 24mm x 10m'].forEach((t,i)=>add(`Cinta ${t}`,990+i*150,90+i*12,'Rollo'));
  // 10. Tarugos (6)
  ['4mm lote 50u','5mm lote 50u','6mm lote 50u','8mm lote 50u','10mm lote 25u','12mm lote 25u'].forEach((t,i)=>add(`Tarugo plástico ${t}`,490+i*60,250+i*20,'Bolsa'));
  // 11. Pinturas (10)
  ['blanco 1L','blanco 4L','negro 1L','negro 4L','rojo 1L','rojo 4L','azul 1L','verde 1L','amarillo 1L','gris 1L'].forEach((t,i)=>add(`Pintura esmalte ${t}`,4990+i*250,35+i*5,'Litros'));
  // 12. Varios (10)
  add('Diluyente sintético 1L',2990,60,'Litros');
  add('Aguarrás mineral 1L',2490,45,'Litros');
  add('Silicona transparente 280ml',1890,70,'Unidad');
  add('Guante seguridad cuero lote 2u',3990,45,'Caja');
  add('Guante nitrilo lote 10u',5490,30,'Caja');
  add('Antiparras seguridad',2990,25,'Unidad');
  add('Mascarilla N95 lote 5u',4490,40,'Caja');
  add('Candado 40mm',3490,50,'Unidad');
  add('Candado 60mm',5490,35,'Unidad');
  add('Chaleco reflectante',6990,20,'Unidad');
  muestras.forEach(m=>catalogo.push({id:cNextId++,...m}));
  save('catalogo_ferreteria',catalogo);
  save('ferreteria_seeded',true);
 }

 pedidoRender();
 catalogoRender();
 ventasRenderGrid();
 ventasCheckCaja();
 ventasRenderHistorial();
 ventasStats();
 cajaRender();
})();