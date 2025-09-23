<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let showModal: boolean = false;

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  // 按下 Escape 键时关闭模态框
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown}/>

{#if showModal}
  <div 
    class="fixed inset-0 bg-black/60 z-40"
    on:click={closeModal}
    role="button"
    tabindex="-1"
  ></div>

  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col">
      <slot></slot>
    </div>
  </div>
{/if}