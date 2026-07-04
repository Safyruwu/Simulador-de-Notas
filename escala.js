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

// Inyectar íconos en los botones
els.calcular.innerHTML = `${ICONS.check}<span>Calcular</span>`;
els.ordenarAsc.innerHTML = `${ICONS.sortUp}<span>Orden ascendente</span>`;
els.ordenarDesc.innerHTML = `${ICONS.sortDown}<span>Orden descendente</span>`;
els.exportarBtn.innerHTML = `${ICONS.download}<span>Exportar a Excel</span>`;
els.resetBtn.innerHTML = `${ICONS.trash}<span>Reiniciar valores</span>`;

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
    resultadoCard.hidden = false;
    resultadoCard.classList.remove("anim-card");
    tablaWrapper.innerHTML = `
      <div class="empty-state">
        ${ICONS.empty}
        <p>Presioná <strong>Calcular</strong> para generar la tabla de conversión a partir de tus parámetros.</p>
      </div>
    `;
    els.resumen.textContent = "";
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

  // Limpiamos el wrapper completo (puede haber loading-state, empty-state o tabla previa)
  tablaWrapper.innerHTML = "";
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
els.calcular.addEventListener("click", async () => {
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

  // Mostrar loading state
  const resultadoCard = document.getElementById("resultado-card");
  const tablaWrapper = resultadoCard.querySelector(".tabla-wrapper");
  resultadoCard.hidden = false;
  resultadoCard.classList.remove("anim-card");
  tablaWrapper.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Generando tabla...</span>
    </div>
  `;

  // Pequeño delay para que se vea el spinner (UX)
  await new Promise((r) => setTimeout(r, 200));

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

els.resetBtn.addEventListener("click", async () => {
  const ok = await confirmar({
    titulo: "¿Restablecer todos los parámetros?",
    mensaje: "Los campos volverán a sus valores predeterminados. La tabla calculada se borrará.",
    okTexto: "Sí, reiniciar",
    cancelTexto: "Cancelar",
    danger: true,
  });
  if (!ok) return;
  els.puntajeMax.value = "";
  els.exigencia.value = "";
  els.notaMin.value = "";
  els.notaMax.value = "";
  els.notaAprob.value = "";
  localStorage.removeItem(STORAGE_KEY);
  filas = [];
  orden = "asc";
  mostrarWarning([]);
  renderTabla();
  toast("Parámetros reiniciados", "success");
});

// Exporta la tabla actual a un archivo .xlsx real (Office Open XML).
// Usa SheetJS para generar un archivo que Excel, Google Sheets, WPS,
// y apps móviles (Excel mobile, Sheets Android) abren sin advertencias.
function exportarAExcel() {
  if (filas.length === 0) {
    toast("Primero calculá la escala antes de exportar.", "error", 3500);
    return;
  }

  const p = leerParametros();
  const datos = orden === "asc" ? [...filas] : [...filas].reverse();
  const notaAprobVal = Number.isFinite(p.notaAprob) ? p.notaAprob : 4.0;

  // Cabecera con los parámetros usados (primera fila de la hoja)
  const parametrosTxt =
    `Escala generada · Puntaje máx: ${formatear(p.puntajeMax)} · ` +
    `Exigencia: ${formatear(p.exigencia)}% · ` +
    `Notas: ${formatear(p.notaMin)} a ${formatear(p.notaMax)} · ` +
    `Aprobación: ${formatear(p.notaAprob)}`;

  // Construimos la hoja: cabecera + filas con puntaje y nota numérica
  const aoa = [
    [parametrosTxt],
    [],
    ["Puntaje", "Nota"],
    ...datos.map((f) => [Number(f.puntaje), Number(f.nota)]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge de la fila de cabecera para que ocupe las 2 columnas
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  // Ancho de columnas
  ws["!cols"] = [{ wch: 14 }, { wch: 14 }];

  // Estilos: negrita a los headers y colores a la nota según aprobado/reprobado
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let R = 2; R <= range.e.r; R++) {
    const nota = datos[R - 3]?.nota;
    const cellRef = XLSX.utils.encode_cell({ r: R, c: 1 });
    if (ws[cellRef] && Number.isFinite(nota)) {
      const esAprob = nota >= notaAprobVal;
      ws[cellRef].s = {
        font: {
          bold: true,
          color: { rgb: esAprob ? "FF2D5F2D" : "FF8B2E2E" },
        },
      };
    }
  }
  // Estilo al header de columnas
  if (ws["A3"]) ws["A3"].s = { font: { bold: true } };
  if (ws["B3"]) ws["B3"].s = { font: { bold: true } };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Escala");

  // Generar el .xlsx como binario y descargarlo
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `escala-notas-${fecha}.xlsx`);
  toast("Archivo exportado correctamente", "success");
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
renderTabla();

// Atajo: Ctrl/Cmd + Enter para calcular desde cualquier input
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    els.calcular.click();
  }
  if (e.key === "Escape" && !e.target.matches("input, button, textarea, select")) {
    window.location.href = "index.html";
  }
});
