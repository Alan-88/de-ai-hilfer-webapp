<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  let selectedFile: FileList | null = null; // 用于绑定文件输入
  let confirm = false;
  let isLoading = false;
  let error: string | null = null;
  const dispatch = createEventDispatcher();

  async function handleRestore() {
    if (!selectedFile || selectedFile.length === 0) {
      error = '请选择一个备份文件。';
      return;
    }
    if (!confirm) {
      error = '请勾选确认框以继续。';
      return;
    }
    isLoading = true;
    error = null;

    // 使用 FormData 来包装要上传的文件
    const formData = new FormData();
    formData.append('backup_file', selectedFile[0]);

    try {
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/database/import`, {
        method: 'POST',
        body: formData // 直接发送 FormData 对象
        // 注意：当 body 是 FormData 时，浏览器会自动设置正确的 Content-Type (multipart/form-data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || '恢复失败');
      }
      
      dispatch('restoreSuccess', result.message || '恢复成功！');

    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
  }
</script>

<header class="flex items-center justify-between p-4 border-b dark:border-gray-700">
  <h2 class="text-xl font-bold">数据管理</h2>
  <button on:click={() => dispatch('close')} class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="关闭">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  </button>
</header>

<main class="p-6 space-y-6">
  <div>
    <h3 class="text-lg font-semibold mb-2">备份知识库</h3>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">将云端的所有数据下载为一个 `.db` 备份文件。</p>
    <a 
      href="https://de-ai-hilfer-api.onrender.com/api/v1/database/export"
      class="inline-block px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
      download
    >
      下载备份文件
    </a>
  </div>

  <div class="border-t dark:border-gray-700"></div>

  <div>
    <h3 class="text-lg font-semibold mb-2">从备份恢复</h3>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
      <span class="font-bold text-red-500">警告:</span> 此操作将用你上传的备份文件完全覆盖云端数据库，当前所有数据都将丢失且不可逆。
    </p>
    <form on:submit|preventDefault={handleRestore} class="space-y-4">
      <div>
        <label for="file-upload" class="block text-sm font-medium mb-1">选择备份文件 (.db)</label>
        <input 
          bind:files={selectedFile}
          id="file-upload"
          type="file"
          accept=".db"
          class="block w-full text-sm text-gray-500
                 file:mr-4 file:py-2 file:px-4
                 file:rounded-full file:border-0
                 file:text-sm file:font-semibold
                 file:bg-blue-50 file:text-blue-700
                 dark:file:bg-blue-900/50 dark:file:text-blue-300
                 hover:file:bg-blue-100 dark:hover:file:bg-blue-800/50"
        />
      </div>
      
      <div class="flex items-start">
        <div class="flex items-center h-5">
          <input bind:checked={confirm} id="confirm" type="checkbox" class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded">
        </div>
        <div class="ml-3 text-sm">
          <label for="confirm" class="font-medium">我已阅读警告并理解此操作的后果。</label>
        </div>
      </div>
      
      {#if error}
        <p class="text-red-500 text-sm">{error}</p>
      {/if}

      <div class="flex justify-end">
        <button 
          type="submit"
          disabled={isLoading}
          class="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? '上传并恢复...' : '开始恢复'}
        </button>
      </div>
    </form>
  </div>
</main>