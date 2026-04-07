<script>
  let { open = false, title = '', onclose, children } = $props();
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black/50" onclick={onclose} onkeydown={e => e.key === 'Escape' && onclose()}></div>
    <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
        <button onclick={onclose} class="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer">&times;</button>
      </div>
      {@render children()}
    </div>
  </div>
{/if}
