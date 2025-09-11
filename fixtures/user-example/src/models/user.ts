import { Address } from "./address";
import { Priority } from "../enums";
import type { UserProfile } from "./profile";
import type { Status } from "../enums";

export interface User {
	id: number;
	name: string;
	active: boolean;
	status: Status;
	priority: Priority;
	profile: UserProfile;
	addresses: Address[];
	metadata: Record<string, string>;
	attributes: Record<string, any>;
	data: Uint8Array;
	optionalData?: Uint8Array;
}
