# Step 7: AppHeader Component

## Overview
Create a global navigation header component that links to the three main pages: Practice, Manage, and Settings.

## Architecture Rules
- Location: `src/dumb/AppHeader.vue` (global component, no business logic)
- Can import icons from lucide-vue-next

## Tasks

### 7.1 Create AppHeader Component

Create `src/dumb/AppHeader.vue`:

```vue
<template>
  <header class="navbar bg-base-200">
    <div class="flex-1">
      <span class="text-xl font-bold">Memorization Cafe</span>
    </div>
    <div class="flex-none">
      <nav class="flex gap-2">
        <router-link
          to="/practice"
          class="btn btn-ghost gap-2"
          :class="{ 'btn-active': isActive('/practice') }"
        >
          <Brain :size="20" />
          <span class="hidden sm:inline">Practice</span>
        </router-link>

        <router-link
          to="/manage"
          class="btn btn-ghost gap-2"
          :class="{ 'btn-active': isActive('/manage') }"
        >
          <FolderOpen :size="20" />
          <span class="hidden sm:inline">Manage</span>
        </router-link>

        <router-link
          to="/settings"
          class="btn btn-ghost gap-2"
          :class="{ 'btn-active': isActive('/settings') }"
        >
          <Settings :size="20" />
          <span class="hidden sm:inline">Settings</span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { Brain, FolderOpen, Settings } from 'lucide-vue-next';

const route = useRoute();

function isActive(path: string): boolean {
  return route.path.startsWith(path);
}
</script>
```

### 7.2 Update App Layout

Update `src/App.vue` (or main app component) to include the header:

```vue
<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1 container mx-auto p-4">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/dumb/AppHeader.vue';
</script>
```

### 7.3 Update Router

Ensure `src/app/router.ts` has routes for all three pages:

```typescript
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/practice',
    },
    {
      path: '/practice',
      name: 'Practice',
      component: () => import('@/pages/practice/PracticePage.vue'),
    },
    {
      path: '/manage',
      name: 'Manage',
      component: () => import('@/pages/manage/ManagePage.vue'),
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/pages/settings/SettingsPage.vue'),
    },
  ],
});

export default router;
```

## Responsive Behavior

- **Desktop**: Shows icon + page name
- **Mobile (sm breakpoint and below)**: Shows icon only
- **Active route**: Highlighted with `btn-active` class

## Validation

- [ ] Header appears at the top of the app
- [ ] All three navigation links work correctly
- [ ] Active route is highlighted
- [ ] On mobile, only icons are shown
- [ ] On desktop, icons + labels are shown
- [ ] DaisyUI navbar styling applied correctly
- [ ] ESLint passes

## Next Step

Proceed to `08-practice-page.md` to implement the Practice page.
