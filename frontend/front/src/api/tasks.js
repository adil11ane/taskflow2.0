import apiClient from "./client";

const tasksAPI = {
    async list(){
        const response = await apiClient.get('/tasks/')
        return response.data
    },
    async create(taskData){
        const response = await apiClient.post('/tasks/', taskData)
        return response.data
    },
    async update(id,taskData){
        const response = await apiClient.patch(`/tasks/${id}/`, taskData)
        return response.data
    },
    async remove(id){
        const reponse = await apiClient.delete(`/tasks/${id}/`)
    }
}

export default tasksAPI