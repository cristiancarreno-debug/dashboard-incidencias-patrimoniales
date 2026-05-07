/**
 * Script de extracción de datos de Jira para el Dashboard de Incidencias Patrimoniales.
 * Consulta MDSB filtrando SOLO por los ítems de configuración específicos de patrimoniales.
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

/** Extrae texto plano de un documento ADF (Atlassian Document Format) */
function extractTextFromADF(adf) {
  if (!adf) return '';
  if (typeof adf === 'string') return adf;
  let text = '';
  if (adf.text) text += adf.text;
  if (adf.content && Array.isArray(adf.content)) {
    for (const node of adf.content) {
      text += extractTextFromADF(node) + ' ';
    }
  }
  return text;
}

/** Ítems de configuración específicos de patrimoniales con su clasificación */
const ITEMS_PATRIMONIALES = [
  { item: 'Análisis de Solicitudes', aplicacion: 'Estudio Digital', producto: 'Arrendamiento', tribu: 'Arrendamiento', squad: 'Arrendamiento' },
  { item: 'Análisis Digital El Libertador', aplicacion: 'Estudio Digital', producto: 'Arrendamiento', tribu: 'Arrendamiento', squad: 'Arrendamiento' },
  { item: 'Biometría Facial', aplicacion: 'Biometría facial', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'Constructor', aplicacion: 'Plataforma Constructor', producto: 'Cuotas al día', tribu: 'Vivienda', squad: 'Copropiedades' },
  { item: 'CONSTRUPLAN', aplicacion: 'Plataforma Constructor', producto: 'Cuotas al día', tribu: 'Vivienda', squad: 'Copropiedades' },
  { item: 'Copropiedades', aplicacion: 'Plataforma Constructor', producto: 'Cuotas al día', tribu: 'Vivienda', squad: 'Copropiedades' },
  { item: 'Cuotas al día', aplicacion: 'Plataforma Constructor', producto: 'Cuotas al día', tribu: 'Vivienda', squad: 'Copropiedades' },
  { item: 'Datamart - Libertador', aplicacion: 'Datamart', producto: 'Arrendamiento', tribu: 'Arrendamiento', squad: 'Arrendamiento' },
  { item: 'Jelpit Conjuntos Cuotas al día', aplicacion: 'Jelpit Conjuntos', producto: 'Cuotas al día', tribu: 'Vivienda', squad: 'Copropiedades' },
  { item: 'Jelpit Pymes', aplicacion: 'Jelpit Conjuntos', producto: 'Pymes', tribu: 'Empresas', squad: 'Pymes' },
  { item: 'Obra al día', aplicacion: 'Obra al día', producto: 'Obra al día', tribu: 'Vivienda', squad: 'Copropiedades' },
  { item: 'Planificador Agrícola', aplicacion: 'Plataforma agro', producto: 'Agro', tribu: 'Empresas', squad: 'Agro y Transporte' },
  { item: 'Recaudo Electrónico SOAT', aplicacion: 'Portal de pagos', producto: 'SOAT', tribu: 'Movilidad', squad: 'Movilidad' },
  { item: 'SAI', aplicacion: 'SAI', producto: 'Arrendamiento', tribu: 'Arrendamiento', squad: 'Arrendamiento' },
  { item: 'SAI WEB', aplicacion: 'SAI', producto: 'Arrendamiento', tribu: 'Arrendamiento', squad: 'Arrendamiento' },
  { item: 'SIMON - Cotizador Consultas', aplicacion: 'Simon Cotizadores', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'SIMON - Cotizadores', aplicacion: 'Simon Cotizadores', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'SIMON - Cotizadores Agro', aplicacion: 'Simon Cotizadores', producto: 'Agro', tribu: 'Empresas', squad: 'Agro y Transporte' },
  { item: 'SIMON - Cotizadores Autos', aplicacion: 'Simon Cotizadores', producto: 'Autos', tribu: 'Movilidad', squad: 'Movilidad' },
  { item: 'SIMON - Cotizadores Hogar', aplicacion: 'Simon Cotizadores', producto: 'Hogar', tribu: 'Vivienda', squad: 'Hogar' },
  { item: 'SIMON - Cotizadores Pymes + Digital (Prod. 778)', aplicacion: 'Simon Cotizadores', producto: 'Pymes', tribu: 'Empresas', squad: 'Pymes' },
  { item: 'SIMON - Cotizadores Tranquilidad Pymes (Prod. 777)', aplicacion: 'Simon Cotizadores', producto: 'Pymes', tribu: 'Empresas', squad: 'Pymes' },
  { item: 'SIMON - Cumplimiento', aplicacion: 'Simon Cotizadores', producto: 'Cumplimiento', tribu: 'Empresas', squad: 'Cumplimiento' },
  { item: 'SIMON - Soat', aplicacion: 'Simon Cotizadores', producto: 'SOAT', tribu: 'Movilidad', squad: 'Movilidad' },
  { item: 'SIMON - Soat Falabella', aplicacion: 'Simon Web', producto: 'SOAT', tribu: 'Movilidad', squad: 'Movilidad' },
  { item: 'SIMON WEB EMISION-TRONADOR CIA 3 EXCEPTO AUTOS Y SOAT', aplicacion: 'Simon WEB', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'SIMON WEB REASEGUROS CIA 3 EXCEPTO AUTOS Y SOAT', aplicacion: 'Simon WEB', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'SIMON WEB SINIESTROS CIA 3', aplicacion: 'Simon WEB', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'SIMON WEB SINIESTROS CIA 3 EXCEPTO AUTOS Y SOAT', aplicacion: 'Simon WEB', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'SIMON WEB VENTAS CIA 3', aplicacion: 'Simon WEB', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'SIOS', aplicacion: 'Sios', producto: 'Arrendamiento', tribu: 'Arrendamiento', squad: 'Arrendamiento' },
  { item: 'TRONADOR BANCA + MOVILIDAD', aplicacion: 'Tronador', producto: 'Autos', tribu: 'Movilidad', squad: 'Movilidad' },
  { item: 'TRONADOR CIA 3 EXCEPTO AUTOS Y SOAT', aplicacion: 'Tronador', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'Tronador Batch (Cartera, reserva, cierres)', aplicacion: 'Tronador', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'Tronador Contingencia', aplicacion: 'Tronador', producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' },
  { item: 'VentaDigitalAutos - IBM', aplicacion: 'Simon Ventas', producto: 'Autos', tribu: 'Movilidad', squad: 'Movilidad' },
  { item: 'VentaSoatDigital - IBM', aplicacion: 'Simon Ventas', producto: 'SOAT', tribu: 'Movilidad', squad: 'Movilidad' },
  { item: 'ARCGIS', aplicacion: 'Arcgis', producto: 'Multiproducto', tribu: 'Vivienda', squad: 'Multiproducto' },
];

function clasificar(childValue, parentValue, summary, tribuJira, squadJira, clasificacionDetallada) {
  const s = (summary || '').toLowerCase();

  // Excluir problemas de accesos
  if (s.includes('acceso') || s.includes('control accesos') || s.includes('permisos') || s.includes('contraseña') || s.includes('password') || s.includes('login') || s.includes('usuario bloqueado')) {
    return { producto: '__EXCLUIR_ACCESOS__', tribu: '', squad: '', plataforma: '' };
  }

  // PASO 1: Revisar campo Tribu/Squad de Jira
  // PASO 2: Validar con la descripción
  // Si coinciden → asociar a la tribu de Jira
  // Si NO coinciden → asociar al producto que identifique en la descripción

  // Identificar producto por texto (summary + descripción)
  const productoTexto = identificarProductoPorTexto(s);

  // Si se identificó producto en el texto, usarlo (prevalece)
  if (productoTexto) {
    const tribuSquad = derivarTribuSquadDeProducto(productoTexto);
    const plataforma = determinarPlataforma(childValue, parentValue, summary);
    return { producto: productoTexto, tribu: tribuSquad.tribu, squad: tribuSquad.squad, plataforma };
  }

  // Si NO se identificó producto en texto, usar Tribu/Squad de Jira + squad para inferir
  if (tribuJira && TRIBUS_JIRA_VALIDAS.has(tribuJira)) {
    let producto = 'Multiproducto';
    if (squadJira) {
      const sq = squadJira.toLowerCase();
      if (sq.includes('movilidad')) producto = 'Autos';
      else if (sq.includes('hogar')) producto = 'Hogar';
      else if (sq.includes('copropiedades')) producto = 'Cuotas al día';
      else if (sq.includes('pymes')) producto = 'Pymes';
      else if (sq.includes('cumplimiento')) producto = 'Cumplimiento';
      else if (sq.includes('agro')) producto = 'Agro';
      else if (sq.includes('decenal') || sq.includes('maquinaria')) producto = 'Decenal';
      else if (sq.includes('arrendamiento')) producto = 'Arrendamiento';
    } else {
      // Sin squad, usar tribu directamente
      if (tribuJira === 'Movilidad') producto = 'Autos';
      else if (tribuJira === 'Arrendamiento') producto = 'Arrendamiento';
    }

    if (producto !== 'Multiproducto') {
      const tribuSquad = derivarTribuSquadDeProducto(producto);
      const plataforma = determinarPlataforma(childValue, parentValue, summary);
      return { producto, tribu: tribuSquad.tribu, squad: tribuSquad.squad, plataforma };
    }
  }

  // No se pudo clasificar
  return { producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto', plataforma: determinarPlataforma(childValue, parentValue, summary) };
}

/** Identifica el producto basándose SOLO en el texto (summary + descripción) */
function identificarProductoPorTexto(s) {
  if (s.includes('soat')) return 'SOAT';
  if (s.includes('autos') || s.includes('auto ') || s.includes('vehiculo') || s.includes('vehículo')) return 'Autos';
  if (s.includes('hogar')) return 'Hogar';
  if (s.includes('cumplimiento')) return 'Cumplimiento';
  if (s.includes('pymes') || s.includes('pyme') || s.includes('prod. 778') || s.includes('prod. 777')) return 'Pymes';
  if (s.includes('agro') || s.includes('agrícola') || s.includes('agricola')) return 'Agro';
  if (s.includes('transporte') || s.includes('prod 40')) return 'Transporte';
  if (s.includes('maquinaria') || s.includes('prod 152') || s.includes('producto 152')) return 'Maquinaria';
  if (s.includes('decenal')) return 'Decenal';
  if (s.includes('zonas comunes') || s.includes('copropiedades') || s.includes('copropiedad')) return 'Zonas comunes';
  if (s.includes('obra al día') || s.includes('obra al dia')) return 'Obra al día';
  if (s.includes('cuotas al día') || s.includes('cuotas al dia') || s.includes('jelpit conjuntos')) return 'Cuotas al día';
  if (s.includes('arrendamiento') || s.includes('sai ') || s.includes('libertador')) return 'Arrendamiento';
  return null; // No se pudo identificar
}

/** Deriva tribu y squad a partir del producto (fuente de verdad única) */
function derivarTribuSquadDeProducto(producto) {
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
  return map[producto] || { tribu: 'Multiproducto', squad: 'Multiproducto' };
}

function determinarPlataforma(childValue, parentValue, summary) {
  if (childValue) {
    const match = ITEMS_PATRIMONIALES.find(c => c.item === childValue);
    if (match) return match.aplicacion;
  }
  const s = (summary || '').toLowerCase();
  if (s.includes('tronador')) return 'Tronador';
  if (s.includes('simon web')) return 'Simon WEB';
  if (s.includes('simon') && s.includes('cotizador')) return 'Simon Cotizadores';
  if (s.includes('simon')) return 'Simon Cotizadores';
  if (s.includes('jelpit')) return 'Jelpit Conjuntos';
  if (s.includes('sai')) return 'SAI';
  if (s.includes('arcgis')) return 'Arcgis';
  return parentValue || 'Sin plataforma';
}

function jiraRequest(urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, JIRA_BASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
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
  const fields = 'summary,status,assignee,created,resolutiondate,customfield_10409,customfield_27826,customfield_11219,customfield_10403,description';
  const maxResults = 100;
  let allIssues = [];
  let nextPageToken = null;

  do {
    const encodedJql = encodeURIComponent(jql);
    let url = `/rest/api/3/search/jql?jql=${encodedJql}&fields=${fields}&maxResults=${maxResults}`;
    if (nextPageToken) {
      url += `&nextPageToken=${encodeURIComponent(nextPageToken)}`;
    }
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

  // ENFOQUE 1: Traer por campo Tribu/Squad (cf[27826])
  const tribuQueries = [
    `cf[27826] in cascadeOption("Movilidad")`,
    `cf[27826] in cascadeOption("Vivienda")`,
    `cf[27826] in cascadeOption("Empresas")`,
    `cf[27826] in cascadeOption("Arrendamiento")`,
    `cf[27826] in cascadeOption("Copropiedades")`,
    `cf[27826] in cascadeOption("Hogar")`,
    `cf[27826] in cascadeOption("Pymes")`,
    `cf[27826] in cascadeOption("Cumplimiento")`,
    `cf[27826] in cascadeOption("Agro y Transporte")`,
    `cf[27826] in cascadeOption("Decenal y Maquinaria")`,
  ];

  console.log('ENFOQUE 1: Consultando por Tribu/Squad...');
  for (let i = 0; i < tribuQueries.length; i += 3) {
    const batch = tribuQueries.slice(i, i + 3);
    const jql = `${baseFilter} AND (${batch.join(' OR ')}) AND created >= "2024-01-01" ORDER BY created DESC`;
    try {
      const issues = await fetchWithJQL(jql);
      for (const issue of issues) {
        if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); }
      }
      console.log(`  Lote ${Math.floor(i / 3) + 1}: ${issues.length} issues (total: ${allIssues.length})`);
    } catch (err) {
      console.warn(`  ⚠️ Error: ${err.message.slice(0, 100)}`);
      for (const q of batch) {
        try {
          const issues = await fetchWithJQL(`${baseFilter} AND ${q} AND created >= "2024-01-01" ORDER BY created DESC`);
          for (const issue of issues) { if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); } }
        } catch (e) { console.warn(`    ⚠️ ${e.message.slice(0, 60)}`); }
      }
    }
    if (i + 3 < tribuQueries.length) await new Promise(r => setTimeout(r, 300));
  }
  console.log(`  Subtotal Tribu/Squad: ${allIssues.length}`);

  // ENFOQUE 2: Traer por categoría/ítem de configuración (complementa lo que no tiene Tribu/Squad)
  console.log('ENFOQUE 2: Consultando por Categoría/Ítem Configuración...');
  const catJQL = `${baseFilter} AND cf[10409] in cascadeOption("Aplicaciones Fuerza Ventas") AND created >= "2024-01-01" ORDER BY created DESC`;
  try {
    const issues = await fetchWithJQL(catJQL);
    let newCount = 0;
    for (const issue of issues) {
      if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); newCount++; }
    }
    console.log(`  Aplicaciones Fuerza Ventas: ${issues.length} issues (${newCount} nuevas)`);
  } catch (err) { console.error(`  ❌ ${err.message.slice(0, 100)}`); }

  const additionalItems = [
    'SAI', 'SAI WEB', 'SIOS', 'TRONADOR BANCA + MOVILIDAD',
    'TRONADOR CIA 3 EXCEPTO AUTOS Y SOAT', 'Tronador Contingencia',
    'Tronador Batch (Cartera, reserva, cierres)', 'ARCGIS',
    'Planificador Agrícola', 'Obra al día', 'Constructor', 'CONSTRUPLAN',
    'Cuotas al día', 'Biometría Facial', 'VentaDigitalAutos - IBM', 'VentaSoatDigital - IBM',
  ];
  for (let i = 0; i < additionalItems.length; i += 4) {
    const batch = additionalItems.slice(i, i + 4).map(item => `cf[10409] in cascadeOption("Aplicaciones Empresariales", "${item}")`);
    const jql = `${baseFilter} AND (${batch.join(' OR ')}) AND created >= "2024-01-01" ORDER BY created DESC`;
    try {
      const issues = await fetchWithJQL(jql);
      let newCount = 0;
      for (const issue of issues) { if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); newCount++; } }
      if (newCount > 0) console.log(`  Empresariales lote: +${newCount} nuevas`);
    } catch (err) { console.warn(`  ⚠️ ${err.message.slice(0, 80)}`); }
    await new Promise(r => setTimeout(r, 200));
  }

  // Activos Digitales específicos
  for (const item of ['Jelpit Conjuntos Cuotas al día', 'Jelpit Pymes']) {
    try {
      const issues = await fetchWithJQL(`${baseFilter} AND cf[10409] in cascadeOption("Activos Digitales", "${item}") AND created >= "2024-01-01" ORDER BY created DESC`);
      for (const issue of issues) { if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); } }
    } catch (e) { /* ignore */ }
  }

  console.log(`\nTotal único combinado: ${allIssues.length} incidencias.`);
  return allIssues;
}

/** Tribus/Squads a excluir */
const TRIBUS_EXCLUIDAS = new Set([
  'ARL', 'COREX', 'Servicio', 'Operaciones y Canales', 'Operaciones', 'Canales',
  'Servicio, Operaciones y Canales', 'Areas Corporativas', 'Bancaseguros y Negocios Digitales',
  'Bancaseguros', 'Negocios Digitales', 'Vida', 'Salud', 'Personas',
]);

/** Tribus de Jira que SÍ son de patrimoniales */
const TRIBUS_JIRA_VALIDAS = new Set([
  'Movilidad', 'Vivienda', 'Empresas', 'Arrendamiento',
  'Copropiedades', 'Hogar', 'Pymes', 'Cumplimiento',
  'Agro y Transporte', 'Decenal y Maquinaria',
]);

/** Tribus VÁLIDAS de patrimoniales — solo estas se incluyen */
const TRIBUS_VALIDAS = new Set(['Movilidad', 'Vivienda', 'Empresas', 'Arrendamiento']);

/** Squads VÁLIDOS de patrimoniales */
const SQUADS_VALIDOS = new Set([
  'Movilidad', 'Hogar', 'Copropiedades', 'Decenal y Maquinaria',
  'Pymes', 'Cumplimiento', 'Agro y Transporte', 'Arrendamiento',
]);

/** Vicepresidencias a excluir */
const VICEPRESIDENCIAS_EXCLUIDAS = new Set(['VIC. NEGOCIOS DE PERSONAS']);

function transformIssue(issue) {
  const fields = issue.fields;
  const childValue = fields.customfield_10409?.child?.value || null;
  const parentValue = fields.customfield_10409?.value || null;

  // Excluir vicepresidencias no deseadas
  const vicepresidencia = fields.customfield_10403?.value || null;
  if (vicepresidencia && VICEPRESIDENCIAS_EXCLUIDAS.has(vicepresidencia)) return null;

  // Campo Tribu/Squad de Jira (customfield_27826)
  const tribuSquadJira = fields.customfield_27826?.value || null;
  const squadJira = fields.customfield_27826?.child?.value || null;

  // Excluir tribus explícitamente no deseadas
  if (tribuSquadJira && TRIBUS_EXCLUIDAS.has(tribuSquadJira)) return null;
  if (squadJira && TRIBUS_EXCLUIDAS.has(squadJira)) return null;

  // Si la tribu de Jira está definida, solo incluir si es de patrimoniales
  // (Ya filtrado por JQL, pero doble verificación)
  if (tribuSquadJira && !TRIBUS_JIRA_VALIDAS.has(tribuSquadJira)) return null;

  // Campo de clasificación detallada (customfield_11219 = "ANALÍTICA - Autos")
  const clasificacionDetallada = fields.customfield_11219?.value || null;

  // Descripción para clasificación más precisa
  let description = '';
  if (typeof fields.description === 'string') {
    description = fields.description;
  } else if (fields.description && typeof fields.description === 'object') {
    // ADF format - extraer texto de los nodos
    description = extractTextFromADF(fields.description);
  }
  const textoCompleto = `${fields.summary || ''} ${description}`;

  const clasificacion = clasificar(childValue, parentValue, textoCompleto, tribuSquadJira, squadJira, clasificacionDetallada);

  // Si no se pudo clasificar, descartar
  if (!clasificacion) return null;

  // Excluir problemas de accesos
  if (clasificacion.producto === '__EXCLUIR_ACCESOS__') return null;

  // Excluir Multiproducto (no se puede asignar a un producto específico)
  if (clasificacion.producto === 'Multiproducto' || clasificacion.tribu === 'Multiproducto') return null;

  // Solo incluir tribus válidas de patrimoniales
  if (!TRIBUS_VALIDAS.has(clasificacion.tribu)) return null;

  // Excluir estados cancelados (doble verificación post-query)
  const status = fields.status?.name || '';
  const statusLower = status.toLowerCase();
  if (statusLower === 'cancelado' || statusLower === 'cancelada' || statusLower.includes('cancel')) return null;

  // Excluir ítems relacionados con CIA 2, Vida, Salud, ARL
  const itemChild = childValue || '';
  const itemParent = parentValue || '';
  const summaryText = fields.summary || '';
  const combinedText = `${itemChild} ${itemParent} ${summaryText}`.toLowerCase();
  if (combinedText.includes('cia 2') || combinedText.includes('vida') || combinedText.includes('salud') || combinedText.includes('arl')) return null;

  const createdDate = fields.created;
  const resolvedDate = fields.resolutiondate || null;
  const now = new Date();
  const created = new Date(createdDate);
  const resolved = resolvedDate ? new Date(resolvedDate) : null;
  const edadDias = Math.max(0, Math.floor(((resolved || now).getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));

  let rangoResolucion = null;
  if (resolved) {
    if (edadDias === 0) rangoResolucion = 'Mismo día';
    else if (edadDias <= 2) rangoResolucion = '1-2 días';
    else if (edadDias <= 7) rangoResolucion = '3-7 días';
    else if (edadDias <= 14) rangoResolucion = '1-2 semanas';
    else if (edadDias <= 28) rangoResolucion = '2-4 semanas';
    else rangoResolucion = 'Más de 4 semanas';
  }

  return {
    key: issue.key,
    summary: fields.summary,
    status: fields.status?.name || 'Desconocido',
    assignee: fields.assignee?.displayName || null,
    createdDate,
    resolvedDate,
    producto: clasificacion.producto,
    tribu: clasificacion.tribu,
    squad: clasificacion.squad,
    plataforma: clasificacion.plataforma,
    edadDias,
    rangoResolucion,
    jiraUrl: `${JIRA_BASE_URL}/browse/${issue.key}`,
  };
}

async function main() {
  try {
    const rawIssues = await fetchAllIncidencias();
    const incidencias = rawIssues.map(transformIssue).filter(Boolean);

    const output = {
      lastUpdated: new Date().toISOString(),
      totalRaw: rawIssues.length,
      totalClasificadas: incidencias.length,
      incidencias,
    };

    const outputPath = path.join(__dirname, '..', 'public', 'data', 'incidencias.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`\n✅ Datos guardados en ${outputPath}`);
    console.log(`   ${incidencias.length} incidencias clasificadas de ${rawIssues.length} consultadas`);
    console.log(`   Última actualización: ${output.lastUpdated}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
