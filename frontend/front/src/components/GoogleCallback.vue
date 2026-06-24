<template>
    <div class="google-callback">
        <p v-if="isLoading">Завершаем вход через Google...</p>
        <p v-else-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
</template>


<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStores';
import authAPI from '@/api/auth';
import { ref,onMounted } from 'vue';

const router = useRouter()
const storage = useAuthStore()

const isLoading = ref(true)
const errorMessage = ref('')

onMounted(async () =>{
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const oauthError = params.get('error')

    if(oauthError){
        errorMessage.value = 'Вход через Google был отменён'
        isLoading.value = false
        return 
    }

    if(!code){
        errorMessage.value = 'Не получен код авторизации от Google'
        isLoading.value = false
        return
    }

    try{
        const data = await authAPI.googleCallback(code)
        storage.setRefreshToken(data.refresh_token)
        storage.setToken(data.access_token)

        router.push('/dashboard')
    } catch( error){
        console.error('Ошибка Google-авторизации:', error)
        errorMessage.value  = 'Не удалось войти через Google'
        isLoading.value = false
    }
})
</script>


<style scoped>
.google-callback {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-family: sans-serif;
}
.error-message {
    color: #dc2626;
}

</style>
