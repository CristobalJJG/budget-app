import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    submitted = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm(): void {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    get f() {
        return this.form.controls;
    }

    get isFormValid(): boolean {
        return this.form.valid;
    }

    async onSubmit(): Promise<void> {
        this.submitted = true;
        this.errorMessage = '';

        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        // Deshabilitar los controles del formulario mientras se procesa
        this.form.disable();
        const { email, password } = this.form.value;

        const result = await this.authService.login(email, password);

        if (result.success) {
            this.router.navigate(['/month']);
        } else {
            this.errorMessage = result.error || 'Error al iniciar sesión';
            // Habilitar los controles si hay error
            this.form.enable();
        }

        this.loading = false;
    }

    navigateToRegister(): void {
        this.router.navigate(['/register']);
    }
}
