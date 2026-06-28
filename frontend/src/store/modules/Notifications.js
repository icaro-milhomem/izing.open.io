// import { Notify } from 'quasar'
// import $router from 'src/router'
// import { orderBy } from 'lodash'
// import { parseISO } from 'date-fns'

const emptyNotifications = () => ({
  count: 0,
  tickets: [],
  hasMore: false
})

const Notifications = {
  state: {
    notifications: emptyNotifications(),
    notifications_p: emptyNotifications()
  },
  mutations: {
    // OK
    UPDATE_NOTIFICATIONS (state, payload) {
      state.notifications = payload
    },
    UPDATE_NOTIFICATIONS_P (state, payload) {
      state.notifications_p = payload
    }
  }
}

export default Notifications
