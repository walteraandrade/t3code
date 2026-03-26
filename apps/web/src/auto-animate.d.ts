declare module "@formkit/auto-animate" {
  export interface AutoAnimateOptions {
    duration?: number;
    easing?: string;
  }

  export function autoAnimate(
    parent: Element,
    options?: AutoAnimateOptions,
  ): (enabled?: boolean) => void;
}
