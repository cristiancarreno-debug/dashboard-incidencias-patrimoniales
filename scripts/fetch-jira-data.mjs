/**
 * Script de extracción de datos de Jira para el Dashboard de Incidencias Patrimoniales.
 * Se ejecuta durante el build de GitHub Actions.
 * Consulta el proyecto MDSB, filtra por ítems de configuración de patrimoniales,
 * clasifica cada incidencia y genera un JSON estático.
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
  console.error('ERROR: JIRA_EMAIL y JIRA_API_TOKEN deben estar configurados como variables de entorno.');
  process.exit(1);
}

const AUTH_HEADER = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;

/** Tabla de clasificación: Item Configuración → Producto/Tribu/Squad/Aplicación */
const CLASIFICACION_MAP = [
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

/**
 * Clasifica una incidencia basándose en el campo Ítem Configuración.
 */
function clasificar(itemConfiguracion, summary) {
  if (!itemConfiguracion) {
    return { producto: 'Sin clasificar', tribu: 'Sin clasificar', squad: 'Sin clasificar', plataforma: 'Sin plataforma' };
  }

  const match = CLASIFICACION_MAP.find(c => c.item === itemConfiguracion);
  if (match) {
    return {
      producto: match.producto,
      tribu: match.tribu,
      squad: match.squad,
      plataforma: match.aplicacion,
    };
  }

  // Intentar clasificar por keywords en el summary
  const summaryLower = (summary || '').toLowerCase();
  if (summaryLower.includes('soat')) return { producto: 'SOAT', tribu: 'Movilidad', squad: 'Movilidad', plataforma: itemConfiguracion };
  if (summaryLower.includes('auto')) return { producto: 'Autos', tribu: 'Movilidad', squad: 'Movilidad', plataforma: itemConfiguracion };
  if (summaryLower.includes('hogar')) return { producto: 'Hogar', tribu: 'Vivienda', squad: 'Hogar', plataforma: itemConfiguracion };
  if (summaryLower.includes('cumplimiento')) return { producto: 'Cumplimiento', tribu: 'Empresas', squad: 'Cumplimiento', plataforma: itemConfiguracion };
  if (summaryLower.includes('pymes')) return { producto: 'Pymes', tribu: 'Empresas', squad: 'Pymes', plataforma: itemConfiguracion };
  if (summaryLower.includes('agro')) return { producto: 'Agro', tribu: 'Empresas', squad: 'Agro y Transporte', plataforma: itemConfiguracion };
  if (summaryLower.includes('transporte')) return { producto: 'Transporte', tribu: 'Empresas', squad: 'Agro y Transporte', plataforma: itemConfiguracion };
  if (summaryLower.includes('jelpit') || summaryLower.includes('conjuntos')) return { producto: 'Cuotas al día', tribu: 'Vivienda', squad: 'Copropiedades', plataforma: 'Jelpit Conjuntos' };
  if (summaryLower.includes('arrendamiento') || summaryLower.includes('sai')) return { producto: 'Arrendamiento', tribu: 'Arrendamiento', squad: 'Arrendamiento', plataforma: 'SAI' };

  return { producto: 'Sin clasificar', tribu: 'Sin clasificar', squad: 'Sin clasificar', plataforma: itemConfiguracion || 'Sin plataforma' };
}

/**
 * Hace una petición HTTP a la API de Jira.
 */
function jiraRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, JIRA_BASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Jira API error ${res.statusCode}: ${data.slice(0, 200)}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * Obtiene todas las incidencias paginando la API de Jira.
 */
async function fetchAllIncidencias() {
  const JQL = `project = MDSB AND issuetype = Incident AND (cf[10409] in cascadeOption("Aplicaciones Fuerza Ventas") OR cf[10409] in cascadeOption("Aplicaciones Empresariales", "SAI") OR cf[10409] in cascadeOption("Aplicaciones Empresariales", "SAI WEB") OR cf[10409] in cascadeOption("Aplicaciones Empresariales", "SIOS") OR cf[10409] in cascadeOption("Aplicaciones Empresariales", "TRONADOR BANCA + MOVILIDAD") OR cf[10409] in cascadeOption("Aplicaciones Empresariales", "TRONADOR CIA 3 EXCEPTO AUTOS Y SOAT") OR cf[10409] in cascadeOption("Aplicaciones Empresariales", "ARCGIS") OR cf[10409] in cascadeOption("Aplicaciones Empresariales", "Planificador Agrícola") OR cf[10409] in cascadeOption("Aplicaciones Empresariales", "Obra al día") OR cf[10409] in cascadeOption("Activos Digitales")) AND created >= "2024-01-01" ORDER BY created DESC`;

  const fields = 'summary,status,assignee,created,resolutiondate,customfield_10409';
  const maxResults = 100;
  let startAt = 0;
  let allIssues = [];
  let total = 0;

  console.log('Consultando Jira...');

  do {
    const encodedJql = encodeURIComponent(JQL);
    const url = `/rest/api/3/search/jql?jql=${encodedJql}&fields=${fields}&maxResults=${maxResults}&startAt=${startAt}`;
    const response = await jiraRequest(url);

    total = response.total;
    const issues = response.issues || [];
    allIssues = allIssues.concat(issues);
    startAt += issues.length;

    console.log(`  Obtenidas ${allIssues.length} de ${total} incidencias...`);

    if (issues.length === 0) break;
  } while (startAt < total);

  console.log(`Total: ${allIssues.length} incidencias obtenidas.`);
  return allIssues;
}

/**
 * Transforma un issue de Jira al formato del dashboard.
 */
function transformIssue(issue) {
  const fields = issue.fields;
  const itemConfig = fields.customfield_10409?.child?.value || fields.customfield_10409?.value || null;
  const clasificacion = clasificar(itemConfig, fields.summary);

  const createdDate = fields.created;
  const resolvedDate = fields.resolutiondate || null;
  const now = new Date();
  const created = new Date(createdDate);
  const resolved = resolvedDate ? new Date(resolvedDate) : null;

  const edadDias = Math.floor(((resolved || now).getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

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

/**
 * Main: extrae datos de Jira y genera el JSON estático.
 */
async function main() {
  try {
    const rawIssues = await fetchAllIncidencias();
    const incidencias = rawIssues.map(transformIssue);

    const output = {
      lastUpdated: new Date().toISOString(),
      totalRaw: rawIssues.length,
      incidencias,
    };

    const outputPath = path.join(__dirname, '..', 'public', 'data', 'incidencias.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`\n✅ Datos guardados en ${outputPath}`);
    console.log(`   ${incidencias.length} incidencias clasificadas`);
    console.log(`   Última actualización: ${output.lastUpdated}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
