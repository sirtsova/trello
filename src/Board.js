require('dotenv').config();
const request = require('request-promise');

const { KEY, HOST, TOKEN } = process.env;
const prefixBoards = '/1/boards/';

class Boards {
  constructor(host = HOST, key = KEY, token = TOKEN) {
    this.host = host;
    this.key = key;
    this.token = token;
    this.request = request.defaults({
      headers: {
        Accept: 'application/json',
      },
      json: true,
    });
  }

  unAuthenticate(host = HOST, key = '', token = '') {
    this.host = host;
    this.key = key;
    this.token = token;
    this.request = request.defaults({
      headers: {
        Accept: 'application/json',
      },
      json: true,
    });
  }

  getBoard(boardId, resolveWithFullResponse = false) {
    const path = `${prefixBoards}${boardId}?key=${this.key}&token=${this.token}`;

    return this.request.get({
      url: `${this.host}${path}`,
      resolveWithFullResponse,
    });
  }

  getAllBoards() {
    const path = `/1/members/me/boards?key=${this.key}&token=${this.token}`;

    return this.request.get({
      url: `${this.host}${path}`,
    });
  }

  createBoard(body, resolveWithFullResponse = false) {
    const path = `${prefixBoards}?key=${this.key}&token=${this.token}`;

    return this.request.post({
      url: `${this.host}${path}`,
      body,
      resolveWithFullResponse,
    });
  }

  updateBoard(boardId, body, resolveWithFullResponse = false) {
    const path = `${prefixBoards}${boardId}?key=${this.key}&token=${this.token}`;

    return this.request.put({
      url: `${this.host}${path}`,
      body,
      resolveWithFullResponse,
    });
  }

  deleteBoard(boardId, resolveWithFullResponse = false) {
    const path = `${prefixBoards}${boardId}?key=${this.key}&token=${this.token}`;

    return this.request.delete({
      url: `${this.host}${path}`,
      resolveWithFullResponse,
    });
  }
}

module.exports = Boards;
