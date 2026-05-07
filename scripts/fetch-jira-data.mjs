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
  // 1. Determinar producto primero (es lo más importante)
  const producto = determinarProducto(childValue, summary, clasificacionDetallada, tribuJira, squadJira);

  // 2. Derivar tribu y squad del producto (fuente de verdad)
  const tribuSquad = derivarTribuSquadDeProducto(producto);

  // 3. Si no se pudo determinar producto, intentar por categoría padre
  if (producto === 'Multiproducto' || producto === '__EXCLUIR_ACCESOS__') {
    if (producto === '__EXCLUIR_ACCESOS__') return { producto, tribu: '', squad: '', plataforma: '' };
    return { producto, tribu: 'Multiproducto', squad: 'Multiproducto', plataforma: determinarPlataforma(childValue, parentValue, summary) };
  }

  const plataforma = determinarPlataforma(childValue, parentValue, summary);
  return { producto, tribu: tribuSquad.tribu, squad: tribuSquad.squad, plataforma };
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

function determinarProducto(childValue, summary, clasificacionDetallada, tribuJira, squadJira) {
  // Usar ítem de configuración primero (más confiable)
  if (childValue) {
    const match = ITEMS_PATRIMONIALES.find(c => c.item === childValue);
    if (match && match.producto !== 'Multiproducto') return match.producto;
  }

  // Usar Tribu/Squad de Jira para inferir producto
  if (squadJira) {
    const sq = squadJira.toLowerCase();
    if (sq.includes('movilidad')) return 'Autos';
    if (sq.includes('hogar')) return 'Hogar';
    if (sq.includes('copropiedades')) return 'Cuotas al día';
    if (sq.includes('pymes')) return 'Pymes';
    if (sq.includes('cumplimiento')) return 'Cumplimiento';
    if (sq.includes('agro')) return 'Agro';
    if (sq.includes('decenal') || sq.includes('maquinaria')) {
      // Distinguir entre Decenal y Maquinaria por summary
      const sumLower = (summary || '').toLowerCase();
      if (sumLower.includes('maquinaria') || sumLower.includes('prod 152') || sumLower.includes('producto 152')) return 'Maquinaria';
      return 'Decenal';
    }
    if (sq.includes('arrendamiento')) return 'Arrendamiento';
  }

  // Usar summary como último recurso
  const result = determinarProductoPorSummary(summary);
  return result.producto;
}

function determinarProductoPorSummary(summary) {
  const s = (summary || '').toLowerCase();

  // Excluir problemas de accesos (no son incidencias de producto)
  if (s.includes('acceso') || s.includes('control accesos') || s.includes('permisos') || s.includes('contraseña') || s.includes('password') || s.includes('login') || s.includes('usuario bloqueado')) {
    return { producto: '__EXCLUIR_ACCESOS__', tribu: '', squad: '' };
  }

  // Clasificar por producto
  if (s.includes('soat')) return { producto: 'SOAT', tribu: 'Movilidad', squad: 'Movilidad' };
  if (s.includes('autos') || s.includes('auto ') || s.includes('vehiculo') || s.includes('vehículo') || s.includes('movilidad')) return { producto: 'Autos', tribu: 'Movilidad', squad: 'Movilidad' };
  if (s.includes('hogar')) return { producto: 'Hogar', tribu: 'Vivienda', squad: 'Hogar' };
  if (s.includes('cumplimiento')) return { producto: 'Cumplimiento', tribu: 'Empresas', squad: 'Cumplimiento' };
  if (s.includes('pymes') || s.includes('pyme') || s.includes('prod. 778') || s.includes('prod. 777')) return { producto: 'Pymes', tribu: 'Empresas', squad: 'Pymes' };
  if (s.includes('agro') || s.includes('agrícola') || s.includes('agricola')) return { producto: 'Agro', tribu: 'Empresas', squad: 'Agro y Transporte' };
  if (s.includes('transporte') || s.includes('prod 40')) return { producto: 'Transporte', tribu: 'Empresas', squad: 'Agro y Transporte' };
  if (s.includes('decenal')) return { producto: 'Decenal', tribu: 'Vivienda', squad: 'Decenal y Maquinaria' };
  if (s.includes('maquinaria') || s.includes('prod 152') || s.includes('producto 152')) return { producto: 'Maquinaria', tribu: 'Vivienda', squad: 'Decenal y Maquinaria' };
  if (s.includes('zonas comunes') || s.includes('copropiedades') || s.includes('copropiedad')) return { producto: 'Zonas comunes', tribu: 'Vivienda', squad: 'Copropiedades' };
  if (s.includes('obra al día') || s.includes('obra al dia')) return { producto: 'Obra al día', tribu: 'Vivienda', squad: 'Copropiedades' };
  if (s.includes('cuotas al día') || s.includes('cuotas al dia') || s.includes('jelpit conjuntos')) return { producto: 'Cuotas al día', tribu: 'Vivienda', squad: 'Copropiedades' };
  if (s.includes('arrendamiento') || s.includes('sai ') || s.includes('libertador')) return { producto: 'Arrendamiento', tribu: 'Arrendamiento', squad: 'Arrendamiento' };

  return { producto: 'Multiproducto', tribu: 'Multiproducto', squad: 'Multiproducto' };
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
  // JQL principal: trae TODAS las incidencias de las categorías padre de patrimoniales
  // Excluye: estado Cancelado
  const baseFilter = `project = MDSB AND issuetype = Incident AND status != "Cancelado"`;

  const mainJQL = `${baseFilter} AND cf[10409] in cascadeOption("Aplicaciones Fuerza Ventas") AND created >= "2024-01-01" ORDER BY created DESC`;

  // JQLs adicionales para ítems específicos bajo otras categorías
  const additionalQueries = [
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "SAI")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "SAI WEB")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "SIOS")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "TRONADOR BANCA + MOVILIDAD")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "TRONADOR CIA 3 EXCEPTO AUTOS Y SOAT")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "Tronador Contingencia")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "Tronador Batch (Cartera, reserva, cierres)")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "ARCGIS")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "Planificador Agrícola")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "Obra al día")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "Constructor")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "CONSTRUPLAN")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "Cuotas al día")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "Biometría Facial")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "VentaDigitalAutos - IBM")`,
    `cf[10409] in cascadeOption("Aplicaciones Empresariales", "VentaSoatDigital - IBM")`,
    `cf[10409] in cascadeOption("Activos Digitales", "Jelpit Conjuntos Cuotas al día")`,
    `cf[10409] in cascadeOption("Activos Digitales", "Jelpit Pymes")`,
    `cf[10409] in cascadeOption("IA", "Análisis de Solicitudes")`,
  ];

  const seenKeys = new Set();
  let allIssues = [];

  // 1. Traer todas las de "Aplicaciones Fuerza Ventas" (la mayoría)
  console.log('Consultando Aplicaciones Fuerza Ventas (principal)...');
  try {
    const issues = await fetchWithJQL(mainJQL);
    for (const issue of issues) {
      if (!seenKeys.has(issue.key)) {
        seenKeys.add(issue.key);
        allIssues.push(issue);
      }
    }
    console.log(`  Principal: ${issues.length} issues`);
  } catch (err) {
    console.error(`  ❌ Error en query principal: ${err.message}`);
  }

  // 2. Traer las adicionales (Empresariales, Activos Digitales, IA)
  console.log('Consultando categorías adicionales...');
  for (let i = 0; i < additionalQueries.length; i += 3) {
    const batch = additionalQueries.slice(i, i + 3);
    const combinedJql = `${baseFilter} AND (${batch.join(' OR ')}) AND created >= "2024-01-01" ORDER BY created DESC`;

    try {
      const issues = await fetchWithJQL(combinedJql);
      let newCount = 0;
      for (const issue of issues) {
        if (!seenKeys.has(issue.key)) {
          seenKeys.add(issue.key);
          allIssues.push(issue);
          newCount++;
        }
      }
      console.log(`  Lote ${Math.floor(i / 3) + 1}: ${issues.length} issues (${newCount} nuevas)`);
    } catch (err) {
      console.warn(`  ⚠️ Error en lote: ${err.message.slice(0, 100)}`);
      // Intentar uno por uno
      for (const q of batch) {
        try {
          const singleJql = `${baseFilter} AND ${q} AND created >= "2024-01-01" ORDER BY created DESC`;
          const issues = await fetchWithJQL(singleJql);
          for (const issue of issues) {
            if (!seenKeys.has(issue.key)) {
              seenKeys.add(issue.key);
              allIssues.push(issue);
            }
          }
        } catch (e) {
          console.warn(`    ⚠️ Falló: ${e.message.slice(0, 80)}`);
        }
      }
    }

    if (i + 3 < additionalQueries.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\nTotal único: ${allIssues.length} incidencias de patrimoniales.`);
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
