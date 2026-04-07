<script>
  import pb from '../lib/pb.js';
  import { getIsSuperuser } from '../lib/auth.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { formatDate } from '../utils/helpers.js';

  let events = $state([]);
  let rsvpCounts = $state({});
  let loading = $state(true);

  async function loadData() {
    loading = true;
    try {
      const result = await pb.collection('events').getFullList({
        sort: '-date',
        expand: 'owner',
      });
      events = result;

      // Fetch RSVP counts per event
      const allRsvps = await pb.collection('rsvps').getFullList({
        fields: 'event,attendance',
      });

      const counts = {};
      for (const rsvp of allRsvps) {
        if (!counts[rsvp.event]) {
          counts[rsvp.event] = { total: 0, attending: 0 };
        }
        counts[rsvp.event].total++;
        if (rsvp.attendance === 'attending') {
          counts[rsvp.event].attending++;
        }
      }
      rsvpCounts = counts;
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadData();
  });
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-semibold text-gray-900">Events</h2>
    {#if getIsSuperuser()}
      <button
        onclick={() => navigate('#/events/new')}
        class="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer"
      >
        + New Event
      </button>
    {/if}
  </div>

  {#if loading}
    <p class="text-gray-500">Loading...</p>
  {:else if events.length === 0}
    <p class="text-gray-500">No events found.</p>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each events as event}
        <button
          onclick={() => navigate(`#/events/${event.id}`)}
          class="bg-white rounded-lg border border-gray-200 p-5 text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <h3 class="font-semibold text-gray-900">{event.name}</h3>
          <p class="text-sm text-gray-500 mt-1">{formatDate(event.date)}</p>
          {#if event.expand?.owner}
            <p class="text-xs text-gray-400 mt-1">Owner: {event.expand.owner.name || event.expand.owner.email}</p>
          {/if}
          <div class="mt-3 text-sm text-gray-600">
            {#if rsvpCounts[event.id]}
              <span>{rsvpCounts[event.id].total} RSVPs</span>
              <span class="text-gray-400 mx-1">/</span>
              <span class="text-green-600">{rsvpCounts[event.id].attending} attending</span>
            {:else}
              <span>0 RSVPs</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
