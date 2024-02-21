<script lang="ts">
	import type { ComponentAndProps } from "$lib/jinja";

    export let components: ComponentAndProps[];
</script>

{#each components as [component, props]}
    {#if typeof(component) == "string"}
        {@html component}
    {:else}
        <svelte:component this={component} {...props} />
    {/if}
{/each}
