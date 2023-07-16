<script lang="ts">
	import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { promptSchemaVersion, type Prompt, type PromptChain, saveChain } from '$lib/prompts';
  import PromptBox from './PromptBox.svelte';

  export let chainId: string | null = null;
  export let editKey: string | null = null;
  export let chainTitle: string = "Untitled Prompt";
  export let promptChain: PromptChain = {
    version: promptSchemaVersion,
    title: chainTitle,
    prompts: [{
      version: promptSchemaVersion,
      prompt_text: "Tell me a story about {{ storyTopic }}, make it sound like you're very excited about {{ storyTopic | title }}!\n\n{% if anotherTopic %}\nAnd another one about {{ anotherTopic | upper }}!!!\n{% endif %}",
      parameters_dict: {storyTopic: "time travelling"},
      title:  chainTitle
    }]
  }
  export let isShared: boolean = false;   // Show box with permalink
  let isSharedEditable: boolean = false;  // Permalink is editable


  // Share
  let sharedUrlReadOnly: string = '';
  let sharedUrlEditable: string = '';
  let isSharing: boolean = false;
  let error: string = "";

  if (chainId) sharedUrlReadOnly = $page.url.protocol + '//' + $page.url.host + '/p/' + chainId;
  if (editKey) sharedUrlEditable = sharedUrlReadOnly + '?editKey=' + editKey;
  let sharedUrlUser = sharedUrlReadOnly;
  $: sharedUrlUser = isSharedEditable ? sharedUrlEditable : sharedUrlReadOnly;

  async function handleShare() {
    isSharing = true;
    error = "";
    const res = await fetch(`/api/chain`, {
			method: 'POST',
			body: JSON.stringify(promptChain)
		});

		const responseJson = await res.json()
    console.log("Saved prompt chain with id: " + responseJson.chainId);
    chainId = responseJson.chainId;
    editKey = responseJson.editKey;
    sharedUrlReadOnly = $page.url.protocol + '//' + $page.url.host + '/p/' + responseJson.chainId;
    sharedUrlEditable = sharedUrlReadOnly + '?editKey=' + responseJson.editKey;

    isSharing = false;
    isShared = true;

    goto(sharedUrlEditable + '&isShared=true');
  }

  async function handleUpdate() {
    isSharing = true;
    error = "";
    const res = await fetch(`/api/chain/${chainId}?editKey=${editKey}`, {
			method: 'POST',
			body: JSON.stringify(promptChain)
		})
    .then(async function(response) {
      if (!response.ok){
        console.error("Failed updating prompt chain: ", response);
        let responseText = await response.text();
        error = response.status + " " + response.statusText + ": " + responseText;
      } else {
        console.log(`Updated prompt chain with id: ${chainId}`);
        // let responseJson = await response.json();
        isShared = true;
      }
      isSharing = false;
    });
  }

  function dismissError() {
    error = "";
  }
</script>

<PromptBox
    bind:promptTitle = {promptChain.prompts[0].title}
    bind:promptText = {promptChain.prompts[0].prompt_text}
    bind:paramDict = {promptChain.prompts[0].parameters_dict}
/>

<div>
  {#if isSharing}
    <p class="isSharing">saving...</p>
  {:else}

    <!-- Homepage: unsaved prompt with no id -->
    {#if (! chainId)}
      <button id="shareButton" class="button" title="Generate a permalink for this prompt" on:click={handleShare}>Share</button>
    {/if}

    <!-- Saved prompt with edit key -->
    {#if editKey}
      <button id="updateButton" class="button" title="Save all the edits you made to this prompt" on:click={handleUpdate}>Update</button>
    {/if}

    <!-- Saved prompt, either with or without edit key -->
    {#if chainId}
      <button id="shareCopyButton" class="button" title="Save all the edits you made to this prompt as a new permalink" on:click={handleShare}>Share Copy</button>
    {/if}
  {/if}

</div>

{#if error}
  <div class="error"> <span class="closeIcon" on:click={dismissError} on:keypress={dismissError}>✖</span> [<strong style="color: #c60000;">ERROR</strong>] {error}</div>
{/if}

{#if isShared}
  <div id="sharedUrl">
    <a href="{sharedUrlUser}">{sharedUrlUser}</a>
    {#if editKey}
      <span class="shareEditableContainer">
        <input type="checkbox" name="shareEditable" id="shareEditable" bind:checked={isSharedEditable}><label for="shareEditable">Editable Link</label>
      </span>
    {/if}
  </div>
  <div id="sharedDisclaimer"><p>Please note that Prompter is in early development stage, your work may change format or become unreachable at any time. Use it at your own risk!</p></div>
{/if}

<style>
.button {
    display:inline-block;
    /* color:var(--color-theme-2); */
    border:1px solid var(--color-theme-1);
    border-radius: 2px;
    background:var(--color-theme-1);
    cursor:pointer;
    vertical-align:middle;
    /* max-width: 100px; */
    padding: 1em;
    margin: 1em;
    text-align: center;
}

.button:hover {
    border:1px solid var(--color-bg-alphawhite);
    /* background-color:white;
    color: var(--color-theme-1); */
    color: white;
}

.shareEditableContainer {
  display: block;
  margin-top: 0.5em;
}

.shareEditableContainer label {
  line-height: 1em;
  display: inline-block;
  vertical-align: middle;
}

.isSharing {
  display: inline-block;
  border: 1px transparent var(--color-theme-1);
  border-radius: 2px;
  vertical-align: middle;
  max-width: 100px;
  padding: 1em;
  margin: 1em;
  text-align: center;
  color: var(--color-bg-alphawhite);
  font-style: oblique;
}

#sharedUrl {
  background: white;
  margin: 1em 1em 0.5em 1em;
  padding: 1em;
  text-align: center;
}

#sharedUrl a {
  color: var(--color-theme-2);
}

#sharedDisclaimer p {
  font-style: italic;
  font-size: 0.9em;
  color: var(--color-bg-alphawhite);
  margin-top: 0;
}

.error {
  color: black;
  border: 1x solid #c60000;
  background: rgba(255, 255, 255, 0.75);
  padding: 0.5em;
  font-family: monospace;
  width: 100%;
  text-align: center;
}

.closeIcon {
  background: #c60000;
  color: white;
  padding: 0.1em 0.4em;
  border-radius: 1em;
  margin-left: 0.5em;
  font-size: 1em;
  cursor: pointer;
}
</style>