import apiClient from "./client";
const commentsAPI = {
    async list(taskId){
        const response = await apiClient.get('/comments/')
        return response.data.filter(c => c.task === taskId)
    },
    async create(commentData){
        const response = await apiClient.post('/comments/', commentData)
        return response.data
    },
    async remove(id){
        await apiClient.delete(`/comments/${id}/`)
    }
}
export default commentsAPI

