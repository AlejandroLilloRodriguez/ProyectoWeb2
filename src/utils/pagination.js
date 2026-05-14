function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);

  if (!Number.isInteger(page) || page < 1) {
    const err = new Error('El parametro page debe ser un entero mayor o igual que 1');
    err.status = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    const err = new Error('El parametro limit debe ser un entero entre 1 y 100');
    err.status = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function buildPagination(page, limit, totalItems) {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

module.exports = { parsePagination, buildPagination };
