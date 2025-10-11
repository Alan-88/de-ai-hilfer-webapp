<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { fade, scale } from 'svelte/transition';

  export let showModal: boolean = false;
  export let fullScreen: boolean = false;

  const dispatch = createEventDispatcher();
  function closeModal() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  onMount(() => {
    if (browser) {
      window.addEventListener('keydown', handleKeydown);
    }
    return () => {
      if (browser) {
        window.removeEventListener('keydown', handleKeydown);
        document.body.classList.remove('overflow-hidden');
      }
    };
  });

  $: if (browser && fullScreen) {
    if (showModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }
</script>

{#if showModal}
  <div class="fixed inset-0 z-40" transition:fade={{ duration: 150 }}>
    <button
      class="absolute inset-0 w-full h-full bg-black/70 cursor-pointer border-0"
      on:click={closeModal}
      aria-label="关闭模态框"
      type="button"
    ></button>
  </div>

  <div
    class="fixed inset-0 z-50 flex justify-center p-4"
    class:items-start={!fullScreen}
    class:pt-20={!fullScreen}
  >
    <div
      class="flex flex-col w-full"
      class:h-full={fullScreen}
      class:max-w-2xl={!fullScreen}
      class:max-h-[85vh]={!fullScreen}
      class:bg-white={!fullScreen}
      class:dark:bg-gray-800={!fullScreen}
      class:rounded-2xl={!fullScreen}
      class:shadow-xl={!fullScreen}
      class:overflow-hidden={!fullScreen}
      transition:scale={{ duration: 150, start: 0.97 }}
    >
      <slot></slot>
    </div>
  </div>
{/if}