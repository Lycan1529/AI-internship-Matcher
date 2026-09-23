export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  res.status(status).json({
    error: {
      code: error.code || (status === 401 ? "AUTH_UNAUTHENTICATED" : status === 403 ? "AUTH_FORBIDDEN" : status === 404 ? "RESOURCE_NOT_FOUND" : status === 409 ? "RESOURCE_CONFLICT" : status === 400 ? "VALIDATION_ERROR" : "INTERNAL_ERROR"),
      message: error.message || "Unexpected server error",
      ...(process.env.NODE_ENV === "production" ? {} : { details: error.details }),
    },
  });
}

export function httpError(status, message, details, code) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  error.code = code;
  return error;
}
