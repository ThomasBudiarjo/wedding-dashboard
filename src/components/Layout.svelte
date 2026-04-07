<script>
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';

  let { children } = $props();
</script>

<div class="flex min-h-screen bg-gray-50">
  <Sidebar />
  <div class="flex-1 flex flex-col">
    <Topbar />
    <main class="flex-1 p-6">
      {@render children()}
    </main>
  </div>
</div>
