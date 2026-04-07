<script>
  import pb from '../lib/pb.js';
  import { formatDate } from '../utils/helpers.js';

  let users = $state([]);
  let loading = $state(true);

  async function loadData() {
    loading = true;
    try {
      users = await pb.collection('users').getFullList({ sort: '-created' });
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadData();
  });
</script>

<div>
  <h2 class="text-xl font-semibold text-gray-900 mb-6">Users</h2>

  {#if loading}
    <p class="text-gray-500">Loading...</p>
  {:else if users.length === 0}
    <p class="text-gray-500">No users found.</p>
  {:else}
    <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Email</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Created</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{user.name || '-'}</td>
              <td class="px-4 py-3 text-gray-600">{user.email}</td>
              <td class="px-4 py-3 text-gray-500">{formatDate(user.created)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
