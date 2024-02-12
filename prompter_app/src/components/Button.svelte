<script lang="ts">
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
	import Fa from "svelte-fa";

export let icon: IconDefinition | null = null;
export let label: string | null = null;
export let title: string | null = null;
export let onClick = () => {};
export let size: string = "large";
export let style: string = "A";
export let highlight: boolean = false;
export let rounded: boolean = false;

</script>

<button 
 on:click={onClick}
 title={title}
 class:medium={size == "medium"}
 class:large={size == "large"}
 class:styleA={style == "A"}
 class:styleB={style == "B"}
 class:styleBase={style == "base"}
 class:highlight
 class:rounded
>
    {#if icon}
        <Fa icon={icon} />
    {/if}
    {#if label}
        {label}
    {/if}
</button>

<style>
button {
  border: 1px solid;
  /* padding: .25em; */
  cursor: pointer;
}

.styleA {
  background: var(--color-A-bg);
  color: var(--color-A-text-standard);
}

.styleA:hover {
  color: black;
}

.styleB {
  background: var(--color-B-bg);
  color: var(--color-B-text-standard);
}

.styleBase {
  background: var(--color-base-bg);
  color: var(--color-base-text);
}

.styleBase.highlight {
  background: var(--color-base-text);
  color: var(--color-base-bg);
  border: 1px solid var(--color-base-text);
}

.styleB:hover {
  color: white;
}

.rounded {
  border-radius: 5px;
}

button.medium {
    padding: .25em .5em;
}

button.large {
    padding: 1em;
}
</style>