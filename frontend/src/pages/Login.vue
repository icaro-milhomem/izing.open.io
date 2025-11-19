<template>
  <q-layout class="modern-login-layout">
    <q-page-container>
      <!-- Background com gradiente animado -->
      <div class="animated-background">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
      </div>

      <!-- Grid pattern sutil -->
      <div class="grid-pattern"></div>

      <q-page class="login-page flex flex-center">
        <div class="login-container">
          <div class="login-box">
            <!-- Logo Section -->
            <div class="logo-container">
              <div class="logo-wrapper">
                <q-img
                  src="/logo_izing.png"
                  spinner-color="primary"
                  style="width: 180px; height: auto"
                  class="q-mb-md"
                />
              </div>
              <h1 class="login-title">Bem-vindo</h1>
              <p class="login-subtitle">Entre com suas credenciais para continuar</p>
            </div>

            <!-- Form Section -->
            <q-form @submit="fazerLogin" class="login-form q-gutter-md">
              <q-input
                v-model="form.email"
                label="Email"
                :rules="[val => !!val || 'Email é obrigatório']"
                outlined
                rounded
                class="modern-input"
                @blur="$v.form.email.$touch"
                :error="$v.form.email.$error"
                error-message="Deve ser um e-mail válido."
                bg-color="white"
              >
                <template v-slot:prepend>
                  <q-icon name="mdi-email-outline" color="primary" size="20px" />
                </template>
              </q-input>

              <q-input
                v-model="form.password"
                label="Senha"
                :type="isPwd ? 'password' : 'text'"
                :rules="[val => !!val || 'Senha é obrigatória']"
                outlined
                rounded
                class="modern-input"
                @blur="$v.form.password.$touch"
                :error="$v.form.password.$error"
                error-message="Senha é obrigatória"
                bg-color="white"
              >
                <template v-slot:prepend>
                  <q-icon name="mdi-lock-outline" color="primary" size="20px" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="isPwd ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                    color="grey-6"
                    size="20px"
                  />
                </template>
              </q-input>

              <q-btn
                label="Entrar"
                type="submit"
                color="primary"
                class="full-width login-button"
                :loading="loading"
                unelevated
                rounded
                size="lg"
              >
                <template v-slot:loading>
                  <q-spinner-hourglass class="on-left" />
                  Entrando...
                </template>
              </q-btn>
            </q-form>

            <!-- Footer -->
            <div class="login-footer">
              <p class="footer-text">© 2024 Izing. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { required, email } from 'vuelidate/lib/validators'

export default {
  name: 'Login',
  data () {
    return {
      form: {
        email: null,
        password: null
      },
      isPwd: true,
      loading: false
    }
  },
  validations: {
    form: {
      email: { required, email },
      password: { required }
    }
  },
  methods: {
    fazerLogin () {
      this.$v.form.$touch()
      if (this.$v.form.$error) {
        this.$q.notify({
          type: 'negative',
          message: 'Informe usuário e senha corretamente.',
          position: 'top',
          timeout: 3000
        })
        return
      }
      this.loading = true
      this.$store.dispatch('UserLogin', this.form)
        .then(data => {
          this.loading = false
        })
        .catch(err => {
          console.error('exStore', err)
          this.loading = false
        })
    }
  }
}
</script>

<style lang="sass" scoped>
.modern-login-layout
  background: linear-gradient(135deg, var(--q-primary, #667eea) 0%, var(--q-accent, #764ba2) 50%, #f093fb 100%)
  min-height: 100vh
  position: relative
  overflow: hidden

.animated-background
  position: absolute
  top: 0
  left: 0
  width: 100%
  height: 100%
  z-index: 0
  overflow: hidden

.gradient-orb
  position: absolute
  border-radius: 50%
  filter: blur(80px)
  opacity: 0.5
  animation: float 20s ease-in-out infinite

.orb-1
  width: 500px
  height: 500px
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  top: -200px
  left: -200px
  animation-delay: 0s

.orb-2
  width: 400px
  height: 400px
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
  bottom: -150px
  right: -150px
  animation-delay: 5s

.orb-3
  width: 350px
  height: 350px
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
  top: 50%
  right: 10%
  animation-delay: 10s

@keyframes float
  0%, 100%
    transform: translate(0, 0) scale(1)
  33%
    transform: translate(30px, -30px) scale(1.1)
  66%
    transform: translate(-20px, 20px) scale(0.9)

.grid-pattern
  position: absolute
  top: 0
  left: 0
  width: 100%
  height: 100%
  background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
  background-size: 50px 50px
  z-index: 1
  opacity: 0.4

.login-page
  position: relative
  z-index: 2
  min-height: 100vh
  padding: 20px

.login-container
  width: 100%
  max-width: 440px
  animation: slideUpFade 0.6s ease-out

.login-box
  background: rgba(255, 255, 255, 0.98)
  backdrop-filter: blur(20px)
  border-radius: 24px
  padding: 48px 40px
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  position: relative
  overflow: hidden

.login-box::before
  content: ''
  position: absolute
  top: 0
  left: 0
  right: 0
  height: 4px
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)

.login-box:hover
  transform: translateY(-4px)
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)

.logo-container
  text-align: center
  margin-bottom: 40px

.logo-wrapper
  display: flex
  justify-content: center
  margin-bottom: 24px
  animation: fadeInDown 0.6s ease-out

.login-title
  font-size: 32px
  font-weight: 700
  color: #1a1a1a
  margin: 0 0 8px 0
  letter-spacing: -0.5px
  animation: fadeInDown 0.6s ease-out 0.1s both

.login-subtitle
  font-size: 15px
  color: #6b7280
  margin: 0
  font-weight: 400
  animation: fadeInDown 0.6s ease-out 0.2s both

.login-form
  margin-top: 32px

.modern-input
  margin-bottom: 4px
  animation: fadeInUp 0.6s ease-out 0.3s both

.modern-input:nth-child(2)
  animation-delay: 0.4s

.login-button
  height: 52px
  font-size: 16px
  font-weight: 600
  letter-spacing: 0.5px
  margin-top: 32px
  text-transform: none
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4)
  transition: all 0.3s ease
  animation: fadeInUp 0.6s ease-out 0.5s both

.login-button:hover
  transform: translateY(-2px)
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5)

.login-button:active
  transform: translateY(0)

.login-footer
  margin-top: 32px
  text-align: center
  padding-top: 24px
  border-top: 1px solid #e5e7eb
  animation: fadeIn 0.6s ease-out 0.6s both

.footer-text
  font-size: 13px
  color: #9ca3af
  margin: 0

@keyframes slideUpFade
  from
    opacity: 0
    transform: translateY(30px)
  to
    opacity: 1
    transform: translateY(0)

@keyframes fadeInDown
  from
    opacity: 0
    transform: translateY(-20px)
  to
    opacity: 1
    transform: translateY(0)

@keyframes fadeInUp
  from
    opacity: 0
    transform: translateY(20px)
  to
    opacity: 1
    transform: translateY(0)

@keyframes fadeIn
  from
    opacity: 0
  to
    opacity: 1

// Responsive
@media (max-width: 600px)
  .login-box
    padding: 40px 24px
    border-radius: 20px

  .login-title
    font-size: 28px

  .login-subtitle
    font-size: 14px

  .login-container
    max-width: 100%
</style>
