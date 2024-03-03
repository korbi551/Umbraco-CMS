import { createExtensionApi } from '../functions/create-extension-api.function.js';
import { createExtensionElement } from '../functions/create-extension-element.function.js';
import type { UmbApi } from '../models/api.interface.js';
import type { UmbExtensionRegistry } from '../registry/extension.registry.js';
import type { ManifestElementAndApi, ManifestCondition, ManifestWithDynamicConditions } from '../types/index.js';
import { UmbBaseExtensionInitializer } from './base-extension-initializer.controller.js';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';

/**
 * This Controller manages a single Extension initializing its Element and API.
 * When the extension is permitted to be used, its Element and API will be instantiated and available for the consumer.
 *
 * @example
 * ```ts
 * const controller = new UmbExtensionApiAndElementInitializer(host, extensionRegistry, alias, (permitted, ctrl) => { console.log("Extension is permitted and this is the element: ", ctrl.component) }));
 * ```
 * @export
 * @class UmbExtensionElementAndApiInitializer
 */
export class UmbExtensionElementAndApiInitializer<
	ManifestType extends ManifestWithDynamicConditions = ManifestWithDynamicConditions,
	ControllerType extends UmbExtensionElementAndApiInitializer<ManifestType, any> = any,
	ExtensionInterface extends ManifestElementAndApi = ManifestType extends ManifestElementAndApi ? ManifestType : never,
	ExtensionElementInterface extends HTMLElement | undefined = ExtensionInterface['ELEMENT_TYPE'],
	ExtensionApiInterface extends UmbApi | undefined = ExtensionInterface['API_TYPE'],
> extends UmbBaseExtensionInitializer<ManifestType, ControllerType> {
	#defaultElement?: string;
	#component?: ExtensionElementInterface;
	#api?: ExtensionApiInterface;
	#constructorArguments?: Array<unknown>;

	/**
	 * The component that is created for this extension.
	 * @readonly
	 * @type {(HTMLElement | undefined)}
	 */
	public get component() {
		return this.#component;
	}

	/**
	 * The api that is created for this extension.
	 * @readonly
	 * @type {(class | undefined)}
	 */
	public get api() {
		return this.#api;
	}

	/**
	 * The props that are passed to the component.
	 * @type {Record<string, any>}
	 * @memberof UmbElementExtensionController
	 * @example
	 * ```ts
	 * const controller = new UmbElementExtensionController(host, extensionRegistry, alias, onPermissionChanged);
	 * controller.props = { foo: 'bar' };
	 * ```
	 * Is equivalent to:
	 * ```ts
	 * controller.component.foo = 'bar';
	 * ```
	 */
	#properties?: Record<string, unknown>;
	get properties() {
		return this.#properties;
	}
	set properties(newVal) {
		this.#properties = newVal;
		// TODO: we could optimize this so we only re-set the changed props.
		this.#assignProperties();
	}

	constructor(
		host: UmbControllerHost,
		extensionRegistry: UmbExtensionRegistry<ManifestCondition>,
		alias: string,
		constructorArguments: Array<unknown> | undefined,
		onPermissionChanged: (isPermitted: boolean, controller: ControllerType) => void,
		defaultElement?: string,
	) {
		super(host, extensionRegistry, 'extApiAndElement_', alias, onPermissionChanged);
		this.#constructorArguments = constructorArguments;
		this.#defaultElement = defaultElement;
		this._init();
	}

	#assignProperties = () => {
		if (!this.#component || !this.#properties) return;

		// TODO: we could optimize this so we only re-set the updated props.
		Object.keys(this.#properties).forEach((key) => {
			(this.#component as any)[key] = this.#properties![key];
		});
	};

	protected async _conditionsAreGood() {
		const manifest = this.manifest!; // In this case we are sure its not undefined.

		const promises = await Promise.all([
			createExtensionApi(manifest, this.#constructorArguments),
			createExtensionElement(manifest, this.#defaultElement),
		]);

		const newApi = promises[0] as ExtensionApiInterface;
		const newComponent = promises[1] as ExtensionElementInterface;

		if (!this._isConditionsPositive) {
			newApi?.destroy?.();
			if (newComponent && 'destroy' in newComponent) {
				(newComponent as unknown as { destroy: () => void }).destroy();
			}
			// We are not positive anymore, so we will back out of this creation.
			return false;
		}

		this.#api = newApi;
		if (this.#api) {
			(this.#api as any).manifest = manifest;
		} else {
			console.warn('Manifest did not provide any useful data for a api to be created.');
		}

		this.#component = newComponent;
		if (this.#component) {
			this.#assignProperties();
			(this.#component as any).manifest = manifest;
			if (this.#api) {
				(this.#component as any).api = newApi;
			}
			return true; // we will confirm we have a component and are still good to go.
		} else {
			console.warn('Manifest did not provide any useful data for a web component to be created.');
		}

		return false; // we will reject the state, we have no component, we are not good to be shown.
	}

	protected async _conditionsAreBad() {
		// Destroy the element:
		if (this.#component) {
			if ('destroy' in this.#component) {
				(this.#component as unknown as { destroy: () => void }).destroy();
			}
			this.#component = undefined;
		}
		// Destroy the api:
		if (this.#api) {
			if ('destroy' in this.#api) {
				(this.#api as unknown as { destroy: () => void }).destroy();
			}
			this.#api = undefined;
		}
	}

	public destroy(): void {
		super.destroy();
		this.#constructorArguments = undefined;
		this.#properties = undefined;
	}
}
