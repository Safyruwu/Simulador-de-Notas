// Calculadora de Notas — lógica
// Cada evaluación: { id, nota, porcentaje }
// Promedio ponderado: Σ(nota * porcentaje) / Σ(porcentaje)
// Regla: la suma de porcentajes no puede superar 100%.
// Si se llegara a 100% con los actuales, los inputs restantes quedan deshabilitados.

const STORAGE_KEY = "calculadora-notas:evaluaciones";
const MAX_TOTAL = 100;

const listEl = document.getElementById("evaluations-list");
const addBtn = document.getElementById("add-btn");
const resetBtn = document.getElementById("reset-btn");
const resultEl = document.getElementById("result");
const weightsSumEl = document.getElementById("weights-sum");
const weightsWarningEl = document.getElementById("weights-warning");

let evaluaciones = loadEvaluaciones();
if (evaluaciones.length === 0) {
  evaluaciones = [
    { id: uid(), nota: "", porcentaje: "" },
  ];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadEvaluaciones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // Compatibilidad: aceptar "peso" como "porcentaje"
    return data.map((e) => ({
      id: e.id,
      nota: e.nota ?? "",
      porcentaje: e.porcentaje ?? e.peso ?? "",
    }));
  } catch {
    return [];
  }
}

function saveEvaluaciones() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluaciones));
}

function sumaPorcentajesActual() {
  return evaluaciones.reduce((acc, e) => {
    const p = parseFloat(e.porcentaje);
    return acc + (Number.isFinite(p) ? p : 0);
  }, 0);
}

// Crea las filas desde cero. Se usa solo al agregar/eliminar o al cargar.
function render() {
  // Guardamos cuántas filas había antes para saber si agregar/eliminar
  const filasAntes = listEl.querySelectorAll(".evaluation-row").length;
  const cantidadNueva = evaluaciones.length;

  listEl.innerHTML = "";

  const sumaActual = sumaPorcentajesActual();
  const topeAlcanzado = sumaActual >= MAX_TOTAL - 0.0001;

  evaluaciones.forEach((ev, idx) => {
    const row = document.createElement("div");
    row.className = "evaluation-row";
    // Si se acaba de agregar una fila, animar solo la última
    if (cantidadNueva > filasAntes && idx === cantidadNueva - 1) {
      row.classList.add("anim-row");
    }
    const pctActual = parseFloat(ev.porcentaje);
    const inputBloqueado = !Number.isFinite(pctActual) && topeAlcanzado;

    row.innerHTML = `
      <input type="number" step="any" placeholder="0" value="${ev.nota}" data-id="${ev.id}" data-field="nota" />
      <input type="number" step="any" placeholder="0" value="${ev.porcentaje}" data-id="${ev.id}" data-field="porcentaje" ${inputBloqueado ? "disabled" : ""} />
      <button type="button" class="remove-btn" data-id="${ev.id}" aria-label="Eliminar">×</button>
    `;
    listEl.appendChild(row);
  });

  recalcular(true);
}

// Solo actualiza el estado de los inputs (disabled) y los textos de la UI.
// NO recrea los inputs, así no se pierde el foco mientras el usuario escribe.
function actualizarUI() {
  const sumaActual = sumaPorcentajesActual();
  const topeAlcanzado = sumaActual >= MAX_TOTAL - 0.0001;

  // Actualizar estado de los inputs de porcentaje según el tope
  const inputsPorcentaje = listEl.querySelectorAll('input[data-field="porcentaje"]');
  inputsPorcentaje.forEach((input) => {
    const id = input.dataset.id;
    const ev = evaluaciones.find((x) => x.id === id);
    if (!ev) return;
    const pctActual = parseFloat(ev.porcentaje);
    const debeBloquearse = !Number.isFinite(pctActual) && topeAlcanzado;
    input.disabled = debeBloquearse;
  });

  recalcular(false);
}

let promedioAnterior = null;

function recalcular(animarResultado = false) {
  const validas = evaluaciones
    .map((e) => ({
      nota: parseFloat(e.nota),
      porcentaje: parseFloat(e.porcentaje),
    }))
    .filter((e) => Number.isFinite(e.nota) && Number.isFinite(e.porcentaje));

  const sumaPorcentajes = validas.reduce((acc, e) => acc + e.porcentaje, 0);
  weightsSumEl.textContent = `${sumaPorcentajes.toFixed(2)}%`;

  if (sumaPorcentajes === 0 || validas.length === 0) {
    weightsWarningEl.textContent = "";
    weightsWarningEl.classList.remove("anim-shake");
    resultEl.textContent = "—";
    promedioAnterior = null;
    return;
  }

  const hayDesbalance = Math.abs(sumaPorcentajes - 100) > 0.01;
  const nuevoWarning = hayDesbalance
    ? `Los porcentajes suman ${sumaPorcentajes.toFixed(2)}%.`
    : "";

  // Shake del warning solo cuando aparece o cambia de contenido
  if (nuevoWarning && nuevoWarning !== weightsWarningEl.textContent) {
    weightsWarningEl.textContent = nuevoWarning;
    weightsWarningEl.classList.remove("anim-shake");
    // Forzar reflow para reiniciar la animación
    void weightsWarningEl.offsetWidth;
    weightsWarningEl.classList.add("anim-shake");
  } else if (!nuevoWarning) {
    weightsWarningEl.textContent = "";
    weightsWarningEl.classList.remove("anim-shake");
  }

  const sumaPonderada = validas.reduce((acc, e) => acc + e.nota * e.porcentaje, 0);
  const promedio = sumaPonderada / sumaPorcentajes;
  const promedioStr = promedio.toFixed(2);

  // Animar resultado cuando cambia
  if (animarResultado && promedioAnterior !== null && promedioAnterior !== promedioStr) {
    resultEl.classList.remove("anim-result");
    void resultEl.offsetWidth;
    resultEl.classList.add("anim-result");
  }

  resultEl.textContent = promedioStr;
  promedioAnterior = promedioStr;
}

// Eventos
addBtn.addEventListener("click", () => {
  if (sumaPorcentajesActual() >= MAX_TOTAL - 0.0001) {
    alert("Ya se alcanzó el 100% en los porcentajes. No se pueden agregar más evaluaciones.");
    return;
  }
  evaluaciones.push({ id: uid(), nota: "", porcentaje: "" });
  saveEvaluaciones();
  render();
});

resetBtn.addEventListener("click", () => {
  if (!confirm("¿Borrar todas las evaluaciones?")) return;
  evaluaciones = [];
  localStorage.removeItem(STORAGE_KEY);
  evaluaciones.push({ id: uid(), nota: "", porcentaje: "" });
  saveEvaluaciones();
  render();
});

listEl.addEventListener("input", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;

  const id = target.dataset.id;
  const field = target.dataset.field;
  if (!id || !field) return;

  const ev = evaluaciones.find((x) => x.id === id);
  if (!ev) return;

  if (field === "porcentaje") {
    const nuevo = parseFloat(target.value);
    if (Number.isFinite(nuevo)) {
      // Calcular cuánto suma SIN contar el valor actual de este input
      const sumaOtros = evaluaciones.reduce((acc, x) => {
        if (x.id === id) return acc;
        const p = parseFloat(x.porcentaje);
        return acc + (Number.isFinite(p) ? p : 0);
      }, 0);
      if (sumaOtros + nuevo > MAX_TOTAL + 0.0001) {
        // No aceptar el cambio: revertir el valor en pantalla
        target.value = ev.porcentaje ?? "";
        return;
      }
    }
  }

  ev[field] = target.value;
  saveEvaluaciones();
  // No re-renderizamos para no perder el foco. Solo refrescar estado y cálculo.
  actualizarUI();
});

// Bloquear teclas no numéricas (permite dígitos, punto/coma, Backspace, Delete, flechas, tab, etc.)
listEl.addEventListener("keydown", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.type !== "number") return;

  // Permitir siempre: teclas de control y edición
  if (
    e.ctrlKey || e.metaKey || e.altKey ||
    ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter"].includes(e.key)
  ) {
    return;
  }

  // Permitir un único separador decimal (punto o coma)
  if ((e.key === "." || e.key === ",") && !target.value.includes(".") && !target.value.includes(",")) {
    return;
  }

  // Permitir dígitos 0-9
  if (/^[0-9]$/.test(e.key)) return;

  // Cualquier otra cosa: bloquear
  e.preventDefault();
});

// Limpiar lo pegado: dejar solo números y separador decimal
listEl.addEventListener("paste", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.type !== "number") return;

  e.preventDefault();
  const texto = (e.clipboardData || window.clipboardData).getData("text");
  // Quedarse solo con dígitos y el primer separador (punto o coma)
  const limpio = texto
    .replace(/[^0-9.,]/g, "")
    .replace(/([.,]).*([.,])/g, "$1"); // deja solo el primer separador
  target.value = limpio;
  target.dispatchEvent(new Event("input", { bubbles: true }));
});

listEl.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.classList.contains("remove-btn")) return;

  const id = target.dataset.id;
  evaluaciones = evaluaciones.filter((x) => x.id !== id);
  if (evaluaciones.length === 0) {
    evaluaciones.push({ id: uid(), nota: "", porcentaje: "" });
  }
  saveEvaluaciones();
  render();
});

// Inicial
render();
