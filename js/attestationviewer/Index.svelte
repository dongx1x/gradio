<svelte:options accessors={true} />

<script lang="ts">
	import type { Gradio } from "@gradio/utils";
	import AttestationViewer from "./shared/AttestationViewer.svelte";
	import { Block } from "@gradio/atoms";
	import { StatusTracker } from "@gradio/statustracker";
	import type { LoadingStatus } from "@gradio/statustracker";

	export let gradio: Gradio<{
		warning: string;
		clear_status: LoadingStatus;
	}>;

	export let elem_id = "";
	export let elem_classes: string[] = [];
	export let visible = true;
	export let scale: number | null = null;
	export let min_width: number | undefined = undefined;
	export let loading_status: LoadingStatus;
	export let label = "AttestationViewer";
	export let info: string | undefined = undefined;
	export let show_label: boolean;
	export let container = true;
</script>

<Block
	{visible}
	{elem_id}
	{elem_classes}
	{scale}
	{min_width}
	allow_overflow={false}
	padding={container}
>
	{#if loading_status}
		<StatusTracker
			autoscroll={gradio.autoscroll}
			i18n={gradio.i18n}
			{...loading_status}
			on:clear_status={() => gradio.dispatch("clear_status", loading_status)}
		/>
	{/if}

	<AttestationViewer
		{label}
		{info}
		{show_label}
		{gradio}
	/>
</Block>
