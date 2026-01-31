import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OidcConfig } from './oidc-config';

describe('OidcConfig', () => {
    let component: OidcConfig;
    let fixture: ComponentFixture<OidcConfig>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OidcConfig],
        }).compileComponents();

        fixture = TestBed.createComponent(OidcConfig);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
