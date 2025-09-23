<script lang="ts">
  import { onMount } from 'svelte';

  // 1. 增加 'sleeping' 状态，代表我们推断服务器可能处于休眠
  type Status = 'unknown' | 'checking' | 'awake' | 'sleeping' | 'error';
  
  let serverStatus: Status = 'unknown';
  let keepAliveIntervalId: any;
  let keepAliveEnabled = false;

  // 用来判断“冷启动”的阈值（毫秒），Render 免费服务冷启动通常需要 5-30 秒
  const COLD_START_THRESHOLD = 4000; 

  async function checkStatus() {
    serverStatus = 'checking';
    const startTime = Date.now();

    try {
      // 发送探测请求
      const response = await fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/status`);
      const duration = Date.now() - startTime;

      if (response.ok) {
        // 关键逻辑：如果响应时间超过阈值，我们就认为它刚刚被唤醒
        if (duration > COLD_START_THRESHOLD) {
          // 明确告诉用户，我们刚刚唤醒了它
          serverStatus = 'sleeping'; 
          // 4秒后，自动将状态更新为“在线”
          setTimeout(() => {
            if (serverStatus === 'sleeping') {
              serverStatus = 'awake';
            }
          }, 4000);
        } else {
          // 如果响应很快，说明它一直在线
          serverStatus = 'awake';
        }
      } else {
        throw new Error('Server unreachable');
      }
    } catch (e) {
      serverStatus = 'error';
    }
  }

  function manageKeepAliveTimer() {
    clearInterval(keepAliveIntervalId);
    if (keepAliveEnabled) {
      // 开启“保持唤醒”后，立即执行一次检查并启动定时器
      checkStatus();
      keepAliveIntervalId = setInterval(() => {
        // 后台静默请求，只为保活，不更新UI
        fetch(`https://de-ai-hilfer-api.onrender.com/api/v1/status`);
      }, 5 * 60 * 1000);
      localStorage.setItem('keepAliveEnabled', 'true');
    } else {
      localStorage.setItem('keepAliveEnabled', 'false');
    }
  }
  
  // 当用户勾选/取消时，管理定时器
  $: if (typeof window !== 'undefined') {
    manageKeepAliveTimer();
  }

  onMount(() => {
    // 恢复用户偏好
    const savedPreference = localStorage.getItem('keepAliveEnabled') === 'true';
    if (savedPreference) {
      keepAliveEnabled = true;
    } else {
      // 如果用户没有选择“保持唤醒”，则在打开页面时进行一次探测
      checkStatus();
    }
    return () => clearInterval(keepAliveIntervalId);
  });

  const statusMap = {
    unknown: { color: 'bg-gray-400', text: '状态未知' },
    checking: { color: 'bg-yellow-400 animate-pulse', text: '探测中...' },
    awake: { color: 'bg-green-500', text: '服务在线' },
    sleeping: { color: 'bg-cyan-400', text: '服务已唤醒' }, // UI上明确告知用户
    error: { color: 'bg-red-500', text: '服务错误' },
  }
</script>

<div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 p-2 border-t dark:border-gray-700 justify-center">
  <div class="flex items-center space-x-2">
    <span class="w-3 h-3 rounded-full {statusMap[serverStatus].color}"></span>
    <span>{statusMap[serverStatus].text}</span>
    <button on:click={checkStatus} class="hover:underline" title="手动检查服务器状态">(刷新)</button>
  </div>
  <span class="text-gray-300 dark:text-gray-600">|</span>
  <label class="flex items-center space-x-2 cursor-pointer">
    <input type="checkbox" bind:checked={keepAliveEnabled} class="rounded text-blue-500 focus:ring-blue-500" />
    <span title="开启后将每5分钟发送一次请求，防止服务器因无活动而休眠">保持唤醒</span>
  </label>
</div>