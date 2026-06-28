import { Notify } from 'quasar'
import Errors from 'src/utils/errors'

export const notificarErro = (msg, error = null) => {
  let erro = ''
  if (error) {
    erro = error?.data?.error || error?.data?.msg || error?.data?.message || error?.response?.data?.error || error?.message || 'Não identificado'
  }
  const findErro = Errors.find(e => e.error === erro)
  let message = ''

  if (error && findErro?.error) {
    message = `
      <p class="text-bold">
      <span class="text-bold">${findErro.description}.</span>
      </p>
      <p>${findErro.detail}</p>
    `
  } else {
    message = `
    <p class="text-bold">
      <span class="text-bold">${msg}</span>
    </p>
    <p>Detail: ${erro}</p>
    `
  }

  Notify.create({
    type: 'negative',
    progress: true,
    position: 'top',
    timeout: 500,
    message,
    actions: [{
      icon: 'close',
      round: true,
      color: 'white'
    }],
    html: true
  })
  throw new Error(message)
}

const appIcon = (size) => `${window.location.origin}/icons/icon-${size}.png`

const sanitizeNotificationOptions = (options = {}) => {
  const contactIcon = options.icon ? String(options.icon) : ''
  const icon = contactIcon.startsWith('https://') ? contactIcon : appIcon('192x192')

  return {
    body: options.body || '',
    icon,
    badge: appIcon('128x128'),
    tag: options.tag || `izing-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: options.data || {}
  }
}

export const showBrowserNotification = async (title, options = {}) => {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch (error) {
      console.error('requestPermission', error)
    }
  }

  if (Notification.permission !== 'granted') {
    return false
  }

  const safeOptions = sanitizeNotificationOptions(options)

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration?.showNotification) {
        await registration.showNotification(title, safeOptions)
        return true
      }
    }
  } catch (error) {
    console.warn('showBrowserNotification serviceWorker', error)
  }

  try {
    const notification = new Notification(title, safeOptions)
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    setTimeout(() => notification.close(), 10000)
    return true
  } catch (error) {
    console.error('showBrowserNotification page', error)
  }

  return false
}

export const showInAppNotification = (title, body, onOpen) => {
  Notify.create({
    type: 'info',
    color: 'primary',
    textColor: 'white',
    position: 'bottom-right',
    message: title,
    caption: body,
    timeout: 8000,
    progress: true,
    group: false,
    multiLine: true,
    actions: [
      ...(onOpen ? [{
        label: 'Abrir',
        color: 'white',
        handler: onOpen
      }] : []),
      {
        icon: 'close',
        color: 'white',
        round: true
      }
    ]
  })
}

export const notificarSucesso = (msg) => {
  const message = `Tudo certo... <br>${msg}.`
  Notify.create({
    type: 'positive',
    progress: true,
    position: 'top',
    message,
    timeout: 500,
    actions: [{
      icon: 'close',
      round: true,
      color: 'white'
    }],
    html: true
  })
}
