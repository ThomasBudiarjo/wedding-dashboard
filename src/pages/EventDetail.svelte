<script>
  import pb from '../lib/pb.js';
  import { getIsSuperuser } from '../lib/auth.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { formatDate, formatDateTime } from '../utils/helpers.js';
  import StatsCard from '../components/StatsCard.svelte';
  import Badge from '../components/Badge.svelte';

  let { eventId } = $props();

  let event = $state(null);
  let rsvps = $state([]);
  let loading = $state(true);
  let searchQuery = $state('');
  let filterStatus = $state('all');
  let checkingIn = $state(null);

  let stats = $derived({
    total: rsvps.length,
    attending: rsvps.filter(r => r.attendance === 'attending').length,
    notAttending: rsvps.filter(r => r.attendance === 'not_attending').length,
    totalGuests: rsvps.reduce((sum, r) => sum + (r.guest_count || 0), 0),
    checkedIn: rsvps.filter(r => r.checked_in).length,
  });

  let filteredRsvps = $derived.by(() => {
    let result = rsvps;
    if (filterStatus !== 'all') {
      if (filterStatus === 'checked_in') {
        result = result.filter(r => r.checked_in);
      } else if (filterStatus === 'not_checked_in') {
        result = result.filter(r => !r.checked_in);
      } else {
        result = result.filter(r => r.attendance === filterStatus);
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.check_in_code && r.check_in_code.toLowerCase().includes(q))
      );
    }
    return result;
  });

  async function loadData() {
    loading = true;
    try {
      event = await pb.collection('events').getOne(eventId);
      rsvps = await pb.collection('rsvps').getFullList({
        filter: `event = "${eventId}"`,
        sort: '-created',
      });
    } catch (err) {
      console.error('Failed to load event:', err);
    } finally {
      loading = false;
    }
  }

  async function checkIn(rsvpId) {
    checkingIn = rsvpId;
    try {
      const updated = await pb.collection('rsvps').update(rsvpId, {
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      });
      rsvps = rsvps.map(r => r.id === rsvpId ? updated : r);
    } catch (err) {
      console.error('Check-in failed:', err);
    } finally {
      checkingIn = null;
    }
  }

  async function undoCheckIn(rsvpId) {
    checkingIn = rsvpId;
    try {
      const updated = await pb.collection('rsvps').update(rsvpId, {
        checked_in: false,
        checked_in_at: '',
      });
      rsvps = rsvps.map(r => r.id === rsvpId ? updated : r);
    } catch (err) {
      console.error('Undo check-in failed:', err);
    } finally {
      checkingIn = null;
    }
  }

  $effect(() => {
    eventId; // track
    loadData();
  });
</script>

{#if loading}
  <p class="text-gray-500">Loading...</p>
{:else if !event}
  <p class="text-gray-500">Event not found.</p>
{:else}
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <button onclick={() => navigate('#/')} class="text-sm text-gray-500 hover:text-gray-700 cursor-pointer mb-1">&larr; Back to events</button>
        <h2 class="text-xl font-semibold text-gray-900">{event.name}</h2>
        <p class="text-sm text-gray-500">{formatDate(event.date)}</p>
      </div>
      {#if getIsSuperuser()}
        <button
          onclick={() => navigate(`#/events/${eventId}/edit`)}
          class="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer"
        >
          Edit Event
        </button>
      {/if}
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <StatsCard label="Total RSVPs" value={stats.total} />
      <StatsCard label="Attending" value={stats.attending} />
      <StatsCard label="Not Attending" value={stats.notAttending} />
      <StatsCard label="Total Guests" value={stats.totalGuests} />
      <StatsCard label="Checked In" value={stats.checkedIn} sublabel="of {stats.attending} attending" />
    </div>

    <!-- Search & Filter -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <input
        type="text"
        placeholder="Search name, email, or check-in code..."
        bind:value={searchQuery}
        class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
      <select
        bind:value={filterStatus}
        class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <option value="all">All</option>
        <option value="attending">Attending</option>
        <option value="not_attending">Not Attending</option>
        <option value="checked_in">Checked In</option>
        <option value="not_checked_in">Not Checked In</option>
      </select>
    </div>

    <!-- RSVP Table -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Email</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Attendance</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Guests</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Check-in Code</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredRsvps as rsvp}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{rsvp.name}</td>
              <td class="px-4 py-3 text-gray-600">{rsvp.email || '-'}</td>
              <td class="px-4 py-3">
                <Badge variant={rsvp.attendance}>
                  {rsvp.attendance === 'attending' ? 'Attending' : 'Not Attending'}
                </Badge>
              </td>
              <td class="px-4 py-3 text-gray-600">{rsvp.guest_count || 0}</td>
              <td class="px-4 py-3">
                <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{rsvp.check_in_code}</code>
              </td>
              <td class="px-4 py-3">
                {#if rsvp.checked_in}
                  <Badge variant="checked_in">
                    Checked in {formatDateTime(rsvp.checked_in_at)}
                  </Badge>
                {:else}
                  <span class="text-gray-400 text-xs">Not checked in</span>
                {/if}
              </td>
              <td class="px-4 py-3">
                {#if rsvp.checked_in}
                  <button
                    onclick={() => undoCheckIn(rsvp.id)}
                    disabled={checkingIn === rsvp.id}
                    class="text-xs text-red-600 hover:text-red-800 cursor-pointer disabled:opacity-50"
                  >
                    Undo
                  </button>
                {:else}
                  <button
                    onclick={() => checkIn(rsvp.id)}
                    disabled={checkingIn === rsvp.id}
                    class="text-xs text-blue-600 hover:text-blue-800 cursor-pointer disabled:opacity-50"
                  >
                    {checkingIn === rsvp.id ? 'Checking in...' : 'Check In'}
                  </button>
                {/if}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                {searchQuery || filterStatus !== 'all' ? 'No RSVPs match your search.' : 'No RSVPs yet.'}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if filteredRsvps.length > 0}
      <p class="text-xs text-gray-400 mt-2">Showing {filteredRsvps.length} of {rsvps.length} RSVPs</p>
    {/if}
  </div>
{/if}
