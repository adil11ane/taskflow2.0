import { defineStore } from 'pinia'
import { ref, computed } from 'vue'


export const useAuthStore = defineStore('auth',() => {
    const token = ref(localStorage.getItem('access_token') || null )
    const refreshToken = ref(localStorage.getItem('refresh_token')|| null)
    const user = ref(null)


    const isAuthenticated = computed(() => !!token.value)
    
    function setToken(newToken){
        token.value = newToken
        localStorage.setItem('access_token', newToken)
    }

    function setRefreshToken(newRefreshToken){
        refreshToken.value = newRefreshToken
        localStorage.setItem('refresh_token' , newRefreshToken)
    }

    function setUser(userData){
        user.value = userData
    }

    function clearAuth(){   
        token.value = null
        user.value = null
        refreshToken.value = null
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    }

    return {
        token,
        refreshToken,
        user,
        isAuthenticated,
        setToken,
        setRefreshToken,
        setUser,
        clearAuth
    }
})
