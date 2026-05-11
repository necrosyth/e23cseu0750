const { getNotifications } = require('../services/notifService')

async function listNotifications(req, res, next) {
  try {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 20)
    const type = req.query.type

    if (page <= 0 || limit <= 0) {
      return res.status(400).json({ success: false, error: 'page and limit must be positive numbers' })
    }

    const result = await getNotifications(page, limit, type)

    return res.json({
      success: true,
      data: result.notifs,
      page: result.page || page,
      limit: result.limit || limit,
      total: result.total
    })
  } catch (err) {
    return next(err)
  }
}

module.exports = { listNotifications }
