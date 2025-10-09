<script lang="ts">
  import { ReviewQuality } from '$lib/types';

  export let onRating: (quality: ReviewQuality) => void;
  export let disabled = false;

  const ratingOptions = [
    { value: ReviewQuality.COMPLETELY_FORGOT, label: '完全忘记', color: 'red' },
    { value: ReviewQuality.INCORRECT_BUT_REMEMBERED, label: '错误但有印象', color: 'orange' },
    { value: ReviewQuality.INCORRECT_WITH_HINT, label: '提示后记起', color: 'yellow' },
    { value: ReviewQuality.HESITANT, label: '犹豫但正确', color: 'blue' },
    { value: ReviewQuality.CORRECT_WITH_HESITATION, label: '正确但犹豫', color: 'green' },
    { value: ReviewQuality.PERFECT, label: '完美回忆', color: 'emerald' }
  ];

  function handleRating(quality: ReviewQuality) {
    if (!disabled) {
      onRating(quality);
    }
  }
</script>

<div class="space-y-2">
  <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">请评价你的记忆质量：</p>
  <div class="grid grid-cols-2 gap-2">
    {#each ratingOptions as option}
      <button
        on:click={() => handleRating(option.value)}
        disabled={disabled}
        class="px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
               {disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
               {option.color === 'red' ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30' : ''}
               {option.color === 'orange' ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/30' : ''}
               {option.color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300 dark:hover:bg-yellow-900/30' : ''}
               {option.color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30' : ''}
               {option.color === 'green' ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/30' : ''}
               {option.color === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30' : ''}"
      >
        {option.label}
      </button>
    {/each}
  </div>
</div>
