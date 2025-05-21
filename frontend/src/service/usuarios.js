import request from './request'

export const ListarUsuarios = () => {
  return request.get('/users')
}

export const AtualizarStatusUsuario = (status) => {
  return request.patch('/users/status', { status })
}
