import AppError from '../exceptions/AppError.js'
import ApiResponse from '../responses/ApiResponse.js'
import { Messages } from '../enums/Messages.js'

export const errorHandler = (error, req, res, next) => {
  if (error.type === 'entity.parse.failed')
    return ApiResponse.error(res, 'El cuerpo debe contener JSON válido.', 400)
  if (error.type === 'entity.too.large')
    return ApiResponse.error(res, 'La solicitud supera el tamaño permitido.', 413)
  if (error.code === 'ERR_SQLITE_ERROR' && String(error.message).includes('UNIQUE constraint'))
    return ApiResponse.error(
      res,
      'La operación entra en conflicto con un registro existente. Actualizá la información.',
      409,
    )
  if (error instanceof AppError) {
    return ApiResponse.error(res, error.message, error.statusCode)
  }

  console.error(error)

  return ApiResponse.error(res, Messages.INTERNAL_SERVER_ERROR, 500)
}
