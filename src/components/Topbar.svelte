<script>
  import { getUser, getIsSuperuser, logout } from '../lib/auth.svelte.js';
</script>

<header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
  <div class="text-sm text-gray-500">
    {#if getIsSuperuser()}
      <span class="inline-flex items-center rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-xs font-medium">
        Superuser
      </span>
    {/if}
  </div>
  <div class="flex items-center gap-4">
    <span class="text-sm text-gray-600">{getUser()?.email}</span>
    <button
      onclick={logout}
      class="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
    >
      Logout
    </button>
  </div>
</header>
