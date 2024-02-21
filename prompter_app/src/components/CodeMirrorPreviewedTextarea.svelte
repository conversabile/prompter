<script lang="ts">
  import CodeMirrorTextarea from "./CodeMirrorTextarea.svelte";
	import ComponentList from "./ComponentList.svelte";
	import type { RenderedTemplate } from "$lib/jinja";

  export let content: string | null;
  export let renderedContent: RenderedTemplate;
  export let textareaDefaultStyle: string = "";

</script>


<div class="editorAndRendered">
    <CodeMirrorTextarea bind:value={content} defaultStyle={textareaDefaultStyle} />
    {#if content && (content.trim() != renderedContent.text)}
        <div class="rendered" class:error={renderedContent.error}>
            <ComponentList components={renderedContent.components} />
        </div>
    {/if}
</div>

<style>
/* :global(.reqUrl .CodeMirror) {
  border: 1px solid black;
  border-bottom: 0;
} */

.editorAndRendered .rendered {
  background: var(--color-bg-alphawhite25);
  padding: .5em;
  white-space: pre-wrap;
  font-size: 0.8em;
  border-radius: 0 0 5px 5px;
  /* border: 1px solid; */
  /* border-top: 0; */
}

.editorAndRendered .rendered.error {
  color: white;
  background-color: darkred;
}

:global(.editorAndRendered .rendered .param) {
  color: var(--color-A-text-highlight);
}
</style>