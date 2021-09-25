const { expect } = require('chai');
const guard = require('../utils/guard');
const factory = require('../src/factory/trello-factory');
const TrelloApi = require('../src/TrelloApi');
const { validateSchema } = require('../utils/json-schema/validate-schema');

describe('Trello Boards HTTP requests (/1/boards/)', () => {
  let api;
  let nonAuthorizedApi;
  const invalidId = '76432424487';
  async function cleanUp() {
    const boardsArr = await api.getAllMemberBoards();

    await Promise.all(boardsArr.map((board) => {
      return api.deleteBoard(board.id);
    }));
  }

  before(async () => {
    api = new TrelloApi();
    api.authenticate();
    nonAuthorizedApi = new TrelloApi();

    cleanUp();
  });

  afterEach(async () => {
    cleanUp();
  });

  describe('Create board (POST /1/boards/)', () => {
    it('Create board with with required pharameters', async () => {
      const board = {
        name: 'Test Board',
      };
      const requestObj = await api.createBoard(board, true);

      validateSchema('createBoard', requestObj.body);
      expect(requestObj).to.have.property('statusCode', 200);
      expect(requestObj.body).to.have.property('id', requestObj.body.id);
      expect(requestObj.body).to.have.property('id').that.has.lengthOf(24);
      expect(requestObj.body).to.have.property('name', board.name);
      expect(requestObj.body).to.have.property('desc', '');
      expect(requestObj.body).to.have.property('closed', false);
      expect(requestObj.body).to.have.property('pinned', false);
      expect(requestObj.body).to.have.property('url').that.includes('https://trello.com/b/');
      expect(requestObj.body).to.have.property('shortUrl').that.includes('https://trello.com/b/');
    });

    it('Can not create board without required pharameters', async () => {
      const err = await guard(async () => api.createBoard({}));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 400);
      expect(err).to.have.property('error', 'invalid value for name');
    });

    const testScenarious = [
      'B',
      'VeryVeryLOOOOOOOOOooooooooooooooonggggggggggggggBoarddddddddddddname',
      'lower case board',
      'Bo_a_r_d_',
      'Board@gel.com',
      'B567%)^ )Ord',
      '3769808089674',
      '+=*$%_!@#$%^&*()_)',
      '   Spaces   Board    ',
    ];

    testScenarious.forEach(function (board) {
      it(`Create board with name : ${board}`, async () => {
        const boardToBeCreated = {
          ...factory.board(),
          name: board,
        };

        const createdBoardResponce = await api.createBoard(boardToBeCreated);
        expect(createdBoardResponce).to.have.property('name', `${board}`);
      });
    });
  });

  describe('Get board by ID (GET /1/boards/{id})', () => {
    it('Get board by ID', async () => {
      const newBoard = await api.createBoard(factory.board());
      const gotBoard = await api.getBoard(newBoard.id);

      validateSchema('createBoard', gotBoard);
      delete newBoard.limits;
      expect(gotBoard).to.deep.equal(newBoard);
      expect(gotBoard).to.have.property('id', newBoard.id);
      expect(gotBoard).to.have.property('name', newBoard.name);
      expect(gotBoard).to.have.property('desc', newBoard.desc);
      expect(gotBoard).to.have.property('idOrganization', newBoard.idOrganization);
      expect(gotBoard).to.have.property('url', newBoard.url);
      expect(gotBoard).to.have.property('shortUrl', newBoard.shortUrl);
    });

    it('Error returned when getting board with invalid ID', async () => {
      const err = await guard(async () => api.getBoard(invalidId));

      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('statusCode', 400);
      expect(err).to.have.property('error', 'invalid id');
    });
  });

  describe('Get boards member belongs to', () => {
    it('Get boards', async () => {
      const myBoardsArray = await Promise.all([
        api.createBoard(factory.board()),
        api.createBoard(factory.board()),
        api.createBoard(factory.board()),
      ]);

      myBoardsArray.forEach((board) => {
        expect(board).to.have.property('name').that.is.a('string');
        expect(board).to.have.property('desc').that.is.a('string');
      });
      const boardsList = await api.getAllMemberBoards();
      expect(boardsList).to.be.an('array').that.has.lengthOf(3);
    });
  });

  describe('Update board by ID (PUT /1/boards/{id})', () => {
    it('Update board by ID', async () => {
      const newBoard = await api.createBoard(factory.board());

      const boardToUpdate = {
        name: 'Updated Name',
      };

      const updatedBoardObject = await api.updateBoard(newBoard.id, boardToUpdate, true);

      validateSchema('createBoard', updatedBoardObject.body);
      expect(updatedBoardObject).to.have.property('statusCode', 200);
      expect(updatedBoardObject.body).to.have.property('id', newBoard.id);
      expect(updatedBoardObject.body).to.have.property('name', boardToUpdate.name);
      expect(updatedBoardObject.body).to.be.an('object');
    });

    it('Can not update board with invalid ID', async () => {
      const err = await guard(async () => api.updateBoard(invalidId, factory.board()));
      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('statusCode', 400);
      expect(err).to.have.property('error', 'invalid id');
    });
  });

  describe('Delete board by ID (DELETE /1/boards/{id})', () => {
    it('Delete board by ID', async () => {
      const newBoard = await api.createBoard(factory.board());

      const deleteRequestObj = await api.deleteBoard(newBoard.id, true);
      expect(deleteRequestObj).to.have.property('statusCode', 200);
      expect(deleteRequestObj.body).to.have.property('_value', null);

      const err = await guard(async () => api.getBoard(newBoard.id));

      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('statusCode', 404);
      expect(err).to.have.property('error', 'The requested resource was not found.');
    });

    it('Can not delete board with invalid ID', async () => {
      const err = await guard(async () => api.deleteBoard(invalidId));

      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('statusCode', 400);
      expect(err).to.have.property('error', 'invalid id');
    });
  });

  describe('Can not create HTTP board requests without authorization', () => {
    it('Error message returned when creating a board with empty key and token value', async () => {
      const err = await guard(async () => nonAuthorizedApi.createBoard(factory.board()));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });

    it('Error message returned when getting a board with empty key and token value', async () => {
      const newBoard = api.createBoard(factory.board());
      const err = await guard(async () => nonAuthorizedApi.getBoard(newBoard.id));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });

    it('Error message returned when updating a board with empty key and token value', async () => {
      const newBoard = api.createBoard(factory.board());
      const err = await guard(async () => nonAuthorizedApi.updateBoard(newBoard.id, {}));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });

    it('Error message returned when deleting a board with empty key and token value', async () => {
      const newBoard = api.createBoard(factory.board());
      const err = await guard(async () => nonAuthorizedApi.deleteBoard(newBoard.id));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });
  });
});
