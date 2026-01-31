import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SamlCallback } from './saml-callback';

describe('SamlCallback', () => {
    let component: SamlCallback;
    let fixture: ComponentFixture<SamlCallback>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SamlCallback],
        }).compileComponents();

        fixture = TestBed.createComponent(SamlCallback);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
