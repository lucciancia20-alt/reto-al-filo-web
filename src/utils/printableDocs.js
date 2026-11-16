import { RACE_CONFIG, parseTargetDateParts, resolveRunnerCategory } from '../data/raceConfig';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fieldValueOrLine(value, fallbackDots = '..............................................................') {
  const clean = String(value ?? '').trim();
  return clean ? `<strong>${escapeHtml(clean)}</strong>` : fallbackDots;
}

function openPrintableHtmlWindow(title, bodyHtml, { landscape = false, autoPrint = true } = {}) {
  const pageSize = landscape ? 'A4 landscape' : 'A4 portrait';
  const pageMargin = landscape ? '9mm 10mm' : '12mm 14mm';
  const sheetMaxWidth = landscape ? '297mm' : '210mm';
  const sheetMinHeight = landscape ? '190mm' : '272mm';
  const sheetPadding = landscape ? '8mm 10mm' : '12mm 14mm';

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page {
        size: ${pageSize};
        margin: ${pageMargin};
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        color: #111827;
        background: #e5e7eb;
        line-height: 1.42;
        font-size: 11.5px;
      }
      .no-print {
        position: sticky;
        top: 0;
        z-index: 10;
        background: #18181b;
        color: #f4f4f5;
        padding: 10px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 2px solid #f97316;
      }
      .no-print-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .btn-print {
        background: #f59e0b;
        color: #111827;
        border: none;
        border-radius: 8px;
        padding: 8px 14px;
        font-weight: 800;
        font-size: 12px;
        text-transform: uppercase;
        cursor: pointer;
      }
      .btn-close {
        background: #27272a;
        color: #e4e4e7;
        border: 1px solid #3f3f46;
        border-radius: 8px;
        padding: 8px 12px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
      }
      .sheet {
        max-width: ${sheetMaxWidth};
        min-height: ${sheetMinHeight};
        margin: 14px auto;
        background: #ffffff;
        padding: ${sheetPadding};
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
      }
      .sos-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        font-size: 9.8px;
      }
      .sos-table thead {
        display: table-header-group;
      }
      .sos-table th {
        background: #18181b;
        color: #ffffff;
        text-align: left;
        padding: 5px 6px;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 8.8px;
        letter-spacing: 0.04em;
        border: 1px solid #27272a;
      }
      .sos-table td {
        padding: 5px 6px;
        border: 1px solid #d1d5db;
        vertical-align: top;
      }
      .sos-table tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .sos-table tbody tr:nth-child(even) {
        background: #f9fafb;
      }
      .bib-cell {
        font-weight: 900;
        font-size: 12.5px;
        color: #c2410c;
        white-space: nowrap;
        text-align: center;
      }
      .blood-pill {
        display: inline-block;
        padding: 1px 5px;
        border-radius: 4px;
        background: #fee2e2;
        border: 1px solid #fca5a5;
        color: #991b1b;
        font-weight: 800;
        font-size: 9.5px;
      }
      .chk-row {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 3px;
        font-size: 8.8px;
      }
      .chk-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 11px;
        height: 11px;
        border: 1.2px solid #374151;
        border-radius: 2px;
        font-weight: 900;
        font-size: 8.5px;
      }
      .doc-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        border-bottom: 2.5px solid #ea580c;
        padding-bottom: 8px;
        margin-bottom: 12px;
      }
      .brand-kicker {
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #ea580c;
        margin: 0 0 2px;
      }
      .doc-title {
        font-size: 17px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: -0.01em;
        margin: 0;
        color: #09090b;
      }
      .doc-subtitle {
        font-size: 10.5px;
        color: #4b5563;
        margin: 2px 0 0;
      }
      .badge-box {
        border: 1.5px solid #111827;
        border-radius: 6px;
        padding: 5px 10px;
        text-align: right;
        font-size: 10px;
        white-space: nowrap;
      }
      .section-title {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        background: #f3f4f6;
        border-left: 3.5px solid #ea580c;
        padding: 4px 8px;
        margin: 10px 0 7px;
        color: #111827;
      }
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px 14px;
      }
      .field-row {
        font-size: 11px;
        padding: 2px 0;
        border-bottom: 1px dotted #d1d5db;
      }
      .field-row-edit {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: 11px;
        padding: 2px 0;
      }
      .field-label {
        color: #4b5563;
        font-weight: 600;
        white-space: nowrap;
      }
      .doc-input {
        font-family: inherit;
        font-size: inherit;
        font-weight: 700;
        color: #111827;
        background: rgba(249, 115, 22, 0.06);
        border: none;
        border-bottom: 1px dotted #9ca3af;
        border-radius: 3px 3px 0 0;
        padding: 1px 4px;
        margin: 0;
        outline: none;
        transition: background 0.15s, border-color 0.15s;
      }
      .doc-input:hover,
      .doc-input:focus {
        background: rgba(249, 115, 22, 0.14);
        border-bottom-color: #ea580c;
      }
      .doc-input-full {
        flex: 1;
        min-width: 70px;
        width: 100%;
      }
      .doc-input-inline {
        display: inline-block;
      }
      .doc-textarea {
        font-family: inherit;
        font-size: inherit;
        font-weight: 600;
        color: #111827;
        background: rgba(249, 115, 22, 0.06);
        border: 1px dotted #9ca3af;
        border-radius: 4px;
        padding: 2px 6px;
        width: 100%;
        min-height: 22px;
        resize: vertical;
        outline: none;
        line-height: 1.35;
      }
      .doc-textarea:hover,
      .doc-textarea:focus {
        background: rgba(249, 115, 22, 0.14);
        border-color: #ea580c;
      }
      .chk-label {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        cursor: pointer;
        font-weight: 700;
      }
      .chk-input {
        accent-color: #ea580c;
        width: 12px;
        height: 12px;
        margin: 0;
        cursor: pointer;
      }
      .clauses {
        margin: 6px 0 10px;
        padding-left: 16px;
      }
      .clauses li {
        margin-bottom: 5px;
        text-align: justify;
        font-size: 10.7px;
      }
      .med-box {
        border: 1.5px solid #1f2937;
        border-radius: 8px;
        padding: 12px 14px;
        margin-top: 8px;
        background: #fafafa;
      }
      .med-text {
        font-size: 11.5px;
        line-height: 1.65;
        text-align: justify;
        margin: 0 0 12px;
      }
      .note-box {
        border: 1px dashed #ea580c;
        background: #fff7ed;
        border-radius: 6px;
        padding: 7px 10px;
        font-size: 10.2px;
        color: #7c2d12;
        margin-top: 8px;
      }
      .signatures {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 22px;
      }
      .sig-block {
        text-align: center;
      }
      .sig-line {
        border-top: 1px solid #111827;
        margin-top: 30px;
        padding-top: 4px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .sig-sub {
        font-size: 9.5px;
        color: #4b5563;
        margin-top: 2px;
      }
      .footer-meta {
        margin-top: 14px;
        padding-top: 6px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        font-size: 9.5px;
        color: #6b7280;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .no-print {
          display: none !important;
        }
        .sheet {
          max-width: none;
          min-height: auto;
          margin: 0;
          padding: 0;
          box-shadow: none;
        }
        .doc-input,
        .doc-textarea {
          background: transparent !important;
          border-color: #9ca3af !important;
          padding-left: 1px;
          padding-right: 1px;
        }
        .doc-textarea {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-radius: 0 !important;
          resize: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="no-print">
      <div style="font-size: 12px;">
        <strong>${escapeHtml(title)}</strong> · <span style="color: #fdba74;">Hacé clic sobre las líneas para completar tus datos antes de imprimir o guardar PDF</span>
      </div>
      <div class="no-print-actions">
        <button type="button" class="btn-print" onclick="window.print()">Imprimir / Guardar PDF (A4)</button>
        <button type="button" class="btn-close" onclick="window.close()">Cerrar</button>
      </div>
    </div>
    <main class="sheet">
      ${bodyHtml}
    </main>
    ${autoPrint ? `<script>
      window.addEventListener('load', function () {
        setTimeout(function () {
          try { window.print(); } catch (e) {}
        }, 220);
      });
    </script>` : ''}
  </body>
</html>`;

  const popup = typeof window !== 'undefined' ? window.open('', '_blank', 'width=900,height=750') : null;
  if (popup) {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus?.();
    return true;
  }

  // Fallback si el navegador bloquea ventanas emergentes: usar iframe oculto en la misma pestaña
  if (typeof document !== 'undefined') {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => iframe.remove(), 4000);
        }
      }, 260);
      return true;
    }
    iframe.remove();
  }

  return false;
}

function buildEventMeta(raceConfig) {
  const cfg = raceConfig || RACE_CONFIG;
  const dateParts = parseTargetDateParts(cfg.targetDateIso);
  return {
    raceTitle: cfg.title || RACE_CONFIG.title,
    raceSubtitle: cfg.subtitle || RACE_CONFIG.subtitle,
    locationName: cfg.locationName || RACE_CONFIG.locationName,
    eventDate: dateParts.formattedFullDate,
    whatsappNumber: cfg.whatsappNumber || RACE_CONFIG.whatsappNumber,
  };
}

/**
 * Abre una vista A4 imprimible / guardable como PDF del Deslinde de Responsabilidad oficial.
 */
export function openPrintableWaiver({ raceConfig = RACE_CONFIG, runner = null } = {}) {
  const meta = buildEventMeta(raceConfig);
  const emergencyText =
    runner?.emergencyContactName || runner?.emergencyContactPhone
      ? `${runner.emergencyContactName || ''} (${runner.emergencyContactPhone || ''})`
      : '';
  const is27 = runner?.distance === '27K';
  const is13 = runner?.distance === '13K';

  const storageKeyPrefix = 'raf_doc_profile_';
  const initialDniDigits = String(runner?.dni || '').replace(/\D/g, '');
  const hasPrefilledRunner = Boolean(runner && (runner.dni || runner.code || runner.distance));

  const bodyHtml = `
    <header class="doc-header">
      <div>
        <p class="brand-kicker">${escapeHtml(meta.raceTitle)} · ${escapeHtml(meta.raceSubtitle)}</p>
        <h1 class="doc-title">Deslinde de Responsabilidad y Aceptación de Reglamento</h1>
        <p class="doc-subtitle">${escapeHtml(meta.locationName)} · Fecha estimada de carrera: ${escapeHtml(meta.eventDate)}</p>
      </div>
      <div class="badge-box">
        <div><strong>DOCUMENTO OBLIGATORIO</strong></div>
        <div>${runner?.code ? `Código: <strong>${escapeHtml(runner.code)}</strong>` : 'Presentar en Acreditación'}</div>
        <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px; margin-top:2px;">
          <span>Distancia:</span>
          <label class="chk-label"><input type="checkbox" class="chk-input" ${is27 ? 'checked' : ''} /> 27K</label>
          <label class="chk-label"><input type="checkbox" class="chk-input" ${is13 ? 'checked' : ''} /> 13K</label>
        </div>
      </div>
    </header>

    <div class="section-title">1 · Datos del Participante</div>
    <div class="grid-2">
      <div class="field-row-edit"><span class="field-label">Apellido y Nombre:</span> <input type="text" data-field="fullName" id="waiver-name-1" class="doc-input doc-input-full" value="${escapeHtml(runner?.fullName || '')}" /></div>
      <div class="field-row-edit"><span class="field-label">DNI / Pasaporte:</span> <input type="text" data-field="dni" id="waiver-dni-1" class="doc-input doc-input-full" value="${escapeHtml(runner?.dni || '')}" /></div>
      <div class="field-row-edit"><span class="field-label">Fecha de Nacimiento:</span> <input type="text" data-field="birthDate" class="doc-input doc-input-full" placeholder="DD / MM / AAAA" value="${escapeHtml(runner?.birthDate || '')}" /></div>
      <div class="field-row-edit"><span class="field-label">Grupo Sanguíneo / RH:</span> <input type="text" data-field="bloodType" class="doc-input doc-input-full" placeholder="Ej. O+" value="${escapeHtml(runner?.bloodType || '')}" /></div>
      <div class="field-row-edit"><span class="field-label">Teléfono / WhatsApp:</span> <input type="text" data-field="phone" class="doc-input doc-input-full" value="${escapeHtml(runner?.phone || '')}" /></div>
      <div class="field-row-edit"><span class="field-label">Localidad / Provincia:</span> <input type="text" data-field="city" class="doc-input doc-input-full" value="${escapeHtml(runner?.city || '')}" /></div>
      <div class="field-row-edit" style="grid-column: span 2;"><span class="field-label">Contacto de Emergencia (Nombre y Teléfono):</span> <input type="text" data-field="emergencyContact" class="doc-input doc-input-full" value="${escapeHtml(emergencyText)}" /></div>
      <div class="field-row-edit" style="grid-column: span 2;"><span class="field-label">En caso de menor de 18 años — Padre/Madre/Tutor y DNI:</span> <input type="text" data-field="guardianInfo" class="doc-input doc-input-full" placeholder="Completar solo si corresponde" /></div>
    </div>

    <div class="section-title">2 · Declaración Jurada y Deslinde de Responsabilidad</div>
    <ol class="clauses">
      <li><strong>Estado físico y entrenamiento:</strong> Declaro bajo juramento encontrarme física, clínica y psicológicamente apto/a para participar en la competencia de trail running / carrera de montaña denominada <strong>${escapeHtml(meta.raceTitle)}</strong> en la distancia en la que me inscribo, habiendo realizado los controles médicos pertinentes y comprometiéndome a presentar el Certificado / Apto Médico vigente en la acreditación.</li>
      <li><strong>Asunción de riesgos de montaña:</strong> Comprendo que el trail running en ambiente serrano implica riesgos inherentes tales como terreno irregular, piedra suelta, desniveles pronunciados, cruces de arroyo, exposición al viento, frío o lluvia, fauna silvestre y eventual retraso en la evacuación por accesos agrestes. Asumo dichos riesgos libre y voluntariamente.</li>
      <li><strong>Exención de responsabilidad:</strong> Eximo expresamente a la Organización de ${escapeHtml(meta.raceTitle)}, su Dirección Técnica, propietarios de los campos y predios atravesados, sponsors, voluntarios, personal médico y municipios involucrados de toda responsabilidad civil, penal o patrimonial por accidentes, lesiones, extravíos, daños materiales o muerte que pudiera sufrir o provocar antes, durante o después del evento, salvo dolo comprobado.</li>
      <li><strong>Reglamento, equipamiento y cortes horarios:</strong> Acepto íntegramente el reglamento de carrera, la obligación de portar en todo momento el equipamiento obligatorio exigido para mi distancia, respetar las marcaciones del circuito y acatar los cortes horarios o decisiones de suspensión/evacuación dispuestas por el equipo de seguridad o Dirección de Carrera.</li>
      <li><strong>Cuidado del ambiente serrano:</strong> Me comprometo a no arrojar ningún tipo de residuo ni envoltorio fuera de los cestos habilitados en los Puestos de Abastecimiento y llegada (causal de descalificación directa) y a respetar la flora, fauna y tranqueras de la zona.</li>
      <li><strong>Derechos de imagen y datos médicos:</strong> Autorizo a la Organización a utilizar fotografías, videos e imágenes captadas durante el evento con fines informativos o promocionales sin compensación económica, y autorizo al personal médico y de rescate a brindarme atención de urgencia utilizando la información médica declarada.</li>
    </ol>

    <div class="note-box">
      <strong>Nota para retiro de kit:</strong> Este documento debe presentarse <strong>impreso y firmado de puño y letra</strong> en la mesa de acreditación junto con el DNI físico y el Certificado / Apto Médico vigente (emitido dentro de los últimos 12 meses). En caso de menores de 18 años, requiere firma y DNI de padre, madre o tutor responsable.
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">Firma del Participante</div>
        <div class="sig-sub">Aclaración: <input type="text" id="waiver-name-2" class="doc-input doc-input-inline" style="width: 195px;" value="${escapeHtml(runner?.fullName || '')}" /></div>
        <div class="sig-sub" style="margin-top: 3px;">DNI N°: <input type="text" id="waiver-dni-2" class="doc-input doc-input-inline" style="width: 95px;" value="${escapeHtml(runner?.dni || '')}" /> Fecha: <input type="text" data-field="signDate" class="doc-input doc-input-inline" style="width: 80px;" placeholder="DD/MM/AAAA" /></div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Control Organización / Acreditación</div>
        <div class="sig-sub" style="display:flex; justify-content:center; gap:10px;">
          <label class="chk-label" style="font-weight:500;"><input type="checkbox" class="chk-input" /> DNI verificado</label>
          <label class="chk-label" style="font-weight:500;"><input type="checkbox" class="chk-input" /> Apto Médico recibido</label>
        </div>
        <div class="sig-sub" style="margin-top: 3px;">Dorsal N° asignado: <input type="text" class="doc-input doc-input-inline" style="width: 75px; text-align:center;" value="${escapeHtml(runner?.assignedBib ? `#${runner.assignedBib}` : '')}" /></div>
      </div>
    </div>

    <footer class="footer-meta">
      <span>${escapeHtml(meta.raceTitle)} · ${escapeHtml(meta.locationName)}</span>
      <span>Consultas WhatsApp Org.: ${escapeHtml(meta.whatsappNumber)}</span>
    </footer>

    <script>
      (function () {
        var prefix = ${JSON.stringify(storageKeyPrefix)};
        var prefilled = ${JSON.stringify(hasPrefilledRunner)};
        var initialDni = ${JSON.stringify(initialDniDigits)};
        var n1 = document.getElementById('waiver-name-1');
        var n2 = document.getElementById('waiver-name-2');
        var d1 = document.getElementById('waiver-dni-1');
        var d2 = document.getElementById('waiver-dni-2');
        if (n1 && n2) n1.addEventListener('input', function () { n2.value = n1.value; });
        if (d1 && d2) d1.addEventListener('input', function () { d2.value = d1.value; });

        function getDniKey() {
          var raw = (d1 && d1.value ? d1.value : initialDni).replace(/\\D/g, '');
          return raw.length >= 6 ? prefix + raw : '';
        }

        function saveProfile() {
          try {
            var key = getDniKey();
            if (!key) return;
            var prev = {};
            try { prev = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) {}
            document.querySelectorAll('[data-field]').forEach(function (el) {
              var k = el.getAttribute('data-field');
              if (k && k !== 'dni') prev[k] = el.value || '';
            });
            localStorage.setItem(key, JSON.stringify(prev));
          } catch (e) {}
        }

        if (prefilled && initialDni) {
          try {
            var saved = JSON.parse(localStorage.getItem(prefix + initialDni) || 'null');
            if (saved && typeof saved === 'object') {
              document.querySelectorAll('[data-field]').forEach(function (el) {
                var k = el.getAttribute('data-field');
                if (k && k !== 'dni' && !el.value && saved[k]) {
                  el.value = saved[k];
                }
              });
              if (n1 && n2 && !n2.value) n2.value = n1.value;
            }
          } catch (e) {}
        }

        document.querySelectorAll('[data-field]').forEach(function (el) {
          el.addEventListener('input', saveProfile);
        });
      })();
    </script>
  `;

  return openPrintableHtmlWindow(`Deslinde Oficial - ${meta.raceTitle}`, bodyHtml, { autoPrint: false });
}

/**
 * Abre una vista A4 imprimible / guardable como PDF del Modelo de Certificado / Apto Médico.
 */
export function openPrintableMedicalCert({ raceConfig = RACE_CONFIG, runner = null } = {}) {
  const meta = buildEventMeta(raceConfig);
  const is27 = runner?.distance === '27K';
  const is13 = runner?.distance === '13K';
  const storageKeyPrefix = 'raf_doc_profile_';
  const initialDniDigits = String(runner?.dni || '').replace(/\D/g, '');
  const hasPrefilledRunner = Boolean(runner && (runner.dni || runner.code || runner.distance));

  const bodyHtml = `
    <header class="doc-header">
      <div>
        <p class="brand-kicker">${escapeHtml(meta.raceTitle)} · ${escapeHtml(meta.raceSubtitle)}</p>
        <h1 class="doc-title">Ficha Médica y Modelo de Certificado de Aptitud Física</h1>
        <p class="doc-subtitle">Apto específico para Trail Running / Carrera de Montaña · ${escapeHtml(meta.locationName)}</p>
      </div>
      <div class="badge-box">
        <div><strong>VIGENCIA MÁXIMA: 12 MESES</strong></div>
        <div>${runner?.code ? `Código: <strong>${escapeHtml(runner.code)}</strong>` : 'Presentar Original / Copia'}</div>
        <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px; margin-top:2px;">
          <span>Distancia:</span>
          <label class="chk-label"><input type="checkbox" class="chk-input" ${is27 ? 'checked' : ''} /> 27K</label>
          <label class="chk-label"><input type="checkbox" class="chk-input" ${is13 ? 'checked' : ''} /> 13K</label>
        </div>
      </div>
    </header>

    <div class="section-title">1 · Identificación del Corredor/a</div>
    <div class="grid-2">
      <div class="field-row-edit"><span class="field-label">Apellido y Nombre:</span> <input type="text" data-field="fullName" id="med-name-1" class="doc-input doc-input-full" value="${escapeHtml(runner?.fullName || '')}" /></div>
      <div class="field-row-edit"><span class="field-label">DNI / Pasaporte:</span> <input type="text" data-field="dni" id="med-dni-1" class="doc-input doc-input-full" value="${escapeHtml(runner?.dni || '')}" /></div>
      <div class="field-row-edit"><span class="field-label">Fecha de Nacimiento / Edad:</span> <input type="text" data-field="birthDate" class="doc-input doc-input-full" placeholder="DD / MM / AAAA" value="${escapeHtml(runner?.birthDate || '')}" /></div>
      <div class="field-row-edit"><span class="field-label">Grupo Sanguíneo y Factor RH:</span> <input type="text" data-field="bloodType" class="doc-input doc-input-full" placeholder="Ej. A+" value="${escapeHtml(runner?.bloodType || '')}" /></div>
      <div class="field-row-edit" style="grid-column: span 2;"><span class="field-label">Obra Social / Alergias / Medicación actual:</span> <input type="text" data-field="medicalNotes" class="doc-input doc-input-full" value="${escapeHtml(runner?.medicalNotes || '')}" /></div>
    </div>

    <div class="section-title">2 · Certificado Médico de Aptitud Física (Completar por el Profesional)</div>
    <div class="med-box">
      <p class="med-text">
        Certifico que el/la Sr./Sra. <input type="text" id="med-name-2" class="doc-input doc-input-inline" style="width: 245px;" value="${escapeHtml(runner?.fullName || '')}" />,
        DNI N° <input type="text" id="med-dni-2" class="doc-input doc-input-inline" style="width: 115px;" value="${escapeHtml(runner?.dni || '')}" />, ha sido evaluado/a clínicamente y mediante los estudios
        complementarios que consideré pertinentes en función de su edad y antecedentes, encontrándose actualmente
        <strong>APTO/A FÍSICAMENTE</strong> y sin contraindicaciones médicas aparentes para participar en competencias
        de <strong>Trail Running / Carrera de Montaña de esfuerzo físico intenso y competitivo</strong>
        (modalidad <input type="text" class="doc-input doc-input-inline" style="width: 72px; text-align:center;" value="${escapeHtml(runner?.distance || '')}" placeholder="27K / 13K" /> en ambiente serrano),
        correspondiente al evento <strong>${escapeHtml(meta.raceTitle)}</strong>.
      </p>

      <div class="grid-2" style="margin-top: 8px;">
        <div class="field-row-edit"><span class="field-label">Tensión Arterial (TA):</span> <input type="text" class="doc-input doc-input-full" /> <span class="field-label">mmHg</span></div>
        <div class="field-row-edit"><span class="field-label">Frecuencia Cardíaca (FC):</span> <input type="text" class="doc-input doc-input-full" /> <span class="field-label">lpm</span></div>
        <div class="field-row-edit" style="grid-column: span 2; align-items: flex-start;"><span class="field-label" style="padding-top:2px;">Observaciones médicas:</span> <textarea rows="1" class="doc-textarea"></textarea></div>
        <div class="field-row-edit" style="grid-column: span 2;"><span class="field-label">Lugar y Fecha de emisión:</span> <input type="text" class="doc-input doc-input-full" placeholder="Ciudad, Provincia — DD / MM / 202_" /></div>
      </div>

      <div class="signatures" style="margin-top: 20px;">
        <div class="sig-block">
          <div class="sig-line">Firma del Participante</div>
          <div class="sig-sub">Declaro veracidad en antecedentes informados</div>
        </div>
        <div class="sig-block">
          <div class="sig-line">Firma y Sello del Médico</div>
          <div class="sig-sub">Profesional: <input type="text" class="doc-input doc-input-inline" style="width: 170px;" placeholder="Nombre y Apellido" /></div>
          <div class="sig-sub" style="margin-top: 3px;">Matrícula (M.N. / M.P.): <input type="text" class="doc-input doc-input-inline" style="width: 115px;" /></div>
        </div>
      </div>
    </div>

    <div class="note-box">
      <strong>Importante para la acreditación:</strong>
      Se aceptará este modelo completado, firmado y sellado por médico matriculado, o bien un certificado médico particular siempre que indique explícitamente aptitud para <em>"carreras de montaña / trail running de esfuerzo competitivo"</em>, fecha de emisión (vigencia menor a 1 año respecto al día de carrera) y matrícula profesional legible. La organización retendrá el certificado o una fotocopia legible junto con el Deslinde firmado.
    </div>

    <footer class="footer-meta">
      <span>${escapeHtml(meta.raceTitle)} · ${escapeHtml(meta.locationName)}</span>
      <span>Consultas WhatsApp Org.: ${escapeHtml(meta.whatsappNumber)}</span>
    </footer>

    <script>
      (function () {
        var prefix = ${JSON.stringify(storageKeyPrefix)};
        var prefilled = ${JSON.stringify(hasPrefilledRunner)};
        var initialDni = ${JSON.stringify(initialDniDigits)};
        var n1 = document.getElementById('med-name-1');
        var n2 = document.getElementById('med-name-2');
        var d1 = document.getElementById('med-dni-1');
        var d2 = document.getElementById('med-dni-2');
        if (n1 && n2) n1.addEventListener('input', function () { n2.value = n1.value; });
        if (d1 && d2) d1.addEventListener('input', function () { d2.value = d1.value; });

        function getDniKey() {
          var raw = (d1 && d1.value ? d1.value : initialDni).replace(/\\D/g, '');
          return raw.length >= 6 ? prefix + raw : '';
        }

        function saveProfile() {
          try {
            var key = getDniKey();
            if (!key) return;
            var prev = {};
            try { prev = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) {}
            document.querySelectorAll('[data-field]').forEach(function (el) {
              var k = el.getAttribute('data-field');
              if (k && k !== 'dni') prev[k] = el.value || '';
            });
            localStorage.setItem(key, JSON.stringify(prev));
          } catch (e) {}
        }

        if (prefilled && initialDni) {
          try {
            var saved = JSON.parse(localStorage.getItem(prefix + initialDni) || 'null');
            if (saved && typeof saved === 'object') {
              document.querySelectorAll('[data-field]').forEach(function (el) {
                var k = el.getAttribute('data-field');
                if (k && k !== 'dni' && !el.value && saved[k]) {
                  el.value = saved[k];
                }
              });
              if (n1 && n2 && !n2.value) n2.value = n1.value;
            }
          } catch (e) {}
        }

        document.querySelectorAll('[data-field]').forEach(function (el) {
          el.addEventListener('input', saveProfile);
        });
      })();
    </script>
  `;

  return openPrintableHtmlWindow(`Apto Médico Oficial - ${meta.raceTitle}`, bodyHtml, { autoPrint: false });
}

/**
 * Abre una vista A4 apaisada imprimible para la mesa de acreditación y rescate SOS,
 * ordenada por número de dorsal ascendente con todos los corredores confirmados.
 */
export function openPrintableAccreditationSheet({
  raceConfig,
  registrations = [],
  bibDrafts = {},
} = {}) {
  const meta = buildEventMeta(raceConfig);

  const confirmedRunners = (Array.isArray(registrations) ? registrations : []).filter((reg) => {
    const st = String(reg?.status || '').trim().toLowerCase();
    return st === 'confirmed' || st === 'confirmado';
  });

  const sortedRunners = [...confirmedRunners].sort((a, b) => {
    const rawBibA = String((bibDrafts[a.id] ?? a.assignedBib) || '').trim();
    const rawBibB = String((bibDrafts[b.id] ?? b.assignedBib) || '').trim();
    const numA = Number(rawBibA);
    const numB = Number(rawBibB);
    const validA = rawBibA !== '' && Number.isFinite(numA) && numA > 0;
    const validB = rawBibB !== '' && Number.isFinite(numB) && numB > 0;

    if (validA && validB) {
      if (numA !== numB) return numA - numB;
    } else if (validA) {
      return -1;
    } else if (validB) {
      return 1;
    }

    return String(a.fullName || '').localeCompare(String(b.fullName || ''), 'es');
  });

  const count27k = sortedRunners.filter((r) => String(r.distance || '').includes('27')).length;
  const count13k = sortedRunners.filter((r) => String(r.distance || '').includes('13')).length;
  const checkedCount = sortedRunners.filter((r) => Boolean(r.checkedIn)).length;
  const printedAt = new Date().toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rowsHtml =
    sortedRunners.length > 0
      ? sortedRunners
          .map((reg, idx) => {
            const liveBib = String((bibDrafts[reg.id] ?? reg.assignedBib) || '').trim();
            const cat = resolveRunnerCategory(reg, raceConfig);
            const blood = String(reg.bloodType || '').trim();
            const medNotes = String(reg.medicalNotes || '').trim();
            const emergencyName = String(reg.emergencyContactName || '').trim();
            const emergencyPhone = String(reg.emergencyContactPhone || '').trim();
            const isChecked = Boolean(reg.checkedIn);
            const ageText = cat.age !== null ? `${cat.age} años` : 'Edad s/d';

            return `
              <tr>
                <td class="bib-cell">${liveBib ? `#${escapeHtml(liveBib)}` : `S/N<br/><span style="font-size:8px;color:#6b7280;">(#${idx + 1})</span>`}</td>
                <td>
                  <strong>${escapeHtml(reg.fullName || '-')}</strong>
                  <div style="font-size:8.6px;color:#4b5563;">
                    ${escapeHtml(reg.code || 'SIN-COD')} · ${escapeHtml(reg.city || reg.locality || 'S/D')}${reg.team ? ` · Team: ${escapeHtml(reg.team)}` : ''}
                  </div>
                </td>
                <td>
                  <strong>DNI ${escapeHtml(reg.dni || '-')}</strong>
                  <div style="font-size:8.6px;color:#374151;">${escapeHtml(ageText)} · ${escapeHtml(cat.shortCategory)}</div>
                </td>
                <td style="white-space:nowrap;">
                  <strong>${escapeHtml(cat.distanceLabel || reg.distance || '-')}</strong>
                  <div style="font-size:8.8px;color:#374151;">Talle: <strong>${escapeHtml(reg.shirtSize || '-')}</strong></div>
                </td>
                <td>
                  ${blood ? `<span class="blood-pill">${escapeHtml(blood)}</span>` : '<span style="color:#6b7280;font-size:8.6px;">Grupo s/d</span>'}
                  ${
                    medNotes
                      ? `<div style="margin-top:2px;font-size:8.6px;color:#7f1d1d;"><strong>Obs:</strong> ${escapeHtml(medNotes)}</div>`
                      : ''
                  }
                </td>
                <td>
                  <strong>${escapeHtml(emergencyName || '-')}</strong>
                  <div style="font-size:8.8px;color:#111827;">${escapeHtml(emergencyPhone || '-')}</div>
                </td>
                <td style="min-width:118px;">
                  <div class="chk-row">
                    <span class="chk-box">${isChecked ? '✓' : ''}</span>
                    <span>${isChecked ? '<strong>Kit entregado (web)</strong>' : 'Kit + Chip + Dorsal'}</span>
                  </div>
                  <div class="chk-row">
                    <span class="chk-box"></span>
                    <span>Apto + Deslinde OK</span>
                  </div>
                  <div style="border-bottom:1px dotted #9ca3af;margin-top:6px;height:10px;font-size:7.8px;color:#6b7280;">Firma:</div>
                </td>
              </tr>
            `;
          })
          .join('')
      : `<tr><td colspan="7" style="text-align:center;padding:18px;color:#4b5563;">No hay corredores confirmados para imprimir todavía.</td></tr>`;

  const bodyHtml = `
    <header class="doc-header" style="margin-bottom:8px;">
      <div class="doc-brand">
        <div class="doc-tag">Mesa de Acreditación &amp; Planilla Médica SOS</div>
        <h1>Planilla de Control — Ordenada por Dorsal</h1>
        <p>${escapeHtml(meta.raceTitle)} · ${escapeHtml(meta.locationName)} · Fecha oficial: ${escapeHtml(meta.eventDate)}</p>
      </div>
      <div class="doc-meta">
        <div>Confirmados: <strong>${sortedRunners.length}</strong> (27K: ${count27k} · 13K: ${count13k})</div>
        <div>Ya acreditados en web: <strong>${checkedCount}</strong> / ${sortedRunners.length}</div>
        <div>Emitida: ${escapeHtml(printedAt)}</div>
      </div>
    </header>

    <table class="sos-table">
      <thead>
        <tr>
          <th style="width:58px;text-align:center;">Dorsal</th>
          <th>Corredor / Código / Procedencia</th>
          <th>DNI / Edad / Categoría</th>
          <th>Dist. / Talle</th>
          <th>Grupo RH / Alertas Médicas</th>
          <th>Contacto Emergencia SOS</th>
          <th style="width:128px;">Check-in Mesa</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <footer class="footer-meta">
      <span>DOCUMENTO INTERNO DE ORGANIZACIÓN Y RESCATE EN MONTAÑA — NO EXPONER PÚBLICAMENTE</span>
      <span>${escapeHtml(meta.raceTitle)}</span>
    </footer>
  `;

  return openPrintableHtmlWindow(
    `Planilla Acreditación SOS - ${meta.raceTitle}`,
    bodyHtml,
    { landscape: true }
  );
}
