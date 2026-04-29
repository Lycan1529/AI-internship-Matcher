export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  res.status(status).json({
    error: error.message || "Unexpected server error",
    details: process.env.NODE_ENV === "production" ? undefined : error.details,
  });
}

export function httpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}
