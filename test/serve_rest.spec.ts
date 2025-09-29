import pactum from 'pactum';
import { SimpleReporter } from '../simple-reporter';
import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';

describe('JokeAPI - Testes Automatizados', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://v2.jokeapi.dev';

  p.request.setDefaultTimeout(60000);

  beforeAll(() => {
    p.reporter.add(rep);
  });

  afterAll(() => {
    p.reporter.end();
  });

  describe('Testes de Sistema', () => {
    it('ping responde com sucesso', async () => {
      await p.spec().get(`${baseUrl}/ping`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, ping: 'Pong!' });
    });

    it('retorna informações da API', async () => {
      await p.spec().get(`${baseUrl}/info`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('version')
        .expectBodyContains('categories');
    });

    it('retorna idiomas disponíveis', async () => {
      await p.spec().get(`${baseUrl}/languages`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('jokeLanguages');
    });

    it('retorna código de idioma para português', async () => {
      await p.spec().get(`${baseUrl}/langcode/portuguese`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, code: 'pt' });
    });
  });

  describe('Testes de Piadas', () => {
    it('retorna piada aleatória', async () => {
      await p.spec().get(`${baseUrl}/joke/Any`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false });
    });

    it('retorna piada de programação', async () => {
      await p.spec().get(`${baseUrl}/joke/Programming`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, category: 'Programming' });
    });

    it('retorna piada sombria', async () => {
      await p.spec().get(`${baseUrl}/joke/Dark`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, category: 'Dark' });
    });

    it('retorna múltiplas piadas', async () => {
      await p.spec().get(`${baseUrl}/joke/Any`)
        .withQueryParams({ amount: 2 })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, amount: 2 });
    });

    it('retorna piada tipo single', async () => {
      await p.spec().get(`${baseUrl}/joke/Any`)
        .withQueryParams({ type: 'single' })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ error: false, type: 'single' });
    });

    it('retorna erro para categoria inválida', async () => {
      await p.spec().get(`${baseUrl}/joke/InvalidCategory`)
        .expectStatus(StatusCodes.BAD_REQUEST)
        .expectJsonLike({ error: true });
    });
  });

  describe('Testes de Submissão', () => {
    it('submete piada tipo single com dry-run', async () => {
      await p.spec().post(`${baseUrl}/submit`)
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

    it('submete piada tipo twopart com dry-run', async () => {
      await p.spec().post(`${baseUrl}/submit`)
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

    it('retorna erro ao submeter piada inválida', async () => {
      await p.spec().post(`${baseUrl}/submit`)
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
  });
});
