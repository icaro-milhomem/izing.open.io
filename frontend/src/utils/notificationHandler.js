import { format } from 'date-fns'
import alertSound from 'src/assets/sound.mp3'
import {
  showBrowserNotification,
  showInAppNotification
} from './helpersNotifications'

const recentKeys = new Map()
const pendingReminders = new Map()

const REMINDER_DELAY_MS = 60 * 1000
const REMINDER_CHECK_INTERVAL_MS = 10 * 1000

let notificationAudio = null
let reminderPollerStarted = false

export const initNotificationAudio = () => {
  if (notificationAudio || typeof document === 'undefined') {
    return
  }
  notificationAudio = document.createElement('audio')
  notificationAudio.src = alertSound
  notificationAudio.preload = 'auto'
  notificationAudio.style.display = 'none'
  document.body.appendChild(notificationAudio)
}

export const unlockNotificationAudio = () => {
  initNotificationAudio()
  if (!notificationAudio) {
    return
  }
  notificationAudio.play().then(() => {
    notificationAudio.pause()
    notificationAudio.currentTime = 0
  }).catch(() => {})
}

export const playNotificationSound = () => {
  initNotificationAudio()
  if (notificationAudio) {
    notificationAudio.currentTime = 0
    notificationAudio.play().catch(() => {
      new Audio(alertSound).play().catch(() => {})
    })
    return
  }
  new Audio(alertSound).play().catch(() => {})
}

export const parseNotificationPayload = (data) => {
  const message = data?.message || data
  const ticket = data?.ticket || message?.ticket
  const contact = ticket?.contact || data?.contact || message?.contact
  const bodyText =
    (message?.body && String(message.body).trim()) ||
    (message?.mediaType ? `[${message.mediaType}]` : '') ||
    'Nova mensagem'

  return { message, ticket, contact, bodyText }
}

export const isViewingTicketChat = (vm, ticketId) => {
  if (!vm?.$route || !ticketId) {
    return false
  }
  const route = vm.$route
  if (route.name !== 'chat') {
    return false
  }
  return route.params?.ticketId && +route.params.ticketId === +ticketId
}

const userCanReceiveTicketNotification = (ticket) => {
  const userId = +localStorage.getItem('userId')
  const profile = localStorage.getItem('profile')

  if (profile === 'admin') {
    return true
  }

  if (ticket.userId && +ticket.userId !== userId) {
    return false
  }

  if (ticket.userId && +ticket.userId === userId) {
    return true
  }

  const userQueues = JSON.parse(localStorage.getItem('queues') || '[]')
  const filasCadastradas = JSON.parse(localStorage.getItem('filasCadastradas') || '[]')

  if (filasCadastradas.length > 0 && ticket.queueId) {
    return userQueues.some(q => +q.id === +ticket.queueId)
  }

  return true
}

export const shouldNotifyIncomingMessage = (payload, vm) => {
  try {
    if (!payload || payload.fromMe) {
      return false
    }

    const ticket = payload.ticket
    if (!ticket?.id) {
      return false
    }

    if (isViewingTicketChat(vm, ticket.id)) {
      return false
    }

    return userCanReceiveTicketNotification(ticket)
  } catch (error) {
    console.error('shouldNotifyIncomingMessage', error)
    return true
  }
}

const openTicket = (vm, ticket) => {
  if (!vm || !ticket) {
    return
  }
  cancelMessageReminder(ticket.id)
  window.focus()
  vm.$store.dispatch('AbrirChatMensagens', ticket)
}

export const openTicketFromNotification = (vm, ticketId) => {
  if (!vm || !ticketId) {
    return
  }
  cancelMessageReminder(ticketId)
  window.focus()
  vm.$router.push({ name: 'chat', params: { ticketId: String(ticketId) } })
}

export const cancelMessageReminder = (ticketId) => {
  if (!ticketId) {
    return
  }
  const pending = pendingReminders.get(+ticketId)
  if (pending?.timeoutId) {
    clearTimeout(pending.timeoutId)
  }
  pendingReminders.delete(+ticketId)
}

const isTicketStillUnopened = (vm, ticketId) => {
  return !isViewingTicketChat(vm, ticketId)
}

const showNotificationAlert = async (vm, { title, body, ticket, contact, onOpen, tagPrefix }) => {
  const isBackground = document.visibilityState !== 'visible'

  playNotificationSound()

  if (isBackground) {
    await showBrowserNotification(title, {
      body,
      icon: contact?.profilePicUrl,
      tag: `${tagPrefix}-${ticket.id}-${Date.now()}`,
      data: { ticketId: ticket.id }
    })
  } else {
    showInAppNotification(title, body, onOpen)
  }
}

const fireMessageReminder = async (ticketId) => {
  const reminder = pendingReminders.get(ticketId)
  if (!reminder) {
    return
  }

  pendingReminders.delete(ticketId)
  if (reminder.timeoutId) {
    clearTimeout(reminder.timeoutId)
  }

  const { vm, ticket, contact, bodyText } = reminder
  if (!vm || vm._isDestroyed) {
    return
  }

  if (!isTicketStillUnopened(vm, ticketId)) {
    return
  }

  if (!userCanReceiveTicketNotification(ticket)) {
    return
  }

  const title = contact?.name
    ? `Lembrete: ${contact.name}`
    : 'Lembrete: mensagem não lida'

  const body = `${bodyText} — aguardando atendimento há 1 minuto`

  await showNotificationAlert(vm, {
    title,
    body,
    ticket,
    contact,
    onOpen: () => openTicket(vm, ticket),
    tagPrefix: 'reminder-ticket'
  })
}

const processDueReminders = () => {
  const now = Date.now()
  for (const [ticketId, reminder] of pendingReminders.entries()) {
    if (reminder.remindAt <= now) {
      fireMessageReminder(ticketId)
    }
  }
}

const startReminderPoller = () => {
  if (reminderPollerStarted || typeof window === 'undefined') {
    return
  }
  reminderPollerStarted = true
  setInterval(processDueReminders, REMINDER_CHECK_INTERVAL_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      processDueReminders()
    }
  })
}

const scheduleMessageReminder = (vm, data) => {
  const { ticket, contact, bodyText } = parseNotificationPayload(data)
  if (!ticket?.id || !vm) {
    return
  }

  startReminderPoller()
  cancelMessageReminder(ticket.id)

  const ticketId = +ticket.id
  const remindAt = Date.now() + REMINDER_DELAY_MS

  const timeoutId = setTimeout(() => {
    fireMessageReminder(ticketId)
  }, REMINDER_DELAY_MS)

  pendingReminders.set(ticketId, {
    remindAt,
    timeoutId,
    vm,
    ticket,
    contact,
    bodyText
  })
}

const shouldSkipDuplicate = (key) => {
  if (!key) {
    return false
  }
  const now = Date.now()
  const lastAt = recentKeys.get(key)
  if (lastAt && now - lastAt < 800) {
    return true
  }
  recentKeys.set(key, now)
  if (recentKeys.size > 100) {
    const oldest = [...recentKeys.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(0, 50)
    oldest.forEach(([k]) => recentKeys.delete(k))
  }
  return false
}

export const notifyIncomingMessage = async (vm, data) => {
  try {
    const { message, ticket, contact, bodyText } = parseNotificationPayload(data)

    if (!ticket?.id) {
      return
    }

    const messageKey = message?.messageId || message?.id
    if (messageKey && shouldSkipDuplicate(`${ticket.id}:${messageKey}`)) {
      return
    }

    const title = contact?.name
      ? `Mensagem de ${contact.name}`
      : 'Nova mensagem'

    const body = `${bodyText} - ${format(new Date(), 'HH:mm')}`
    const onOpen = () => openTicket(vm, ticket)

    await showNotificationAlert(vm, {
      title,
      body,
      ticket,
      contact,
      onOpen,
      tagPrefix: 'ticket'
    })

    scheduleMessageReminder(vm, data)
  } catch (error) {
    console.error('notifyIncomingMessage', error)
  }
}

export const notifyPendingClient = async (contactName) => {
  try {
    const body = `Cliente: ${contactName || 'Novo contato'}`
    const isBackground = document.visibilityState !== 'visible'

    playNotificationSound()

    if (isBackground) {
      await showBrowserNotification('Novo cliente pendente', {
        body,
        tag: `pending-${Date.now()}`
      })
    } else {
      showInAppNotification('Novo cliente pendente', body)
    }
  } catch (error) {
    console.error('notifyPendingClient', error)
  }
}
