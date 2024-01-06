<script lang="ts">
import { page } from "$app/stores";
import type { PromptChain } from "$lib/prompts";
import { faClone, faSave, faShare } from "@fortawesome/free-solid-svg-icons";
import Fa from "svelte-fa";
	import { Clock } from "svelte-loading-spinners";

// Display parameters and Prediction UI, will be used in PromptChainEditor
export let promptChain: PromptChain;
export let lastSavedPromptChain: PromptChain;
export let isShared: boolean;         // will be populate by the page server module, through PromptChainEditor
export let chainId: string | null;
export let editKey: string | null;

let sharedUrlReadOnly: string = '';
let sharedUrlEditable: string = '';
let isSharedEditable: boolean = false;  // Permalink is editable
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
    lastSavedPromptChain = JSON.parse(JSON.stringify(promptChain));
    let newSharedUrlReadOnly = $page.url.protocol + '//' + $page.url.host + '/p/' + responseJson.chainId;
    let newSharedUrlEditable = newSharedUrlReadOnly + '?editKey=' + responseJson.editKey;

    // isSharing = false;
    // isShared = true;

    window.location.href = newSharedUrlEditable + '&isShared=true';
    // goto(newSharedUrlEditable + '&isShared=true');
    // ^ this messes up the state (+page.server.ts is skipped)
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
        lastSavedPromptChain = JSON.parse(JSON.stringify(promptChain));
        isShared = true;
      }
      isSharing = false;
    });
}

function dismissError() {
    error = "";
}
</script>

<div style="margin-top:1em;">
    {#if isSharing}
      <div style="text-align: center;">
        <p class="isSharing"><Clock size="30" color="#000" unit="px" duration="10s" /></p>
      </div>
    {:else}
  
      <!-- Homepage: unsaved prompt with no id -->
      {#if (! chainId)}
        <div class="singleButtonContainer">
            <button id="shareButton" class="button" title="Generate a permalink for this prompt" on:click={handleShare}><Fa icon={faShare} /> Generate link</button>
        </div>
      {/if}
  
      <!-- Saved prompt with edit key -->
      {#if editKey}
        <button id="updateButton" class="button" title="Save all the edits you made to this prompt" on:click={handleUpdate}><Fa icon={faSave} /> Update</button>
      {/if}
  
      <!-- Saved prompt, either with or without edit key -->
      {#if chainId}
        <button id="shareCopyButton" class="button" title="Save all the edits you made to this prompt as a new permalink" on:click={handleShare}><Fa icon={faClone} /> Clone</button>
      {/if}
  
    {/if}
  </div>
  
  {#if error}
    <div class="error"> <span class="closeIcon" on:click={dismissError} on:keypress={dismissError}>✖</span> [<strong style="color: #c60000;">ERROR</strong>] {error}</div>
  {/if}
  
  {#if sharedUrlReadOnly}
    <div id="sharedUrl">

        <table class="sharedLinksTable">
                <tr>
                    <th class="min">Read-only</th>
                    <td> <span class="sharedLink"><a href="{sharedUrlReadOnly}" target="_blank">{sharedUrlReadOnly}</a></span> </td>
                </tr>
                <tr>
                    <th class="min">Read + Edit</th>
                    <td>
                        {#if editKey}
                            <span class="sharedLink"><a href="{sharedUrlEditable}" target="_blank">{sharedUrlEditable}</a></span>
                        {:else}
                            <p>You don't have edit access to this prompt. Clone it to a new one to make Edits.</p>
                        {/if}
                    </td>
                </tr>
        </table>

    </div>
    <div id="sharedDisclaimer"><p>Please note that Prompter is in early development stage, your work may change format or become unreachable at any time. Use it at your own risk!</p></div>
  {/if}

<style>
.singleButtonContainer {
    padding: 2em 0;
    text-align: center;    
}

.button {
    margin: 0 0 0 1em;
    background-color: var(--color-theme-darkgray);
    color: #DDD;
    border: 0;
}

.button:hover {
    color: white;
}

.sharedLinksTable {
    width: 100%;
}

.sharedLinksTable td, .sharedLinksTable th {
    text-align: left;
}

.sharedLinksTable th {
    width:0.1%;
    white-space: nowrap;
    padding-right: 1em;
}

.sharedLinksTable .sharedLink {
    padding: 0.5em;
    width: calc(100% - 1em);
    background-color: white;
    border: 1px solid;
    display: inline-block;
    font-size: .9em;
}

.sharedLinksTable p {
    padding: 0.5em;
    margin: 0;
    font-style: italic;
}

.isSharing {
  display: inline-block;
  border: 1px transparent var(--color-theme-orange);
  border-radius: 2px;
  vertical-align: middle;
  max-width: 100px;
  padding: 1em;
  margin: 1em;
  text-align: center;
  /* color: var(--color-bg-alphawhite); */
  font-style: oblique;
}

#sharedUrl {
  background: var(--color-bg-alphawhite);
  margin: 1em 1em 0.5em 1em;
  padding: 1em;
  text-align: center;
}

#sharedUrl a {
  color: var(--color-theme-blue);
}

#sharedDisclaimer p {
  font-style: italic;
  font-size: 0.9em;
  /* color: var(--color-bg-alphawhite); */
  margin-top: 0;
  text-align: center;
}

.error {
  color: black;
  border: 1x solid #c60000;
  background: rgba(255, 255, 255, 0.75);
  padding: 0.5em 1em;
  font-family: monospace;
  width: calc(100% - 4em);
  text-align: center;
  margin: 1em;
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