<script lang="ts">
  const messageLoader = document.getElementById("message-loader");
  let messageDiv: any;
  $: if (messageLoader && messageDiv) {
    setTimeout(() => {
      messageLoader.style.display = "none";
      messageDiv.style.display = "block";
    }, 2000);
  }
</script>

<div bind:this={messageDiv} class="hidden" id="messageDiv">Hey! 👋</div>
