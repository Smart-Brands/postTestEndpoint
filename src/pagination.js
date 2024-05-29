const { sql } = require('./main');

class Pagination {
  /**
   * The current page number.
   */
  page = 1;

  /**
   * The page size to fetch.
   */
  pageSize = 10;

  /**
   * Constructs Pagination instance.
   *
   * @param {Object} event A request event object.
   */
  constructor(event) {
    const { page, pageSize } = event.queryStringParameters || {};

    if (page) this.page = Number(page);
    if (pageSize) this.pageSize = Number(pageSize);
  }

  /**
   * Returns a limit for sql request.
   *
   * @returns array The array with [offset, limit] values.
   */
  get limit() {
    return [(this.page - 1) * this.pageSize, this.pageSize];
  }

  /**
   * Returns sql query for total elements.
   *
   * @returns string The sql query.
   */
  get query() {
    return 'SELECT FOUND_ROWS() as total';
  }

  /**
   * Wraps given response with pagination object.
   *
   * @param {Object} response A response object.
   * @returns {Object} The new response object.
   */
  wrapResponse([content, foundRows]) {
    return {
      content,
      totalElements: foundRows[0].total,
      totalPages: Math.ceil(foundRows[0].total / this.pageSize),
    };
  }
}

module.exports.createPagination = event => new Pagination(event);
