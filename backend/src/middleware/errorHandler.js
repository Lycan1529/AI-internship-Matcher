import { ZodError } from "zod";

export function errorHandler(error, req, res, _next) {
  const status = error instanceof ZodError ? 400 : error.status || 500;
  if (status >= 500) {
    console.error("Request failed", { method: req.method, path: req.originalUrl, status, code: error.code || "INTERNAL_ERROR" });
  }
  res.status(status).json({
    error: {
      code: error.code || (status === 401 ? "AUTH_UNAUTHENTICATED" : status === 403 ? "AUTH_FORBIDDEN" : status === 404 ? "RESOURCE_NOT_FOUND" : status === 409 ? "RESOURCE_CONFLICT" : status === 400 ? "VALIDATION_ERROR" : "INTERNAL_ERROR"),
      message: error.message || "Unexpected server error",
      ...(process.env.NODE_ENV === "production" ? {} : { details: error.details || (error instanceof ZodError ? error.issues : undefined) }),
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
