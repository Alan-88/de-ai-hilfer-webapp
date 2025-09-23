<script lang="ts">
  import { marked } from 'marked';
  import type { FollowUpItem } from '$lib/types'; // 1. 导入 FollowUpItem 类型

  /**
   * 接收传入的 Markdown 字符串
   */
  export let markdownContent: string = '';
  /**
   * 接收可选的追问历史记录数组
   */
  export let followUps: FollowUpItem[] = []; // 2. 接收追问数组作为 prop

  let renderedHtml: string | Promise<string> = '';

  // 当 markdownContent 或 followUps 发生变化时，重新渲染 HTML
  $: {
    let fullMarkdown = markdownContent;

    // 3. 如果有追问历史，将其格式化并附加到主内容的末尾
    if (followUps && followUps.length > 0) {
      const followUpsMarkdown = `\n\n<br><hr>\n\n## 追问历史\n\n` + 
        followUps.map(fu => `**你问:** ${fu.question}\n\n**AI答:** ${fu.answer}`).join("\n\n---\n\n");
      fullMarkdown += followUpsMarkdown;
    }

    if (fullMarkdown) {
      renderedHtml = marked.parse(fullMarkdown);
    } else {
      renderedHtml = '';
    }
  }
</script>

<div class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
  {#await renderedHtml}
    <p>正在渲染内容...</p>
  {:then html}
    {@html html}
  {:catch error}
    <p class="text-red-500">内容渲染失败: {error.message}</p>
  {/await}
</div>