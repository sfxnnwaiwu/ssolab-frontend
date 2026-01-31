import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SamlConfig } from './saml-config';

describe('SamlConfig', () => {
    let component: SamlConfig;
    let fixture: ComponentFixture<SamlConfig>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SamlConfig],
        }).compileComponents();

        fixture = TestBed.createComponent(SamlConfig);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
