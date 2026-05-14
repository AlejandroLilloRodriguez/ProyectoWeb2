function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Error interno del servidor';

  if (err.name === 'CastError') {
    status = 400;
    code = 'BAD_REQUEST';
    message = 'Identificador o parametro con formato no valido';
  }

  if (err.name === 'ValidationError') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'El cuerpo de la peticion no es valido';
  }

  if (err.code === 11000) {
    status = 409;
    code = 'CONFLICT';
    message = 'Ya existe un recurso con esos datos unicos';
  }

  res.status(status).json({ error: { code, message } });
}

module.exports = errorHandler;
