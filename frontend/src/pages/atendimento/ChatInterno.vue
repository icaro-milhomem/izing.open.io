<template>
  <q-page class="q-pa-md">
    <q-btn label="Testar Notificação e Áudio" color="primary" @click="testarNotificacaoAudio" class="q-mb-md" />
    <div class="row q-col-gutter-md">
      <!-- Lista de usuários -->
      <div class="col-12 col-md-4">
        <q-card class="chat-users-card">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">Atendentes Online</div>
          </q-card-section>
          <q-card-section class="q-pa-none">
            <q-list separator>
              <q-item
                v-for="user in users"
                :key="user.id"
                clickable
                v-ripple
                :active="selectedUser && selectedUser.id === user.id"
                @click="selectUser(user)"
                class="chat-user-item"
              >
                <q-item-section avatar>
                  <q-avatar :color="user.status === 'online' ? 'positive' : 'grey'">
                    <q-icon name="person" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ user.name }}</q-item-label>
                  <q-item-label caption>{{ user.status === 'online' ? 'Online' : 'Offline' }}</q-item-label>
                </q-item-section>
                <q-item-section side v-if="user.unreadCount > 0">
                  <q-badge color="primary">{{ user.unreadCount }}</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Área de chat -->
      <div class="col-12 col-md-8">
        <q-card class="chat-area-card">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">
              {{ selectedUser ? `Chat com ${selectedUser.name}` : 'Selecione um atendente' }}
            </div>
          </q-card-section>

          <q-card-section class="chat-messages" ref="chatMessages">
            <audio ref="notificationSound" src="/MSN.mp3" preload="auto"></audio>
            <div v-if="selectedUser">
              <div
                v-for="message in messages"
                :key="message.id"
                :class="['message-bubble', String(message.senderId) === String(currentUser.id) ? 'message-received' : 'message-sent']"
              >
                <div class="message-meta">
                  <q-avatar size="28px" color="primary" text-color="white">
                    <q-icon name="person" />
                  </q-avatar>
                  <span class="message-sender">
                    {{
                      message.senderName ||
                        (String(message.senderId) === String(currentUser.id)
                          ? currentUser.name
                          : (users.find(u => String(u.id) === String(message.senderId))?.name || 'Atendente'))
                    }}
                  </span>
                </div>
                <div class="message-content">
                  <span v-html="message.message"></span>
                </div>
                <div class="message-time">
                  {{ formatTime(message.createdAt) }}
                </div>
              </div>
            </div>
            <div v-else class="text-center text-grey q-pa-md">
              Selecione um atendente para iniciar a conversa
            </div>
          </q-card-section>

          <q-card-section v-if="selectedUser" class="chat-input">
            <div class="row items-center q-gutter-sm">
              <q-btn round flat icon="insert_emoticon">
                <q-menu
                  ref="menuEmoji"
                  anchor="top right"
                  self="bottom middle"
                  :offset="[5, 40]"
                >
                  <VEmojiPicker
                    style="width: 40vw"
                    :showSearch="false"
                    :emojisByRow="20"
                    labelSearch="Localizar..."
                    lang="pt-BR"
                    @select="inserirEmoji"
                  />
                </q-menu>
              </q-btn>
              <q-btn round flat icon="videocam" @click="abrirVideo" />
            </div>
            <q-input
              v-model="newMessage"
              outlined
              dense
              id="chat-message-input"
              name="chat-message"
              placeholder="Digite sua mensagem..."
              @keyup.enter="sendMessage"
              class="q-mt-sm"
            >
              <template v-slot:append>
                <q-btn
                  round
                  dense
                  flat
                  icon="send"
                  @click="sendMessage"
                  :disable="!newMessage.trim()"
                />
              </template>
            </q-input>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { format } from 'date-fns'
import { socketIO } from 'src/utils/socket'
import { ListarUsuarios } from 'src/service/usuarios'
import { ListarMensagensInternas, EnviarMensagemInterna, MarcarMensagensComoLidas } from 'src/service/mensagensInternas'
import { VEmojiPicker } from 'v-emoji-picker'

const socket = socketIO()

export default {
  name: 'ChatInterno',
  components: { VEmojiPicker },
  data () {
    return {
      users: [],
      messages: [],
      selectedUser: null,
      newMessage: '',
      currentUser: (() => {
        const u = JSON.parse(localStorage.getItem('usuario')) || {}
        return { ...u, id: u.id || u.userId }
      })()
    }
  },
  methods: {
    formatTime (date) {
      return format(new Date(date), 'HH:mm')
    },
    async loadUsers () {
      try {
        const { data } = await ListarUsuarios()
        this.users = (data.users || data)
          .filter(user => String(user.id) !== String(this.currentUser.id))
          .map(user => ({
            ...user,
            status: user.isOnline ? 'online' : 'offline',
            unreadCount: 0
          }))
      } catch (error) {
        this.$notificarErro('Erro ao carregar usuários', error?.response?.data || error)
      }
    },
    async selectUser (user) {
      this.selectedUser = user
      await this.loadMessages(user.id)
      await this.markMessagesAsRead(user.id)
    },
    async loadMessages (userId) {
      try {
        const { data } = await ListarMensagensInternas(userId)
        this.messages = data
        this.messages.forEach(msg => {
          console.log(
            'senderId:', msg.senderId,
            'currentUser.id:', this.currentUser.id,
            'igual:', String(msg.senderId) === String(this.currentUser.id)
          )
        })
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      } catch (error) {
        this.$notificarErro('Erro ao carregar mensagens', error?.response?.data || error)
      }
    },
    async sendMessage () {
      if (!this.newMessage.trim() || !this.selectedUser) return

      const tempId = `temp-${Date.now()}`
      const tempMessage = {
        id: tempId,
        senderId: this.currentUser.id,
        receiverId: this.selectedUser.id,
        message: this.newMessage.trim(),
        createdAt: new Date()
      }
      this.messages.push(tempMessage)
      this.newMessage = ''
      this.$nextTick(() => {
        this.scrollToBottom()
      })

      try {
        const response = await EnviarMensagemInterna({
          receiverId: this.selectedUser.id,
          senderId: this.currentUser.id,
          message: tempMessage.message
        })
        // Substitui a mensagem temporária pela oficial do backend
        const index = this.messages.findIndex(m => m.id === tempId)
        if (index !== -1) {
          this.$set(this.messages, index, response.data)
        }
      } catch (error) {
        // Se der erro, remove a mensagem temporária
        this.messages = this.messages.filter(m => m.id !== tempId)
        this.$notificarErro('Erro ao enviar mensagem', error?.response?.data || error)
      }
    },
    async markMessagesAsRead (userId) {
      try {
        await MarcarMensagensComoLidas(userId)
        const user = this.users.find(u => u.id === userId)
        if (user) {
          user.unreadCount = 0
        }
      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error)
      }
    },
    scrollToBottom () {
      const container = this.$refs.chatMessages
      if (container && container.$el) {
        container.$el.scrollTop = container.$el.scrollHeight
      } else if (container) {
        container.scrollTop = container.scrollHeight
      }
    },
    handleNewMessage (message) {
      this.messages.push(message)
      this.$nextTick(() => {
        this.scrollToBottom()
      })
      // Só notifica/toca som se NÃO for mensagem do próprio usuário logado
      if (String(message.senderId) !== String(this.currentUser.id)) {
        // LOG: Tentando tocar o som
        console.log('[NOTIFICAÇÃO] Tentando tocar áudio de notificação...')
        if (this.$refs.notificationSound) {
          this.$refs.notificationSound.currentTime = 0
          const playPromise = this.$refs.notificationSound.play()
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('[NOTIFICAÇÃO] Áudio tocado com sucesso!')
            }).catch((err) => {
              console.warn('[NOTIFICAÇÃO] Falha ao tocar áudio:', err)
            })
          }
        } else {
          console.warn('[NOTIFICAÇÃO] Ref de áudio não encontrada!')
        }
        // LOG: Tentando notificar
        if (window.Notification && Notification.permission === 'granted') {
          console.log('[NOTIFICAÇÃO] Disparando notificação do navegador...')
          // eslint-disable-next-line no-new
          new Notification('Nova mensagem', { body: message.message })
        } else if (this.$q && this.$q.notify) {
          console.log('[NOTIFICAÇÃO] Disparando notificação do Quasar...')
          this.$q.notify({
            message: `Nova mensagem: ${message.message}`,
            color: 'info',
            position: 'top-right'
          })
        } else {
          console.warn('[NOTIFICAÇÃO] Não foi possível notificar!')
        }
      }
    },
    testarNotificacaoAudio () {
      // Teste de áudio
      console.log('[TESTE] Tentando tocar áudio de notificação...')
      if (this.$refs.notificationSound) {
        this.$refs.notificationSound.currentTime = 0
        const playPromise = this.$refs.notificationSound.play()
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('[TESTE] Áudio tocado com sucesso!')
          }).catch((err) => {
            console.warn('[TESTE] Falha ao tocar áudio:', err)
          })
        }
      } else {
        console.warn('[TESTE] Ref de áudio não encontrada!')
      }
      // Teste de notificação
      if (window.Notification && Notification.permission === 'granted') {
        console.log('[TESTE] Disparando notificação do navegador...')
        // eslint-disable-next-line no-new
        new Notification('Teste de notificação', { body: 'Funcionou?' })
      } else if (this.$q && this.$q.notify) {
        console.log('[TESTE] Disparando notificação do Quasar...')
        this.$q.notify({
          message: 'Teste de notificação: Funcionou?',
          color: 'info',
          position: 'top-right'
        })
      } else {
        console.warn('[TESTE] Não foi possível notificar!')
      }
    },
    abrirMenuEmoji () {
      // Removido pois o menu agora abre automaticamente ao clicar no botão
    },
    inserirEmoji (emoji) {
      if (!emoji.data) return
      this.newMessage += emoji.data
      this.$refs.menuEmoji.hide()
    },
    abrirVideo () {
      this.$q.notify({
        message: 'Funcionalidade de vídeo ainda não implementada.',
        color: 'info',
        position: 'top-right'
      })
    }
  },
  mounted () {
    // Garante que currentUser sempre tenha id
    if (!this.currentUser || !this.currentUser.id) {
      const u = JSON.parse(localStorage.getItem('usuario')) || {}
      this.currentUser = { ...u, id: u.id || u.userId }
    }
    // Solicita permissão para notificações do navegador
    if (window.Notification && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
    this.loadUsers()
    // Escuta eventos de atualização de usuários
    socket.on(`${this.currentUser.tenantId}:users`, (data) => {
      if (data.action === 'update') {
        const updatedUser = this.users.find(u => u.email === data.data.email)
        if (updatedUser) {
          updatedUser.status = data.data.status || (data.data.isOnline ? 'online' : 'offline')
        }
      }
    })
    socket.on(`${this.currentUser.tenantId}:internal_message:${this.currentUser.id}`, this.handleNewMessage)
    // Garante que ao reconectar, o canal de mensagens seja reescutado
    socket.on('connect', () => {
      socket.on(`${this.currentUser.tenantId}:internal_message:${this.currentUser.id}`, this.handleNewMessage)
    })
  },
  beforeDestroy () {
    socket.off(`${this.currentUser.tenantId}:internal_message:${this.currentUser.id}`, this.handleNewMessage)
    socket.off(`${this.currentUser.tenantId}:users`)
  }
}
</script>

<style lang="scss" scoped>
.chat-users-card,
.chat-area-card {
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.chat-users-card {
  .q-card__section {
    flex: 1;
    overflow-y: auto;
  }
}

.chat-area-card {
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .chat-input {
    border-top: 1px solid #ddd;
    padding: 10px;
  }
}

.message-bubble {
  max-width: 60%;
  min-width: 120px;
  margin: 4px 0;
  padding: 10px 14px;
  border-radius: 16px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  transition: box-shadow 0.2s;
  word-break: break-word;
  display: flex;
  flex-direction: column;
}

.message-sent {
  background: linear-gradient(90deg, #e0f7fa 80%, #b2ebf2 100%) !important;
  align-self: flex-end;
  margin-left: auto;
  margin-right: 0;
  border-bottom-right-radius: 4px;
  text-align: right;
  border: 2px solid #00bcd4 !important;
}

.message-received {
  background: #d4f8e8 !important;
  align-self: flex-start;
  margin-right: auto;
  margin-left: 0;
  border-bottom-left-radius: 4px;
  text-align: left;
  border: 2px solid #43a047 !important;
}

.message-content {
  font-size: 1.08em;
}
.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}
.message-meta {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
  gap: 6px;
}
.message-sender {
  font-size: 0.85em;
  color: #1976d2;
  font-weight: 500;
}

.chat-user-item {
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &.q-item--active {
    background-color: rgba(0, 0, 0, 0.1);
  }
}
</style>
