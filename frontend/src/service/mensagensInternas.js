import request from './request'

export const ListarMensagensInternas = (userId) => {
  return request.get(`/internal-messages/${userId}`)
}

export const EnviarMensagemInterna = (message) => {
  return request.post('/internal-messages', message)
}

export const MarcarMensagensComoLidas = (userId) => {
  return request.put(`/internal-messages/read/${userId}`)
}
