import pactum from 'pactum';
import { SimpleReporter } from '../simple-reporter';
import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';

describe('Validação da JokeAPI', () => {
  const api = pactum;
  const reporter = SimpleReporter;
  const API_BASE = 'https://v2.jokeapi.dev';

  api.request.setDefaultTimeout(60000);

  beforeAll(() => {
    api.reporter.add(reporter);
  });

  afterAll(() => {
    api.reporter.end();
  });

  describe('Verificações de Sistema', () => {
    it('responde ao ping corretamente', async () => {
      await api
        .spec()
        .get(`${API_BASE}/ping`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, ping: 'Pong!' })
        .expectHeaderContains('content-type', 'application/json');
    });

    it('retorna dados gerais da API', async () => {
      await api
        .spec()
        .get(`${API_BASE}/info`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('version')
        .expectBodyContains('jokes')
        .expectBodyContains('categories')
        .expectJsonSchema({
          type: 'object',
          properties: {
            error: { type: 'boolean' },
            version: { type: 'string' },
            jokes: { type: 'object' }
          },
          required: ['error', 'version', 'jokes']
        });
    });

    it('lista categorias disponíveis', async () => {
      await api
        .spec()
        .get(`${API_BASE}/categories`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('categories')
        .expectBodyContains('categoryAliases')
        .expectJsonLike({ error: false });
    });

    it('lista flags disponíveis', async () => {
      await api
        .spec()
        .get(`${API_BASE}/flags`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('flags')
        .expectJsonLike({ error: false });
    });

    it('informa os formatos aceitos', async () => {
      await api
        .spec()
        .get(`${API_BASE}/formats`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('formats')
        .expectJsonLike({ error: false });
    });

    it('retorna os endpoints disponíveis', async () => {
      await api
        .spec()
        .get(`${API_BASE}/endpoints`)
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({ type: 'array' });
    });

    it('informa os idiomas suportados', async () => {
      await api
        .spec()
        .get(`${API_BASE}/languages`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('jokeLanguages')
        .expectBodyContains('systemLanguages');
    });

    it('retorna código de idioma para português', async () => {
      await api
        .spec()
        .get(`${API_BASE}/langcode/portuguese`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('code')
        .expectJsonLike({ error: false, code: 'pt' });
    });

    it('retorna código de idioma para inglês', async () => {
      await api
        .spec()
        .get(`${API_BASE}/langcode/english`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('code')
        .expectJsonLike({ error: false, code: 'en' });
    });
  });

  describe('Testes de Piadas', () => {
    it('traz piada de qualquer categoria', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Any`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false })
        .expectResponseTime(5000);
    });

    it('traz piada da categoria Programming', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Programming`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, category: 'Programming' });
    });

    it('traz piada da categoria Dark', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Dark`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, category: 'Dark' });
    });

    it('traz múltiplas piadas', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Any`)
        .withQueryParams({ amount: 3 })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, amount: 3 });
    });

    it('traz piadas em formato JSON', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Any`)
        .withQueryParams({ format: 'json' })
        .expectStatus(StatusCodes.OK)
        .expectHeaderContains('content-type', 'application/json');
    });

    it('filtra piada do tipo single', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Any`)
        .withQueryParams({ type: 'single' })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, type: 'single' });
    });

    it('filtra piada do tipo twopart', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Any`)
        .withQueryParams({ type: 'twopart' })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, type: 'twopart' });
    });

    it('filtra piadas com blacklist', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Any`)
        .withQueryParams({ blacklistFlags: 'nsfw,racist' })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false });
    });

    it('filtra piadas por palavra-chave', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Programming`)
        .withQueryParams({ contains: 'code' })
        .expectStatus(StatusCodes.OK);
    });

    it('retorna erro para categoria inválida', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/InvalidCategory`)
        .expectStatus(StatusCodes.BAD_REQUEST)
        .expectJsonLike({ error: true });
    });

    it('retorna erro para faixa de ID inválida', async () => {
      await api
        .spec()
        .get(`${API_BASE}/joke/Any`)
        .withQueryParams({ idRange: '999999-999999' })
        .expectStatus(StatusCodes.BAD_REQUEST)
        .expectJsonLike({ error: true });
    });
  });

  describe('Envio de Piadas', () => {
    it('envia piada tipo single com dry-run', async () => {
      await api
        .spec()
        .post(`${API_BASE}/submit`)
        .withQueryParams({ 'dry-run': true })
        .withJson({
          formatVersion: 3,
          category: 'Misc',
          type: 'single',
          joke: faker.lorem.sentence(),
          flags: {
            nsfw: false,
            religious: false,
            political: false,
            racist: false,
            sexist: false,
            explicit: false
          },
          lang: 'en'
        })
        .expectStatus(StatusCodes.CREATED)
        .expectJsonLike({ error: false });
    });

    it('envia piada tipo twopart com dry-run', async () => {
      await api
        .spec()
        .post(`${API_BASE}/submit`)
        .withQueryParams({ 'dry-run': true })
        .withJson({
          formatVersion: 3,
          category: 'Programming',
          type: 'twopart',
          setup: faker.lorem.sentence(),
          delivery: faker.lorem.sentence(),
          flags: {
            nsfw: false,
            religious: false,
            political: false,
            racist: false,
            sexist: false,
            explicit: false
          },
          lang: 'en'
        })
        .expectStatus(StatusCodes.CREATED)
        .expectJsonLike({ error: false });
    });

    it('retorna erro ao enviar piada inválida', async () => {
      await api
        .spec()
        .post(`${API_BASE}/submit`)
        .withQueryParams({ 'dry-run': true })
        .withJson({
          formatVersion: 3,
          category: 'InvalidCategory',
          type: 'single',
          joke: '',
          flags: {
            nsfw: false,
            religious: false,
            political: false,
            racist: false,
            sexist: false,
            explicit: false
          },
          lang: 'en'
        })
        .expectStatus(StatusCodes.BAD_REQUEST);
    });

    it('retorna erro para versão de formato inválida', async () => {
      await api
        .spec()
        .