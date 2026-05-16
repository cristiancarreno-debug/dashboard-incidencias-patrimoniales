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
  'Movilidad': 'Autos', 'Vivienda': 'Hogar', 'Empresas': 'Cumplimiento',
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
    'Equipo Electrónico': { tribu: 'Empresas', squad: 'Empresas' },
    'All Risk': { tribu: 'Empresas', squad: 'Empresas' },
    'Sin identificar': { tribu: 'Sin identificar', squad: 'Sin identificar' },
    'Agro': { tribu: 'Empresas', squad: 'Agro y Transporte' },
    'Transporte': { tribu: 'Empresas', squad: 'Agro y Transporte' },
    'Arrendamiento': { tribu: 'Arrendamiento', squad: 'Arrendamiento' },
  };
  return map[producto] || { tribu: 'Movilidad', squad: 'Movilidad' };
}

/** Determina plataforma */
function determinarPlataforma(summary) {
  const s = (summary || '').toLowerCase();
  if (s.includes('tronador banca') || s.includes('banca + movilidad')) return 'Tronador Banca';
  if (s.includes('tronador cia 3') || s.includes('tronador contingencia')) return 'Tronador CIA 3';
  if (s.includes('tronador batch') || s.includes('tronador')) return 'Tronador';
  if (s.includes('simon web emision') || s.includes('simon web ventas') || s.includes('simon web reaseguros') || s.includes('simon web siniestros') || s.includes('simon web cia')) return 'Simon WEB';
  if (s.includes('simon') && (s.includes('cotizador') || s.includes('cotizadores'))) return 'Simon Cotizadores';
  if (s.includes('simon - soat') || s.includes('simon-soat') || s.includes('simon soat')) return 'Simon Cotizadores';
  if (s.includes('simon - cumplimiento') || s.includes('simon-cumplimiento')) return 'Simon Cotizadores';
  if (s.includes('simon web')) return 'Simon WEB';
  if (s.includes('simon')) return 'Simon Cotizadores';
  if (s.includes('sai web') || s.includes('sai ')) return 'SAI';
  if (s.includes('sios')) return 'SIOS';
  if (s.includes('arcgis')) return 'Arcgis';
  if (s.includes('jelpit')) return 'Jelpit Conjuntos';
  if (s.includes('obra al día') || s.includes('obra al dia')) return 'Obra al día';
  if (s.includes('construplan') || s.includes('constructor')) return 'Plataforma Constructor';
  if (s.includes('planificador agr')) return 'Plataforma Agro';
  if (s.includes('poliza digital') || s.includes('póliza digital')) return 'Póliza Digital';
  if (s.includes('biometría') || s.includes('biometria')) return 'Biometría Facial';
  if (s.includes('datamart') || s.includes('libertador')) return 'Datamart';
  if (s.includes('recaudo') || s.includes('pago en línea') || s.includes('pago en linea')) return 'Portal de Pagos';
  if (s.includes('comisiones')) return 'Comisiones';
  if (s.includes('facturación') || s.includes('facturacion') || s.includes('renovación') || s.includes('renovacion')) return 'Tronador';
  if (s.includes('reaseguro')) return 'Tronador';
  return 'Tronador'; // Default: la mayoría de incidencias genéricas son de Tronador
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

  // Extraer texto de comentarios
  let commentText = '';
  if (fields.comment && fields.comment.comments && Array.isArray(fields.comment.comments)) {
    for (const c of fields.comment.comments) {
      if (c.body) commentText += ' ' + extractTextFromADF(c.body);
    }
  }

  // Estado cancelado → excluir
  const status = fields.status?.name || '';
  if (status.toLowerCase() === 'cancelado' || status.toLowerCase() === 'cancelada') return null;

  // Filtrar por Grupo Asignación: solo para 2026, incluir valores válidos
  const GRUPOS_VALIDOS = new Set(['Tribu de Desarrollo', 'Especialistas N1', 'Analítica', 'Mesa Soporte Tecnológico Validaciones']);
  const grupoAsignacion = fields.customfield_10439?.value || null;
  const anioCreacion = fields.created ? new Date(fields.created).getFullYear() : 2024;
  if (anioCreacion >= 2026 && grupoAsignacion && !GRUPOS_VALIDOS.has(grupoAsignacion)) return null;

  // Si Tribu/Squad de Jira está llena pero NO es válida → excluir
  if (tribuJira && !TRIBUS_JIRA_VALIDAS.has(tribuJira)) return null;

  // CASO 1: Tribu/Squad de Jira es válida → usar SOLO la tribu de Jira
  if (tribuJira && TRIBUS_JIRA_VALIDAS.has(tribuJira)) {
    const tribu = TRIBU_MAP[tribuJira] || tribuJira;

    // PRIORIDAD: Si fue pre-etiquetado por query de squad hijo, usar ese producto
    let producto;
    if (preTaggedProducts.has(issue.key)) {
      producto = preTaggedProducts.get(issue.key);
      // Refinar dentro del producto pre-etiquetado (ej: Cuotas al día → Obra al día)
      const itemConfig = fields.customfield_10409?.child?.value || fields.customfield_10409?.value || '';
      const texto = `${summary} ${description} ${commentText} ${itemConfig}`.toLowerCase();
      if (producto === 'Cuotas al día') {
        if (texto.includes('obra al día') || texto.includes('obra al dia')) producto = 'Obra al día';
        else if (texto.includes('zonas comunes')) producto = 'Zonas comunes';
      } else if (producto === 'Agro') {
        if (texto.includes('transporte') || texto.includes('prod 40')) producto = 'Transporte';
      } else if (producto === 'Decenal') {
        if (texto.includes('maquinaria') || texto.includes('prod 152') || texto.includes('producto 152')) producto = 'Maquinaria';
      } else if (producto === 'Autos') {
        if (texto.includes('soat')) producto = 'SOAT';
      }
    } else {
      // Fallback: determinar producto por keywords dentro de la tribu
      const itemConfig = fields.customfield_10409?.child?.value || fields.customfield_10409?.value || '';
      producto = determinarProductoDentroDeTribu(tribu, tribuJira, squadJira, summary, `${description} ${commentText}`, itemConfig);
    }

    const tribuSquad = producto === 'Sin identificar'
      ? { tribu, squad: squadJira || tribuJira }
      : derivarTribuSquad(producto);
    const plataforma = determinarPlataforma(summary);

    return {
      key: issue.key, summary, status,
      assignee: fields.assignee?.displayName || null,
      createdDate: fields.created, resolvedDate: fields.resolutiondate || null,
      producto, tribu: tribuSquad.tribu, squad: tribuSquad.squad, plataforma,
      grupoAsignacion: fields.customfield_10439?.value || 'Sin asignar',
      jiraUrl: `${JIRA_BASE_URL}/browse/${issue.key}`,
    };
  }

  // CASO 2: Tribu/Squad vacía → fallback por keywords en TODOS los campos
  const textoCompleto = `${summary} ${description} ${commentText}`.toLowerCase();

  // Para 2024 y 2025: usar keywords de confianza media (más amplio)
  if (anioCreacion <= 2025) {
    const producto = identificarProductoConfianzaMedia(textoCompleto);
    if (producto) {
      const tribuSquad = derivarTribuSquad(producto);
      const plataforma = determinarPlataforma(summary);
      return {
        key: issue.key, summary, status,
        assignee: fields.assignee?.displayName || null,
        createdDate: fields.created, resolvedDate: fields.resolutiondate || null,
        producto, tribu: tribuSquad.tribu, squad: tribuSquad.squad, plataforma,
        grupoAsignacion: fields.customfield_10439?.value || 'Sin asignar',
        jiraUrl: `${JIRA_BASE_URL}/browse/${issue.key}`,
      };
    }
  }

  // Para 2025+: usar keywords de alta confianza (más estricto)
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
function determinarProductoDentroDeTribu(tribu, tribuJira, squadJira, summary, description, itemConfig) {
  const texto = `${summary} ${description} ${itemConfig}`.toLowerCase();

  // Detectar producto Vida en cualquier tribu (será excluido después)
  if (texto.includes('protección de crédito') || texto.includes('proteccion de credito') || texto.includes('protección de credito') || texto.includes('proteccion de crédito') || texto.includes('vida deudor') || texto.includes('vida deudores')) return 'Vida';

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
      if (texto.includes('cuotas al día') || texto.includes('cuotas al dia') || texto.includes('construplan') || texto.includes('constructor')) return 'Cuotas al día';
      return 'Sin identificar';
    }
    if (sq.includes('pymes')) return 'Pymes';
    if (sq.includes('cumplimiento')) return 'Cumplimiento';
    if (sq.includes('agro')) {
      if (texto.includes('transporte') || texto.includes('prod 40')) return 'Transporte';
      if (texto.includes('agro') || texto.includes('agrícola') || texto.includes('agricola') || texto.includes('planificador')) return 'Agro';
      return 'Sin identificar';
    }
    if (sq.includes('decenal') || sq.includes('maquinaria')) {
      if (texto.includes('maquinaria') || texto.includes('prod 152') || texto.includes('producto 152') || texto.includes('multiriesgo')) return 'Maquinaria';
      if (texto.includes('decenal') || texto.includes('anticipo') || texto.includes('seccion ii') || texto.includes('sección ii') || texto.includes('todo riesgo construc')) return 'Decenal';
      return 'Sin identificar';
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
    if (texto.includes('cuotas al día') || texto.includes('cuotas al dia') || texto.includes('construplan') || texto.includes('constructor')) return 'Cuotas al día';
    if (texto.includes('decenal') || texto.includes('anticipo') || texto.includes('seccion ii') || texto.includes('sección ii') || texto.includes('todo riesgo construc')) return 'Decenal';
    if (texto.includes('maquinaria') || texto.includes('prod 152') || texto.includes('multiriesgo')) return 'Maquinaria';
    return 'Sin identificar'; // No se puede determinar producto exacto
  }
  if (tribu === 'Empresas') {
    // Excluir producto Vida (no es de patrimoniales)
    if (texto.includes('protección de crédito') || texto.includes('proteccion de credito') || texto.includes('protección de credito') || texto.includes('proteccion de crédito') || texto.includes('vida deudor') || texto.includes('vida deudores')) return 'Vida';
    if (texto.includes('equipo electr') || texto.includes('equipo electrónico') || texto.includes('prod 200') || texto.includes('producto 200')) return 'Equipo Electrónico';
    if (texto.includes('all risk') || texto.includes('allrisk') || texto.includes('prod 76') || texto.includes('producto 76')) return 'All Risk';
    if (texto.includes('cumplimiento')) return 'Cumplimiento';
    if (texto.includes('pymes') || texto.includes('pyme')) return 'Pymes';
    if (texto.includes('agro') || texto.includes('agrícola') || texto.includes('agricola') || texto.includes('planificador')) return 'Agro';
    if (texto.includes('transporte') || texto.includes('prod 40')) return 'Transporte';
    if (texto.includes('decenal') || texto.includes('anticipo') || texto.includes('seccion ii') || texto.includes('sección ii') || texto.includes('todo riesgo construc')) return 'Decenal';
    if (texto.includes('maquinaria') || texto.includes('prod 152') || texto.includes('multiriesgo')) return 'Maquinaria';
    return 'Sin identificar'; // No se puede determinar producto exacto
  }

  return PRODUCTO_DEFAULT[tribuJira] || 'Sin identificar';
}

/**
 * Fallback confianza MEDIA: para 2024 donde la tribu generalmente está vacía.
 * Usa keywords más amplios que el fallback estricto.
 */
function identificarProductoConfianzaMedia(texto) {
  // Excluir producto Vida (no es de patrimoniales)
  if (texto.includes('protección de crédito') || texto.includes('proteccion de credito') || texto.includes('protección de credito') || texto.includes('proteccion de crédito') || texto.includes('vida deudor') || texto.includes('vida deudores')) return 'Vida';
  if (texto.includes('equipo electr') || texto.includes('equipo electrónico') || texto.includes('equipo electronico') || texto.includes('prod 200') || texto.includes('producto 200')) return 'Equipo Electrónico';
  if (texto.includes('all risk') || texto.includes('allrisk') || texto.includes('prod 76') || texto.includes('producto 76')) return 'All Risk';
  if (texto.includes('soat') || texto.includes('recaudo electr')) return 'SOAT';
  if (texto.includes('autos') || texto.includes('auto ') || texto.includes('cotizadores autos') || texto.includes('cotizador autos') || texto.includes('tronador banca') || texto.includes('banca + movilidad') || texto.includes('ventadigitalautos')) return 'Autos';
  if (texto.includes('hogar') || texto.includes('cotizadores hogar')) return 'Hogar';
  if (texto.includes('cumplimiento') || texto.includes('simon - cumplimiento')) return 'Cumplimiento';
  if (texto.includes('pymes') || texto.includes('pyme') || texto.includes('jelpit pymes')) return 'Pymes';
  if (texto.includes('agro') || texto.includes('agrícola') || texto.includes('agricola') || texto.includes('planificador agr')) return 'Agro';
  if (texto.includes('transporte') || texto.includes('prod 40')) return 'Transporte';
  if (texto.includes('maquinaria') || texto.includes('prod 152') || texto.includes('producto 152') || texto.includes('multiriesgo')) return 'Maquinaria';
  if (texto.includes('decenal') || texto.includes('anticipo') || texto.includes('seccion ii') || texto.includes('sección ii') || texto.includes('todo riesgo construc')) return 'Decenal';
  if (texto.includes('zonas comunes') || texto.includes('copropiedades')) return 'Zonas comunes';
  if (texto.includes('obra al día') || texto.includes('obra al dia')) return 'Obra al día';
  if (texto.includes('cuotas al día') || texto.includes('cuotas al dia') || texto.includes('jelpit conjuntos') || texto.includes('construplan') || texto.includes('constructor')) return 'Cuotas al día';
  if (texto.includes('arrendamiento') || texto.includes('sai web') || texto.includes('sai ') || texto.includes('libertador') || texto.includes('sios')) return 'Arrendamiento';
  return null;
}

/**
 * Fallback: identifica producto por keywords cuando NO hay tribu de Jira.
 * Más estricto - solo clasifica si hay alta confianza.
 */
function identificarProductoGeneral(texto) {
  // Excluir producto Vida (no es de patrimoniales)
  if (texto.includes('protección de crédito') || texto.includes('proteccion de credito') || texto.includes('protección de credito') || texto.includes('proteccion de crédito') || texto.includes('vida deudor') || texto.includes('vida deudores')) return 'Vida';
  // Keywords específicos (alta confianza)
  if (texto.includes('all risk') || texto.includes('allrisk') || texto.includes('prod 76') || texto.includes('producto 76')) return 'All Risk';
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
  const fields = 'summary,status,assignee,created,resolutiondate,customfield_10409,customfield_27826,description,customfield_10439,comment';
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

/**
 * Queries por squad hijo específico.
 * La API de Jira NO devuelve el child value del campo cascading en la respuesta,
 * pero SÍ permite filtrar por cascadeOption("padre", "hijo") en JQL.
 * Hacemos queries separadas por cada squad hijo y pre-etiquetamos el producto correcto.
 */
const SQUAD_QUERIES = [
  // Empresas → hijos
  { parent: 'Empresas', child: 'Cumplimiento', producto: 'Cumplimiento' },
  { parent: 'Empresas', child: 'Pymes', producto: 'Pymes' },
  { parent: 'Empresas', child: 'Agro y Transporte', producto: 'Agro' },
  // Vivienda → hijos
  { parent: 'Vivienda', child: 'Copropiedades', producto: 'Cuotas al día' },
  { parent: 'Vivienda', child: 'Hogar', producto: 'Hogar' },
  { parent: 'Vivienda', child: 'Decenal y Maquinaria', producto: 'Decenal' },
  // Movilidad → hijos
  { parent: 'Movilidad', child: 'Movilidad', producto: 'Autos' },
  // Arrendamiento → hijos
  { parent: 'Arrendamiento', child: 'Arrendamiento', producto: 'Arrendamiento' },
];

/** Map de issue key → producto pre-etiquetado por query de squad hijo */
const preTaggedProducts = new Map();

async function fetchAllIncidencias() {
  const baseFilter = `project = MDSB AND issuetype = Incident AND status != "Cancelado"`;
  const seenKeys = new Set();
  let allIssues = [];

  // FASE 1: Queries por squad hijo específico (pre-etiquetado preciso)
  console.log('Fase 1: Consultando por Squad hijo específico...');
  for (const sq of SQUAD_QUERIES) {
    const jql = `${baseFilter} AND cf[27826] in cascadeOption("${sq.parent}", "${sq.child}") AND created >= "2024-01-01" ORDER BY created DESC`;
    try {
      const issues = await fetchWithJQL(jql);
      for (const issue of issues) {
        if (!seenKeys.has(issue.key)) {
          seenKeys.add(issue.key);
          allIssues.push(issue);
        }
        // Pre-etiquetar con el producto correcto del squad hijo
        preTaggedProducts.set(issue.key, sq.producto);
      }
      console.log(`  ${sq.parent} → ${sq.child}: ${issues.length} issues (producto: ${sq.producto})`);
    } catch (err) {
      console.warn(`  ⚠️ ${sq.parent}/${sq.child}: ${err.message.slice(0, 80)}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`  Subtotal Fase 1 (squad hijo): ${allIssues.length}`);

  // FASE 2: Queries por tribu padre (captura issues que no tienen hijo definido)
  console.log('Fase 2: Consultando por Tribu padre (complemento)...');
  const tribuQueries = [
    'Movilidad', 'Vivienda', 'Empresas', 'Arrendamiento',
    'Copropiedades', 'Hogar', 'Pymes', 'Cumplimiento',
    'Agro y Transporte', 'Decenal y Maquinaria',
  ];

  for (let i = 0; i < tribuQueries.length; i += 2) {
    const batch = tribuQueries.slice(i, i + 2);
    const conditions = batch.map(t => `cf[27826] in cascadeOption("${t}")`).join(' OR ');
    const jql = `${baseFilter} AND (${conditions}) AND created >= "2024-01-01" ORDER BY created DESC`;
    try {
      const issues = await fetchWithJQL(jql);
      let newCount = 0;
      for (const issue of issues) {
        if (!seenKeys.has(issue.key)) { seenKeys.add(issue.key); allIssues.push(issue); newCount++; }
      }
      if (newCount > 0) console.log(`  ${batch.join(', ')}: +${newCount} nuevas`);
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
  console.log(`  Subtotal Fase 1+2: ${allIssues.length}`);

  // FASE 3: Complementar con categoría/ítem (para incidencias sin Tribu/Squad)
  console.log('Fase 3: Complementando con Categoría/Ítem...');
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

  console.log(`\nTotal: ${allIssues.length} incidencias extraídas.`);
  console.log(`Pre-etiquetadas por squad hijo: ${preTaggedProducts.size}`);
  return allIssues;
}

// ============ MAIN ============

async function main() {
  try {
    const rawIssues = await fetchAllIncidencias();
    const incidencias = rawIssues.map(clasificar).filter(Boolean).filter(inc => {
      // Excluir producto Vida (no es de patrimoniales)
      if (inc.producto === 'Vida') return false;
      // Excluir Jelpit Conjuntos
      if (inc.plataforma === 'Jelpit Conjuntos') return false;
      // SAI solo para Arrendamiento
      if (inc.plataforma === 'SAI' && inc.producto !== 'Arrendamiento') return false;
      return true;
    });

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
