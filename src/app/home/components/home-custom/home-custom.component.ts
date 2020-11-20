import { Component, ChangeDetectionStrategy, Input, ViewEncapsulation, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'home-custom',
  templateUrl: './home-custom.component.html',
  styleUrls: ['./home-custom.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeCustomComponent implements OnChanges {
  @Input() html: string;
  content: any;

  constructor(private sanitized: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.content = this.sanitized.bypassSecurityTrustHtml(this.html);
  }
}
