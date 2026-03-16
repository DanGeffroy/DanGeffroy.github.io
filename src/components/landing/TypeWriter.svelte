<script lang="ts">
  import { onMount } from "svelte";

  let displayed = $state("");
  let showCursor = $state(true);

  const fullText = "adnnnnj";
  const typeSpeed = 120;
  const startDelay = 800;

  onMount(() => {
    let i = 0;
    const cursorInterval = setInterval(() => {
      showCursor = !showCursor;
    }, 530);

    setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (i < fullText.length) {
          displayed = fullText.slice(0, i + 1);
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, typeSpeed);
    }, startDelay);

    return () => clearInterval(cursorInterval);
  });
</script>

<span class="typewriter">
  {displayed}<span class="cursor" class:visible={showCursor} class:invisible={!showCursor}>|</span>
</span>

<style>
  .typewriter {
    display: inline;
  }
  .cursor {
    font-weight: 300;
    color: #a78bfa;
    animation: none;
  }
  .visible {
    opacity: 1;
  }
  .invisible {
    opacity: 0;
  }
</style>
