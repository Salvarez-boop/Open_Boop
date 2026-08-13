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

/* ── Tab navigation ── */
function showTab(name){
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
 if(opening) cajaRender();
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
 const data=pedidos.filter(p=>p.nombre.toLowerCase().includes(q)||p.formato.toLowerCase().includes(q))
 .sort((a,b)=>{let va=a[pSortCol],vb=b[pSortCol];if(typeof va==='string'){va=va.toLowerCase();vb=vb.toLowerCase();}return pSortAsc?(va>vb?1:-1):(va<vb?1:-1);});
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
 const precio=parseFloat(precioS);
 const stockS=document.getElementById('c-stock').value;
 const stock=parseInt(stockS);
 const formato=document.getElementById('c-formato').value;
 if(!nombre){shake('c-nombre');return;}
 if(!precioS||isNaN(precio)||precio<0){shake('c-precio');return;}
 if(!stockS||isNaN(stock)||stock<0){shake('c-stock');return;}
 if(!formato){shake('c-formato');return;}
 catalogo.push({id:cNextId++,nombre,codigo,precio,stock,formato});
 save('catalogo_ferreteria',catalogo); catalogoRender();
 showToast(`"${nombre}" agregado al catálogo ✓`);
 document.getElementById('c-nombre').value='';
 document.getElementById('c-codigo').value='';
 document.getElementById('c-precio').value='';
 document.getElementById('c-stock').value='';
 document.getElementById('c-formato').value='';
 document.getElementById('c-nombre').focus();
}
function catalogoEliminar(id){ catalogo=catalogo.filter(c=>c.id!==id); save('catalogo_ferreteria',catalogo); catalogoRender(); showToast('Producto eliminado del catálogo'); }
function catalogoLimpiar(){ if(!catalogo.length)return; if(!confirm('¿Eliminar todos los productos del catálogo?'))return; catalogo=[];cNextId=1; save('catalogo_ferreteria',catalogo); catalogoRender(); showToast('Catálogo limpiado'); }
function catSort(col){ cSortAsc=cSortCol===col?!cSortAsc:true; cSortCol=col; cPagina=1; catalogoRender(); }
function catIrPagina(dir){
 const q=document.getElementById('c-buscar').value.toLowerCase();
 const data=catalogo.filter(c=>c.nombre.toLowerCase().includes(q)||c.formato.toLowerCase().includes(q)||(c.codigo||'').toLowerCase().includes(q)).sort((a,b)=>{let va=a[cSortCol],vb=b[cSortCol];if(typeof va==='string'){va=va.toLowerCase();vb=vb.toLowerCase();}return cSortAsc?(va>vb?1:-1):(va<vb?1:-1);});
 const totalPaginas=Math.max(1,Math.ceil(data.length/C_POR_PAGINA));
 if(dir==='prev'&&cPagina>1)cPagina--;
 if(dir==='next'&&cPagina<totalPaginas)cPagina++;
 if(typeof dir==='number')cPagina=Math.max(1,Math.min(dir,totalPaginas));
 catalogoRender();
}
function catalogoRender(){
 const q=document.getElementById('c-buscar').value.toLowerCase();
 const fullData=catalogo.filter(c=>c.nombre.toLowerCase().includes(q)||c.formato.toLowerCase().includes(q)||(c.codigo||'').toLowerCase().includes(q))
 .sort((a,b)=>{let va=a[cSortCol],vb=b[cSortCol];if(typeof va==='string'){va=va.toLowerCase();vb=vb.toLowerCase();}return cSortAsc?(va>vb?1:-1):(va<vb?1:-1);});
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
 const data=catalogo.filter(c=>c.nombre.toLowerCase().includes(q)||c.formato.toLowerCase().includes(q)||(c.codigo||'').toLowerCase().includes(q))
 .sort((a,b)=>(rank[b.nombre]||0)-(rank[a.nombre]||0));
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
 if(!prod)return; // no es código exacto → la búsqueda filtra normal
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
 // ordenar: más vendidos primero, empate por nombre
 const fullData=catalogo.filter(c=>c.nombre.toLowerCase().includes(q)||c.formato.toLowerCase().includes(q)||(c.codigo||'').toLowerCase().includes(q))
 .sort((a,b)=>{
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
function carritoLimpiar(){carrito=[];carritoRender();}
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
 const el=document.getElementById('v-historial');
 const empty=document.getElementById('v-hist-empty');
 if(!ventas.length){el.innerHTML='';empty.style.display='block';return;}
 empty.style.display='none';
 el.innerHTML=[...ventas].reverse().map(v=>`
 <div class="sale-entry">
 <div class="sale-time">${v.hora}</div>
 <div class="sale-items">${v.items.map(i=>`<span>${i.qty}× ${esc(i.nombre)}</span>`).join(' &nbsp;·&nbsp; ')}${v.descuento>0?`<br/><span style="color:var(--muted);font-size:.74rem">Descuento ${v.descuento}%</span>`:''}</div>
 <div class="sale-total">${fmt$(v.total)}</div>
 </div>`).join('');
}
function ventasStats(){
 const total=ventas.reduce((s,v)=>s+v.total,0);
 document.getElementById('v-stat-ventas').textContent=ventas.length;
 document.getElementById('v-stat-ingresos').textContent=fmt$(total);
}
function ventasLimpiarHistorial(){
 if(!ventas.length)return;
 if(!confirm('¿Limpiar el historial de ventas del día?'))return;
 ventas=[];save('ventas_ferreteria',[]);
 ventasRenderHistorial();ventasStats();showToast('Historial limpiado');
}
function confirmarVenta(){
 if(!carrito.length){showToast('El carrito está vacío',true);return;}
 const caja=load('caja_ferreteria');
 if(!caja||!caja.abierta){showToast('⚠ Abre la caja antes de vender',true);return;}
 const desc=parseFloat(document.getElementById('v-descuento').value)||0;
 const clamp=Math.min(100,Math.max(0,desc));
 const subtotal=carrito.reduce((s,i)=>s+i.precio*i.qty,0);
 const total=Math.round(subtotal*(1-clamp/100));
 const hora=now();
 // descontar stock
 carrito.forEach(item=>{const p=catalogo.find(c=>c.id===item.id);if(p)p.stock=Math.max(0,p.stock-item.qty);});
 save('catalogo_ferreteria',catalogo);
 // guardar venta
 const venta={hora,items:carrito.map(i=>({nombre:i.nombre,qty:i.qty,precio:i.precio,formato:i.formato})),subtotal,descuento:clamp,total};
 ventas.push(venta); save('ventas_ferreteria',ventas);
 // registrar en caja
 cajaRegistrarVenta(hora, `Venta – ${carrito.length} producto(s)`, total);
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
 showToast(`Caja abierta con ${fmt$(monto)} ✓`);
}

function cajaRegistrarVenta(hora, desc, monto){
 const state=cajaGetState();
 if(!state.abierta)return;
 state.movimientos.push({hora,tipo:'venta',descripcion:desc,monto});
 cajaSave(state);
 if(document.getElementById('panel-caja').classList.contains('active')) cajaRender();
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
 if(!confirm('¿Cerrar la caja y generar el resumen del día?'))return;
 // calcular totales
 const totalVentas=state.movimientos.filter(m=>m.tipo==='venta').reduce((s,m)=>s+m.monto,0);
 const totalEgresos=state.movimientos.filter(m=>m.tipo!=='venta').reduce((s,m)=>s+m.monto,0);
 const saldoFinal=state.montoInicial+totalVentas+totalEgresos;
 const horaCierre=now();
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
 cierres.push({fecha:state.fecha,horaApertura:state.horaApertura,horaCierre,responsable:state.responsable,montoInicial:state.montoInicial,totalVentas,totalEgresos,saldoFinal,movimientos:state.movimientos});
 save('cierres_ferreteria',cierres);
 // resetear caja
 cajaSave({abierta:false,fecha:'',horaApertura:'',montoInicial:0,responsable:'',movimientos:[]});
 cajaRender();
 showToast('Caja cerrada. Resumen descargado ✓');
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
 const precio=parseFloat(precioS);
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
 showToast(`"${nombre}" actualizado ✓`);
}

/* ══════════════════════════════════════════════
 MAIL
══════════════════════════════════════════════ */
function enviarPorMail(){
 if(!pedidos.length){showToast('No hay productos en el pedido para enviar.',true);return;}
 const fecha=new Date().toLocaleDateString('es-CL',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
 const total=pedidos.reduce((s,p)=>s+p.cantidad,0);
 const lineas=pedidos.map((p,i)=>`${String(i+1).padStart(2,' ')}. ${p.nombre.padEnd(35,' ')} | Cant: ${String(p.cantidad).padStart(4,' ')} | ${p.formato}`).join('\n');
 const contenido=`FERRETERÍA EL GREENGO\n${'='.repeat(50)}\nPedido del día: ${fecha}\n${'='.repeat(50)}\n\n${lineas}\n\n${'-'.repeat(50)}\nTotal de productos : ${pedidos.length}\nTotal de unidades : ${total}\n${'-'.repeat(50)}\n`;
 downloadTxt('Pedido_ElGreengo.txt',contenido);
 const asunto=encodeURIComponent(`Pedido Ferretería El Greengo – ${fecha}`);
 const cuerpo=encodeURIComponent(`Estimados,\n\nAdjunto el pedido del día ${fecha}.\n\nDetalle:\n${lineas}\n\nTotal de productos : ${pedidos.length}\nTotal de unidades : ${total}\n\nSaludos,\nFerretería El Greengo`);
 window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=ferreteria.elgreengo%40gmail.com&su=${asunto}&body=${cuerpo}`,'_blank');
 document.getElementById('mail-modal').classList.add('open');
}
function cerrarModalMail(){document.getElementById('mail-modal').classList.remove('open');}

/* ── Init ── */
(function(){
 document.getElementById('mail-modal').addEventListener('click',function(e){if(e.target===this)cerrarModalMail();});
 document.getElementById('edit-modal').addEventListener('click',function(e){if(e.target===this)catalogoCerrarEdicion();});

 // Scanner: Enter en el buscador de ventas → auto-agregar por código exacto
 document.getElementById('v-buscar').addEventListener('keydown',e=>{
  if(e.key==='Enter'){ e.preventDefault(); ventasScanCodigo('v-buscar'); }
 });
 // Scanner: Enter en el campo dedicado de scanner → auto-agregar
 document.getElementById('v-scanner').addEventListener('keydown',e=>{
  if(e.key==='Enter'){ e.preventDefault(); ventasScanCodigo('v-scanner'); }
 });

 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   if(document.getElementById('mail-modal').classList.contains('open')) cerrarModalMail();
   if(document.getElementById('edit-modal').classList.contains('open')) catalogoCerrarEdicion();
   return;
  }
  if(e.key!=='Enter')return;
  const active=document.querySelector('.tab-panel.active').id;
  if(active==='panel-pedidos' &&e.target.id!=='p-buscar') pedidoAgregar();
  if(active==='panel-catalogo' &&e.target.id!=='c-buscar') catalogoAgregar();
 });

 // Seed 100 productos de muestra (si catálogo vacío o solo tiene la muestra anterior ≤20)
 if(!catalogo.length || catalogo.length<=20){
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
 }

 pedidoRender();
 catalogoRender();
 ventasRenderGrid();
 ventasCheckCaja();
 ventasRenderHistorial();
 ventasStats();
 cajaRender();
})();