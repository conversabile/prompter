<script lang="ts">
	import { page } from '$app/stores';
	import { faDesktop, faServer, faTowerBroadcast, faWarning } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import RestProxySettings from '../userSettings/RestProxySettings.svelte';

    export let proxiedRequest: boolean;
</script>

<!-- <h2>{STEP_TYPE_DATA[StepType.rest].label} configuration</h2> -->

<h2>Request Configuration</h2>
<table>
    <tr>
        <th>Request type</th>
        <td>
            <label><input type="radio" name="proxiedRequest" value={false} bind:group={proxiedRequest}> Direct</label>
            <label><input type="radio" name="proxiedRequest" value={true} bind:group={proxiedRequest}> Proxied</label>
        </td>
    </tr>
</table>

<div class="requestTypeExplanation">
    {#if proxiedRequest}
        <div class="diagram">
            <span class="icon"><Fa icon={faDesktop} /> <span class="label">Your device</span></span>
            <span class="arrow">-----&gt;</span>
            <span class="icon"><Fa icon={faTowerBroadcast} /> <span class="label">Proxy service</span></span>
            <span class="arrow">-----&gt;</span>
            <span class="icon"><Fa icon={faServer} /> <span class="label">Remote server</span></span>
        </div>
        <p class="explanation">Your request will be sent to an intermediate service, which will make the request for you in order to bypass <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" target="_blank">CORS restrictions</a>.</p>
        <p class="explanation warning"><Fa icon={faWarning} /> It is advisable NOT to send sensitive information through a proxy, as they may be recorded.</p>
    {:else}
        <div class="diagram">
            <span class="icon"><Fa icon={faDesktop} /> <span class="label">Your device</span></span>
            <span class="arrow">-----&gt;</span>
            <span class="icon"><Fa icon={faServer} /> <span class="label">Remote server</span></span>
            <p class="explanation">Your request will be sent directly from your browser to the REST endpoint.</p>
            <p class="explanation warning"><Fa icon={faWarning} /> Your request may fail, as browsers block communication with external resources that don't allow CORS (<a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" target="_blank">learn more</a>).</p>
            <p class="explanation warning">You can either 1) If you control the REST endpoint, allow <em>{$page.url.protocol + '//' + $page.url.hostname} as an origin. 2) Change this step configuration to "Proxied".</em></p>
    </div>
    {/if}
</div>

{#if proxiedRequest}
    <h2>User Configuration</h2>
    <RestProxySettings />
{/if}


<style>
.requestTypeExplanation .diagram {
    text-align: center;
    padding: 1em 0;
}

.requestTypeExplanation .icon {
    display: inline-flex;
    flex-direction: column;
}

.requestTypeExplanation .label {
    font-size: .8em;
    padding-top:.5em;
}

.requestTypeExplanation .arrow {
    font-family: monospace;
}

.explanation {
    text-align: center;
    font-size: .8em;
}

.warning {
    color:orange;
}

.explanation a {
    color: inherit;
    text-decoration: underline;
}
</style>
