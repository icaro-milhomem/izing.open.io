<template>
  <q-layout view="hHh Lpr lFf">

    <q-header
      class="bg-white text-grey-8 q-py-xs header-elevation"
      height-hint="58"
      bordered
    >
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
          icon="menu"
        >
          <q-tooltip>Menu</q-tooltip>
        </q-btn>

        <q-btn
          flat
          no-caps
          no-wrap
          dense
          class="q-ml-sm"
          v-if="$q.screen.gt.xs"
        >
          <q-img
            src="/logo_izing.png"
            spinner-color="primary"
            style="height: 50px; width: 140px"
          />
        </q-btn>

        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
        <div v-if="userProfile === 'admin' || userProfile === 'user'">
          <q-btn
            round
            dense
            flat
            color="grey-8"
            icon="notifications"
          >
            <q-badge
              color="red"
              text-color="white"
              floating
              v-if="totalNotificationsCount > 0"
            >
              {{ totalNotificationsCount }}
            </q-badge>
            <q-menu anchor="bottom right" self="top right">
              <q-list style="min-width: 300px">

                <q-item v-if="totalNotificationsCount === 0">
                  <q-item-section style="cursor: pointer;">
                    Nada de novo por aqui!
                  </q-item-section>
                </q-item>
                <q-item v-if="pendingNotificationsCount > 0">
                  <q-item-section
                    avatar
                    @click="() => $router.push({ name: 'atendimento' })"
                    style="cursor: pointer;"
                  >
                    <q-avatar
                      style="width: 60px; height: 60px"
                      color="blue"
                      text-color="white"
                    >
                      {{ pendingNotificationsCount }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section
                    @click="() => $router.push({ name: 'atendimento' })"
                    style="cursor: pointer;"
                  >
                    Clientes pendentes na fila
                  </q-item-section>
                </q-item>
                <q-item
                  v-for="ticket in (notifications.tickets || [])"
                  :key="ticket.id"
                  style="border-bottom: 1px solid #ddd; margin: 5px;"
                >
                  <q-item-section
                    avatar
                    @click="abrirAtendimentoExistente(ticket.name, ticket)"
                    style="cursor: pointer;"
                  >
                    <q-avatar style="width: 60px; height: 60px">
                      <img :src="ticket.profilePicUrl">
                    </q-avatar>
                  </q-item-section>
                  <q-item-section
                    @click="abrirAtendimentoExistente(ticket.name, ticket)"
                    style="cursor: pointer;"
                  >
                    <q-list>
                      <q-item style="text-align:center; font-size: 17px; font-weight: bold; min-height: 0">{{ ticket.name
                      }}</q-item>
                      <q-item style="min-height: 0; padding-top: 0"><b>Mensagem: </b> {{ ticket.lastMessage }}</q-item>
                    </q-list>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
            <q-tooltip>Notificações</q-tooltip>
          </q-btn>
          <q-avatar
            :color="usuario.status === 'offline' ? 'negative' : 'positive'"
            text-color="white"
            size="25px"
            :icon="usuario.status === 'offline' ? 'mdi-account-off' : 'mdi-account-check'"
            rounded
            class="q-ml-lg"
          >
            <q-tooltip>
              {{ usuario.status === 'offline' ? 'Usuário Offiline' : 'Usuário Online' }}
            </q-tooltip>
          </q-avatar>
          </div>
          <q-btn
            round
            flat
            class="bg-padrao text-bold q-mx-sm q-ml-lg"
          >
            <q-avatar size="26px">
              {{ $iniciaisString(username) }}
            </q-avatar>
            <q-menu>
              <q-list style="min-width: 100px">
                <q-item-label header> Olá! <b> {{ username }} </b> </q-item-label>

                <cStatusUsuario
                  @update:usuario="atualizarUsuario"
                  :usuario="usuario"
                />
                <q-item
                  clickable
                  v-close-popup
                  @click="abrirModalUsuario"
                >
                  <q-item-section>Perfil</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="efetuarLogout"
                >
                  <q-item-section>Sair</q-item-section>
                </q-item>
                <q-separator />
                <q-item>
                  <q-item-section>
                    <cSystemVersion />
                  </q-item-section>
                </q-item>

              </q-list>
            </q-menu>

            <q-tooltip>Usuário</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-banner
      v-if="notificationsNeedPermission && (userProfile === 'admin' || userProfile === 'user')"
      inline-actions
      rounded
      class="bg-orange text-white q-mx-sm q-mt-xs"
      dense
    >
      Ative as notificações do sistema para receber popup com o navegador minimizado.
      <template v-slot:action>
        <q-btn
          flat
          label="Ativar"
          color="white"
          @click="ativarNotificacoesSistema"
        />
      </template>
    </q-banner>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
      mini-to-overlay
      content-class="bg-white text-grey-9 drawer-elevation main-drawer"
    >
      <q-scroll-area class="fit">
        <q-list
          padding
          :key="userProfile"
          class="menu-list"
        >
          <div v-if="userProfile === 'admin' || userProfile === 'user'">
            <EssentialLink v-for="item in menuData" :key="item.title" v-bind="item"/>
          </div>
          <div v-if="userProfile === 'admin'">
            <q-separator spaced class="menu-separator" />
            <div class="q-mb-lg"></div>
            <template v-for="item in menuDataAdmin">
              <EssentialLink
                v-if="exibirMenuBeta(item)"
                :key="item.title"
                v-bind="item"
              />
            </template>
          </div>
          <div v-if="userProfile === 'super'">
            <div class="q-mb-lg"></div>
            <template v-for="item in menuDataSuper">
              <EssentialLink v-if="exibirMenuBeta(item)"
                :key="item.title"
                v-bind="item" />
            </template>
          </div>
        </q-list>
      </q-scroll-area>
      <div
        class="drawer-footer"
        :class="{ 'bg-grey-3': $q.dark.isActive }"
      >
        <q-toggle
          size="xl"
          keep-color
          dense
          class="text-bold q-ml-xs"
          :icon-color="$q.dark.isActive ? 'black' : 'white'"
          :value="$q.dark.isActive"
          :color="$q.dark.isActive ? 'grey-3' : 'black'"
          checked-icon="mdi-white-balance-sunny"
          unchecked-icon="mdi-weather-sunny"
          @input="$setConfigsUsuario({ isDark: !$q.dark.isActive })"
        >
          <q-tooltip content-class="text-body1 hide-scrollbar">
            {{ $q.dark.isActive ? 'Desativar' : 'Ativar' }} Modo Escuro (Dark Mode)
          </q-tooltip>
        </q-toggle>
      </div>
    </q-drawer>

    <q-page-container>
      <q-page class="q-pa-xs">
        <router-view />
      </q-page>
    </q-page-container>

    <ModalUsuario
      :isProfile="true"
      :modalUsuario.sync="modalUsuario"
      :usuarioEdicao.sync="usuario"
    />
  </q-layout>
</template>

<script>
import cSystemVersion from '../components/cSystemVersion.vue'
import { ListarWhatsapps } from 'src/service/sessoesWhatsapp'
import EssentialLink from 'components/EssentialLink.vue'
import socketInitial from './socketInitial'
const username = localStorage.getItem('username')
import ModalUsuario from 'src/pages/usuarios/ModalUsuario'
import { mapGetters } from 'vuex'
import { ListarConfiguracoes } from 'src/service/configuracoes'
import { RealizarLogout } from 'src/service/login'
import cStatusUsuario from '../components/cStatusUsuario.vue'
import { socketIO } from 'src/utils/socket'
import { ConsultarTickets } from 'src/service/tickets'
import { openTicketFromNotification, unlockNotificationAudio, initNotificationAudio } from 'src/utils/notificationHandler'

const socket = socketIO()

const objMenu = [
  {
    title: 'Dashboard',
    caption: 'Visão geral do sistema',
    icon: 'mdi-view-dashboard-variant',
    routeName: 'home-dashboard',
    color: 'primary'
  },
  {
    title: 'Atendimentos',
    caption: 'Lista de atendimentos',
    icon: 'mdi-message-text-outline',
    routeName: 'atendimento',
    color: 'positive'
  },
  {
    title: 'Chat Interno',
    caption: 'Comunicação entre atendentes',
    icon: 'mdi-chat-processing',
    routeName: 'chat-interno',
    color: 'info'
  },
  {
    title: 'Contatos',
    caption: 'Lista de contatos',
    icon: 'mdi-account-group-outline',
    routeName: 'contatos',
    color: 'info'
  }
]

const objMenuAdmin = [
  {
    title: 'Canais',
    caption: 'Canais de Comunicação',
    icon: 'mdi-cellphone-wireless',
    routeName: 'sessoes',
    color: 'primary'
  },
  {
    title: 'Painel Atendimentos',
    caption: 'Visão geral dos atendimentos',
    icon: 'mdi-view-dashboard-variant-outline',
    routeName: 'painel-atendimentos',
    color: 'blue'
  },
  {
    title: 'Relatórios',
    caption: 'Relatórios gerais',
    icon: 'mdi-file-chart-outline',
    routeName: 'relatorios',
    color: 'accent'
  },
  {
    title: 'Usuarios',
    caption: 'Admin de usuários',
    icon: 'mdi-account-cog-outline',
    routeName: 'usuarios',
    color: 'warning'
  },
  {
    title: 'Filas',
    caption: 'Cadastro de Filas',
    icon: 'mdi-arrow-decision-outline',
    routeName: 'filas',
    color: 'info'
  },
  {
    title: 'Mensagens Rápidas',
    caption: 'Mensagens pré-definidas',
    icon: 'mdi-reply-all-outline',
    routeName: 'mensagens-rapidas',
    color: 'positive'
  },
  {
    title: 'Chatbot',
    caption: 'Robô de atendimento',
    icon: 'mdi-robot-happy-outline',
    routeName: 'chat-flow',
    color: 'orange'
  },
  {
    title: 'Etiquetas',
    caption: 'Cadastro de etiquetas',
    icon: 'mdi-tag-text',
    routeName: 'etiquetas',
    color: 'accent'
  },
  {
    title: 'Horário de Atendimento',
    caption: 'Horário de funcionamento',
    icon: 'mdi-calendar-clock',
    routeName: 'horarioAtendimento',
    color: 'warning'
  },
  {
    title: 'Configurações',
    caption: 'Configurações gerais',
    icon: 'mdi-cog',
    routeName: 'configuracoes',
    color: 'primary'
  },
  {
    title: 'Campanha',
    caption: 'Campanhas de envio',
    icon: 'mdi-message-bookmark-outline',
    routeName: 'campanhas',
    color: 'positive'
  },
  {
    title: 'API',
    caption: 'Integração sistemas externos',
    icon: 'mdi-call-split',
    routeName: 'api-service',
    color: 'info'
  }
]

const superMenu = [
  {
    title: 'Empresas',
    caption: 'Admin das Empresas',
    icon: 'mdi-office-building',
    routeName: 'empresassuper',
    color: 'primary'
  },
  {
    title: 'Usuarios',
    caption: 'Admin de usuários',
    icon: 'mdi-account-group',
    routeName: 'usuariossuper',
    color: 'secondary'
  },
  {
    title: 'Canais',
    caption: 'Canais de Comunicação',
    icon: 'mdi-cellphone-wireless',
    routeName: 'sessaosuper',
    color: 'accent'
  }
]

export default {
  name: 'MainLayout',
  mixins: [socketInitial],
  components: { EssentialLink, ModalUsuario, cStatusUsuario, cSystemVersion },
  data () {
    return {
      username,
      domainExperimentalsMenus: ['@'],
      miniState: true,
      userProfile: 'user',
      modalUsuario: false,
      usuario: {},
      leftDrawerOpen: false,
      menuData: objMenu,
      menuDataAdmin: objMenuAdmin,
      menuDataSuper: superMenu,
      countTickets: 0,
      ticketsList: [],
      notificationsNeedPermission: false
    }
  },
  computed: {
    ...mapGetters(['notifications', 'notifications_p', 'whatsapps']),
    openNotificationsCount () {
      return Number(this.notifications?.count) || 0
    },
    pendingNotificationsCount () {
      return Number(this.notifications_p?.count) || 0
    },
    totalNotificationsCount () {
      return this.openNotificationsCount + this.pendingNotificationsCount
    },
    cProblemaConexao () {
      const idx = this.whatsapps.findIndex(w =>
        ['PAIRING', 'TIMEOUT', 'DISCONNECTED'].includes(w.status)
      )
      return idx !== -1
    },
    cQrCode () {
      const idx = this.whatsapps.findIndex(
        w => w.status === 'qrcode' || w.status === 'DESTROYED'
      )
      return idx !== -1
    },
    cOpening () {
      const idx = this.whatsapps.findIndex(w => w.status === 'OPENING')
      return idx !== -1
    },
    cUsersApp () {
      return this.$store.state.usersApp
    },
    cObjMenu () {
      if (this.cProblemaConexao) {
        return objMenu.map(menu => {
          if (menu.routeName === 'sessoes') {
            menu.color = 'negative'
          }
          return menu
        })
      }
      return objMenu
    }
  },
  methods: {
    exibirMenuBeta (itemMenu) {
      if (!itemMenu?.isBeta) return true
      for (const domain of this.domainExperimentalsMenus) {
        if (this.usuario.email.indexOf(domain) !== -1) return true
      }
      return false
    },
    async listarWhatsapps () {
      const { data } = await ListarWhatsapps()
      this.$store.commit('LOAD_WHATSAPPS', data)
    },
    onServiceWorkerMessage (event) {
      if (event?.data?.type === 'NOTIFICATION_CLICK' && event.data.ticketId) {
        openTicketFromNotification(this, event.data.ticketId)
      }
    },
    atualizarPermissaoNotificacoes () {
      this.notificationsNeedPermission =
        'Notification' in window &&
        Notification.permission !== 'granted'
    },
    async ativarNotificacoesSistema () {
      if (!('Notification' in window)) {
        this.$q.notify({
          type: 'warning',
          message: 'Seu navegador não suporta notificações nativas.'
        })
        return
      }

      const result = await Notification.requestPermission()
      this.atualizarPermissaoNotificacoes()

      if (result === 'granted') {
        this.$q.notify({
          type: 'positive',
          message: 'Notificações do sistema ativadas.'
        })
      } else {
        this.$q.notify({
          type: 'warning',
          message: 'Permissão negada. Verifique as configurações do navegador.'
        })
      }
    },
    notificationQueryParams (status, withUnreadMessages) {
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
    },
    async abrirModalUsuario () {
      this.modalUsuario = true
    },
    async efetuarLogout () {
      try {
        await RealizarLogout(this.usuario)
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        localStorage.removeItem('profile')
        localStorage.removeItem('userId')
        localStorage.removeItem('queues')
        localStorage.removeItem('usuario')
        localStorage.removeItem('filtrosAtendimento')

        this.$router.go({ name: 'login', replace: true })
      } catch (error) {
        this.$notificarErro('Não foi possível realizar logout', error)
      }
    },
    async listarConfiguracoes () {
      const { data } = await ListarConfiguracoes()
      localStorage.setItem('configuracoes', JSON.stringify(data))
    },
    conectarSocket (usuario) {
      socket.on(`${usuario.tenantId}:chat:updateOnlineBubbles`, data => {
        this.$store.commit('SET_USERS_APP', data)
      })
    },
    atualizarUsuario () {
      this.usuario = JSON.parse(localStorage.getItem('usuario'))
      if (this.usuario.status === 'offline') {
        socket.emit(`${this.usuario.tenantId}:setUserIdle`)
      }
      if (this.usuario.status === 'online') {
        socket.emit(`${this.usuario.tenantId}:setUserActive`)
      }
    },
    async consultarTickets () {
      try {
        const { data } = await ConsultarTickets(
          this.notificationQueryParams(['open'], true)
        )
        this.$store.commit('UPDATE_NOTIFICATIONS', data)
      } catch (err) {
        console.error('consultarTickets open', err)
      }
      try {
        const { data } = await ConsultarTickets(
          this.notificationQueryParams(['pending'], false)
        )
        this.$store.commit('UPDATE_NOTIFICATIONS_P', data)
      } catch (err) {
        console.error('consultarTickets pending', err)
      }
    },
    abrirChatContato (ticket) {
      // caso esteja em um tamanho mobile, fechar a drawer dos contatos
      if (this.$q.screen.lt.md && ticket.status !== 'pending') {
        this.$root.$emit('infor-cabecalo-chat:acao-menu')
      }
      if (!(ticket.status !== 'pending' && (ticket.id !== this.$store.getters.ticketFocado.id || this.$route.name !== 'chat'))) return
      this.$store.commit('SET_HAS_MORE', true)
      this.$store.dispatch('AbrirChatMensagens', ticket)
    },
    abrirAtendimentoExistente (contato, ticket) {
      this.$q.dialog({
        title: 'Atenção!!',
        message: `${contato} possui um atendimento em curso (Atendimento: ${ticket.id}). Deseja abrir o atendimento?`,
        cancel: {
          label: 'Não',
          color: 'primary',
          push: true
        },
        ok: {
          label: 'Sim',
          color: 'negative',
          push: true
        },
        persistent: true
      }).onOk(async () => {
        try {
          this.abrirChatContato(ticket)
        } catch (error) {
          this.$notificarErro(
            'Não foi possível atualizar o token',
            error
          )
        }
      })
    }
  },
  async mounted () {
    initNotificationAudio()
    document.addEventListener('click', unlockNotificationAudio, { once: true, capture: true })
    document.addEventListener('keydown', unlockNotificationAudio, { once: true, capture: true })
    this.atualizarUsuario()
    await this.listarWhatsapps()
    await this.listarConfiguracoes()
    await this.consultarTickets()
    this.atualizarPermissaoNotificacoes()
    this.usuario = JSON.parse(localStorage.getItem('usuario'))
    this.userProfile = localStorage.getItem('profile')
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.onServiceWorkerMessage)
    }
    await this.conectarSocket(this.usuario)
  },
  destroyed () {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.onServiceWorkerMessage)
    }
    socket.disconnect()
  }
}
</script>
<style lang="sass">
.header-elevation
  box-shadow: 0 2px 4px rgba(0,0,0,0.1)
  transition: all 0.3s ease

.drawer-elevation
  box-shadow: 2px 0 4px rgba(0,0,0,0.1)
  transition: all 0.3s ease

.main-drawer
  .q-drawer__content
    background: linear-gradient(to bottom, #ffffff, #f8f9fa)
    display: flex
    flex-direction: column

.menu-list
  .q-item
    margin: 4px 8px
    border-radius: 8px
    transition: all 0.3s ease
  flex: 1
  overflow-y: auto

.menu-separator
  margin: 8px 16px
  background: rgba(21, 120, 173, 0.1)

.drawer-footer
  position: sticky
  bottom: 0
  left: 0
  right: 0
  height: 60px
  padding: 8px 16px
  border-top: 1px solid rgba(0,0,0,0.1)
  transition: all 0.3s ease
  background: white
  z-index: 1

.menu-link-active-item-top
  background: rgba(21, 120, 173, 0.1)
  border-left: 3px solid rgb(21, 120, 173)
  border-right: 3px solid rgb(21, 120, 173)
  border-top-right-radius: 20px
  border-bottom-right-radius: 20px
  position: relative
  height: 100%
</style>
