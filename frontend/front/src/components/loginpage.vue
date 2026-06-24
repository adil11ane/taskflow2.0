<template>
    <div class="login-container">
        <div class="login-card">
            <h2>Вход в Личный Кабинет</h2>



            <form @submit.prevent="handleLogin" class="login-form">
                <div class="form-group">
                    <label for="email">Электронная почта</label>
                    <input 
                    type="email"
                    id="email"
                    v-model="email"
                    autocomplete="email"
                    placeholder="name@example.com"
                    required 
                    />
                </div>
                <div class="form-group">
                    <label for="password">Пароль</label>
                    <input 
                    type="password"
                    id="password"
                    required
                    v-model="password"
                    autocomplete="currnet-password"
                    placeholder="••••••••"
                    />
                </div>
                <div class="error-message" v-if="errorMessage">
                    {{ errorMessage }}
                </div>
                <button type="button" class="google-btn" @click="handleGoogleAuthUrl">
                    Google
                </button>

                <button type="submit" :disabled="isLoading" class="submit-btn">
                    <span v-if="isLoading">Вход...</span>
                    <span v-else>Войти</span>
                </button>
            </form>
            <p class="redirect-text">
                Нет Аккаунта?
                <router-link to="/register">Зарегистрироваться</router-link>
            </p>
        </div>
    </div>
</template>



<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authApi from '@/api/auth'
import { useAuthStore } from '@/stores/authStores'


const router = useRouter()
const store = useAuthStore()

const password = ref('')
const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')


const handleGoogleAuthUrl = async () =>{
  try{
    const data = await authApi.getGoogleAuthUrl()
    window.location.href = data.uri
  } catch (error){
    console.error('Не удалось получить ссылку для Google:', error)
    errorMessage.value = 'Не удалось получить ссылку для Google'
  }
}


const handleLogin = async () => {
    isLoading.value = true
    errorMessage.value=''

    try{
        const data = ref(null)
        data.value = await authApi.login(email.value, password.value)

        if (data.value && data.value.access) {
            store.setToken(data.value.access)

            if(data.value.refresh) {
              store.setRefreshToken(data.value.refresh)
            }
            
            if(data.value.user){
                store.setUser(data.value.user)
            }

            router.push('/dashboard')
        } else {
            errorMessage.value = "Не удалось получить токен авторизации"
        }
    } catch (error) {
    // Обрабатываем ошибки бэкенда (например, 400 Bad Request или 401 Unauthorized)
    console.error('Ошибка при входе:', error)
    errorMessage.value = error.response?.data?.detail || 'Неверный email или пароль'
  } finally {
    // В любом случае (успех или ошибка) выключаем индикатор загрузки
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
    display: flex;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
    background-color: #f3f4f6;
    font-family: sans-serif;
}

.login-card{
    width: 100%;
    max-width: 400px;
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

h2{
    text-align: center;
    margin-bottom: 2rem;
    color: #1f2937;
}

.login-form {
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
.error-message {
  color: #dc2626;
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