import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

// Import Views/Pages
import LoginPage from '../views/LoginPage.vue';
// import DashboardLayout from '../layouts/DashboardLayout.vue';
// import GroupList from '../views/GroupList.vue';
import GroupView from '../views/groupView.vue';
import GroupList from '../views/groupList.vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import SignupPage from '../views/SignupPage.vue';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/login',
        name: 'Login',
        component: LoginPage,
        meta: { requiresGuest: true } // Redirect if already logged in
    },
    {
        path: '/signup',
        name: 'Signup',
        component: SignupPage,
         meta: { requiresGuest: true }
    },
    {
        path: '/dashboard',
        component: DashboardLayout, // Parent layout for protected routes
        meta: { requiresAuth: true }, // This route and children require login
        children: [
            {
                path: '', // Default child for /dashboard
                name: 'GroupList',
                component: GroupList,
            },
            {
                path: 'groups/:groupId', // Route for specific group
                name: 'GroupView',
                component: GroupView,
                props: true // Pass route params as props to the component
            },
            // Add other dashboard routes here
        ]
    },
    // Redirect root path
    {
        path: '/',
        redirect: '/dashboard' // Or '/login' if you prefer landing on login
    },
     // Catch-all 404
     {
         path: '/:pathMatch(.*)*',
         redirect: '/' // Or redirect to a dedicated 404 page
     }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation Guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

    if (requiresAuth && !authStore.isAuthenticated) {
        // Redirect to login if trying to access protected route without auth
        next({ name: 'Login' });
    } else if (requiresGuest && authStore.isAuthenticated) {
        // Redirect to dashboard if trying to access login/signup while authenticated
        next({ path: '/dashboard' });
    } else {
        // Otherwise, allow navigation
        next();
    }
});

export default router;