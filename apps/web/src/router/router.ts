import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("@/components/FrontLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("@/pages/Home.vue"),
        meta: { title: "Home", icon: "Home" },
      },
      {
        path: "consultation",
        component: () => import("@/pages/Consultation.vue"),
        meta: { title: "Consultation", icon: "consultation" },
      },
      {
        path: "emotion",
        component: () => import("@/pages/EmotionalDiary.vue"),
        meta: { title: "Emotion", icon: "emotion" },
      },
      {
        path: "knowledge",
        component: () => import("@/pages/Knowledge.vue"),
        meta: { title: "knowledge", icon: "knowledge" },
      },
    ],
  },
  {
    path: "/auth",
    component: () => import("@/components/AuthLayout.vue"),
    children: [
      {
        path: "login",
        component: () => import("@/pages/LoginForm.vue"),
        meta: { title: "Login", icon: "Login" },
      },
      {
        path: "register",
        component: () => import("@/pages/RegisterForm.vue"),
        meta: { title: "Register", icon: "Register" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
