const usuario = JSON.parse(localStorage.getItem('usuario'))
import Router from 'src/router/index'
import { socketIO } from 'src/utils/socket'
import { ConsultarTickets } from 'src/service/tickets'

const socket = socketIO()

const userId = +localStorage.getItem('userId')

const buildNotificationParams = (status, withUnreadMessages) => {
  const UserQueues = JSON.parse(localStorage.getItem('queues') || '[]')
  const params = {
    searchParam: '',
    pageNumber: 1,
    status,
    showAll: false,
    count: null,
    withUnreadMessages,
    isNotAssignedUser: false,
    includeNotQueueDefined: true
  }
  if (UserQueues.length) {
    params.queuesIds = UserQueues.map(q => q.id)
  }
  return params
}

// localStorage.debug = '*'

socket.on(`tokenInvalid:${socket.id}`, () => {
  socket.disconnect()
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('profile')
  localStorage.removeItem('userId')
  localStorage.removeItem('usuario')
  setTimeout(() => {
    Router.push({
      name: 'login'
    })
  }, 1000)
})

export default {
  methods: {
    scrollToBottom () {
      setTimeout(() => {
        this.$root.$emit('scrollToBottomMessageChat')
      }, 200)
    },
    socketMessagesList () {

    },
    socketTicket () {
      socket.on('connect', () => {
        socket.on(`${usuario.tenantId}:ticket`, data => {
          if (data.action === 'update' && data.ticket.userId === userId) {
            if (data.ticket.status === 'open' && !data.ticket.isTransference) {
              this.$store.commit('TICKET_FOCADO', data.ticket)
            }
          }
        })
      })

      // socket.on(`${usuario.tenantId}:contact`, data => {
      //   if (data.action === 'update') {
      //     this.$store.commit('UPDATE_TICKET_CONTACT', data.contact)
      //     if (this.$store.getters.ticketFocado.contactId === data.contact.id) {
      //       this.$store.commit('UPDATE_TICKET_FOCADO_CONTACT', data.contact)
      //     }
      //   }
      // })
    },
    socketTicketList () {
      this.socketTicketListNew()
      // const searchParam = null
    },
    socketTicketListNew () {
      // // if (status) {
      // socket.emit(`${usuario.tenantId}:joinTickets`, 'open')
      // socket.emit(`${usuario.tenantId}:joinTickets`, 'pending')
      // socket.emit(`${usuario.tenantId}:joinTickets`, 'closed')
      // // } else {
      // socket.emit(`${usuario.tenantId}:joinNotification`)
      // }

      socket.on('connect', () => {
        socket.on(`${usuario.tenantId}:ticketList`, async data => {
          if (data.type === 'chat:create') {
            this.$store.commit('UPDATE_MESSAGES', data.payload)
            this.scrollToBottom()
            try {
              const { data } = await ConsultarTickets(
                buildNotificationParams(['open'], true)
              )
              this.countTickets = data.count
              this.$store.commit('UPDATE_NOTIFICATIONS', data)
            } catch (err) {
              console.error('UPDATE_NOTIFICATIONS', err)
            }
          }

          if (data.type === 'chat:ack' || data.type === 'chat:delete') {
            this.$store.commit('UPDATE_MESSAGE_STATUS', data.payload)
          }

          if (data.type === 'chat:update') {
            this.$store.commit('UPDATE_MESSAGE', data.payload)
          }

          if (data.type === 'ticket:update') {
            this.$store.commit('UPDATE_TICKET', data.payload)
          }
        })
        socket.on(`${usuario.tenantId}:contactList`, data => {
          this.$store.commit('UPDATE_CONTACT', data.payload)
        })
      })
    },
    socketDisconnect () {
      socket.disconnect()
    }
  }
}
