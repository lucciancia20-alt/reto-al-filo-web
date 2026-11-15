import { RACE_CONFIG, parseTargetDateParts } from '../data/raceConfig';

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

function openPrintableHtmlWindow(title, bodyHtml) {
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 12mm 14mm;
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
        max-width: 210mm;
        min-height: 272mm;
        margin: 14px auto;
        background: #ffffff;
        padding: 12mm 14mm;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
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
      .field-label {
        color: #4b5563;
        font-weight: 600;
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
      }
    </style>
  </head>
  <body>
    <div class="no-print">
      <div style="font-size: 12px;">
        <strong>${escapeHtml(title)}</strong> · Formato A4 listo para imprimir o guardar como PDF
      </div>
      <div class="no-print-actions">
        <button type="button" class="btn-print" onclick="window.print()">Imprimir / Guardar PDF (A4)</button>
        <button type="button" class="btn-close" onclick="window.close()">Cerrar</button>
      </div>
    </div>
    <main class="sheet">
      ${bodyHtml}
    </main>
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () {
          try { window.print(); } catch (e) {}
        }, 220);
      });
    </script>
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
        <div>Distancia: ${runner?.distance ? `<strong>${escapeHtml(runner.distance)}</strong>` : '☐ 27K  ☐ 13K'}</div>
      </div>
    </header>

    <div class="section-title">1 · Datos del Participante</div>
    <div class="grid-2">
      <div class="field-row"><span class="field-label">Apellido y Nombre:</span> ${fieldValueOrLine(runner?.fullName, '..................................................')}</div>
      <div class="field-row"><span class="field-label">DNI / Pasaporte:</span> ${fieldValueOrLine(runner?.dni, '....................................................')}</div>
      <div class="field-row"><span class="field-label">Fecha de Nacimiento:</span> ${fieldValueOrLine(runner?.birthDate, '......... / ......... / .............')}</div>
      <div class="field-row"><span class="field-label">Grupo Sanguíneo / RH:</span> ${fieldValueOrLine(runner?.bloodType, '.................................')}</div>
      <div class="field-row"><span class="field-label">Teléfono / WhatsApp:</span> ${fieldValueOrLine(runner?.phone, '...............................................')}</div>
      <div class="field-row"><span class="field-label">Localidad / Provincia:</span> ${fieldValueOrLine(runner?.city, '................................................')}</div>
      <div class="field-row" style="grid-column: span 2;"><span class="field-label">Contacto de Emergencia (Nombre y Teléfono):</span> ${fieldValueOrLine(emergencyText, '....................................................................................................')}</div>
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
        <div class="sig-sub">Aclaración: ...........................................................</div>
        <div class="sig-sub">DNI N°: .................................. Fecha: ...... / ...... / ..........</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Control Organización / Acreditación</div>
        <div class="sig-sub">☐ DNI verificado &nbsp;&nbsp; ☐ Apto Médico recibido</div>
        <div class="sig-sub">Dorsal N° asignado: .....................</div>
      </div>
    </div>

    <footer class="footer-meta">
      <span>${escapeHtml(meta.raceTitle)} · ${escapeHtml(meta.locationName)}</span>
      <span>Consultas WhatsApp Org.: ${escapeHtml(meta.whatsappNumber)}</span>
    </footer>
  `;

  return openPrintableHtmlWindow(`Deslinde Oficial - ${meta.raceTitle}`, bodyHtml);
}

/**
 * Abre una vista A4 imprimible / guardable como PDF del Modelo de Certificado / Apto Médico.
 */
export function openPrintableMedicalCert({ raceConfig = RACE_CONFIG, runner = null } = {}) {
  const meta = buildEventMeta(raceConfig);

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
        <div>Distancia: ${runner?.distance ? `<strong>${escapeHtml(runner.distance)}</strong>` : '☐ 27K  ☐ 13K'}</div>
      </div>
    </header>

    <div class="section-title">1 · Identificación del Corredor/a</div>
    <div class="grid-2">
      <div class="field-row"><span class="field-label">Apellido y Nombre:</span> ${fieldValueOrLine(runner?.fullName, '..................................................')}</div>
      <div class="field-row"><span class="field-label">DNI / Pasaporte:</span> ${fieldValueOrLine(runner?.dni, '....................................................')}</div>
      <div class="field-row"><span class="field-label">Fecha de Nacimiento:</span> ${fieldValueOrLine(runner?.birthDate, '......... / ......... / .............')}</div>
      <div class="field-row"><span class="field-label">Grupo Sanguíneo y Factor RH:</span> ${fieldValueOrLine(runner?.bloodType, '........................')}</div>
      <div class="field-row" style="grid-column: span 2;"><span class="field-label">Obra Social / Alergias / Medicación actual:</span> ${fieldValueOrLine(runner?.medicalNotes, '...................................................................................................')}</div>
    </div>

    <div class="section-title">2 · Certificado Médico de Aptitud Física (Completar por el Profesional)</div>
    <div class="med-box">
      <p class="med-text">
        Certifico que el/la Sr./Sra. ${fieldValueOrLine(runner?.fullName, '..........................................................................................')},
        DNI N° ${fieldValueOrLine(runner?.dni, '............................................')}, ha sido evaluado/a clínicamente y mediante los estudios
        complementarios que consideré pertinentes en función de su edad y antecedentes, encontrándose actualmente
        <strong>APTO/A FÍSICAMENTE</strong> y sin contraindicaciones médicas aparentes para participar en competencias
        de <strong>Trail Running / Carrera de Montaña de esfuerzo físico intenso y competitivo</strong>
        (modalidad <strong>${runner?.distance ? escapeHtml(runner.distance) : '13K / 27K'}</strong> en ambiente serrano),
        correspondiente al evento <strong>${escapeHtml(meta.raceTitle)}</strong>.
      </p>

      <div class="grid-2" style="margin-top: 8px;">
        <div class="field-row"><span class="field-label">Tensión Arterial (TA):</span> ............................. mmHg</div>
        <div class="field-row"><span class="field-label">Frecuencia Cardíaca (FC):</span> ....................... lpm</div>
        <div class="field-row" style="grid-column: span 2;"><span class="field-label">Observaciones / Recomendaciones médicas:</span> ..................................................................................................</div>
        <div class="field-row" style="grid-column: span 2;"><span class="field-label">Lugar y Fecha de emisión:</span> ................................................................................ , ...... / ...... / 202....</div>
      </div>

      <div class="signatures" style="margin-top: 26px;">
        <div class="sig-block">
          <div class="sig-line">Firma del Participante</div>
          <div class="sig-sub">Declaro veracidad en antecedentes informados</div>
        </div>
        <div class="sig-block">
          <div class="sig-line">Firma y Sello del Médico</div>
          <div class="sig-sub">Matrícula Nacional / Provincial (M.N. / M.P.): ........................</div>
        </div>
      </div>
    </div>

    <div class="note-box">
      <strong>Importante para la acreditación:</strong>
      Se aceptará este modelo completado, firmado y sellado por médico matriculado, o bien un certificado médico particular siempre que indique explícitamente aptitud para <em>"carreras de montaña / trail running de esfuerzo competitivo"</em>, fecha de emisión (vigencia menor a 1 año respecto al día de carrera) y matrícula profesional legible. La organización retendrá el certificado o una fotocopia legible junto con el Deslinde firmado.
    </div>

    <footer class="footer-meta">
      <span>${escapeHtml(meta.raceTitle)} · ${escapeHtml(meta.locationName)}</span>
      <span>Archivo oficial para imprimir en hoja A4</span>
    </footer>
  `;

  return openPrintableHtmlWindow(`Apto Médico Oficial - ${meta.raceTitle}`, bodyHtml);
}
