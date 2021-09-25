require('dotenv').config();
const request = require('request-promise');

const { KEY, HOST, TOKEN } = process.env;
const prefixBoards = '/1/boards/';
const prefixCards = '/1/cards';
const prefixLists = '/1/lists';

const defaultAuthParams = {
  key: KEY,
  token: TOKEN,
};

class TrelloApi {
  constructor(host = HOST) {
    this.host = host;
    this.request = request.defaults({
      headers: {
        Accept: 'application/json',
      },
      json: true,
    });
  }

  authenticate(authParams = defaultAuthParams) {
    this.request = request.defaults({
      qs: authParams,
      headers: {
        Accept: 'application/json',
      },
      json: true,
    });
  }

  // ################ Boards API #####################
  getBoard(boardId, resolveWithFullResponse = false) {
    const path = `${prefixBoards}${boardId}`;

    return this.request.get({
      url: `${this.host}${path}`,
      resolveWithFullResponse,
    });
  }

  getAllMemberBoards(userId = 'me') {
    const path = `/1/members/${userId}/boards`;

    return this.request.get({
      url: `${this.host}${path}`,
    });
  }

  createBoard(body, resolveWithFullResponse = false) {
    const path = `${prefixBoards}`;

    return this.request.post({
      url: `${this.host}${path}`,
      body,
      resolveWithFullResponse,
    });
  }

  updateBoard(boardId, body, resolveWithFullResponse = false) {
    const path = `${prefixBoards}${boardId}`;

    return this.request.put({
      url: `${this.host}${path}`,
      body,
      resolveWithFullResponse,
    });
  }

  deleteBoard(boardId, resolveWithFullResponse = false) {
    const path = `${prefixBoards}${boardId}`;

    return this.request.delete({
      url: `${this.host}${path}`,
      resolveWithFullResponse,
    });
  }
  // #################Cards API####################

  createCard(body) {
    return this.request.post({
      url: `${this.host}${prefixCards}`,
      body,
    });
  }

  getCard(id) {
    return this.request.get({
      url: `${this.host}${prefixCards}/${id}`,
    });
  }

  updateCard(id, body) {
    return this.request.put({
      url: `${this.host}${prefixCards}/${id}`,
      body,
    });
  }

  deleteCard(id) {
    return this.request.delete({
      url: `${this.host}${prefixCards}/${id}`,
    });
  }

  // ################# Lists API ###################

  createList(body) {
    return this.request.post({
      url: `${this.host}${prefixLists}`,
      body,
    });
  }

  getList(id) {
    return this.request.get({
      url: `${this.host}${prefixLists}/${id}`,
    });
  }

  updateList(id, body) {
    return this.request.put({
      url: `${this.host}${prefixLists}/${id}`,
      body,
    });
  }

  deleteList(id) {
    return this.request.delete({
      url: `${this.host}${prefixLists}/${id}`,
    });
  }

  // ################ Misc API #####################
  search(query, modelTypes = undefined) {
    return this.request.get({
      url: `${this.host}/search`,
      qs: {
        query,
        modelTypes,
      },
    });
  }
}

module.exports = TrelloApi;
