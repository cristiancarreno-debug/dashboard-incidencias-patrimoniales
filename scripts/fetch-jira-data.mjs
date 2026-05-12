/**
 * Script de extracción de datos de Jira para el Dashboard de Incidencias Patrimoniales.
 * Lógica: Tribu/Squad de Jira como fuente de verdad. Keywords solo para determinar producto específico.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JIRA_BASE_URL = 'https://jirasegurosbolivar.atlassian.net';
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('ERROR: JIRA_EMAIL y JIRA_API_TOKEN deben estar configurados.');
  process.exit(1);
}

const AUTH_HEADER = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;

/** Tribus válidas en el campo Tribu/Squad de Jira */
const TRIBUS_JIRA_VALIDAS = new Set([
  'Movilidad', 'Vivienda', 'Empresas', 'Arrendamiento',
  'Copropiedades', 'Hogar', 'Pymes', 'Cumplimiento',
  'Agro y Transporte', 'Decenal y Maquinaria',
]);

/** Mapeo tribu Jira → tribu dashboard */
const TRIBU_MAP = {
  'Movilidad': 'Movilidad', 'Vivienda': 'Vivienda', 'Empresas': 'Empresas',
  'Arrendamiento': 'Arrendamiento', 'Copropiedades': 'Vivienda', 'Hogar': 'Vivienda',
  'Pymes': 'Empresas', 'Cumplimiento': 'Empresas', 'Agro y Transporte': 'Empresas',
  'Decenal y Maquinaria': 'Vivienda',
};

/** Producto por defecto según tribu/squad de Jira */
const PRODUCTO_DEFAULT = {
  'Movilidad': 'Autos', 'Vivienda': 'Hogar', 'Empresas': 'Pymes',
  'Arrendamiento': 'Arrendamiento', 'Copropiedades': 'Cuotas al día',
  'Hogar': 'Hogar', 'Pymes': 'Pymes', 'Cumplimiento': 'Cumplimiento',
  'Agro y Transporte': 'Agro', 'Decenal y Maquinaria': 'Decenal',
};

/** Deriva tribu y squad del producto */
function derivarTribuSquad(producto) {
  const map = {
    'Autos': { tribu: 'Movilidad', squad: 'Movilidad' },
    'SOAT': { tribu: 'Movilidad', squad: 'Movilidad' },
    'Hogar': { tribu: 'Vivienda', squad: 'Hogar' },
    'Cuotas al día': { tribu: 'Vivienda', squad: 'Copropiedades' },
    'Obra al día': { tribu: 'Vivienda', squad: 'Copropiedades' },
    'Zonas comunes': { tribu: 'Vivienda', squad: 'Copropiedades' },
    'Decenal': { tribu: 'Vivienda', squad: 'Decenal y Maquinaria' },
    'Maquinaria': { tribu: 'Vivienda', squad: 'Decenal y Maquinaria' },
    'Pymes': { tribu: 'Empresas', squad: 'Pymes' },
    'Cumplimiento': { tribu: 'Empresas', squad: 'Cumplimiento' },
    'Agro': { tribu: 'Empresas', squad: 'Agro y Transporte' },
    'Transporte': { tribu: 'Empresas', squad: 'Agro y Transporte' },
    'Arrendamiento': { tribu: 'Arrendamiento', squad: 'Arrendamiento' },
  };
  return map[producto] || { tribu: 'Movilidad', squad: 'Movilidad' };
}

/** Determina plataforma */
function determinarPlataforma(summary) {
  const s = (summary || '').toLowerCase();
  if (s.includes('tronador')) return 'Tronador';
  if (s.includes('simon web')) return 'Simon WEB';
  if (s.includes('simon') && s.includes('cotizador')) return 'Simon Cotizadores';
  if (s.includes('simon')) return 'Simon Cotizadores';
  if (s.includes('jelpit')) return 'Jelpit Conjuntos';
  if (s.includes('sai')) return 'SAI';
  if (s.includes('arcgis')) return 'Arcgis';
  return 'Otros';
}

/** Extrae texto de ADF */
function extractTextFromADF(adf) {
  if (!adf) return '';
  if (typeof adf === 'string') return adf;
  let text = '';
  if (adf.text) text += adf.text;
  if (adf.content && Array.isArray(adf.content)) {
    for (const node of adf.content) { text += extractTextFromADF(node) + ' '; }
  }
  return text;
}

/**
 * CLASIFICACIÓN:
 * 1. Si Tribu/Squad de Jira es válida → SIEMPRE usar esa tribu. Keywords SOLO para producto DENTRO de la tribu.
 * 2. Si Tribu/Squad vacía → fallback por keywords en summary + descripción + comentarios
 * 3. Si Tribu/Squad no válida (COREX, etc.) → excluir
 * 4. Si no se puede clasificar → excluir
 */
function clasificar(issue) {
  const fields = issue.fields;
  const tribuJira = fields.customfield_27826?.value || null;
  const squadJira = fields.customfield_27826?.child?.value || null;
  const summary = fields.summary || '';
  let description = '';
  if (typeof fields.description === 'string') description = fields.description;
  else if (fields.description && typeof fields.description === 'object') description = extractTextFromADF(fields.description);

  // Estado cancelado → excluir
  const status = fields.status?.name || '';
  if (status.toLowerCase() === 'cancelado' || status.toLowerCase() === 'cancelada') return null;

  // Si Tribu/Squad de Jira está llena pero NO es válida → excluir
  if (tribuJira && !TRIBUS_JIRA_VALIDAS.has(tribuJira)) return null;

  // CASO 1: Tribu/Squad de Jira es válida → usar SOLO la tribu de Jira
  if (tribuJira && TRIBUS_JIRA_VALIDAS.has(tribuJira)) {
    const tribu = TRIBU_MAP[tribuJira] || tribuJira;

    // Determinar producto DENTRO de la tribu (keywords restringidos al contexto de la tribu)
    const producto = determinarProductoDentroDeTribu(tribu, tribuJira, squadJira, summary, description);
    const tribuSquad = derivarTribuSquad(producto);
    const plataforma = determinarPlataforma(summary);

    return {
      key: issue.key, summary, status,
      assignee: fields.assignee?.displayName || null,
      createdDate: fields.created, resolvedDate: fields.resolutiondate || null,
      producto, tribu: tribuSquad.tribu, squad: tribuSquad.squad, plataforma,
      jiraUrl: `${JIRA_BASE_URL}/browse/${issue.key}`,
    };
  }

  // CASO 2: Tribu/Squad vacía → fallback por keywords en TODOS los campos
  const textoCompleto = `${summary} ${description}`.toLowerCase();
  const producto = identificarProductoGeneral(textoCompleto);
  if (producto) {
    const tribuSquad = derivarTribuSquad(producto);
    const plataforma = determinarPlataforma(summary);
    return {
      key: issue.key, summary, status,
      assignee: fields.assignee?.displayName || null,
      createdDate: fields.created, resolvedDate: fields.resolutiondate || null,
      producto, tribu: tribuSquad.tribu, squad: tribuSquad.squad, plataforma,
      jiraUrl: `${JIRA_BASE_URL}/browse/${issue.key}`,
    };
  }

  // CASO 3: No se puede clasificar → excluir
  return null;
}

/**
 * Determina el producto DENTRO de una tribu específica.
 * Solo busca keywords relevantes para esa tribu.
 */
function determinarProductoDentroDeTribu(tribu, tribuJira, squadJira, summary, description) {
  const texto = `${summary} ${description}`.toLowerCase();

  // Primero usar squad de Jira si está disponible
  if (squadJira) {
    const sq = squadJira.toLowerCase();
    if (sq.includes('movilidad')) {
      if (texto.includes('soat')) return 'SOAT';
      return 'Autos';
    }
    if (sq.includes('hogar')) return 'Hogar';
    if (sq.includes('copropiedades')) {
      if (texto.includes('obra al día') || texto.includes('obra al dia')) return 'Obra al día';
      if (texto.includes('zonas comunes')) return 'Zonas comunes';
      return 'Cuotas al día';
    }
    if (sq.includes('pymes')) return 'Pymes';
    if (sq.includes('cumplimiento')) return 'Cumplimiento';
    if (sq.includes('agro')) {
      if (texto.includes('transporte') || texto.includes('prod 40')) return 'Transporte';
      return 'Agro';
    }
    if (sq.includes('decenal') || sq.includes('maquinaria')) {
      if (texto.includes('maquinaria') || texto.includes('prod 152') || texto.includes('producto 152')) return 'Maquinaria';
      return 'Decenal';
    }
    if (sq.includes('arrendamiento')) return 'Arrendamiento';
  }

  // Si no hay squad, usar keywords DENTRO del contexto de la tribu
  if (tribu === 'Movilidad') {
    if (texto.includes('soat')) return 'SOAT';
    return 'Autos'; // Default para Movilidad
  }
  if (tribu === 'Arrendamiento') return 'Arrendamiento';
  if (tribu === 'Vivienda') {
    if (texto.includes('hogar')) return 'Hogar';
    if (texto.includes('obra al día') || texto.includes('obra al dia')) return 'Obra al día';
    if (texto.includes('zonas comunes')) return 'Zonas comunes';
    if (texto.includes('decenal')) return 'Decenal';
    if (texto.includes('maquinaria') || texto.includes('prod 152')) return 'Maquinaria';
    return 'Cuotas al día'; // Default para Vivienda
  }
  if (tribu === 'Empresas') {
    if (texto.includes('cumplimiento')) return 'Cumplimiento';
    if (texto.includes('pymes') || texto.includes('pyme')) return 'Pymes';
    if (texto.includes('agro') || texto.includes('agrícola')) return 'Agro';
    if (texto.includes('transporte') || texto.includes('prod 40')) return 'Transporte';
    if (texto.includes('decenal')) return 'Decenal';
    if (texto.includes('maquinaria') || texto.includes('prod 152')) return 'Maquinaria';
    return 'Pymes'; // Default para Empresas
  }

  return PRODUCTO_DEFAULT[tribuJira] || 'Autos';
}

/**
 * Fallback: identifica producto por keywords cuando NO hay tribu de Jira.
 * Más estricto - solo clasifica si hay alta confianza.
 */
function identificarProductoGeneral(texto) {
  // Keywords específicos (alta confianza)
  if (texto.includes('cotizadores autos') || texto.includes('cotizador autos')) return 'Autos';
  if (texto.includes('simon - soat') || texto.includes('simon-soat') || texto.includes('soat falabella') || texto.includes('ventasoatdigital')) return 'SOAT';
  if (texto.includes('cotizadores hogar') || texto.includes('cotizador hogar')) return 'Hogar';
  if (texto.includes('simon - cumplimiento') || texto.includes('simon-cumplimiento')) return 'Cumplimiento';
  if (texto.includes('cotizadores pymes') || texto.includes('pymes + digital') || texto.includes('tranquilidad pymes')) return 'Pymes';
  if (texto.includes('cotizadores agro') || texto.includes('planificador agrícola') || texto.includes('planificador agricola')) return 'Agro';
  if (texto.includes('jelpit conjuntos cuotas') || texto.includes('jelpit conjuntos recaudo')) return 'Cuotas al día';
  if (texto.includes('jelpit pymes')) return 'Pymes';
  if (texto.includes('obra al día') || texto.includes('obra al dia')) return 'Obra al día';
  if (texto.includes('ventadigitalautos')) return 'Autos';
  if (texto.includes('tronador banca + movilidad') || texto.includes('tronador banca +movilidad')) return 'Autos';
  if (texto.includes('sai web') || texto.includes('sai ')) return 'Arrendamiento';
  if (texto.includes('sios')) return 'Arrendamiento';
  if (texto.includes('recaudo electrónico soat') || texto.includes('recaudo electronico soat')) return 'SOAT';

  // No se puede determinar con confianza
  return null;
}

// ============ JIRA API ============

function jiraRequest(urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, JIRA_BASE_URL);
    const options = {
      hostname: url.hostname, path: url.pathname + url.search, method: 'GET',
      headers: { 'Authorization': AUTH_HEADER, 'Accept': 'application/json' },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`Jira ${res.statusCode}: ${data.slice(0, 300)}`));
        else resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchWithJQL(jql) {
  const fields = 'summary,status,assignee,created,resolutiondate,customfield_10409,customfield_27826,description';
  const maxResults = 100;
  let allIssues = [];
  let nextPageToken = null;
  do {
    const encodedJql = encodeURIComponent(jql);
    let url = `/rest/api/3/search/jql?jql=${encodedJql}&fields=${fields}&maxResults=${maxResults}`;
    if (nextPageToken) url += `&nextPageToken=${encodeURIComponent(nextPageToken)}`;
    const response = await jiraRequest(url);
    const issues = response.issues || [];
    allIssues = allIssues.concat(issues);
    nextPageToken = response.nextPageToken || null;
    if (issues.length === 0) break;
  } while (nextPageToken);
  return allIssues;
}

async function fetchAllIncidencias() {
  const baseFilter = `project = MDSB AND issuetype = Incident AND status != "Cancelado"`;
  const seenKeys = new Set();
  let allIssues = [];

  // Traer por campo Tribu/Squad (fuente principal)
  const tribuQueries = [
    'Movilidad', 'Vivienda', 'Empresas', 'Arrendamiento',
    'Copropiedades', 'Hogar', 'Pymes', 'Cumplimiento',
    'Agro y Transporte', 'Decenal y Maquinaria',
  ];

  console.log('Consultando por Tribu/Squad...');
  for (let i = 0; i < tribuQueries.length; i += 2) {
    const batch = tribuQueries.slice(i, i + 2);
    const conditions = batch.map(t => `cf[27826] in cascadeOption("${t}")`).join(' OR ');
    const jql = `${baseFilter} AND (${conditions}) AND created >= "2024-01-01" ORDER BY created DESC`;
    try {
      const issues = await fetchWithJQL(jql);
      for (const issue of issues) {
        if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); }
      }
      console.log(`  ${batch.join(', ')}: total acumulado ${allIssues.length}`);
    } catch (err) {
      console.warn(`  ⚠️ ${err.message.slice(0, 100)}`);
      for (const t of batch) {
        try {
          const issues = await fetchWithJQL(`${baseFilter} AND cf[27826] in cascadeOption("${t}") AND created >= "2024-01-01" ORDER BY created DESC`);
          for (const issue of issues) { if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); } }
        } catch (e) { console.warn(`    ⚠️ ${e.message.slice(0, 60)}`); }
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`  Subtotal Tribu/Squad: ${allIssues.length}`);

  // Complementar con categoría/ítem (para incidencias sin Tribu/Squad)
  console.log('Complementando con Categoría/Ítem...');
  const catJQL = `${baseFilter} AND cf[10409] in cascadeOption("Aplicaciones Fuerza Ventas") AND created >= "2024-01-01" ORDER BY created DESC`;
  try {
    const issues = await fetchWithJQL(catJQL);
    let n = 0;
    for (const issue of issues) { if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); n++; } }
    console.log(`  Aplicaciones Fuerza Ventas: +${n} nuevas`);
  } catch (err) { console.error(`  ❌ ${err.message.slice(0, 100)}`); }

  const items = ['SAI', 'SAI WEB', 'SIOS', 'TRONADOR BANCA + MOVILIDAD', 'TRONADOR CIA 3 EXCEPTO AUTOS Y SOAT', 'Tronador Contingencia', 'Planificador Agrícola', 'Obra al día', 'Constructor', 'VentaDigitalAutos - IBM', 'VentaSoatDigital - IBM'];
  for (let i = 0; i < items.length; i += 3) {
    const batch = items.slice(i, i + 3).map(it => `cf[10409] in cascadeOption("Aplicaciones Empresariales", "${it}")`);
    try {
      const issues = await fetchWithJQL(`${baseFilter} AND (${batch.join(' OR ')}) AND created >= "2024-01-01" ORDER BY created DESC`);
      let n = 0;
      for (const issue of issues) { if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); n++; } }
      if (n > 0) console.log(`  +${n} de Empresariales`);
    } catch (e) { /* ignore */ }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nTotal: ${allIssues.length} incidencias.`);
  return allIssues;
}

// ============ MAIN ============

async function main() {
  try {
    const rawIssues = await fetchAllIncidencias();
    const incidencias = rawIssues.map(clasificar).filter(Boolean);

    // Calcular edad
    const now = new Date();
    for (const inc of incidencias) {
      const created = new Date(inc.createdDate);
      const resolved = inc.resolvedDate ? new Date(inc.resolvedDate) : null;
      inc.edadDias = Math.max(0, Math.floor(((resolved || now).getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
      if (resolved) {
        const dias = inc.edadDias;
        if (dias === 0) inc.rangoResolucion = 'Mismo día';
        else if (dias <= 2) inc.rangoResolucion = '1-2 días';
        else if (dias <= 7) inc.rangoResolucion = '3-7 días';
        else if (dias <= 14) inc.rangoResolucion = '1-2 semanas';
        else if (dias <= 28) inc.rangoResolucion = '2-4 semanas';
        else inc.rangoResolucion = 'Más de 4 semanas';
      } else {
        inc.rangoResolucion = null;
      }
    }

    const output = { lastUpdated: new Date().toISOString(), totalRaw: rawIssues.length, totalClasificadas: incidencias.length, incidencias };
    const outputPath = path.join(__dirname, '..', 'public', 'data', 'incidencias.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`\n✅ ${incidencias.length} incidencias clasificadas de ${rawIssues.length} consultadas`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
