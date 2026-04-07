<script>
  import { getIsSuperuser } from '../lib/auth.svelte.js';
  import { navigate, getCurrentHash } from '../lib/router.svelte.js';

  function isActive(path) {
    const hash = getCurrentHash();
    if (path === '#/') return hash === '#/' || hash === '';
    return hash.startsWith(path);
  }

  function go(path) {
    return (e) => {
      e.preventDefault();
      navigate(path);
    };
  }
</script>

<aside class="w-56 bg-gray-900 text-white min-h-screen flex flex-col">
  <div class="p-4 border-b border-gray-700">
    <h1 class="text-lg font-semibold">Wedding Dashboard</h1>
  </div>

  <nav class="flex-1 p-3 space-y-1">
    <a
      href="#/"
      onclick={go('#/')}
      class="block px-3 py-2 rounded-md text-sm {isActive('#/') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
    >
      Events
    </a>

    {#if getIsSuperuser()}
      <a
        href="#/events/new"
        onclick={go('#/events/new')}
        class="block px-3 py-2 rounded-md text-sm {isActive('#/events/new') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
      >
        + New Event
      </a>
      <a
        href="#/users"
        onclick={go('#/users')}
        class="block px-3 py-2 rounded-md text-sm {isActive('#/users') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
      >
        Users
      </a>
    {/if}
  </nav>
</aside>
