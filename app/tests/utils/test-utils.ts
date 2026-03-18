import { expect } from 'bun:test';

// Custom matchers for testing
export function toHaveClass(element: Element, className: string) {
  const hasClass = element.classList.contains(className);
  return {
    pass: hasClass,
    message: () =>
      `expected element ${hasClass ? 'not ' : ''}to have class "${className}"`,
  };
}

export function toHaveStyle(element: HTMLElement, style: string) {
  const elementStyle = window.getComputedStyle(element);
  const hasStyle = elementStyle.cssText.includes(style);
  return {
    pass: hasStyle,
    message: () =>
      `expected element ${hasStyle ? 'not ' : ''}to have style "${style}"`,
  };
}

// Extend expect with custom matchers
declare module 'bun:test' {
  interface Matchers<T> {
    toHaveClass(className: string): T;
    toHaveStyle(style: string): T;
  }
}

expect.extend({
  toHaveClass,
  toHaveStyle,
});
