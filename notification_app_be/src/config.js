require('dotenv').config()

const config = {
  port: process.env.PORT || 4000,
  baseUrl: process.env.BASE_URL || 'http://4.224.186.213/evaluation-service',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  email: process.env.EMAIL,
  rollNo: process.env.ROLL_NO,
  accessCode: process.env.ACCESS_CODE,
  name: process.env.NAME,
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
}

const required = ['clientId', 'clientSecret', 'email', 'rollNo', 'accessCode']
for (const key of required) {
  if (!config[key]) {
    console.error(`missing required env var: ${key}`)
    process.exit(1)
  }
}

module.exports = config
