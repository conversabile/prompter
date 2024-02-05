<script lang="ts">
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
	import Fa from "svelte-fa";

export let icon: IconDefinition | null = null;
export let label: string | null = null;
export let title: string | null = null;
export let onClick = () => {};
export let size: string = "large";
export let style: string = "A";

</script>

<button 
 on:click={onClick}
 title={title}
 class:medium={size == "medium"}
 class:large={size == "large"}
 class:styleA={style == "A"}
 class:styleB={style == "B"}
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
  background: var(--color-A-bg);
  color: var(--color-A-text-standard);
  border: 1px solid var(--color-A-text-standard);
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

.styleB:hover {
  color: white;
}

button.medium {
    padding: .25em .5em;
}

button.large {
    padding: 1em;
}
</style>