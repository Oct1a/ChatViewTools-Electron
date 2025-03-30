export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  DATABASE: {
    INIT_FAILED: 'DB_INIT_FAILED',
    QUERY_FAILED: 'DB_QUERY_FAILED',
    NOT_FOUND: 'DB_NOT_FOUND'
  },
  DECRYPT: {
    INSTALL_PATH_NOT_FOUND: 'DECRYPT_INSTALL_PATH_NOT_FOUND',
    DB_PASS_NOT_FOUND: 'DECRYPT_DB_PASS_NOT_FOUND',
    INVALID_VERSION: 'DECRYPT_INVALID_VERSION',
    DECRYPT_FAILED: 'DECRYPT_FAILED',
    DB_NOT_FOUND: 'DECRYPT_DB_NOT_FOUND',
    INVALID_DATA: 'DECRYPT_INVALID_DATA'
  },
  EXPORT: {
    CREATE_DIR_FAILED: 'EXPORT_CREATE_DIR_FAILED',
    WRITE_FILE_FAILED: 'EXPORT_WRITE_FILE_FAILED',
    INVALID_FORMAT: 'EXPORT_INVALID_FORMAT'
  },
  AVATAR: {
    DOWNLOAD_FAILED: 'AVATAR_DOWNLOAD_FAILED',
    SAVE_FAILED: 'AVATAR_SAVE_FAILED'
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      { originalError: error }
    )
  }
  
  return new AppError(
    '发生未知错误',
    'UNKNOWN_ERROR',
    { originalError: error }
  )
} 