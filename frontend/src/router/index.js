import Vue from 'vue'
import VueRouter from 'vue-router'
import { Notify } from 'quasar'

import routes from './routes'

// Desativar erro de navegação duplicada
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push (location, onResolve, onReject) {
  if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject)
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') throw err
  })
}

Vue.use(VueRouter)

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

const Router = new VueRouter({
  scrollBehavior: () => ({ x: 0, y: 0 }),
  routes,
  // Leave these as they are and change in quasar.conf.js instead!
  // quasar.conf.js -> build -> vueRouterMode
  // quasar.conf.js -> build -> publicPath
  mode: process.env.VUE_ROUTER_MODE,
  base: process.env.VUE_ROUTER_BASE
})

const whiteListName = [
  'login'
]

Router.beforeEach((to, from, next) => {
  const token = JSON.parse(localStorage.getItem('token'))

  if (!token) {
    if (whiteListName.indexOf(to.name) === -1) {
      if (to.fullPath !== '/login' && !to.query.tokenSetup) {
        Notify.create({ message: 'Necessário realizar login', position: 'top' })
        next({ name: 'login' })
      } else {
        next()
      }
    } else {
      next()
    }
  } else {
    if (to.name === 'login') {
      const profile = localStorage.getItem('profile')
      if (profile === 'admin') {
        next({ name: 'home-dashboard' })
      } else if (profile === 'super') {
        next({ name: 'empresassuper' })
      } else {
        next({ name: 'atendimento' })
      }
    } else {
      next()
    }
  }
})

Router.afterEach(to => {
  window.scrollTo(0, 0)
})

export default Router
