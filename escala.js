// Escala de Notas — lógica
// Genera una tabla de conversión puntaje ↔ nota, distribución lineal.
//
// Entradas:
//   - puntajeMax: puntaje máximo del examen
//   - exigencia:  porcentaje de exigencia (puntaje mínimo para aprobar)
//   - notaMin:    nota más baja posible
//   - notaMax:    nota más alta posible
//   - notaAprob:  nota a la que equivale el puntaje de exigencia
//
// Modelo lineal:
//   - nota = notaMin   cuando puntaje = 0
//   - nota = notaAprob  cuando puntaje = puntajeMax * exigencia/100
//   - nota = notaMax   cuando puntaje = puntajeMax
//   Entre esos tramos se interpola linealmente.

const els = {
  puntajeMax: document.getElementById("puntaje-max"),
  exigencia: document.getElementById("exigencia"),
  notaMin: document.getElementById("nota-min"),
  notaMax: document.getElementById("nota-max"),
  notaAprob: document.getElementById("nota-aprob"),
  calcular: document.getElementById("calcular-btn"),
  ordenarAsc: document.getElementById("ordenar-asc"),
  ordenarDesc: document.getElementById("ordenar-desc"),
  warning: document.getElementById("param-warning"),
  resultadoCard: document.getElementById("resultado-card"),
  resumen: document.getElementById("resumen"),
  resetBtn: document.getElementById("reset-btn"),
  exportarBtn: document.getElementById("exportar-btn"),
};

let filas = []; // [{ puntaje, nota }]
let orden = "asc"; // "asc" o "desc"

// Valores por defecto (coinciden con los placeholders del HTML).
const DEFAULTS = {
  puntajeMax: 100,
  exigencia: 60,
  notaMin: 1.0,
  notaMax: 7.0,
  notaAprob: 4.0,
};

// Rellena los inputs vacíos con los valores por defecto, reflejándolos en pantalla.
function aplicarDefaultsSiVacio() {
  if (els.puntajeMax.value === "") els.puntajeMax.value = DEFAULTS.puntajeMax;
  if (els.exigencia.value === "") els.exigencia.value = DEFAULTS.exigencia;
  if (els.notaMin.value === "") els.notaMin.value = DEFAULTS.notaMin;
  if (els.notaMax.value === "") els.notaMax.value = DEFAULTS.notaMax;
  if (els.notaAprob.value === "") els.notaAprob.value = DEFAULTS.notaAprob;
}

function leerParametros() {
  return {
    puntajeMax: parseFloat(els.puntajeMax.value),
    exigencia: parseFloat(els.exigencia.value),
    notaMin: parseFloat(els.notaMin.value),
    notaMax: parseFloat(els.notaMax.value),
    notaAprob: parseFloat(els.notaAprob.value),
  };
}

function validar(p) {
  const problemas = [];
  if (!Number.isFinite(p.puntajeMax) || p.puntajeMax <= 0) {
    problemas.push("Puntaje máximo debe ser un número mayor a 0.");
  }
  if (!Number.isFinite(p.exigencia) || p.exigencia < 0 || p.exigencia > 100) {
    problemas.push("Porcentaje de exigencia debe estar entre 0 y 100.");
  }
  if (!Number.isFinite(p.notaMin)) problemas.push("Nota mínima es obligatoria.");
  if (!Number.isFinite(p.notaMax)) problemas.push("Nota máxima es obligatoria.");
  if (Number.isFinite(p.notaMin) && Number.isFinite(p.notaMax) && p.notaMax <= p.notaMin) {
    problemas.push("Nota máxima debe ser mayor que nota mínima.");
  }
  if (
    Number.isFinite(p.notaMin) &&
    Number.isFinite(p.notaMax) &&
    Number.isFinite(p.notaAprob) &&
    (p.notaAprob < p.notaMin || p.notaAprob > p.notaMax)
  ) {
    problemas.push("Nota de aprobación debe estar entre nota mínima y nota máxima.");
  }
  return problemas;
}

// Devuelve la nota correspondiente a un puntaje dado (modelo lineal por tramos)
function puntajeANota(puntaje, p) {
  const xExigencia = (p.exigencia / 100) * p.puntajeMax;
  if (puntaje <= 0) return p.notaMin;
  if (puntaje >= p.puntajeMax) return p.notaMax;
  if (puntaje <= xExigencia) {
    // Tramo bajo: de (0, notaMin) a (xExigencia, notaAprob)
    const t = puntaje / xExigencia;
    return p.notaMin + t * (p.notaAprob - p.notaMin);
  } else {
    // Tramo alto: de (xExigencia, notaAprob) a (puntajeMax, notaMax)
    const t = (puntaje - xExigencia) / (p.puntajeMax - xExigencia);
    return p.notaAprob + t * (p.notaMax - p.notaAprob);
  }
}

// Genera la lista de filas para la tabla
// Un punto por cada entero entre 0 y puntajeMax (más 0 y puntajeMax como anclas).
// Así el usuario puede consultar cualquier puntaje, no solo los "saltos limpios".
function generarFilas(p) {
  const filasGeneradas = [];
  const xExigencia = (p.exigencia / 100) * p.puntajeMax;

  const maxEntero = Math.round(p.puntajeMax);
  const puntos = new Set();
  for (let v = 0; v <= maxEntero; v++) {
    puntos.add(v);
  }
  // Asegurar las anclas aunque puntajeMax no sea entero
  puntos.add(0);
  puntos.add(Math.round(xExigencia * 100) / 100);
  puntos.add(Math.round(p.puntajeMax * 100) / 100);

  for (const pt of [...puntos].sort((a, b) => a - b)) {
    if (pt < 0 || pt > p.puntajeMax + 0.0001) continue;
    const nota = puntajeANota(pt, p);
    filasGeneradas.push({
      puntaje: Math.round(pt * 100) / 100,
      nota: Math.round(nota * 100) / 100,
    });
  }
  return filasGeneradas;
}

function renderTabla() {
  const p = leerParametros();
  const resultadoCard = document.getElementById("resultado-card");
  const tablaWrapper = resultadoCard.querySelector(".tabla-wrapper");

  if (filas.length === 0) {
    resultadoCard.hidden = true;
    // Limpiamos el wrapper por si quedó contenido de un cálculo anterior
    const old = tablaWrapper.querySelector(".tabla-grid");
    if (old) old.remove();
    return;
  }

  const datos = orden === "asc" ? [...filas] : [...filas].reverse();
  const notaAprobVal = Number.isFinite(p.notaAprob) ? p.notaAprob : Infinity;

  // Dividir las filas en 3 columnas por rangos contiguos:
  // columna 1 = primeras N filas, columna 2 = siguientes N, columna 3 = el resto.
  // Así cada columna muestra un rango continuo de puntajes, no entreverado.
  const numCols = 3;
  const tamCol = Math.ceil(datos.length / numCols);
  const columnas = [];
  for (let c = 0; c < numCols; c++) {
    columnas.push(datos.slice(c * tamCol, (c + 1) * tamCol));
  }

  // Una <table> por columna, todas dentro de un grid CSS.
  const wrapper = document.createElement("div");
  wrapper.className = "tabla-grid";

  columnas.forEach((colFilas) => {
    if (colFilas.length === 0) return;
    const tablaCol = document.createElement("table");
    tablaCol.className = "tabla-col";
    tablaCol.innerHTML = `
      <thead>
        <tr><th>Puntaje</th><th>Nota</th></tr>
      </thead>
      <tbody>
        ${colFilas
          .map(
            (f, i) => `
          <tr class="anim-row" style="animation-delay: ${Math.min(i * 0.008, 0.4)}s">
            <td>${formatear(f.puntaje)}</td>
            <td class="${f.nota >= notaAprobVal ? "nota-aprob" : "nota-reprob"}">${formatear(f.nota)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    `;
    wrapper.appendChild(tablaCol);
  });

  // Limpiamos el wrapper viejo si existe y montamos el nuevo
  const oldWrapper = tablaWrapper.querySelector(".tabla-grid");
  if (oldWrapper) oldWrapper.remove();
  tablaWrapper.appendChild(wrapper);

  resultadoCard.hidden = false;
  // Animar la card de resultados la primera vez que aparece en este cálculo.
  // Como renderTabla corre en Calcular y en Ordenar, solo animamos en Calcular.
  resultadoCard.classList.remove("anim-card");
  void resultadoCard.offsetWidth;
  resultadoCard.classList.add("anim-card");
  const cantAprob = filas.filter((f) => f.nota >= notaAprobVal).length;
  els.resumen.textContent = `${filas.length} filas generadas · ${cantAprob} en rango de aprobación`;
}

function formatear(n) {
  // Forzar coma como separador decimal y punto como separador de miles
  // (no dependemos del locale del navegador, que a veces usa punto).
  // Siempre al menos 1 decimal (4 → "4,0"), hasta 2.
  const valor = Number(n.toFixed(2));
  const partes = valor.toString().split(".");
  const entero = partes[0];
  const decimales = partes[1] ?? "";
  // Agrupar miles en el entero
  const enteroConMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalesFinales = (decimales + "0").slice(0, 2); // asegura al menos 1 decimal
  return `${enteroConMiles},${decimalesFinales}`;
}

function mostrarWarning(msgs) {
  if (msgs.length === 0) {
    els.warning.textContent = "";
    els.warning.style.display = "none";
    els.warning.classList.remove("anim-shake");
    return;
  }
  els.warning.textContent = msgs.join(" ");
  els.warning.style.display = "block";
  // Shake para llamar la atención
  els.warning.classList.remove("anim-shake");
  void els.warning.offsetWidth;
  els.warning.classList.add("anim-shake");
}

// Eventos
els.calcular.addEventListener("click", () => {
  aplicarDefaultsSiVacio();
  const p = leerParametros();
  const problemas = validar(p);
  if (problemas.length > 0) {
    mostrarWarning(problemas);
    filas = [];
    renderTabla();
    return;
  }
  mostrarWarning([]);
  filas = generarFilas(p);
  orden = "asc";
  renderTabla();
});

els.ordenarAsc.addEventListener("click", () => {
  orden = "asc";
  renderTabla();
});

els.ordenarDesc.addEventListener("click", () => {
  orden = "desc";
  renderTabla();
});

els.resetBtn.addEventListener("click", () => {
  if (!confirm("¿Restablecer todos los parámetros a sus valores por defecto?")) return;
  // Vaciar inputs (los placeholders del HTML definen los valores por defecto)
  els.puntajeMax.value = "";
  els.exigencia.value = "";
  els.notaMin.value = "";
  els.notaMax.value = "";
  els.notaAprob.value = "";
  // Limpiar estado derivado y persistencia
  localStorage.removeItem(STORAGE_KEY);
  filas = [];
  orden = "asc";
  mostrarWarning([]);
  renderTabla();
});

// Exporta la tabla actual a un archivo .xls (formato XML que Excel abre nativamente).
// Sin librerías externas: generamos HTML con estilo y lo servimos como .xls.
function exportarAExcel() {
  if (filas.length === 0) {
    alert("Primero calculá la escala antes de exportar.");
    return;
  }

  const p = leerParametros();
  const datos = orden === "asc" ? [...filas] : [...filas].reverse();
  const notaAprobVal = Number.isFinite(p.notaAprob) ? p.notaAprob : 4.0;

  // Construimos las filas como HTML
  const filasHtml = datos
    .map(
      (f) =>
        `<tr><td>${formatear(f.puntaje)}</td>` +
        `<td style="color:${f.nota >= notaAprobVal ? '#2D5F2D' : '#8B2E2E'};font-weight:bold">${formatear(f.nota)}</td></tr>`
    )
    .join("");

  // Cabecera con los parámetros usados
  const parametrosTxt =
    `Escala generada · Puntaje máx: ${formatear(p.puntajeMax)} · ` +
    `Exigencia: ${formatear(p.exigencia)}% · ` +
    `Notas: ${formatear(p.notaMin)} a ${formatear(p.notaMax)} · ` +
    `Aprobación: ${formatear(p.notaAprob)}`;

  // Plantilla HTML/XML que Excel interpreta como libro
  const contenido = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8" />
  <title>Escala de Notas</title>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Escala</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <style>
    body { font-family: Calibri, Arial, sans-serif; }
    table { border-collapse: collapse; }
    th, td { border: 1px solid #999; padding: 6px 12px; text-align: center; }
    th { background: #DCCEB4; font-weight: bold; }
    caption { padding: 8px; font-style: italic; color: #555; caption-side: top; }
  </style>
</head>
<body>
  <table>
    <caption>${parametrosTxt}</caption>
    <thead>
      <tr><th>Puntaje</th><th>Nota</th></tr>
    </thead>
    <tbody>
      ${filasHtml}
    </tbody>
  </table>
</body>
</html>`;

  // BOM para que Excel reconozca UTF-8 correctamente (tildes, comas, etc.)
  const blob = new Blob(["﻿" + contenido], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fecha = new Date().toISOString().slice(0, 10);
  a.download = `escala-notas-${fecha}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

els.exportarBtn.addEventListener("click", exportarAExcel);

// Persistir parámetros en localStorage
const STORAGE_KEY = "escala-notas:parametros";
function guardarParametros() {
  const p = leerParametros();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
function cargarParametros() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (Number.isFinite(p.puntajeMax)) els.puntajeMax.value = p.puntajeMax;
    if (Number.isFinite(p.exigencia)) els.exigencia.value = p.exigencia;
    if (Number.isFinite(p.notaMin)) els.notaMin.value = p.notaMin;
    if (Number.isFinite(p.notaMax)) els.notaMax.value = p.notaMax;
    if (Number.isFinite(p.notaAprob)) els.notaAprob.value = p.notaAprob;
  } catch {
    /* noop */
  }
}

[els.puntajeMax, els.exigencia, els.notaMin, els.notaMax, els.notaAprob].forEach((el) => {
  el.addEventListener("change", guardarParametros);
});

cargarParametros();
