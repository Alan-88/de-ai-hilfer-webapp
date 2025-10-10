<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

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

  // --- 修改开始 ---
  // onMount 确保这段代码只在浏览器中运行
  onMount(() => {
    // 监听键盘事件
    window.addEventListener('keydown', handleKeydown);

    // 如果是全屏模态框，在挂载时就禁止body滚动
    if (showModal && fullScreen) {
      document.body.classList.add('overflow-hidden');
    }

    // 返回一个清理函数，在组件销毁时执行
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      document.body.classList.remove('overflow-hidden');
    };
  });

  // 使用响应式语句来处理模态框显示/隐藏时的 body 滚动
  $: if (typeof document !== 'undefined' && fullScreen) {
    if (showModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }
  // --- 修改结束 ---

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
