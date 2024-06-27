import { BROKEN_CONNECTION_MSG } from "../constants";
import type { Attestation, PostResponse } from "../types";
import { Client } from "..";

export async function post_data(
	this: Client,
	url: string,
	body: unknown,
	additional_headers?: any
): Promise<[PostResponse, number, Attestation]> {
	let attestation: Attestation = {
		type: null,
		report: null
	};
	const headers: {
		Authorization?: string;
		"Content-Type": "application/json";
	} = { "Content-Type": "application/json" };
	if (this.options.hf_token) {
		headers.Authorization = `Bearer ${this.options.hf_token}`;
	}
	try {
		var response = await this.fetch(url, {
			method: "POST",
			body: JSON.stringify(body),
			headers: { ...headers, ...additional_headers },
			credentials: "include"
		});
	} catch (e) {
		return [{ error: BROKEN_CONNECTION_MSG }, 500, attestation];
	}
	let output: PostResponse;
	let status: number;
	try {
		output = await response.json();
		status = response.status;
		if (response.headers.has("X-Attestation-Type") &&
			response.headers.has("X-Attestation-Report")) {
			attestation = {
				type: response.headers.get("X-Attestation-Type"),
				report: response.headers.get("X-Attestation-Report")
			};
		}
	} catch (e) {
		output = { error: `Could not parse server response: ${e}` };
		status = 500;
	}
	return [output, status, attestation];
}
