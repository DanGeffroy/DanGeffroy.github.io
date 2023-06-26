<script lang="ts">
  import { onMount } from "svelte";
  import { Cursor } from "./Cursor";
  onMount(() => {
    if (
      !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      new Cursor({
        targets: ["a", ".title", "#header"],
        count: 6,
      });
    }
  });
</script>
