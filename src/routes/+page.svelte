<script lang="ts">
  // 1. 状态管理: searchQuery 现在默认为空，等待用户输入
  let searchQuery = "";
  
  // 未来API返回的数据将存储在这里
  // let searchResult = null; 
  // let isLoading = false;

  // 2. 交互逻辑: handleSearch 函数保持不变，作为我们未来的API调用入口
  function handleSearch() {
    console.log(`准备搜索: ${searchQuery}`);
    // TODO: 在这里调用后端 API
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-start pt-20 px-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">

  <div class="text-center mb-12">
    <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
      De-AI-Hilfer
    </h1>
    <p class="mt-4 text-lg text-gray-500 dark:text-gray-400">
      你的下一代个人德语学习助理
    </p>
  </div>

  <form class="w-full max-w-2xl mx-auto" on:submit|preventDefault={handleSearch}>
    <div class="relative bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700">
      <input 
        type="text" 
        placeholder="输入德语单词，例如 'Hilfe'..." 
        class="w-full bg-transparent text-lg pl-6 pr-16 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        bind:value={searchQuery}
      >
      <button 
        type="submit" 
        aria-label="Search"
        class="absolute top-1/2 right-3 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </button>
    </div>
  </form>
  
  <footer class="text-center mt-16 pb-8">
    <p class="text-gray-400 dark:text-gray-500 text-sm">De-AI-Hilfer V4.0 Web Client</p>
  </footer>

</div>