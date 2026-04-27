<script lang="ts">
    import { onMount } from "svelte";
    import IconCobalt from "$components/icons/Cobalt.svelte";
    import { getCustomLogoPath } from "$lib/runtime-config";

    let customLogoPath: string | null = null;

    onMount(() => {
        customLogoPath = getCustomLogoPath();
    });
</script>

<div id="cobalt-logo">
    {#if customLogoPath}
        <img src={customLogoPath} alt="custom logo" />
    {:else}
        <IconCobalt />
    {/if}
</div>

<style>
    #cobalt-logo {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: calc(var(--sidebar-tab-padding) * 2);

        /* accommodate space for scaling animation */
        padding-bottom: calc(var(--sidebar-tab-padding) * 2 - var(--sidebar-inner-padding));
    }

    #cobalt-logo :global(path) {
        fill: var(--sidebar-highlight);
    }

    #cobalt-logo :global(svg),
    #cobalt-logo img {
        width: 100%;
        max-width: 48px;
        max-height: 48px;
        object-fit: contain;
    }

    @media screen and (max-width: 535px) {
        #cobalt-logo {
            display: none;
        }
    }
</style>
