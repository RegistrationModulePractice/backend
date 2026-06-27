import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { companies, conferenceDates, timeOptions } from './data/catalog.js';
import { openApiDocument } from './openapi.js';

const DEFAULT_PORT = 3000;
const DEFAULT_CATALOG_PAGE = 1;
const DEFAULT_CATALOG_PAGE_SIZE = 12;
const MAX_CATALOG_PAGE_SIZE = 12;

const meetingRequests = [];
const tildaHookEvents = [];

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parsePositiveInteger(value, fallbackValue) {
  const parsedValue = Number.parseInt(String(value ?? ''), 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallbackValue;
  }

  return parsedValue;
}

function buildCatalogFilters(query) {
  return {
    search: normalizeString(query?.search),
    industry: normalizeString(query?.industry),
    serviceType: normalizeString(query?.serviceType),
    region: normalizeString(query?.region),
    city: normalizeString(query?.city),
  };
}

function buildCompanyHaystack(company) {
  return [
    company.name,
    company.inn,
    company.description,
    company.industry,
    company.serviceType,
    company.region,
    company.city,
    ...company.keywords,
  ]
    .join(' ')
    .toLowerCase();
}

function matchesCatalogFilters(company, filters) {
  const normalizedSearch = filters.search.toLowerCase();

  return (
    (!normalizedSearch || buildCompanyHaystack(company).includes(normalizedSearch)) &&
    (!filters.industry || company.industry === filters.industry) &&
    (!filters.serviceType || company.serviceType === filters.serviceType) &&
    (!filters.region || company.region === filters.region) &&
    (!filters.city || company.city === filters.city)
  );
}

function getUniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function buildCatalogFilterOptions() {
  return {
    industries: getUniqueValues(companies, 'industry'),
    serviceTypes: getUniqueValues(companies, 'serviceType'),
    regions: getUniqueValues(companies, 'region'),
    cities: getUniqueValues(companies, 'city'),
  };
}

function normalizePayload(payload) {
  const companyId = Number(payload?.companyId);

  return {
    companyId: Number.isFinite(companyId) ? companyId : Number.NaN,
    companyName: normalizeString(payload?.companyName),
    initiatorName: normalizeString(payload?.initiatorName),
    initiatorPosition: normalizeString(payload?.initiatorPosition),
    initiatorCity: normalizeString(payload?.initiatorCity),
    phone: normalizeString(payload?.phone),
    email: normalizeString(payload?.email).toLowerCase(),
    date: normalizeString(payload?.date),
    time: normalizeString(payload?.time),
    topic: normalizeString(payload?.topic),
    request: normalizeString(payload?.request),
    consent: payload?.consent === true,
  };
}

function validateMeetingRequest(payload) {
  const errors = {};
  const company = companies.find((item) => item.id === payload.companyId);

  if (!company) {
    errors.companyId = 'Компания не найдена в каталоге.';
  }

  if (!payload.initiatorName || payload.initiatorName.length < 3) {
    errors.initiatorName = 'Укажите имя и фамилию.';
  }

  if (payload.phone.replace(/\D/g, '').length !== 11) {
    errors.phone = 'Введите телефон в формате +7 (___) ___-__-__.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(payload.email)) {
    errors.email = 'Укажите корректный email.';
  }

  if (!conferenceDates.some((date) => date.value === payload.date)) {
    errors.date = 'Выберите один из дней конференции.';
  }

  if (!timeOptions.includes(payload.time)) {
    errors.time = 'Выберите доступное время встречи.';
  }

  if (!payload.topic || payload.topic.length < 5) {
    errors.topic = 'Кратко обозначьте тему встречи.';
  } else if (payload.topic.length > 255) {
    errors.topic = 'Максимум 255 символов.';
  }

  if (payload.request.length > 1000) {
    errors.request = 'Максимум 1000 символов.';
  }

  if (!payload.consent) {
    errors.consent = 'Нужно согласие на обработку персональных данных.';
  }

  return { company, errors };
}

const app = express();
const port = Number(process.env.PORT) || DEFAULT_PORT;

app.disable('x-powered-by');
app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/docs/openapi.json', (_request, response) => {
  response.json(openApiDocument);
});

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'BTS Meeting API Docs',
    swaggerOptions: {
      url: '/api/docs/openapi.json',
    },
  }),
);

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'bts-meeting-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/catalog', (request, response) => {
  const filters = buildCatalogFilters(request.query);
  const requestedPage = parsePositiveInteger(request.query.page, DEFAULT_CATALOG_PAGE);
  const requestedPageSize = parsePositiveInteger(request.query.pageSize, DEFAULT_CATALOG_PAGE_SIZE);
  const pageSize = Math.min(requestedPageSize, MAX_CATALOG_PAGE_SIZE);

  const filteredCompanies = companies.filter((company) => matchesCatalogFilters(company, filters));
  const totalItems = filteredCompanies.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const page = totalPages === 0 ? DEFAULT_CATALOG_PAGE : Math.min(requestedPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + pageSize);

  response.json({
    conferenceDates,
    timeOptions,
    filterOptions: buildCatalogFilterOptions(),
    companies: paginatedCompanies,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages,
      itemsOnPage: paginatedCompanies.length,
      totalCompanies: companies.length,
      hasPreviousPage: page > 1,
      hasNextPage: totalPages > 0 && page < totalPages,
      query: {
        search: filters.search,
        industry: filters.industry,
        serviceType: filters.serviceType,
        region: filters.region,
        city: filters.city,
      },
    },
  });
});

app.post('/api/meeting-requests', (request, response) => {
  const payload = normalizePayload(request.body);
  const { company, errors } = validateMeetingRequest(payload);

  if (Object.keys(errors).length > 0) {
    response.status(400).json({
      message: 'Проверьте корректность полей формы.',
      errors,
    });
    return;
  }

  const meetingRequest = {
    id: meetingRequests.length + 1,
    status: 'new',
    submittedAt: new Date().toISOString(),
    companyId: company.id,
    companyName: company.name,
    companyEmail: company.email,
    initiatorName: payload.initiatorName,
    initiatorPosition: payload.initiatorPosition,
    initiatorCity: payload.initiatorCity,
    phone: payload.phone,
    email: payload.email,
    date: payload.date,
    time: payload.time,
    topic: payload.topic,
    request: payload.request,
    consent: payload.consent,
  };

  meetingRequests.unshift(meetingRequest);

  response.status(201).json({
    message: 'Заявка принята. Backend сохранил запись, а CRM-сценарий запускается через Tilda bridge.',
    requestId: meetingRequest.id,
    submittedAt: meetingRequest.submittedAt,
  });
});

app.post('/api/tilda/hooks/meeting-request-check', (request, response) => {
  const hookEvent = {
    id: tildaHookEvents.length + 1,
    receivedAt: new Date().toISOString(),
    payload: request.body,
  };

  tildaHookEvents.unshift(hookEvent);

  response.status(200).json({
    message: 'Tilda hook accepted.',
    hookEventId: hookEvent.id,
    receivedAt: hookEvent.receivedAt,
  });
});

app.use((error, _request, response, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({
      message: 'Не удалось прочитать JSON в теле запроса.',
    });
    return;
  }

  next(error);
});

app.use((error, _request, response, _next) => {
  console.error(error);

  response.status(500).json({
    message: 'Внутренняя ошибка сервера.',
  });
});

app.listen(port, () => {
  console.log(`BTS meeting API started on port ${port}`);
});
