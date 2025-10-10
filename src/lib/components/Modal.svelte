<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let showModal: boolean = false;
  export let fullScreen: boolean = false; // <-- 新增 prop

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
      if (fullScreen) {
          document.body.classList.add('overflow-hidden');
      }
  });

  onDestroy(() => {
      if (fullScreen) {
          document.body.classList.remove('overflow-hidden');
      }
  });

  $: if (showModal && fullScreen) {
      document.body.classList.add('overflow-hidden');
  } else if (!showModal && fullScreen) {
      document.body.classList.remove('overflow-hidden');
  }

</script>

<svelte:window on:keydown={handleKeydown}/>

{#if showModal}
  <button 
    class="fixed inset-0 bg-black/60 z-40 cursor-pointer border-0"
    on:click={closeModal}
    aria-label="关闭模态框"
    type="button"
  ></button>

  <div 
    class:fixed={true}
    class:inset-0={true}
    class:z-50={true}
    class:flex={true}
    class:items-center={!fullScreen}
    class:justify-center={!fullScreen}
    class:p-4={!fullScreen}
  >
    <div 
      class="flex flex-col"
      class:w-full={fullScreen}
      class:h-full={fullScreen}
      class:max-w-2xl={!fullScreen}
      class:max-h-[80vh]={!fullScreen}
      class:bg-white={!fullScreen}
      class:dark:bg-gray-800={!fullScreen}
      class:rounded-2xl={!fullScreen}
      class:shadow-xl={!fullScreen}
    >
      <slot></slot>
    </div>
  </div>
{/if}
