import Router from 'src/router/index'
import { socketIO } from '../utils/socket'
import { ConsultarTickets } from 'src/service/tickets'
import {
  notifyPendingClient,
  notifyIncomingMessage,
  shouldNotifyIncomingMessage
} from 'src/utils/notificationHandler'

const socket = socketIO()

let notificationSocketReady = false

const getTenantId = () => {
  try {
    return JSON.parse(localStorage.getItem('usuario'))?.tenantId
  } catch (error) {
    return null
  }
}

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

const joinNotificationChannel = () => {
  const tenantId = getTenantId()
  if (tenantId) {
    socket.emit(`${tenantId}:joinNotification`)
  }
}

socket.on(`tokenInvalid:${socket.id}`, () => {
  socket.disconnect()
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('profile')
  localStorage.removeItem('userId')
  localStorage.removeItem('usuario')
  setTimeout(() => {
    Router.push({ name: 'login' })
  }, 1000)
})

export default {
  created () {
    this.$root.$on('handlerNotifications', this.onHandlerNotifications)
  },
  destroyed () {
    notificationSocketReady = false
    this.$root.$off('handlerNotifications', this.onHandlerNotifications)
  },
  mounted () {
    this.socketInitial()
  },
  methods: {
    onHandlerNotifications (data) {
      if (shouldNotifyIncomingMessage(data, this)) {
        notifyIncomingMessage(this, data)
      }
    },
    socketInitial () {
      if (notificationSocketReady) {
        joinNotificationChannel()
        return
      }
      notificationSocketReady = true

      joinNotificationChannel()

      socket.on('connect', () => {
        joinNotificationChannel()
      })

      const tenantId = getTenantId()
      if (!tenantId) {
        console.error('socketInitial: tenantId não encontrado')
        return
      }

      socket.on(`${tenantId}:whatsapp`, data => {
        if (data.action === 'update') {
          this.$store.commit('UPDATE_WHATSAPPS', data.whatsapp)
        }
        if (data.action === 'delete') {
          this.$store.commit('DELETE_WHATSAPPS', data.whatsappId)
        }
      })

      socket.on(`${tenantId}:ticketList`, async data => {
        if (data.type === 'chat:create') {
          if (shouldNotifyIncomingMessage(data.payload, this)) {
            notifyIncomingMessage(this, data.payload)
          }

          try {
            const { data: ticketsData } = await ConsultarTickets(
              buildNotificationParams(['open'], true)
            )
            this.$store.commit('UPDATE_NOTIFICATIONS', ticketsData)
          } catch (err) {
            console.error('UPDATE_NOTIFICATIONS', err)
          }
        }

        if (data.type === 'notification:new') {
          let verify = { data: { tickets: [] } }
          try {
            const dataNoti = await ConsultarTickets(
              buildNotificationParams(['pending'], false)
            )
            this.$store.commit('UPDATE_NOTIFICATIONS_P', dataNoti.data)
            verify = dataNoti
          } catch (err) {
            console.error('UPDATE_NOTIFICATIONS_P', err)
          }

          const passNoti = (verify.data?.tickets || []).some(
            element => element.id === data.payload.id
          )

          if (passNoti) {
            notifyPendingClient(data.payload.contact?.name)
          }
        }
      })

      socket.on(`${tenantId}:whatsappSession`, data => {
        if (data.action === 'update') {
          this.$store.commit('UPDATE_SESSION', data.session)
          this.$root.$emit('UPDATE_SESSION', data.session)
        }

        if (data.action === 'readySession') {
          this.$q.notify({
            position: 'top',
            icon: 'mdi-wifi-arrow-up-down',
            message: `A conexão com o WhatsApp está pronta e o mesmo está habilitado para enviar e receber mensagens. Conexão: ${data.session.name}. Número: ${data.session.number}.`,
            type: 'positive',
            color: 'primary',
            html: true,
            progress: true,
            timeout: 7000,
            actions: [{
              icon: 'close',
              round: true,
              color: 'white'
            }],
            classes: 'text-body2 text-weight-medium'
          })
        }
      })

      socket.on(`${tenantId}:change_battery`, data => {
        this.$q.notify({
          message: `Bateria do celular do whatsapp ${data.batteryInfo.sessionName} está com bateria em ${data.batteryInfo.battery}%. Necessário iniciar carregamento.`,
          type: 'negative',
          progress: true,
          position: 'top',
          actions: [{
            icon: 'close',
            round: true,
            color: 'white'
          }]
        })
      })
    }
  }
}
