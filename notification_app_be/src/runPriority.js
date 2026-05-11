require('dotenv').config()
const { fetchNotifications, getTopNotifications } = require('./priorityInbox')

async function main() {
  console.log('fetching notifications...\n')

  const notifs = await fetchNotifications()

  if (notifs.length === 0) {
    console.log('no notifications found. check your AUTH_TOKEN in .env')
    return
  }

  const top10 = getTopNotifications(notifs, 10)

  console.log('=== TOP 10 PRIORITY NOTIFICATIONS ===\n')
  top10.forEach((notif, i) => {
    console.log(`#${i + 1} [${notif.Type}] ${notif.Message}`)
    console.log(`    Score: ${notif.score}  |  Time: ${notif.Timestamp}`)
    console.log(`    ID: ${notif.ID}\n`)
  })

  console.log('\n=== TABLE VIEW ===\n')
  console.table(top10.map((n, i) => ({
    rank: i + 1,
    type: n.Type,
    message: n.Message,
    score: n.score,
    timestamp: n.Timestamp
  })))
}

main()
