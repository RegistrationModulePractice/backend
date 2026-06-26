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
      example: 'Производит линейки колбас, деликатесов и ready-to-cook решений.',
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
    initiatorName: 'Иван Иванов',
    initiatorPosition: 'Директор',
    initiatorEmail: 'ivan@example.com',
    initiatorPhone: '+7 999 999-99-99',
    initiatorCity: 'Москва',
    meetingDateTime: '2026-06-26 14:00',
    meetingTopic: 'Обсуждение сотрудничества',
    meetingRequest: 'Хотим обсудить партнерство',
    personalDataAgreement: true,
  },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'BTS Meeting API',
    version: '1.1.0',
    description:
      'Backend для каталога участников конференции, приема заявок и stub-hook от Tilda. CRM-сценарий инициируется на фронтенде через postMessage в родительскую Tilda-страницу.',
  },
  servers: [
    {
      url: '/',
      description: 'Relative server URL for local proxy and container deployment',
    },
  ],
  tags: [
    { name: 'System', description: 'Служебные эндпоинты backend-сервиса' },
    { name: 'Catalog', description: 'Каталог компаний и метаданные конференции' },
    { name: 'Meeting requests', description: 'Отправка заявок на встречу из frontend-приложения' },
    { name: 'Tilda', description: 'Stub-эндпоинты для интеграции с Tilda' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Проверка доступности backend',
        responses: {
          200: {
            description: 'Сервис доступен',
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
        summary: 'Получить каталог компаний и слоты конференции',
        responses: {
          200: {
            description: 'Каталог успешно загружен',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['conferenceDates', 'timeOptions', 'companies'],
                  properties: {
                    conferenceDates: { type: 'array', items: conferenceDateSchema },
                    timeOptions: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['10:00', '11:00', '12:00'],
                    },
                    companies: { type: 'array', items: companySchema },
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
        summary: 'Сохранить заявку на встречу на backend',
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
            description: 'Заявка принята',
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
            description: 'Ошибка валидации или некорректный JSON',
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
            description: 'Внутренняя ошибка сервера',
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
    '/api/tilda/hooks/meeting-request': {
      post: {
        tags: ['Tilda'],
        summary: 'Stub-hook для входящего события от Tilda',
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
          202: {
            description: 'Hook принят',
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
