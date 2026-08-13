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

function catalogoAgregar(){
 const nombre=document.getElementById('c-nombre').value.trim();
 const precioS=document.getElementById('c-precio').value;
 const precio=parseFloat(precioS);
 const stockS=document.getElementById('c-stock').value;
 const stock=parseInt(stockS);
 const formato=document.getElementById('c-formato').value;
 if(!nombre){shake('c-nombre');return;}
 if(!precioS||isNaN(precio)||precio<0){shake('c-precio');return;}
 if(!stockS||isNaN(stock)||stock<0){shake('c-stock');return;}
 if(!formato){shake('c-formato');return;}
 catalogo.push({id:cNextId++,nombre,precio,stock,formato});
 save('catalogo_ferreteria',catalogo); catalogoRender();
 showToast(`"${nombre}" agregado al catálogo ✓`);
 document.getElementById('c-nombre').value='';
 document.getElementById('c-precio').value='';
 document.getElementById('c-stock').value='';
 document.getElementById('c-formato').value='';
 document.getElementById('c-nombre').focus();
}
function catalogoEliminar(id){ catalogo=catalogo.filter(c=>c.id!==id); save('catalogo_ferreteria',catalogo); catalogoRender(); showToast('Producto eliminado del catálogo'); }
function catalogoLimpiar(){ if(!catalogo.length)return; if(!confirm('¿Eliminar todos los productos del catálogo?'))return; catalogo=[];cNextId=1; save('catalogo_ferreteria',catalogo); catalogoRender(); showToast('Catálogo limpiado'); }
function catSort(col){ cSortAsc=cSortCol===col?!cSortAsc:true; cSortCol=col; catalogoRender(); }
function catalogoRender(){
 const q=document.getElementById('c-buscar').value.toLowerCase();
 const data=catalogo.filter(c=>c.nombre.toLowerCase().includes(q)||c.formato.toLowerCase().includes(q))
 .sort((a,b)=>{let va=a[cSortCol],vb=b[cSortCol];if(typeof va==='string'){va=va.toLowerCase();vb=vb.toLowerCase();}return cSortAsc?(va>vb?1:-1):(va<vb?1:-1);});
 document.querySelectorAll('#panel-catalogo thead th').forEach(th=>{
 th.classList.remove('sorted');
 const m=(th.getAttribute('onclick')||'').match(/catSort\('(.+?)'\)/);
 const col=m?m[1]:null;const arr=th.querySelector('.arrow');
 if(col===cSortCol){th.classList.add('sorted');if(arr)arr.textContent=cSortAsc?'↑':'↓';}else if(arr)arr.textContent='↕';
 });
 const tbody=document.getElementById('c-tbody');
 const empty=document.getElementById('c-empty');
 if(!data.length){tbody.innerHTML='';empty.style.display='block';}
 else{
 empty.style.display='none';
 tbody.innerHTML=data.map((c,i)=>`<tr>
 <td style="color:var(--muted);font-size:.76rem">${i+1}</td>
 <td><strong>${esc(c.nombre)}</strong></td>
 <td style="font-weight:700;color:var(--accent)">${fmt$(c.precio)}</td>
 <td><strong>${c.stock.toLocaleString('es-CL')}</strong>${c.stock===0?' <span style="color:var(--red);font-size:.7rem;font-weight:600;margin-left:4px">SIN STOCK</span>':''}</td>
 <td><span class="badge ${badgeCls(c.formato)}">${esc(c.formato)}</span></td>
 <td><button class="btn-del" onclick="catalogoEliminar(${c.id})">✕</button></td>
 </tr>`).join('');
 }
 document.getElementById('c-stat-prod').textContent=catalogo.length;
 document.getElementById('c-stat-stock').textContent=catalogo.reduce((s,c)=>s+c.stock,0).toLocaleString('es-CL');
}

/* ══════════════════════════════════════════════
 MÓDULO VENTAS (POS)
══════════════════════════════════════════════ */
let carrito = [];
let ventas = load('ventas_ferreteria') || [];

function ventasCheckCaja(){
 const caja=load('caja_ferreteria');
 const warn=document.getElementById('v-caja-warning');
 warn.style.display=(!caja||!caja.abierta)?'flex':'none';
}
function ventasRenderGrid(){
 const q=document.getElementById('v-buscar').value.toLowerCase();
 const data=catalogo.filter(c=>c.nombre.toLowerCase().includes(q)||c.formato.toLowerCase().includes(q));
 const grid=document.getElementById('v-prod-grid');
 const empty=document.getElementById('v-grid-empty');
 if(!catalogo.length){grid.innerHTML='';empty.style.display='block';return;}
 empty.style.display='none';
 grid.innerHTML=data.map(c=>`
 <div class="prod-card ${c.stock<=0?'disabled':''}" onclick="${c.stock>0?`carritoAgregar(${c.id})`:''}">
 <div class="prod-card-name">${esc(c.nombre)}</div>
 <div class="prod-card-price">${fmt$(c.precio)}</div>
 <div class="prod-card-stock">Stock: ${c.stock} ${esc(c.formato)}</div>
 <div class="prod-card-badge"><span class="badge ${badgeCls(c.formato)}">${esc(c.formato)}</span></div>
 </div>`).join('');
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
function cerrarModal(){document.getElementById('mail-modal').classList.remove('open');}

/* ── Init ── */
(function(){
 document.getElementById('mail-modal').addEventListener('click',function(e){if(e.target===this)cerrarModal();});

 document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  const active=document.querySelector('.tab-panel.active').id;
  if(active==='panel-pedidos' &&e.target.id!=='p-buscar') pedidoAgregar();
  if(active==='panel-catalogo' &&e.target.id!=='c-buscar') catalogoAgregar();
 });

 pedidoRender();
 catalogoRender();
 ventasRenderHistorial();
 ventasStats();
 cajaRender();
})();