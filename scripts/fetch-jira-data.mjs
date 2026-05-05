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

function clasificar(childValue, parentValue, summary, tribuJira, squadJira, clasificacionDetallada) {
  // 1. Usar el campo Tribu/Squad de Jira si está disponible (fuente más confiable)
  if (tribuJira) {
    const tribu = mapTribuJira(tribuJira);
    const squad = squadJira ? mapSquadJira(squadJira, tribuJira) : tribu;
    const producto = determinarProducto(childValue, summary, clasificacionDetallada, tribuJira, squadJira);
    const plataforma = determinarPlataforma(childValue, parentValue, summary);
    return { producto, tribu, squad, plataforma };
  }

  // 2. Buscar por el valor hijo (ítem específico) si existe
  if (childValue) {
    const match = ITEMS_PATRIMONIALES.find(c => c.item === childValue);
    if (match) {
      return { producto: match.producto, tribu: match.tribu, squad: match.squad, plataforma: match.aplicacion };
    }
  }

  // 3. Si es "Aplicaciones Fuerza Ventas" sin más info, clasificar por summary
  if (parentValue === 'Aplicaciones Fuerza Ventas' || parentValue === 'Aplicaciones Empresariales' || parentValue === 'Activos Digitales') {
    const producto = determinarProductoPorSummary(summary);
    const plataforma = determinarPlataforma(childValue, parentValue, summary);
    return { producto: producto.producto, tribu: producto.tribu, squad: producto.squad, plataforma };
  }

  return null;
}

function mapTribuJira(tribu) {
  const map = {
    'Movilidad': 'Movilidad',
    'Vivienda': 'Vivienda',
    'Empresas': 'Empresas',
    'Arrendamiento': 'Arrendamiento',
    'Copropiedades': 'Vivienda',
    'Hogar': 'Vivienda',
    'Pymes': 'Empresas',
    'Cumplimiento': 'Empresas',
    'Agro y Transporte': 'Empresas',
    'Decenal y Maquinaria': 'Empresas',
  };
  return map[tribu] || tribu;
}

function mapSquadJira(squad, tribu) {
  if (squad) return squad;
  return tribu;
}

function determinarProducto(childValue, summary, clasificacionDetallada, tribuJira, squadJira) {
  // Usar clasificación detallada si existe (ej: "ANALÍTICA - Autos")
  if (clasificacionDetallada) {
    const det = clasificacionDetallada.toLowerCase();
    if (det.includes('autos') || det.includes('auto')) return 'Autos';
    if (det.includes('soat')) return 'SOAT';
    if (det.includes('hogar')) return 'Hogar';
    if (det.includes('cumplimiento')) return 'Cumplimiento';
    if (det.includes('pymes') || det.includes('pyme')) return 'Pymes';
    if (det.includes('agro')) return 'Agro';
    if (det.includes('transporte')) return 'Transporte';
    if (det.includes('decenal')) return 'Decenal';
    if (det.includes('maquinaria')) return 'Maquinaria';
    if (det.includes('zonas comunes') || det.includes('copropiedades')) return 'Zonas comunes';
    if (det.includes('obra al día') || det.includes('obra al dia')) return 'Obra al día';
    if (det.includes('cuotas al día') || det.includes('cuotas al dia')) return 'Cuotas al día';
    if (det.includes('arrendamiento')) return 'Arrendamiento';
  }

  // Usar ítem de configuración
  if (childValue) {
    const match = ITEMS_PATRIMONIALES.find(c => c.item === childValue);
    if (match && match.producto !== 'Multiproducto') return match.producto;
  }

  // Usar summary
  return determinarProductoPorSummary(summary).producto;
}

function determinarProductoPorSummary(summary) {
  const s = (summary || '').toLowerCase();
  if (s.includes('soat')) return { producto: 'SOAT', tribu: 'Movilidad', squad: 'Movilidad' };
  if (s.includes('auto')) return { producto: 'Autos', tribu: 'Movilidad', squad: 'Movilidad' };
  if (s.includes('hogar')) return { producto: 'Hogar', tribu: 'Vivienda', squad: 'Hogar' };
  if (s.includes('cumplimiento')) return { producto: 'Cumplimiento', tribu: 'Empresas', squad: 'Cumplimiento' };
  if (s.includes('pymes') || s.includes('pyme')) return { producto: 'Pymes', tribu: 'Empresas', squad: 'Pymes' };
  if (s.includes('agro')) return { producto: 'Agro', tribu: 'Empresas', squad: 'Agro y Transporte' };
  if (s.includes('transporte')) return { producto: 'Transporte', tribu: 'Empresas', squad: 'Agro y Transporte' };
  if (s.includes('decenal')) return { producto: 'Decenal', tribu: 'Empresas', squad: 'Decenal y Maquinaria' };
  if (s.includes('maquinaria')) return { producto: 'Maquinaria', tribu: 'Empresas', squad: 'Decenal y Maquinaria' };
  if (s.includes('zonas comunes') || s.includes('copropiedades')) return { producto: 'Zonas comunes', tribu: 'Vivienda', squad: 'Copropiedades' };
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
  const fields = 'summary,status,assignee,created,resolutiondate,customfield_10409,customfield_27826,customfield_11219,customfield_10403';
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
const TRIBUS_EXCLUIDAS = new Set(['ARL', 'COREX', 'Servicio', 'Operaciones y Canales', 'Operaciones', 'Canales']);

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

  // Campo de clasificación detallada (customfield_11219 = "ANALÍTICA - Autos")
  const clasificacionDetallada = fields.customfield_11219?.value || null;

  const clasificacion = clasificar(childValue, parentValue, fields.summary, tribuSquadJira, squadJira, clasificacionDetallada);

  // Si no se pudo clasificar, descartar
  if (!clasificacion) return null;

  // Solo incluir tribus válidas de patrimoniales
  if (!TRIBUS_VALIDAS.has(clasificacion.tribu) && clasificacion.tribu !== 'Multiproducto') return null;

  // Excluir estados cancelados (doble verificación post-query)
  const status = fields.status?.name || '';
  const statusLower = status.toLowerCase();
  if (statusLower === 'cancelado' || statusLower === 'cancelada' || statusLower.includes('cancel')) return null;

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
