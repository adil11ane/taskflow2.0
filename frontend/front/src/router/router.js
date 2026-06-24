import { createRouter, createWebHistory } from "vue-router";    
import { useAuthStore } from "@/stores/authStores";


const routes = [
    {
        path: '/',
        name: 'Login',
        component: () => import('@/components/loginpage.vue'),
        meta: {requiresGuest: true}
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import("@/components/registerpage.vue"),
        meta: {requiresGuest: true}
    },
    {
        path : '/auth/google',
        name : 'GoogleCallback',
        component: () => import("@/components/GoogleCallback.vue")
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/components/dashboard.vue'),
        meta: {requiresAuth: true}
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]


const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to,from,next) => {
    const storage = useAuthStore()
    const isAuth = storage.isAuthenticated 
    
    if (to.meta.requiresAuth && !isAuth){
        return next({name: 'Login'})
    }
    
    if (to.meta.requiresGuest && isAuth){
        return next({name: 'Dashboard'})
    }

    next()
})

export default router