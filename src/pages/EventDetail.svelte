<script>
  import QRCode from 'qrcode';
  import pb from '../lib/pb.js';
  import { getIsSuperuser } from '../lib/auth.svelte.js';
  import { navigate } from '../lib/router.svelte.js';
  import { formatDate, formatDateTime } from '../utils/helpers.js';
  import StatsCard from '../components/StatsCard.svelte';
  import Badge from '../components/Badge.svelte';
  import Modal from '../components/Modal.svelte';

  let { eventId } = $props();

  let event = $state(null);
  let rsvps = $state([]);
  let loading = $state(true);
  let searchQuery = $state('');
  let filterStatus = $state('all');
  let checkingIn = $state(null);
  let showAddRsvpForm = $state(false);
  let creatingRsvp = $state(false);
  let createRsvpError = $state('');
  let editingRsvpId = $state('');
  let savingRsvpEdit = $state(false);
  let editRsvpError = $state('');
  let editRsvp = $state({
    name: '',
    email: '',
    attendance: 'attending',
    guestCount: 0,
    message: '',
  });
  let qrModalRsvp = $state(null);
  let qrDataUrl = $state('');
  let showGreeterQr = $state(false);
  let greeterQrDataUrl = $state('');
  let newRsvp = $state({
    name: '',
    email: '',
    attendance: 'attending',
    guestCount: 1,
    message: '',
  });

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

  function resetNewRsvpForm() {
    newRsvp = {
      name: '',
      email: '',
      attendance: 'attending',
      guestCount: 1,
      message: '',
    };
    createRsvpError = '';
  }

  async function addRsvpFromDashboard() {
    const trimmedName = newRsvp.name.trim();
    if (!trimmedName) {
      createRsvpError = 'Name is required.';
      return;
    }

    creatingRsvp = true;
    createRsvpError = '';

    try {
      const created = await pb.collection('rsvps').create({
        event: eventId,
        name: trimmedName,
        email: newRsvp.email.trim() || '',
        attendance: newRsvp.attendance,
        guest_count: newRsvp.attendance === 'attending' ? Math.max(0, Number(newRsvp.guestCount) || 0) : 0,
        message: newRsvp.message.trim() || '',
      });
      rsvps = [created, ...rsvps];
      showAddRsvpForm = false;
      resetNewRsvpForm();
    } catch (err) {
      createRsvpError = err?.response?.message || 'Failed to add RSVP.';
      console.error('Create RSVP failed:', err);
    } finally {
      creatingRsvp = false;
    }
  }

  function startEditRsvp(rsvp) {
    editingRsvpId = rsvp.id;
    editRsvp = {
      name: rsvp.name || '',
      email: rsvp.email || '',
      attendance: rsvp.attendance || 'attending',
      guestCount: Number(rsvp.guest_count || 0),
      message: rsvp.message || '',
    };
    editRsvpError = '';
  }

  function cancelEditRsvp() {
    editingRsvpId = '';
    editRsvpError = '';
  }

  function closeQrModal() {
    qrModalRsvp = null;
  }

  function closeGreeterQrModal() {
    showGreeterQr = false;
  }

  async function saveRsvpEdit() {
    const trimmedName = editRsvp.name.trim();
    if (!trimmedName) {
      editRsvpError = 'Name is required.';
      return;
    }

    savingRsvpEdit = true;
    editRsvpError = '';

    try {
      const updated = await pb.collection('rsvps').update(editingRsvpId, {
        name: trimmedName,
        email: editRsvp.email.trim() || '',
        attendance: editRsvp.attendance,
        guest_count: editRsvp.attendance === 'attending' ? Math.max(0, Number(editRsvp.guestCount) || 0) : 0,
        message: editRsvp.message.trim() || '',
      });
      rsvps = rsvps.map(r => (r.id === editingRsvpId ? updated : r));
      cancelEditRsvp();
    } catch (err) {
      editRsvpError = err?.response?.message || 'Failed to update RSVP.';
      console.error('Update RSVP failed:', err);
    } finally {
      savingRsvpEdit = false;
    }
  }

  $effect(() => {
    eventId; // track
    loadData();
  });

  $effect(() => {
    const code = qrModalRsvp?.check_in_code;
    if (!code) {
      qrDataUrl = '';
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(String(code), {
      width: 280,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) qrDataUrl = url;
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
        if (!cancelled) qrDataUrl = '';
      });
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    if (!showGreeterQr || !event?.check_in_secret) {
      greeterQrDataUrl = '';
      return;
    }
    let cancelled = false;
    const payload = JSON.stringify({
      secret: event.check_in_secret,
      eventSlug: event.slug,
    });
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) greeterQrDataUrl = url;
      })
      .catch((err) => {
        console.error('Greeter QR generation failed:', err);
        if (!cancelled) greeterQrDataUrl = '';
      });
    return () => {
      cancelled = true;
    };
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
      <div class="flex items-center gap-2">
        <button
          onclick={() => (showGreeterQr = true)}
          class="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 cursor-pointer"
        >
          Greeter QR
        </button>
        {#if getIsSuperuser()}
          <button
            onclick={() => navigate(`#/events/${eventId}/edit`)}
            class="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer"
          >
            Edit Event
          </button>
        {/if}
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <StatsCard label="Total RSVPs" value={stats.total} />
      <StatsCard label="Attending" value={stats.attending} />
      <StatsCard label="Not Attending" value={stats.notAttending} />
      <StatsCard label="Total Guests" value={stats.totalGuests} />
      <StatsCard label="Checked In" value={stats.checkedIn} sublabel="of {stats.attending} attending" />
    </div>

    <div class="flex items-center justify-between mb-4 gap-3">
      <h3 class="text-sm font-medium text-gray-700">RSVPs</h3>
      <button
        onclick={() => {
          showAddRsvpForm = !showAddRsvpForm;
          createRsvpError = '';
        }}
        class="px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer"
      >
        {showAddRsvpForm ? 'Cancel' : '+ Add RSVP'}
      </button>
    </div>

    {#if showAddRsvpForm}
      <form
        onsubmit={(e) => {
          e.preventDefault();
          addRsvpFromDashboard();
        }}
        class="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Full name"
            bind:value={newRsvp.name}
            required
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <input
            type="email"
            placeholder="Email (optional)"
            bind:value={newRsvp.email}
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            bind:value={newRsvp.attendance}
            class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
          </select>

          <input
            type="number"
            min="0"
            bind:value={newRsvp.guestCount}
            disabled={newRsvp.attendance !== 'attending'}
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
            placeholder="Guest count"
          />

          <button
            type="submit"
            disabled={creatingRsvp}
            class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            {creatingRsvp ? 'Saving...' : 'Save RSVP'}
          </button>
        </div>

        <textarea
          rows="3"
          placeholder="Message (optional)"
          bind:value={newRsvp.message}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        ></textarea>

        {#if createRsvpError}
          <p class="text-sm text-red-600">{createRsvpError}</p>
        {/if}
      </form>
    {/if}

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
                <div class="flex flex-wrap items-center gap-3">
                  <button
                    onclick={() => startEditRsvp(rsvp)}
                    class="text-xs text-gray-700 hover:text-gray-900 cursor-pointer"
                  >
                    Edit
                  </button>
                  {#if rsvp.check_in_code}
                    <button
                      type="button"
                      onclick={() => (qrModalRsvp = rsvp)}
                      class="text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      Show QR
                    </button>
                  {/if}
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
                </div>
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

    <Modal
      open={!!qrModalRsvp}
      title={qrModalRsvp ? `Check-in code — ${qrModalRsvp.name}` : 'Check-in code'}
      onclose={closeQrModal}
    >
      {#if qrModalRsvp}
        <div class="flex flex-col items-center gap-4">
          {#if qrDataUrl}
            <img
              src={qrDataUrl}
              alt="QR code for check-in"
              class="w-64 h-64"
              width="256"
              height="256"
            />
          {:else}
            <p class="text-sm text-gray-500">Generating QR code…</p>
          {/if}
          <code class="text-sm bg-gray-100 px-2 py-1 rounded">{qrModalRsvp.check_in_code}</code>
        </div>
      {/if}
    </Modal>

    <Modal open={showGreeterQr} title="Greeter Check-in QR" onclose={closeGreeterQrModal}>
      <div class="flex flex-col items-center gap-4">
        <p class="text-sm text-gray-600 text-center">
          Show this QR code to a greeter. They scan it with the check-in app to authenticate.
        </p>
        {#if greeterQrDataUrl}
          <img
            src={greeterQrDataUrl}
            alt="Greeter authentication QR"
            class="w-64 h-64"
            width="256"
            height="256"
          />
        {:else}
          <p class="text-sm text-gray-500">Generating QR code…</p>
        {/if}
      </div>
    </Modal>

    <Modal open={!!editingRsvpId} title="Edit RSVP" onclose={cancelEditRsvp}>
      <form
        onsubmit={(e) => {
          e.preventDefault();
          saveRsvpEdit();
        }}
        class="space-y-3"
      >
        <input
          type="text"
          placeholder="Full name"
          bind:value={editRsvp.name}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />

        <input
          type="email"
          placeholder="Email (optional)"
          bind:value={editRsvp.email}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />

        <div class="grid grid-cols-2 gap-3">
          <select
            bind:value={editRsvp.attendance}
            class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
          </select>

          <input
            type="number"
            min="0"
            bind:value={editRsvp.guestCount}
            disabled={editRsvp.attendance !== 'attending'}
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
            placeholder="Guest count"
          />
        </div>

        <textarea
          rows="3"
          placeholder="Message (optional)"
          bind:value={editRsvp.message}
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        ></textarea>

        {#if editRsvpError}
          <p class="text-sm text-red-600">{editRsvpError}</p>
        {/if}

        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onclick={cancelEditRsvp}
            class="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={savingRsvpEdit}
            class="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            {savingRsvpEdit ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  </div>
{/if}
