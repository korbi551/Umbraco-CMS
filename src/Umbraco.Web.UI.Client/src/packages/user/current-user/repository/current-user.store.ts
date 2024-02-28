import type { UmbCurrentUserModel } from '../types.js';
import type { UmbUserDetailModel } from '@umbraco-cms/backoffice/user';
import { UMB_USER_DETAIL_STORE_CONTEXT } from '@umbraco-cms/backoffice/user';
import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import type { UmbControllerHostElement } from '@umbraco-cms/backoffice/controller-api';
import { UmbObjectState } from '@umbraco-cms/backoffice/observable-api';

export class UmbCurrentUserStore extends UmbContextBase<UmbCurrentUserStore> {
	#data = new UmbObjectState<UmbCurrentUserModel | undefined>(undefined);
	readonly data = this.#data.asObservable();

	constructor(host: UmbControllerHostElement) {
		super(host, UMB_CURRENT_USER_STORE_CONTEXT.toString());

		this.consumeContext(UMB_USER_DETAIL_STORE_CONTEXT, (instance) => {
			this.observe(instance?.all(), (users) => this.#onUserDetailStoreUpdate(users));
		});
	}

	/**
	 * Get the current user
	 * @readonly
	 * @type {UmbCurrentUserModel}
	 * @memberof UmbCurrentUserStore
	 */
	get() {
		return this.#data.getValue();
	}

	/**
	 * Set the current user
	 * @param {UmbCurrentUserModel} data
	 * @memberof UmbCurrentUserStore
	 */
	set(data: UmbCurrentUserModel) {
		this.#data.setValue(data);
	}

	/**
	 * Update the current user
	 * @param {Partial<UmbCurrentUserModel>} data
	 * @memberof UmbCurrentUserStore
	 */
	update(data: Partial<UmbCurrentUserModel>) {
		this.#data.update(data);
	}

	/**
	 * Clear the current user
	 * @memberof UmbCurrentUserStore
	 */
	clear() {
		this.#data.setValue(undefined);
	}

	#onUserDetailStoreUpdate = (users: Array<UmbUserDetailModel>) => {
		const currentUser = this.get();
		if (!currentUser) return;

		const updatedCurrentUser = users.find((user) => user.unique === currentUser.unique);
		if (!updatedCurrentUser) return;

		const mappedCurrentUser: Partial<UmbCurrentUserModel> = {
			email: updatedCurrentUser.email,
			userName: updatedCurrentUser.userName,
			name: updatedCurrentUser.name,
			languageIsoCode: updatedCurrentUser.languageIsoCode || '', // TODO: default value?
			documentStartNodeUniques: updatedCurrentUser.documentStartNodeUniques,
			mediaStartNodeUniques: updatedCurrentUser.mediaStartNodeUniques,
			avatarUrls: updatedCurrentUser.avatarUrls,
		};

		this.update(mappedCurrentUser);
	};
}

export const UMB_CURRENT_USER_STORE_CONTEXT = new UmbContextToken<UmbCurrentUserStore>('UmbCurrentUserStore');
