const AppError = require('../utils/appError');

const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID: ${err.value}`;
    code = 'INVALID_ID';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for field: ${field}`;
    code = 'DUPLICATE_KEY';
    details = err.keyValue;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ');
    code = 'VALIDATION_ERROR';
  }

  const payload = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  if (process.env.NODE_ENV === 'development') {
    payload.error.stack = err.stack;
    if (!(err instanceof AppError)) payload.error.raw = { name: err.name };
  }

  res.status(statusCode).json(payload);
};

module.exports = globalErrorHandler;

