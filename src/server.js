import express from 'express';
import { pathToFileURL } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import { companies, conferenceDates, timeOptions } from './data/catalog.js';
import { openApiDocument } from './openapi.js';

const DEFAULT_PORT = 3000;
const meetingRequests = [];

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePayload(payload) {
  const companyId = Number(payload?.companyId);

  return {
    companyId: Number.isFinite(companyId) ? companyId : NaN,
    companyName: normalizeString(payload?.companyName),
    initiatorName: normalizeString(payload?.initiatorName),
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

app.get('/api/catalog', (_request, response) => {
  response.json({
    conferenceDates,
    timeOptions,
    companies,
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
    message: 'Заявка принята. CRM и email-процессы подключим следующим этапом.',
    requestId: meetingRequest.id,
    submittedAt: meetingRequest.submittedAt,
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

app.listen(3000, () => {
  console.log(`BTS meeting API started on port 3000`);
});
