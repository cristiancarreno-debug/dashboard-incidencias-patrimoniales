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

/** Intenta identificar producto específico por keywords en el texto */
function identificarProducto(texto) {
  const s = texto.toLowerCase();
  if (s.includes('soat')) return 'SOAT';
  if (s.includes('autos') || s.includes('auto ') || s.includes('cotizadores autos') || s.includes('tronador banca') || s.includes('banca + movilidad')) return 'Autos';
  if (s.includes('hogar')) return 'Hogar';
  if (s.includes('cumplimiento')) return 'Cumplimiento';
  if (s.includes('pymes') || s.includes('pyme')) return 'Pymes';
  if (s.includes('agro') || s.includes('agrícola')) return 'Agro';
  if (s.includes('transporte') || s.includes('prod 40')) return 'Transporte';
  if (s.includes('maquinaria') || s.includes('prod 152') || s.includes('producto 152')) return 'Maquinaria';
  if (s.includes('decenal')) return 'Decenal';
  if (s.includes('zonas comunes') || s.includes('copropiedades')) return 'Zonas comunes';
  if (s.includes('obra al día') || s.includes('obra al dia')) return 'Obra al día';
  if (s.includes('cuotas al día') || s.includes('cuotas al dia') || s.includes('jelpit conjuntos')) return 'Cuotas al día';
  if (s.includes('arrendamiento') || s.includes('sai ') || s.includes('libertador')) return 'Arrendamiento';
  return null;
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
 * 1. Si Tribu/Squad de Jira es válida → SIEMPRE incluir, usar keywords solo para producto específico
 * 2. Si Tribu/Squad vacía → usar keywords para determinar producto y tribu (fallback)
 * 3. Si no se puede clasificar → excluir
 */
function clasificar(issue) {
  const fields = issue.fields;
  const tribuJira = fields.customfield_27826?.value || null;
  const squadJira = fields.customfield_27826?.child?.value || null;
  const summary = fields.summary || '';
  let description = '';
  if (typeof fields.description === 'string') description = fields.description;
  else if (fields.description && typeof fields.description === 'object') description = extractTextFromADF(fields.description);
  const texto = `${summary} ${description}`;

  // Estado cancelado → excluir
  const status = fields.status?.name || '';
  if (status.toLowerCase() === 'cancelado' || status.toLowerCase() === 'cancelada') return null;

  // CASO 1: Tribu/Squad de Jira está llena y es válida → SIEMPRE incluir
  if (tribuJira && TRIBUS_JIRA_VALIDAS.has(tribuJira)) {
    const tribu = TRIBU_MAP[tribuJira] || tribuJira;

    // Intentar determinar producto específico por keywords
    let producto = identificarProducto(texto);

    // Si no se encontró producto por keywords, usar producto por defecto de la tribu/squad
    if (!producto) {
      producto = PRODUCTO_DEFAULT[squadJira] || PRODUCTO_DEFAULT[tribuJira] || 'Autos';
    }

    const tribuSquad = derivarTribuSquad(producto);
    const plataforma = determinarPlataforma(summary);

    return {
      key: issue.key,
      summary,
      status: status,
      assignee: fields.assignee?.displayName || null,
      createdDate: fields.created,
      resolvedDate: fields.resolutiondate || null,
      producto,
      tribu: tribuSquad.tribu,
      squad: tribuSquad.squad,
      plataforma,
      jiraUrl: `${JIRA_BASE_URL}/browse/${issue.key}`,
    };
  }

  // CASO 2: Tribu/Squad vacía → usar keywords como fallback
  const producto = identificarProducto(texto);
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
