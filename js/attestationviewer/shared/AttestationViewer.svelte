<script lang="ts">
	import { onMount } from "svelte";
	import type { Gradio } from "@gradio/utils";
	import type { LoadingStatus } from "@gradio/statustracker";
	import { Loader } from "@gradio/statustracker";
	import { BlockTitle } from "@gradio/atoms";
	import { BaseTextbox as TextBox } from "@gradio/textbox";
	import { BaseButton as Button } from "@gradio/button";
	import { BaseLabel as Label } from "@gradio/label";
	import Column from "@gradio/column";
	import Row from "@gradio/row";
	import { jwtDecode } from "jwt-decode";

	export let gradio: Gradio<{
		warning: string;
		clear_status: LoadingStatus;
	}>;

	export let label: string;
	export let info: string | undefined = undefined;
	export let show_label = true;

	let loading = true;
	let target: HTMLDivElement;
	const expected_label = {label: "Expected Runtime Measurement"};
	const service_label = {label: "Service Runtime Measurement"};
	const tdx_measurements = [
		"tdx_mrseam", "tdx_mrtd", "tdx_report_data", "tdx_rtmr0",
		"tdx_rtmr1", "tdx_rtmr2", "tdx_rtmr3", "tdx_seamsvn",
		"tdx_td_attributes", "tdx_tee_tcb_svn"
	];

	let service_data = {};
	let expected_data = {};

	onMount(() => {
		document.addEventListener("attestation", handle_attestation);
	});

	async function ita_attestation(quote: string) {
        // TODO: add attestation service url and api-key/token
		const attestation_service = "";
		const x_api_key = "";
		let retry = 4;
		let response;
		do {
			response = await fetch(attestation_service, {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"X-Api-Key": x_api_key,
				},
				body: JSON.stringify({"quote": quote})
			})
			.catch((e) => {
				console.log(e);
			});
			retry--;
		} while(retry > 0 && response.status !== 200)

		if (response.status === 200) {
			let output = await response.json();
			return output || false;
		}
		return false;
	}

	async function handle_attestation(event) {
		const {data, attestation} = event.detail;
		console.log(attestation);
		if (attestation.type === "TDX") {
			let token = (await ita_attestation(attestation.report)).token;
			if (token !== false) {
				service_data = jwtDecode(token);
				console.log(service_data);
				if (Object.keys(service_data).length) {
					loading = false;
				}
			}
			/** Here is a token for testing
			let token = "eyJhbGciOiJQUzM4NCIsImprdSI6Imh0dHBzOi8vYW1iZXItZGV2MDEtdXNlcjgucHJvamVjdC1hbWJlci1zbWFzLmNvbS9jZXJ0cyIsImtpZCI6ImVlMWM5ZTYwOWVmZGNjOTViNTU2ZTc4YTI1OWRjNDRiODViNzhjMTVlYWY5ZWM0N2M5Yjg2ODg3YmNkNGViMWNjNmY0MGZlMTg1OWY2YzMyMmRmYWIyMWI4YTExNmRlMCIsInR5cCI6IkpXVCJ9.eyJhdHRlc3Rlcl90Y2JfZGF0ZSI6IjIwMjMtMDgtMDlUMDA6MDA6MDBaIiwiYXR0ZXN0ZXJfdGNiX3N0YXR1cyI6IlVwVG9EYXRlIiwiYXR0ZXN0ZXJfdHlwZSI6IlREWCIsImRiZ3N0YXQiOiJkaXNhYmxlZCIsImVhdF9wcm9maWxlIjoiaHR0cHM6Ly9hbWJlci1kZXYwMS11c2VyOC5wcm9qZWN0LWFtYmVyLXNtYXMuY29tL2VhdF9wcm9maWxlLmh0bWwiLCJpbnR1c2UiOiJnZW5lcmljIiwicG9saWN5X2RlZmluZWRfY2xhaW1zIjpudWxsLCJwb2xpY3lfaWRzX21hdGNoZWQiOm51bGwsInBvbGljeV9pZHNfdW5tYXRjaGVkIjpudWxsLCJ0ZHhfY29sbGF0ZXJhbCI6eyJxZWlkY2VydGhhc2giOiJiMmNhNzFiOGU4NDlkNWU3OTk0NTFiNGJmZTQzMTU5YTBlZTU0ODAzMmNlY2IyYzBlNDc5YmY2ZWUzZjM5ZmQxIiwicWVpZGNybGhhc2giOiJmNDU0ZGMxYjliZDRjZTM2YzA0MjQxZTJjOGMzN2EyYWUyNmIwNzdmMmM2NmI5MTk4NDMzNjUzMThhNTkzMzJjIiwicWVpZGhhc2giOiI3YWNhZDgzNzY5MmNjY2NlYzBiZTczNmQwY2RlNmFhYjQ2NWQ2ODU2Y2MxZmQyYzIzN2ZmMDM5MzZkNzU2NjY0IiwicXVvdGVoYXNoIjoiYmZjZjg3NjEwMWY3MTAxODdmNzZhNDg1MTExMTdmNjZjYTkwNzQ5MWQzMTRlZmM0MzBkMWE5YWNhYWEyNzVjMyIsInRjYmluZm9jZXJ0aGFzaCI6ImIyY2E3MWI4ZTg0OWQ1ZTc5OTQ1MWI0YmZlNDMxNTlhMGVlNTQ4MDMyY2VjYjJjMGU0NzliZjZlZTNmMzlmZDEiLCJ0Y2JpbmZvY3JsaGFzaCI6ImY0NTRkYzFiOWJkNGNlMzZjMDQyNDFlMmM4YzM3YTJhZTI2YjA3N2YyYzY2YjkxOTg0MzM2NTMxOGE1OTMzMmMiLCJ0Y2JpbmZvaGFzaCI6IjdjZTg4Y2NiNDVlODc1ZjRhZjUyNzk3YmY5YzFhNTkwNWUyYzc2MTU0YzkxYmIxM2NiMTk4Y2M5Njk2OGIzZGMifSwidGR4X2lzX2RlYnVnZ2FibGUiOmZhbHNlLCJ0ZHhfbXJjb25maWdpZCI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsInRkeF9tcm93bmVyIjoiMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwidGR4X21yb3duZXJjb25maWciOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJ0ZHhfbXJzZWFtIjoiNWIzOGUzM2E2NDg3OTU4YjcyYzNjMTJhOTM4ZWFhNWUzZmQ0NTEwYzUxYWVlYWI1OGM3ZDVlY2VlNDFkN2M0MzY0ODlkNmM4ZTRmOTJmMTYwYjdjYWQzNDIwN2IwMGMxIiwidGR4X21yc2lnbmVyc2VhbSI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsInRkeF9tcnRkIjoiZmZmMTRkMDBjODc0NjgwZDM2MmY0ZWM5MmRlZWZkNzJiNzkwZjRlNWMzYTUzMjE5MGVkZjMyMWZmOGI0MzI4NWFhOTRjZWJkZjM1MGY5YThhNjU4Y2NjMjRhNTYwOTU3IiwidGR4X3JlcG9ydF9kYXRhIjoiZDg5ZDhlN2VmNDkwNjYyYzA1Mjc0ZjY4YjQzZjRmYTZkNWU1NmFjODYwNTVmYzI5YmYyODUxNDk1NmUwOTg2YTUyOTJiMjFmYzE0ZjM4MDE1NWE1NmZiNjgwMjJjYzQzMzZhNTkxZjk0MjU5ZmI1NjFkMzcxNjNjNjQ0YmIwZTUiLCJ0ZHhfcnRtcjAiOiIyYjhiNzYyZjk2YzM2OTFmYjNlZDMxY2E2YjJjMjg3MWJiMzA3MjY2MmE2NzY4YjljNjU0YTc1MjNkZTRiMmFmM2Y0MGFkOWM2YjU3OWY4M2NmZDNkODRmYWJiZDc0MTIiLCJ0ZHhfcnRtcjEiOiIzNzhjNTEyN2I2ODUxZTZlNTI3ZWQxNTcxNjYwYzY1NTJkZTc4NWM3YjkzOWJjODVlMTA5OWEzYTVmN2FiMDIyMzMxZDhjMGMxOWRiOTc2NWVjOWFiOGZmNGNmZjAyN2IiLCJ0ZHhfcnRtcjIiOiI5Mzc0MzdkMDcyOTgwMTAwMTVmNDU5ODM5NWM5ZjhkYzIwMmVmMzZlMGJlMzg5N2JiYTg5ODc0YmY2MTJiNWRhMDkyYmVhZGZlMzdmNzk3MTRhNjAxOTM4MTllMzg0YWQiLCJ0ZHhfcnRtcjMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJ0ZHhfc2VhbV9hdHRyaWJ1dGVzIjoiMDAwMDAwMDAwMDAwMDAwMCIsInRkeF9zZWFtc3ZuIjo2LCJ0ZHhfdGRfYXR0cmlidXRlcyI6IjAwMDAwMDEwMDAwMDAwMDAiLCJ0ZHhfdGRfYXR0cmlidXRlc19kZWJ1ZyI6ZmFsc2UsInRkeF90ZF9hdHRyaWJ1dGVzX2tleV9sb2NrZXIiOmZhbHNlLCJ0ZHhfdGRfYXR0cmlidXRlc19wZXJmbW9uIjpmYWxzZSwidGR4X3RkX2F0dHJpYnV0ZXNfcHJvdGVjdGlvbl9rZXlzIjpmYWxzZSwidGR4X3RkX2F0dHJpYnV0ZXNfc2VwdHZlX2Rpc2FibGUiOnRydWUsInRkeF90ZWVfdGNiX3N2biI6IjA2MDEwMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwidGR4X3hmYW0iOiJlNzAyMDYwMDAwMDAwMDAwIiwidmVyIjoiMS4wLjAiLCJ2ZXJpZmllcl9pbnN0YW5jZV9pZHMiOlsiZjFkN2VjNDctZGUzMi00OGE3LThiMDQtODIzNGFkMWUzMjhkIiwiMTMwNTBjMjAtMzdhZi00ZDBhLWFjMWYtOTFlYjEzZmZlOGNkIiwiMWU1NTIzMzYtMWQwMi00MDlmLWE0NTQtZjQ3NDM2ZDhiOTg4IiwiMzg5YTdhMWQtODZkNC00M2EzLTgzYzQtZmI2MWFkOTQ0ZmRhIiwiOWZkMThhZTQtYzcxMC00MDRlLTk5ZmItMDZiYjhjZTQwMWEwIiwiNGIyMjA3Y2ItMDAwNy00NDI3LWExZjItNTQ0ZGFjZWQ3YmIyIl0sImV4cCI6MTcxOTM2NTE1NCwianRpIjoiYzcwYTU2ZmEtY2YxNS00NzIxLWI2MDYtYzM2YzM2NGZmMWNiIiwiaWF0IjoxNzE5MzY0ODU0LCJpc3MiOiJJbnRlbCBUcnVzdCBBdXRob3JpdHkiLCJuYmYiOjE3MTkzNjQ4NTR9.CBtbTjbo-LSwd0e2lOmRXdxZzUAkWndJtpC7Epy1EEwNgcJN2fr9ChnQotTULaEpBxRr8HyKovZoJ9CU3yiECyWTVhWCrz6tNPtGS6WbbztfvMpMuoMYSQx6gTtR68G6MjoB0W4xGkmVUjz5DBW23iYpbPcCew4rt_ok4I6-15_-JCAmGD5Zn58JwkCRJ1SaMeHB-ouke-MRN9CyVGD1JojBymI8V9tweo_To05wrXp0RDZ2oHkQG3jUlRHIyB0DpoRxGSxCSx-87fEA9qtrk7L2q6MpYBiZcw3EzM_FiroQ5xzf037izfTmdYpjoIZits_YhOJ000p_zCL4fWpac7xCo_Nlcq2Er0X-ViN29JaxuHY805vlN6TnAjfvbSBjmKs-HizX1VhYIfYNWZCULhsV4EEiytCVV-JS7N2NiuTYkIfBG1cleJouYAKbkB2aVKCsRNRiIzFyuifEmtilOSIbcgeAWa9TPvCjynOCPawdOwYp68URyxaQ-7-hUcTS";
			service_data = jwtDecode(token);
			console.log(service_data);
			*/

			if (Object.keys(expected_data).length) {
				tdx_measurements.forEach(measurement => {
					if (expected_data[measurement].length && (expected_data[measurement] !== service_data[measurement])) {
						gradio.dispatch("warning", `Service measurement ${measurement.toUpperCase()} is NOT as expected`);
						console.log("Service measurement is NOT as expected");
						return;
					}
				});
			}
		}
	}

	function handle_trust() {
		if (Object.keys(service_data).length) {
			tdx_measurements.forEach(measurement => {
				expected_data[measurement] = service_data[measurement];
			});
		}
	}
</script>


<div bind:this={target} >
	<BlockTitle {show_label} {info}>{label}</BlockTitle>
	{#if loading}
	<Loader />
	{:else}
	<Row>
		<Column>
			<Label value={service_label} />
			{#if Object.keys(service_data).length}
				{#each tdx_measurements as measurement}
				<div class={(Object.keys(expected_data).length && expected_data[measurement].length && (service_data[measurement] !== expected_data[measurement])) ? "textbox-mismatch" : ""}>
					<TextBox
						lines=1
						max_lines=1
						disabled="true"
						label={measurement.toUpperCase()}
						value={service_data[measurement]}
					/>
				</div>
				{/each}
				<Button on:click={handle_trust}>Trust This Environment</Button>
			{/if}
		</Column>
		<Column>
			<Label value={expected_label} />
			{#if Object.keys(expected_data).length}
				{#each tdx_measurements as measurement}
				<TextBox
					lines=1
					max_lines=1
					label={measurement.toUpperCase()}
					bind:value={expected_data[measurement]}
				/>
				{/each}
			{/if}
		</Column>
	</Row>
	{/if}
</div>

<style>
	.textbox-mismatch :global(label > textarea) {
		background-color: red;
	}
</style>
