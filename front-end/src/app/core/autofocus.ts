import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

/** Coloca o foco no elemento assim que ele aparece na tela. */
@Directive({ selector: '[appAutofocus]' })
export class Autofocus {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => el.focus());
  }
}
