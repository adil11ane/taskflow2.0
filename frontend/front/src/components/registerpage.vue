<template>
    <div class="register-container">
      <div class="register-v2">
        <div class="register-card">
            <h2>Регистрация в TaskFlow</h2>
            <form class="register-form" @submit.prevent="handleSubmit">
                <div class="form-group">
                    <label for="email">Электронная почта</label>
                    <input 
                        id="email"
                        v-model="email"
                        type="email"
                        required
                        autocomplete="email"
                        placeholder="name@example.com"
                        :disabled="step===2"
                    />
                </div>

                <div v-if="step===2" class="step-two-fields">
                    <div class="form-group">
                        <label for="password">Придумайте Пароль</label>
                        <input 
                            id="password"
                            type="password"
                            v-model="password"
                            required
                            autocomplete="password"
                            placeholder="••••••••"
                        />
                    </div>
                    <div class="form-group">
                        <label for="code">Код подтверждения из письма</label>
                        <input
                            id="code"
                            type="text"
                            v-model="code"
                            required
                            placeholder="Введите код"
                        />
                    </div>
                </div>
                
                <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
                <div v-if="successMessage" class="confirmation-message">{{ successMessage }}</div>
                
                <button 
                v-if="step===1"
                class="submit-btn"
                type="button"
                @click="handleRequestCode"
                :disabled="isLoading || !email"
                >
                  <span v-if="isLoading">Отправка кода...</span>
                  <span v-else>Получить код подтверждения</span>
                </button>
                
                <button
                v-if="step===2"
                class="submit-btn"
                type="submit"
                :disabled="isLoading">
                  <span v-if="isLoading">Регистрация...</span>
                  <span v-else>Зарегистрироваться</span>  
                </button>

                <button type="button" class="google-btn" @click="handleGoogleAuthUri">
                  Google
                </button>
            </form>

            <button 
            class="back-btn"
            v-if="step===2"
            @click="resetToBack"
            :disabled="isLoading"
            >
              Изменить Email
            </button>

            <p class="redirect-text">
                Уже есть аккаунт?
                <router-link to="/">Войти</router-link>
            </p>
        </div>
      </div>
    </div>
</template>

<script setup>
import {ref} from 'vue'
import { useRouter } from 'vue-router'
import authAPI from '@/api/auth'

const router = useRouter()

const step = ref(1)
const email = ref('')
const password = ref('')
const code = ref('')


const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')



const handleGoogleAuthUri = async () => {
  try{
    const data = authAPI.getGoogleAuthUrl()
    window.location.href = data.uri
  } catch (error){
    console.error('Не удалось получить ссылку для Google:', error)
    errorMessage.value = 'Не удалось получить ссылку для Google'
  }
}

const handleRequestCode = async () => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    try{
        await authAPI.getConfirmation(email.value)
        successMessage.value = 'Код успешно отправлен на вашу почту!'
        step.value=2
    } catch(error) {
        console.error('Ошибка запроса кода:', error)
        errorMessage.value  = error.response?.data?.detail || 'Не удалось отправить код. Проверьте Email.'

    } finally {
        isLoading.value = false
    }
}

const handleSubmit = async () => {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    try {
        const payload = {
            email : email.value,
            password : password.value,
            code : code.value
        }

        await authAPI.register(payload)
        successMessage.value = 'Регистрация успешна! Перенаправление на страницу входа...'

        setTimeout(() => {
            router.push('/')
        },2000)
    } catch  (error) {
        console.error('Ошибка регистрации:', error)
    } finally {
        isLoading.value = false
    }
}

const resetToBack = () => {
    step.value = 1
    password.value = ''
    code.value = ''
    errorMessage.value = ''
    successMessage.value = ''
}
</script>

<style scoped>
/* Стили полностью синхронизированы по дизайну с вашей LoginPage.vue */
.register-container {
  display: flex;
  background-color: #F3F0FF;
  align-content: center;
}
.register-v2{
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background-color: #F3F0FF;
  font-family: sans-serif;
  width: 100%;
}
register-card {
  width: 100%;
  max-width: 400px;
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.582);
}
h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #1f2937;
}
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.step-two-fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
}
input {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}
input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 1px #4f46e5;
}
input:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}
.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
}
.success-message {
  color: #16a34a;
  font-size: 0.875rem;
  text-align: center;
}
.submit-btn {
  background-color: #4f46e5;
  color: white;
  padding: 0.625rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.submit-btn:hover {
  background-color: #4338ca;
}
.submit-btn:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}
.back-btn {
  background: none;
  border: none;
  color: #4b5563;
  font-size: 0.875rem;
  margin-top: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
  width: 100%;
  text-align: center;
}
.back-btn:hover {
  color: #1f2937;
}
.redirect-text {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}
.redirect-text a {
  color: #4f46e5;
  text-decoration: none;
}
.redirect-text a:hover {
  text-decoration: underline;
}
</style>
