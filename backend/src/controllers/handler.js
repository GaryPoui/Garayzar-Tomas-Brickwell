import ApiResponse from '../responses/ApiResponse.js'
export const handler =
  (work, status = 200) =>
  async (req, res, next) => {
    try {
      ApiResponse.success(res, await work(req), status)
    } catch (error) {
      next(error)
    }
  }
