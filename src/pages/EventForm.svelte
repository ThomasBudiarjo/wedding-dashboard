<script>
  import pb from '../lib/pb.js';
  import { navigate } from '../lib/router.svelte.js';
  import { toSlug } from '../utils/helpers.js';

  let { eventId = null } = $props();

  let name = $state('');
  let slug = $state('');
  let date = $state('');
  let ownerId = $state('');
  let autoSlug = $state(true);

  let users = $state([]);
  let createNewUser = $state(false);
  let newUserName = $state('');
  let newUserEmail = $state('');
  let newUserPassword = $state('');

  let loading = $state(false);
  let saving = $state(false);
  let error = $state('');
  let isEdit = $derived(!!eventId);

  async function loadData() {
    loading = true;
    try {
      users = await pb.collection('users').getFullList({ sort: 'email' });

      if (eventId) {
        const event = await pb.collection('events').getOne(eventId);
        name = event.name;
        slug = event.slug;
        date = event.date ? event.date.slice(0, 10) : '';
        ownerId = event.owner;
        autoSlug = false;
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      loading = false;
    }
  }

  function handleNameInput() {
    if (autoSlug && !isEdit) {
      slug = toSlug(name);
    }
  }

  function handleSlugInput() {
    autoSlug = false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    error = '';
    saving = true;

    try {
      let owner = ownerId;

      if (createNewUser) {
        const newUser = await pb.collection('users').create({
          email: newUserEmail,
          password: newUserPassword,
          passwordConfirm: newUserPassword,
          name: newUserName,
        });
        owner = newUser.id;
      }

      const data = {
        name,
        slug,
        date: date || null,
        owner,
      };

      if (isEdit) {
        await pb.collection('events').update(eventId, data);
      } else {
        await pb.collection('events').create(data);
      }

      navigate('#/');
    } catch (err) {
      error = err.message || 'Failed to save event';
      if (err.response?.data) {
        const fieldErrors = Object.entries(err.response.data)
          .map(([k, v]) => `${k}: ${v.message}`)
          .join(', ');
        if (fieldErrors) error = fieldErrors;
      }
    } finally {
      saving = false;
    }
  }

  $effect(() => {
    loadData();
  });
</script>

<div class="max-w-lg">
  <button onclick={() => navigate('#/')} class="text-sm text-gray-500 hover:text-gray-700 cursor-pointer mb-4">&larr; Back to events</button>
  <h2 class="text-xl font-semibold text-gray-900 mb-6">{isEdit ? 'Edit Event' : 'New Event'}</h2>

  {#if loading}
    <p class="text-gray-500">Loading...</p>
  {:else}
    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
        <input
          id="name"
          type="text"
          bind:value={name}
          oninput={handleNameInput}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <div>
        <label for="slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
        <input
          id="slug"
          type="text"
          bind:value={slug}
          oninput={handleSlugInput}
          required
          pattern="^[a-z0-9-]+$"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <p class="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only</p>
      </div>

      <div>
        <label for="date" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          id="date"
          type="date"
          bind:value={date}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-sm font-medium text-gray-700 mb-1">Owner</label>

        <div class="flex items-center gap-3 mb-2">
          <label class="flex items-center gap-1.5 text-sm text-gray-600">
            <input type="radio" bind:group={createNewUser} value={false} />
            Existing user
          </label>
          <label class="flex items-center gap-1.5 text-sm text-gray-600">
            <input type="radio" bind:group={createNewUser} value={true} />
            Create new user
          </label>
        </div>

        {#if createNewUser}
          <div class="space-y-3 border border-gray-200 rounded-md p-3 bg-gray-50">
            <div>
              <label for="newUserName" class="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                id="newUserName"
                type="text"
                bind:value={newUserName}
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label for="newUserEmail" class="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                id="newUserEmail"
                type="email"
                bind:value={newUserEmail}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label for="newUserPassword" class="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input
                id="newUserPassword"
                type="password"
                bind:value={newUserPassword}
                required
                minlength="8"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
        {:else}
          <select
            bind:value={ownerId}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Select a user...</option>
            {#each users as user}
              <option value={user.id}>{user.name || user.email} ({user.email})</option>
            {/each}
          </select>
        {/if}
      </div>

      {#if error}
        <p class="text-sm text-red-600">{error}</p>
      {/if}

      <button
        type="submit"
        disabled={saving}
        class="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
      >
        {saving ? 'Saving...' : (isEdit ? 'Update Event' : 'Create Event')}
      </button>
    </form>
  {/if}
</div>
