<script lang="ts">
    import type { Editor } from "codemirror";

    export let value: string | null;
    export let defaultStyle: string = "";

    // From https://github.com/NaokiM03/codemirror-svelte/blob/CodeMirror5/src/Codemirror.svelte
    // TODO: fixes ts(2686) but breaks CodeMirror reference :(
    //   import type {
    //   Editor,
    //   EditorConfiguration,
    //   EditorFromTextArea,
    // } from "codemirror";
    // export let CodeMirror: {
    //   fromTextArea: (
    //     element: HTMLTextAreaElement,
    //     options?: EditorConfiguration
    //   ) => EditorFromTextArea;
    // };
    
    // let cmText: string;
    let cmInitialized = false;
    let cmTextArea: HTMLTextAreaElement;
    export let editor: CodeMirror.EditorFromTextArea | null = null;
    export function initialize() {
        // console.log("init code mirror", prompt.resultKey, value)
        if (cmInitialized) return;
        
        cmTextArea.style.height = "calc( "+ cmTextArea.scrollHeight + "px - 2em)" 
        
        // TODO: fix ts(2686)
        // @ts-ignore
        editor = CodeMirror.fromTextArea(cmTextArea, {
            mode: {name: "jinja2", htmlMode: true}
        });
        editor.on("change", function (eventEditor: Editor) {
            value = eventEditor.getDoc().getValue();
        });
        // editor.setValue(value);
        cmInitialized = true;
    }
    
    // When a new step is added, only the last PromptBox component in the list is rendered from scratch.
    // Svelte reuses existing steps changing their state. This causes the editor content to lose sync with prompt text
    $: if (value && editor && editor.getDoc().getValue() != value) {editor.setValue(value);}

    // Initialize CodeMirror when textarea becomes visible
    // (steps may be minimized by default, CM doesn't init correctly in this case)
    $: if (cmTextArea) {
    //   console.log("configuring observer");
      const resizeObserver = new ResizeObserver((entries) => {
        // offsetParent is null when the element is not displayed
        // e.g. step content is minimized, or textarea is already initialized (CM will hide the original element)
        let offsetParent = (entries[0].target as HTMLTextAreaElement).offsetParent;
        if (offsetParent) initialize();
      });
      resizeObserver.observe(cmTextArea)
    }
</script>

<svelte:head>
<!-- CodeMirror stuff is imported in app.html because PromptBox may be loaded after 
    head is already processed (e.g. svelte internal routing for browser back or link 
    from error/static pages) -->
    <!-- TODO: refactor with proper imports -->
</svelte:head>

<textarea class="codeMirrorTextarea" bind:this={cmTextArea} style={defaultStyle}>{value}</textarea>

<style>

:global(.CodeMirror) {
    z-index: 0;
}

.codeMirrorTextarea {
  overflow: visible;
  font-family: inherit;
}
</style>
