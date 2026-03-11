const internalErrorMessage = 'Internal server error';

function globalErrorMiddleware(err, req, res, next) {
  let message = err?.message ?? '';
  let status = err?.status ?? 500;

  if (status >= 500) {
    console.error(err);

    message = internalErrorMessage;
  }

  if ((!err) instanceof LocalError) {
    console.error(err);

    message = internalErrorMessage;
    status = 500;
  }

  res.status(status).json({
    status,
    message,
  });
}

class LocalError {
  status;
  message;
  code;

  constructor(status, message, code) {
    this.status = status;
    this.message = message;
    this.code = code;
  }
}

module.exports = {
  globalErrorMiddleware,
  LocalError,
};
