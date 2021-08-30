const { expect } = require('chai');
const { before } = require('mocha');
const guard = require('../utils/guard');
const factory = require('../src/factory/boardsApi-factory');
const Boards = require('../src/Board');

describe('Trello Boards HTTP requests (/1/boards/)', () => {
  let api;
  const invalidId = '76432424487';

  before(async () => {
    api = new Boards();

    const searchResponse = await api.getAllBoards();

    await Promise.all(searchResponse.map((user) => {
      return api.deleteBoard(user.id);
    }));
  });

  afterEach(async () => {
    const searchResponse = await api.getAllBoards();

    await Promise.all(searchResponse.map((user) => {
      return api.deleteBoard(user.id);
    }));
  });

  describe('Can not create HTTP board requests without authorization', () => {
    let unauthorized;
    before(async () => {
      unauthorized = new Boards();
      unauthorized.unAuthenticate();
    });

    it('Error message returned when creating a board with empty key and token value', async () => {
      const err = await guard(async () => unauthorized.createBoard(factory.board()));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });

    it('Error message returned when getting a board with empty key and token value', async () => {
      const newBoard = api.createBoard(factory.board());
      const err = await guard(async () => unauthorized.getBoard(newBoard.id));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });

    it('Error message returned when updating a board with empty key and token value', async () => {
      const newBoard = api.createBoard(factory.board());
      const err = await guard(async () => unauthorized.updateBoard(newBoard.id, {}));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });

    it('Error message returned when deleting a board with empty key and token value', async () => {
      const newBoard = api.createBoard(factory.board());
      const err = await guard(async () => unauthorized.deleteBoard(newBoard.id));

      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('statusCode', 401);
      expect(err).to.have.property('error', 'invalid key');
    });
  });

  describe('Create board (POST /1/boards/)', async () => {
    it('Create board with with required pharameters', async () => {
      const board = {
        name: 'Test Board',
        desc: 'Desrpiption for the board',
      };
      const request = await api.createBoard(board, true);

      expect(request.body).to.have.property('id', request.body.id);
      expect(request.body).to.have.property('name', 'Test Board');
      expect(request.body).to.have.property('desc', 'Desrpiption for the board');
      expect(request).to.have.property('statusCode', 200);
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

  describe('Get board by ID (GET /1/boards/{id})', async () => {
    it('Get board by ID', async () => {
      const newBoard = await api.createBoard(factory.board());
      const request = await api.getBoard(newBoard.id);

      expect(request).to.have.property('id', newBoard.id);
      expect(request).to.have.property('name', newBoard.name);
      expect(request).to.have.property('desc', newBoard.desc);
      expect(request).to.have.property('idOrganization', newBoard.idOrganization);
      expect(request).to.have.property('url', newBoard.url);
      expect(request).to.have.property('shortUrl', newBoard.shortUrl);
    });

    it('Error returned when getting board with invalid ID', async () => {
      const err = await guard(async () => api.getBoard(invalidId));

      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('statusCode', 400);
      expect(err).to.have.property('error', 'invalid id');
    });
  });

  describe('Get boards member belongs to', async () => {
    it('Get boards', async () => {
      const user1 = {
        ...factory.board(),
      };

      const user2 = {
        ...factory.board(),
      };

      const user3 = {
        ...factory.board(),
      };

      const myBoardsArray = await Promise.all([
        api.createBoard(user1),
        api.createBoard(user2),
        api.createBoard(user3),
      ]);

      myBoardsArray.forEach((board) => {
        expect(board).to.have.property('name').that.is.a('string');
      });
      const request = await api.getAllBoards();
      expect(request).to.be.an('array').that.has.lengthOf(3);
    });
  });

  describe('Update board by ID (PUT /1/boards/{id})', async () => {
    it('Update board by ID', async () => {
      const newBoard = await api.createBoard(factory.board());

      const boardToUpdate = {
        name: 'Updated Name',
      };

      const request = await api.updateBoard(newBoard.id, boardToUpdate, true);

      expect(request).to.have.property('statusCode', 200);
      expect(request.body).to.have.property('id', newBoard.id);
      expect(request.body).to.have.property('name', 'Updated Name');
      expect(request.body).to.be.an('object');
    });

    it('Can not update board with invalid ID', async () => {
      const boardToUpdate = {
        name: 'Updated Name',
      };

      const err = await guard(async () => api.updateBoard(invalidId, boardToUpdate));
      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('statusCode', 400);
      expect(err).to.have.property('error', 'invalid id');
    });
  });

  describe('Delete board by ID (DELETE /1/boards/{id})', async () => {
    it('Delete board by ID', async () => {
      const newBoard = await api.createBoard(factory.board());

      const deleteRequest = await api.deleteBoard(newBoard.id, true);
      expect(deleteRequest).to.have.property('statusCode', 200);
      expect(deleteRequest.body).to.have.property('_value', null);

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
});
