import axios from "axios";
import { useAuthStore } from "@/stores/authStores";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://myporjecttaskflow.duckdns.org/api";

const apiClient = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        "Content-Type" : "application/json"
    }    
})

apiClient.interceptors.request.use(
    (config) => {
        const store = useAuthStore()

        if (store.token){
            config.headers.Authorization = `Bearer ${store.token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

const rawClient = axios.create({baseURL, timeout : 10000})
let refreshPromise = null

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const store = useAuthStore()
        const originalRequest = error.config

        const is401 = error.reponse?.status === 401
        const alreadyRetried = originalRequest?._retry
        if(!is401 || alreadyRetried || !store.refreshToken){
            return Promise.reject(error)
        }

        originalRequest._retry = true
        
        try {
            if (!refreshPromise){
                refreshPromise = rawClient
                .post('/users/login/refresh/', {refresh : store.refreshToken})
                .then((res) => res.data)
                .finally(() => { refreshPromise = null})
            }
            const data = await refreshPromise
            store.setToken(data.access)

            originalRequest.headers.Authorization = `Bearer ${data.access}`
            return apiClient(originalRequest)
        } catch (refreshError){
            store.clearAuth()
            window.location.href = '/'
            return Promise.reject(refreshError)
        }
    }
)

export default apiClient

