<script lang="ts">
  import { onMount } from "svelte";
  import { Cursor } from "./Cursor";
  onMount(() => {
    new Cursor({
      targets: ["a", ".title", "#header"],
      count: 6,
    });
  });
</script>
