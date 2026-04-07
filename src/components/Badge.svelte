<script>
  let { variant = 'default', children } = $props();

  const classes = {
    attending: 'bg-green-100 text-green-800',
    not_attending: 'bg-red-100 text-red-800',
    checked_in: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  };
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {classes[variant] || classes.default}">
  {@render children()}
</span>
