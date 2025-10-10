<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

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

  // --- 修改: 优化副作用逻辑 ---
  onMount(() => {
    // 确保只在浏览器中执行
    if (browser) {
      window.addEventListener('keydown', handleKeydown);
    }
    return () => {
      if (browser) {
        window.removeEventListener('keydown', handleKeydown);
        // 确保组件销毁时，移除body上的类
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
