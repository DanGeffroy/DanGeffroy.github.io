<script lang="ts">
  import { onMount } from "svelte";

  let displayed = $state("");
  let showCursor = $state(true);

  const fullText = "adnnnnj";
  const typeSpeed = 120;
  const deleteSpeed = 80;
  const startDelay = 800;
  const pauseAfterType = 3000;
  const pauseAfterDelete = 500;

  onMount(() => {
    let charIndex = 0;
    let activeInterval: ReturnType<typeof setInterval> | undefined;
    let activeTimeout: ReturnType<typeof setTimeout> | undefined;

    const cursorInterval = setInterval(() => {
      showCursor = !showCursor;
    }, 530);

    function startTyping() {
      charIndex = 0;
      activeInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          displayed = fullText.slice(0, charIndex + 1);
          charIndex++;
        } else {
          clearInterval(activeInterval);
          activeInterval = undefined;
          activeTimeout = setTimeout(startDeleting, pauseAfterType);
        }
      }, typeSpeed);
    }

    function startDeleting() {
      activeInterval = setInterval(() => {
        if (charIndex > 0) {
          charIndex--;
          displayed = fullText.slice(0, charIndex);
        } else {
          clearInterval(activeInterval);
          activeInterval = undefined;
          activeTimeout = setTimeout(startTyping, pauseAfterDelete);
        }
      }, deleteSpeed);
    }

    activeTimeout = setTimeout(startTyping, startDelay);

    return () => {
      clearInterval(cursorInterval);
      if (activeTimeout) clearTimeout(activeTimeout);
      if (activeInterval) clearInterval(activeInterval);
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
