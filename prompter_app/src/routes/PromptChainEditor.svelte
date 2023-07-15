<script lang="ts">
  import { page } from '$app/stores';
  import { promptSchemaVersion, type Prompt, type PromptChain, saveChain } from '$lib/prompts';
  import PromptBox from './PromptBox.svelte';

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

  // Share
  let sharedUrl: string;
  let isSharing: boolean = false;
  let isShared: boolean = false;

  async function handleShare() {
    isSharing = true;
    const res = await fetch(`/api/chain`, {
			method: 'POST',
			body: JSON.stringify(promptChain)
		});

		const responseJson = await res.json()
    console.log("Saved prompt with id: " + responseJson.chainId);
    sharedUrl = $page.url.protocol + '//' + $page.url.host + '/p/' + responseJson.chainId
    
    isSharing = false;
    isShared = true;
  }
</script>

<PromptBox
    bind:promptTitle = {promptChain.prompts[0].title}
    bind:promptText = {promptChain.prompts[0].prompt_text}
    bind:paramDict = {promptChain.prompts[0].parameters_dict}
/>

{#if isShared}
  <div id="sharedUrl"><a href="{sharedUrl}">{sharedUrl}</a></div>
  <div id="sharedDisclaimer"><p>Please note that Prompter is in early development stage, your work may become altered or unreachable at any time. Use it at your own risk!</p></div>
{:else if isSharing}
  <button id="shareButton" class="button">saving...</button>
{:else}
  <button id="shareButton" class="button" on:click={handleShare}>Share</button>
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
    max-width: 100px;
    padding: 1em;
    margin: 1em;
    text-align: center;
}
.button:hover {
    border:1px solid var(--color-theme-1);
    /* background-color:white;
    color: var(--color-theme-1); */
    color: var(--color-bg-alphawhite);
}

#sharedUrl {
  background: white;
  margin: 1em;
  padding: 1em;
}

#sharedUrl a {
  color: var(--color-theme-2);
}

#sharedDisclaimer p {
  font-style: italic;
  font-size: 0.9em;
  color: var(--color-bg-alphawhite);
}
</style>