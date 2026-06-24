import apiClient from './client'

const authAPI = {
    async login(email,password){
        const response = await apiClient.post('/users/login/', {email, password})
        return response.data
    }, 

    async register(userData){
        const response = await apiClient.post('/users/register/', userData)
        return response.data
    } ,

    async getConfirmation(email){
        const response = await apiClient.post('/users/get-email-code/', {email})
        return response.data
    },

    async logout(){
        const response = await apiClient.post('/users/logout/')
        return response.data
    },

    async getGoogleAuthUrl(){
        const response = await apiClient.get('/users/google/auth/google/url/')
        return response.data
    },

    async googleCallBack(code){
        const response = await apiClient.post('/users/google/google/callback/', {code})
        return response.data
    }
}

export default authAPI
