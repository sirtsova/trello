const { expect } = require('chai');
const Api = require('../src/TrelloApi');
const factory = require('../src/factory/trello-factory');
const { validateSchema } = require('../utils/json-schema/validate-schema');
const guard = require('../utils/guard');

describe('Cards API', async () => {
  const api = new Api();
  let board;
  let list;
  const nonAuthorizedApi = new Api();

  const cleanUpBoards = async () => {
    const boards = await api.getAllMemberBoards();
    await guard(() => Promise.all(boards.map((b) => api.deleteBoard(b.id))));
  };

  before(async () => {
    api.authenticate();
    await cleanUpBoards();
  });

  beforeEach(async () => {
    board = await api.createBoard(factory.board());
    list = await api.createList({ ...factory.list(), idBoard: board.id });
  });

  afterEach(async () => {
    await cleanUpBoards();
  });

  describe('Create Card (POST /1/cards/)', async () => {
    it('Can create new card by only passing required parameters', async () => {
      const cardPayload = {
        idList: list.id,
        name: `Test card (${factory.QA_PREFIX})`,
        desc: 'Test description',
      };
      const card = await api.createCard(cardPayload);

      validateSchema('createCard', card);
      expect(card).to.have.property('id').that.has.lengthOf(24);
      expect(card).to.have.property('name', cardPayload.name);
      expect(card).to.have.property('desc', cardPayload.desc);
      expect(card).to.have.property('idList', list.id);
      expect(card).to.have.property('idBoard', board.id);
      expect(card).to.have.property('isTemplate', false);
      expect(card).to.have.property('dueComplete', false);
      expect(card).to.have.property('url').that.includes('https://trello.com/c/');
      expect(card).to.have.property('shortUrl').that.includes('https://trello.com/c/');
    });

    it('Error returned when creating a card with missing required parameters', async () => {
      const cardPayload = {
        ...factory.card(),
        idList: undefined,
      };

      const cardCreateError = await guard(() => api.createCard(cardPayload));

      expect(cardCreateError).to.be.an.instanceof(Error);
      expect(cardCreateError.statusCode).to.equal(400);
      expect(cardCreateError.message).to.contain(
        '400 - "invalid value for idList"',
      );
    });

    const testScenarious = [
      'B',
      'VeryVeryLOOOOOOOOOooooooooooooooonggggggggggggggCarddddddddddddname',
      'lower case card',
      'C_a_r_d_',
      'Card@gel.com',
      'B567%)^ )Ord',
      '3769808089674',
      '+=*$%_!@#$%^&*()_)',
      '   Spaces   Card    ',
    ];

    testScenarious.forEach(function (card) {
      it(`Create card with name : ${card}`, async () => {
        const cardToBeCreated = {
          ...factory.card(),
          name: card,
          idList: list.id,
        };

        const createdBoardResponce = await api.createCard(cardToBeCreated);
        expect(createdBoardResponce).to.have.property('name', `${card}`);
      });
    });
  });

  describe('Get card by ID (GET /1/cards/{id})', () => {
    it('Can get card by ID', async () => {
      const card = await api.createCard({ ...factory.card(), idList: list.id });
      const gotCard = await api.getCard(card.id);

      delete card.attachments;
      delete card.descData;
      delete card.limits;
      delete card.stickers;
      delete gotCard.descData;
      validateSchema('getCard', gotCard);

      expect(gotCard, 'Card from GET is different from the card created').to.deep.equal(card);
    });
    it('Error returned when getting card by ID and ID is unknown', async () => {
      const getCardError = await guard(() => api.getCard('unknownCardId'));

      expect(getCardError).to.be.an.instanceof(Error);
      expect(getCardError.statusCode).to.equal(400);
      expect(getCardError.message).to.contain(
        '400 - "invalid id"',
      );
    });
  });

  describe('Delete card by ID (DELETE /1/cards/{id})', () => {
    it('Can delete a card', async () => {
      const card = await api.createCard({ ...factory.card(), idList: list.id });
      const deletedCard = await api.deleteCard(card.id);

      expect(deletedCard).to.deep.equal({ limits: {} });

      const getCardError = await guard(() => api.getCard(card.id));

      expect(getCardError).to.be.an.instanceof(Error);
      expect(getCardError.statusCode).to.equal(404);
    });

    it('Error returned when deleting and already deleted card', async () => {
      const card = await api.createCard({ ...factory.card(), idList: list.id });
      await api.deleteCard(card.id);

      const deleteCardError = await guard(() => api.deleteCard(card.id));

      expect(deleteCardError).to.be.an.instanceof(Error);
      expect(deleteCardError.statusCode).to.equal(404);
      expect(deleteCardError.message).to.contain(
        '404 - "The requested resource was not found."',
      );
    });
  });

  describe('Update card by ID (PUT /1/cards/{id})', () => {
    it('Can update a card', async () => {
      const card = await api.createCard({ ...factory.card(), idList: list.id });
      const payloadForUpdate = {
        name: `${card.name} updated`,
        closed: true,
      };
      const updatedCard = await api.updateCard(card.id, payloadForUpdate);

      validateSchema('updateCard', updatedCard);
      expect(updatedCard).to.have.property('name', payloadForUpdate.name);
      expect(updatedCard).to.have.property('closed', payloadForUpdate.closed);
    });

    it('Error returned when updating a card that has been deleted', async () => {
      const card = await api.createCard({ ...factory.card(), idList: list.id });
      const payloadForUpdate = {
        name: `${card.name} updated`,
        closed: true,
      };
      await api.deleteCard(card.id);

      const updateCardError = await guard(() => api.updateCard(card.id, payloadForUpdate));

      expect(updateCardError).to.be.an.instanceof(Error);
      expect(updateCardError.statusCode).to.equal(404);
      expect(updateCardError.message).to.contain(
        '404 - "The requested resource was not found."',
      );
    });
  });

  describe('Can not create HTTP card requests without authorization', () => {
    it('Error message returned when creating a card with empty key and token value', async () => {
      const err = await guard(async () => nonAuthorizedApi.createCard({ ...factory.card(), idList: list.id }));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });

    it('Error message returned when getting a card with empty key and token value', async () => {
      const newCard = api.createCard({ ...factory.card(), idList: list.id });
      const err = await guard(async () => nonAuthorizedApi.getCard(newCard.id));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });

    it('Error message returned when updating a card with empty key and token value', async () => {
      const newCard = api.createCard({ ...factory.card(), idList: list.id });
      const err = await guard(async () => nonAuthorizedApi.updateCard(newCard.id, {}));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });

    it('Error message returned when deleting a card with empty key and token value', async () => {
      const newCard = api.createCard({ ...factory.card(), idList: list.id });
      const err = await guard(async () => nonAuthorizedApi.deleteCard(newCard.id));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });
  });
});
