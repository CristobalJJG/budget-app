import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    submitted = false;
    errorMessage = '';
    successMessage = '';

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
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, {
            validators: this.passwordMatchValidator
        });
    }

    passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
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
        this.successMessage = '';

        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        // Deshabilitar los controles del formulario mientras se procesa
        this.form.disable();
        const { username, email, password } = this.form.value;

        const result = await this.authService.register(username, email, password);

        if (result.success) {
            this.successMessage = 'Cuenta creada exitosamente. Redirigiendo...';
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 2000);
        } else {
            this.errorMessage = result.error || 'Error al crear la cuenta.';
            // Habilitar los controles si hay error
            this.form.enable();
        }

        this.loading = false;
    }

    navigateToLogin(): void {
        this.router.navigate(['/login']);
    }
}
