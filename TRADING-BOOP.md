# Trading-Boop 🦈

> Skill de análisis técnico con enfoque SMC/ICT — creado para Sebastian.

---

## 📋 Ficha del Skill

| Campo | Valor |
|---|---|
| **Nombre** | Trading-Boop |
| **Estado** | ⏸️ PAUSADO — definición en progreso |
| **Idioma** | Español |
| **Propósito** | Análisis de estructura de mercado, Order Blocks, FVG, liquidez, killzones, price action, risk management |
| **Tipo** | Educativo/analítico (no ejecuta trades) |
| **Interfaz** | Pregunta + respuesta (sin web propia, puede usar diagram-maker y canvas) |
| **Creador** | Sebastian + Boop |

---

## ✅ Lo definido

- Nombre: **Trading-Boop**
- Enfoque: **SMC / ICT** (Smart Money Concepts, Inner Circle Trader)
- Análisis de: estructura de mercado, OBs, FVGs, liquidez, killzones, price action
- Risk management: position sizing, stop loss estructural, R/R
- Multi-activo: cripto, forex, stocks, índices, commodities
- Multi-timeframe: alineación de mayor a menor
- **No ejecuta trades** — bajo ninguna circunstancia
- **No se conecta a brokers** — a menos que Sebastian lo configure explícitamente después
- **No da órdenes directas** — solo análisis y sugerencias condicionales
- **Risk management siempre primero**
- Output visualizable con diagram-maker (SVG) y canvas

---

## ❌ Lo pendiente por definir

- [ ] **Fuentes de datos** — Binance API, Yahoo Finance, CoinGecko (definir)
- [ ] **Watchlist / instrumentos favoritos** — BTC/USDT, ETH/USDT, EUR/USD, S&P 500, DXY, etc.
- [ ] **Formato de output** — texto estructurado, tablas, diagramas, resumen ejecutivo
- [ ] **Config inicial** — tamaño de cuenta default, riesgo % por trade, timeframes preferidos
- [ ] **APIs / Keys** — qué APIs usar y si requiere keys (Binance pública vs con key, etc.)
- [ ] **Journal automático de trades** — registrar trades en ~/trading/journal.md
- [ ] **Escribir SKILL.md** + archivos de referencia (references/)
- [ ] **Publicar via Skill Workshop**

---

## 🗂️ Archivos planeados

```
trading-boop/
├── SKILL.md          ← Instrucciones principales del skill
├── references/
│   ├── smc.md        ← Conceptos SMC/ICT (OB, FVG, liquidez, ChoCH, MSS)
│   ├── killzones.md  ← Horarios y killzones (London, NY, Asian)
│   ├── patterns.md   ← Patrones de velas y price action
│   └── risk.md       ← Position sizing, R/R, gestión de riesgo
├── scripts/
│   └── position-size.sh  ← Calculadora de position sizing (opcional)
```

---

## 🔙 Trigger de retorno

Cuando Sebastian diga **"Trading-Boop"** en cualquier sesión futura, debo darle un resumen específico de lo conversado: definiciones, estado actual, puntos pendientes, y ofrecer retomar donde quedó.

---

*Última actualización: 2026-08-04*