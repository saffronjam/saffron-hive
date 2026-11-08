<script lang="ts">
  import logo from "./dreame.svg";

  let { class: className = "size-6" }: { class?: string } = $props();
</script>

<img src={logo} alt="Dreame" class={className} />
