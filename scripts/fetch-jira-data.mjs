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

/** Set de ítems válidos para filtrado post-query */
const ITEMS_VALIDOS = new Set(ITEMS_PATRIMONIALES.map(i => i.item));

function clasificar(childValue, parentValue, summary) {
  // Buscar por el valor hijo (ítem específico)
  if (childValue) {
    const match = ITEMS_PATRIMONIALES.find(c => c.item === childValue);
    if (match) {
      return { producto: match.producto, tribu: match.tribu, squad: match.squad, plataforma: match.aplicacion };
    }
  }
  return null; // No es de patrimoniales
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

/**
 * Construye múltiples JQLs específicos por ítem hijo para traer SOLO patrimoniales.
 * Usa cascadeOption con padre e hijo para precisión.
 */
function buildJQLQueries() {
  // Agrupar ítems por categoría padre para construir JQLs eficientes
  const queries = [];

  // Ítems bajo "Aplicaciones Empresariales"
  const empresariales = ['SAI', 'SAI WEB', 'SIOS', 'TRONADOR BANCA + MOVILIDAD', 'TRONADOR CIA 3 EXCEPTO AUTOS Y SOAT', 'ARCGIS', 'Planificador Agrícola', 'Obra al día', 'Constructor', 'CONSTRUPLAN', 'Cuotas al día', 'Biometría Facial', 'Tronador Contingencia', 'VentaDigitalAutos - IBM', 'VentaSoatDigital - IBM'];
  for (const item of empresariales) {
    queries.push(`cf[10409] in cascadeOption("Aplicaciones Empresariales", "${item}")`);
  }

  // Ítems bajo "Aplicaciones Fuerza Ventas"
  const fuerzaVentas = ['SIMON - Cotizador Consultas', 'SIMON - Cotizadores', 'SIMON - Cotizadores Agro', 'SIMON - Cotizadores Autos', 'SIMON - Cotizadores Hogar', 'SIMON - Cotizadores Pymes + Digital (Prod. 778)', 'SIMON - Cotizadores Tranquilidad Pymes (Prod. 777)', 'SIMON - Cumplimiento', 'SIMON - Soat', 'SIMON - Soat Falabella', 'SIMON WEB EMISION-TRONADOR CIA 3 EXCEPTO AUTOS Y SOAT', 'SIMON WEB REASEGUROS CIA 3 EXCEPTO AUTOS Y SOAT', 'SIMON WEB SINIESTROS CIA 3', 'SIMON WEB SINIESTROS CIA 3 EXCEPTO AUTOS Y SOAT', 'SIMON WEB VENTAS CIA 3', 'Copropiedades', 'Datamart - Libertador', 'Recaudo Electrónico SOAT'];
  for (const item of fuerzaVentas) {
    queries.push(`cf[10409] in cascadeOption("Aplicaciones Fuerza Ventas", "${item}")`);
  }

  // Ítems bajo "Activos Digitales"
  const activosDigitales = ['Jelpit Conjuntos Cuotas al día', 'Jelpit Pymes'];
  for (const item of activosDigitales) {
    queries.push(`cf[10409] in cascadeOption("Activos Digitales", "${item}")`);
  }

  // Ítems bajo "IA"
  queries.push(`cf[10409] in cascadeOption("IA", "Análisis de Solicitudes")`);

  return queries;
}

async function fetchWithJQL(jql) {
  const fields = 'summary,status,assignee,created,resolutiondate,customfield_10409';
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
  const subQueries = buildJQLQueries();

  // Ejecutar en lotes de 5 para no saturar la API
  const batchSize = 5;
  let allIssues = [];
  const seenKeys = new Set();

  console.log(`Ejecutando ${subQueries.length} consultas a Jira...`);

  for (let i = 0; i < subQueries.length; i += batchSize) {
    const batch = subQueries.slice(i, i + batchSize);
    const combinedJql = `project = MDSB AND issuetype = Incident AND (${batch.join(' OR ')}) AND created >= "2024-01-01" ORDER BY created DESC`;

    try {
      const issues = await fetchWithJQL(combinedJql);
      for (const issue of issues) {
        if (!seenKeys.has(issue.key)) {
          seenKeys.add(issue.key);
          allIssues.push(issue);
        }
      }
      console.log(`  Lote ${Math.floor(i / batchSize) + 1}: ${issues.length} issues (total acumulado: ${allIssues.length})`);
    } catch (err) {
      console.warn(`  ⚠️ Error en lote ${Math.floor(i / batchSize) + 1}: ${err.message}`);
      // Intentar uno por uno si el lote falla
      for (const q of batch) {
        try {
          const singleJql = `project = MDSB AND issuetype = Incident AND ${q} AND created >= "2024-01-01" ORDER BY created DESC`;
          const issues = await fetchWithJQL(singleJql);
          for (const issue of issues) {
            if (!seenKeys.has(issue.key)) {
              seenKeys.add(issue.key);
              allIssues.push(issue);
            }
          }
        } catch (e) {
          console.warn(`    ⚠️ Falló query individual: ${e.message.slice(0, 100)}`);
        }
      }
    }

    // Pausa entre lotes para respetar rate limits
    if (i + batchSize < subQueries.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\nTotal único: ${allIssues.length} incidencias de patrimoniales.`);
  return allIssues;
}

function transformIssue(issue) {
  const fields = issue.fields;
  const childValue = fields.customfield_10409?.child?.value || null;
  const parentValue = fields.customfield_10409?.value || null;

  const clasificacion = clasificar(childValue, parentValue, fields.summary);

  // Si no se pudo clasificar, descartar (no es de patrimoniales)
  if (!clasificacion) return null;

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
