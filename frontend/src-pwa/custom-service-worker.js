/* eslint-disable */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const ticketId = data.ticketId
  const scope = self.registration.scope
  const url = ticketId ? `${scope}#/atendimento/${ticketId}` : `${scope}#/atendimento`

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      if (clientsArr.length > 0) {
        clientsArr[0].postMessage({
          type: 'NOTIFICATION_CLICK',
          ticketId
        })
        return clientsArr[0].focus()
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
