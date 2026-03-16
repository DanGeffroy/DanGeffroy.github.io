<script lang="ts">
  import { onMount } from "svelte";

  let displayed = $state("");
  let showCursor = $state(true);

  const fullText = "adnnnnj";
  const typeSpeed = 120;
  const startDelay = 800;

  onMount(() => {
    let charIndex = 0;
    let typeInterval: ReturnType<typeof setInterval> | undefined;

    const cursorInterval = setInterval(() => {
      showCursor = !showCursor;
    }, 530);

    const startTimeout = setTimeout(() => {
      typeInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          displayed = fullText.slice(0, charIndex + 1);
          charIndex++;
        } else {
          clearInterval(typeInterval);
          typeInterval = undefined;
        }
      }, typeSpeed);
    }, startDelay);

    return () => {
      clearInterval(cursorInterval);
      clearTimeout(startTimeout);
      if (typeInterval) clearInterval(typeInterval);
    };
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
