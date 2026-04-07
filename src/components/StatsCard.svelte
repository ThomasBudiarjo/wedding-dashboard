<script>
  let { label, value, sublabel = '' } = $props();
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4">
  <p class="text-sm text-gray-500">{label}</p>
  <p class="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
  {#if sublabel}
    <p class="text-xs text-gray-400 mt-1">{sublabel}</p>
  {/if}
</div>
