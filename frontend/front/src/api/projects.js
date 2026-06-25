import apiClient from "./client";
const projectsAPI = {
    async list(){
        const response = await apiClient.get('/projects/')
        return response.data
    },
    async create(projectData){
        const response = await apiClient.post('/projects/', projectData)
        return response.data
    },
    async update(id, projectData){
        const response = await apiClient.patch(`/projects/${id}/`, projectData)
        return response.data
    },
    async remove(id){
        await apiClient.delete(`/projects/${id}/`)
    }
}
export default projectsAPI

