/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ApiError, CancelablePromise, ProblemDetails } from '@umbraco-cms/backend-api';
import { UmbNotificationOptions, UmbNotificationService } from 'src/backoffice/core/services/notification';
import { UmbNotificationDefaultData } from 'src/backoffice/core/services/notification/layouts/default';

import { UmbContextConsumer } from '@umbraco-cms/context-api';

export class UmbResourceController implements ReactiveController {
	host: ReactiveControllerHost;

	#promises: Promise<any>[] = [];

	#notificationConsumer: UmbContextConsumer;

	#notificationService?: UmbNotificationService;

	constructor(host: ReactiveControllerHost) {
		(this.host = host).addController(this);

		this.#notificationConsumer = new UmbContextConsumer(
			host as unknown as EventTarget,
			'umbNotificationService',
			(_instance: UmbNotificationService) => {
				this.#notificationService = _instance;
			}
		);
	}

	hostConnected() {
		this.#promises.length = 0;
		this.#notificationConsumer.attach();
	}

	hostDisconnected() {
		this.cancelAllResources();
		this.#notificationConsumer.detach();
	}

	addResource(promise: Promise<any>): void {
		this.#promises.push(promise);
	}

	/**
	 * Execute a given function and get the result as a promise.
	 */
	execute<T>(func: Promise<T>): Promise<T> {
		this.addResource(func);
		return func;
	}

	/**
	 * Wrap the {execute} function in a try/catch block and return a tuple with the result and the error.
	 */
	async tryExecute<T>(func: Promise<T>): Promise<[T | undefined, ProblemDetails | undefined]> {
		try {
			return [await this.execute(func), undefined];
		} catch (e) {
			return [undefined, this.#toProblemDetails(e)];
		}
	}

	/**
	 * Wrap the {execute} function in a try/catch block and return the result.
	 * If the executor function throws an error, then show the details in a notification.
	 */
	async tryExecuteAndNotify<T>(
		func: Promise<T>,
		options?: UmbNotificationOptions<any>
	): Promise<[T | undefined, ProblemDetails | undefined]> {
		const [result, error] = await this.tryExecute(func);

		if (error) {
			const data: UmbNotificationDefaultData = {
				headline: error.title ?? 'Server Error',
				message: error.detail ?? 'Something went wrong',
			};

			if (this.#notificationService) {
				this.#notificationService?.peek('danger', { data, ...options });
			} else {
				console.group('UmbResourceController');
				console.error(error);
				console.groupEnd();
			}
		}

		return [result, error];
	}

	/**
	 * Cancel all resources that are currently being executed by this controller if they are cancelable.
	 *
	 * This works by checking if the promise is a CancelablePromise and if so, it will call the cancel method.
	 *
	 * This is useful when the controller is being disconnected from the DOM.
	 *
	 * @see CancelablePromise
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController
	 */
	cancelAllResources() {
		this.#promises.forEach((promise) => {
			if (promise instanceof CancelablePromise) {
				promise.cancel();
			}
		});
	}

	/**
	 * Extract the ProblemDetails object from an ApiError.
	 *
	 * This assumes that all ApiErrors contain a ProblemDetails object in their body.
	 */
	#toProblemDetails(error: unknown): ProblemDetails | undefined {
		if (error instanceof ApiError) {
			const errorDetails = error.body as ProblemDetails;
			return errorDetails;
		} else if (error instanceof Error) {
			return {
				title: error.name,
				detail: error.message,
			};
		}

		return undefined;
	}
}
