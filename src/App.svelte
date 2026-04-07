<script>
  import { initAuth, getIsLoggedIn, getIsSuperuser } from './lib/auth.svelte.js';
  import { initRouter, getCurrentHash, matchRoute, navigate } from './lib/router.svelte.js';

  import Layout from './components/Layout.svelte';
  import Login from './pages/Login.svelte';
  import EventList from './pages/EventList.svelte';
  import EventDetail from './pages/EventDetail.svelte';
  import EventForm from './pages/EventForm.svelte';
  import UserList from './pages/UserList.svelte';

  initAuth();

  $effect(() => {
    return initRouter();
  });

  let route = $derived(matchRoute(getCurrentHash()));

  // Guard superuser-only routes
  let guardedRoute = $derived.by(() => {
    const superuserOnly = ['event-new', 'event-edit', 'user-list'];
    if (superuserOnly.includes(route.name) && !getIsSuperuser()) {
      return { name: 'event-list', params: [] };
    }
    return route;
  });
</script>

{#if !getIsLoggedIn()}
  <Login />
{:else}
  <Layout>
    {#if guardedRoute.name === 'event-list'}
      <EventList />
    {:else if guardedRoute.name === 'event-detail'}
      <EventDetail eventId={guardedRoute.params[0]} />
    {:else if guardedRoute.name === 'event-new'}
      <EventForm />
    {:else if guardedRoute.name === 'event-edit'}
      <EventForm eventId={guardedRoute.params[0]} />
    {:else if guardedRoute.name === 'user-list'}
      <UserList />
    {/if}
  </Layout>
{/if}
