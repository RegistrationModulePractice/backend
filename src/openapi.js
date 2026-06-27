const companySchema = {
  type: 'object',
  required: ['id', 'inn', 'email', 'name', 'industry', 'serviceType', 'region', 'city', 'description', 'keywords'],
  properties: {
    id: { type: 'integer', example: 1 },
    inn: { type: 'string', example: '7704000000' },
    email: { type: 'string', format: 'email', example: 'contact1@demo-bts.ru' },
    name: { type: 'string', example: 'Северный Деликатес' },
    industry: { type: 'string', example: 'Мясопереработка' },
    serviceType: { type: 'string', example: 'Производитель' },
    region: { type: 'string', example: 'Москва и область' },
    city: { type: 'string', example: 'Москва' },
    description: {
      type: 'string',
      example: 'Производит линейки колбас, деликатесов и ready-to-cook решений для розницы.',
    },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      example: ['колбаса', 'retail', 'ready-to-cook'],
    },
  },
};

const conferenceDateSchema = {
  type: 'object',
  required: ['value', 'label'],
  properties: {
    value: { type: 'string', format: 'date', example: '2026-09-24' },
    label: { type: 'string', example: '24 сентября 2026' },
  },
};

const filterOptionsSchema = {
  type: 'object',
  required: ['industries', 'serviceTypes', 'regions', 'cities'],
  properties: {
    industries: {
      type: 'array',
      items: { type: 'string' },
      example: ['Мясопереработка', 'Логистика'],
    },
    serviceTypes: {
      type: 'array',
      items: { type: 'string' },
      example: ['Производитель', 'IT-решения'],
    },
    regions: {
      type: 'array',
      items: { type: 'string' },
      example: ['Москва и область', 'Санкт-Петербург'],
    },
    cities: {
      type: 'array',
      items: { type: 'string' },
      example: ['Москва', 'Санкт-Петербург'],
    },
  },
};

const catalogMetaSchema = {
  type: 'object',
  required: [
    'page',
    'pageSize',
    'totalItems',
    'totalPages',
    'itemsOnPage',
    'totalCompanies',
    'hasPreviousPage',
    'hasNextPage',
    'query',
  ],
  properties: {
    page: { type: 'integer', example: 1 },
    pageSize: { type: 'integer', example: 12 },
    totalItems: { type: 'integer', example: 30 },
    totalPages: { type: 'integer', example: 3 },
    itemsOnPage: { type: 'integer', example: 12 },
    totalCompanies: { type: 'integer', example: 30 },
    hasPreviousPage: { type: 'boolean', example: false },
    hasNextPage: { type: 'boolean', example: true },
    query: {
      type: 'object',
      required: ['search', 'industry', 'serviceType', 'region', 'city'],
      properties: {
        search: { type: 'string', example: 'логистика' },
        industry: { type: 'string', example: 'Логистика' },
        serviceType: { type: 'string', example: '' },
        region: { type: 'string', example: '' },
        city: { type: 'string', example: '' },
      },
    },
  },
};

const meetingRequestPayloadSchema = {
  type: 'object',
  required: ['companyId', 'companyName', 'initiatorName', 'phone', 'email', 'date', 'time', 'topic', 'consent'],
  properties: {
    companyId: { type: 'integer', example: 1 },
    companyName: { type: 'string', example: 'Северный Деликатес' },
    initiatorName: { type: 'string', example: 'Анна Смирнова' },
    initiatorPosition: { type: 'string', example: 'Директор' },
    initiatorCity: { type: 'string', example: 'Москва' },
    phone: { type: 'string', example: '+7 (999) 123-45-67' },
    email: { type: 'string', format: 'email', example: 'anna@example.com' },
    date: { type: 'string', format: 'date', example: '2026-09-24' },
    time: { type: 'string', example: '11:00' },
    topic: { type: 'string', maxLength: 255, example: 'Пилот по поставке упаковки' },
    request: { type: 'string', maxLength: 1000, example: 'Нужна тестовая встреча для обсуждения пилота.' },
    consent: { type: 'boolean', example: true },
  },
};

const tildaHookPayloadSchema = {
  type: 'object',
  additionalProperties: true,
  example: {
    targetCompanyId: 'company_001',
    targetCompanyName: 'ООО Компания',
    targetCompanyInn: '1234567890',
    targetCompanyServiceType: 'Интегратор',
    targetCompanyRegion: 'Москва',
    initiatorName: 'Иван Иванов',
    initiatorPosition: 'Руководитель',
    initiatorEmail: 'ivan@example.com',
    initiatorPhone: '+7 999 999-99-99',
    initiatorCity: 'Москва',
    meetingDateTime: '2026-06-27 14:00',
    meetingTopic: 'Обсуждение сотрудничества',
    meetingRequest: 'Хотим обсудить возможное партнерство',
    personalDataAgreement: true,
  },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'BTS Meeting API',
    version: '1.2.0',
    description:
      'Backend for the conference companies catalog, meeting requests, server-side filtering, and paginated catalog responses.',
  },
  servers: [
    {
      url: '/',
      description: 'Relative server URL for local proxy and container deployment',
    },
  ],
  tags: [
    { name: 'System', description: 'Service endpoints' },
    { name: 'Catalog', description: 'Companies catalog and conference metadata' },
    { name: 'Meeting requests', description: 'Meeting request submission from the frontend app' },
    { name: 'Tilda', description: 'Stub endpoints for Tilda integration' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is available',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'service', 'timestamp'],
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'bts-meeting-api' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/catalog': {
      get: {
        tags: ['Catalog'],
        summary: 'Get the companies catalog with server-side filtering and pagination',
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Catalog page number',
          },
          {
            in: 'query',
            name: 'pageSize',
            schema: { type: 'integer', minimum: 1, maximum: 12, default: 12 },
            description: 'Page size, capped at 12',
          },
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Free-text search by name, INN, description, and keywords',
          },
          {
            in: 'query',
            name: 'industry',
            schema: { type: 'string' },
            description: 'Industry filter',
          },
          {
            in: 'query',
            name: 'serviceType',
            schema: { type: 'string' },
            description: 'Service type filter',
          },
          {
            in: 'query',
            name: 'region',
            schema: { type: 'string' },
            description: 'Region filter',
          },
          {
            in: 'query',
            name: 'city',
            schema: { type: 'string' },
            description: 'City filter',
          },
        ],
        responses: {
          200: {
            description: 'Catalog loaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['conferenceDates', 'timeOptions', 'filterOptions', 'companies', 'meta'],
                  properties: {
                    conferenceDates: { type: 'array', items: conferenceDateSchema },
                    timeOptions: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['10:00', '11:00', '12:00'],
                    },
                    filterOptions: filterOptionsSchema,
                    companies: { type: 'array', items: companySchema },
                    meta: catalogMetaSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/meeting-requests': {
      post: {
        tags: ['Meeting requests'],
        summary: 'Store a meeting request on the backend',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: meetingRequestPayloadSchema,
            },
          },
        },
        responses: {
          201: {
            description: 'Meeting request accepted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message', 'requestId', 'submittedAt'],
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Заявка принята. Backend сохранил запись, а CRM-сценарий запускается через Tilda bridge.',
                    },
                    requestId: { type: 'integer', example: 1 },
                    submittedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error or invalid JSON',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Проверьте корректность полей формы.' },
                    errors: {
                      type: 'object',
                      additionalProperties: { type: 'string' },
                      example: {
                        email: 'Укажите корректный email.',
                        phone: 'Введите телефон в формате +7 (___) ___-__-__.',
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string', example: 'Внутренняя ошибка сервера.' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/tilda/hooks/meeting-request-check': {
      post: {
        tags: ['Tilda'],
        summary: 'Stub hook for an incoming Tilda event',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: tildaHookPayloadSchema,
            },
            'application/x-www-form-urlencoded': {
              schema: tildaHookPayloadSchema,
            },
          },
        },
        responses: {
          200: {
            description: 'Hook accepted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message', 'hookEventId', 'receivedAt'],
                  properties: {
                    message: { type: 'string', example: 'Tilda hook accepted.' },
                    hookEventId: { type: 'integer', example: 1 },
                    receivedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
