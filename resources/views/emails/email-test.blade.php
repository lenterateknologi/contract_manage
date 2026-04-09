<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Email Testing - {{ config('app.name') }}</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-2xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center mb-4">
                    <div class="bg-blue-500 text-white p-3 rounded-full mr-4">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Email Configuration Test</h1>
                        <p class="text-gray-600">Test your SMTP email configuration</p>
                    </div>
                </div>

                <!-- Environment Warning -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-yellow-800">Development Environment Only</h3>
                            <div class="mt-2 text-sm text-yellow-700">
                                <p>This email testing page is only available in non-production environments.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Email Test Form -->
            <div class="bg-white rounded-lg shadow-md p-6" x-data="emailTest()">
                <form @submit.prevent="sendEmail">
                    <div class="space-y-6">
                        <!-- Email Field -->
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                                Recipient Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                x-model="form.email"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="test@example.com"
                                required
                            >
                            <p x-show="errors.email" x-text="errors.email" class="mt-1 text-sm text-red-600"></p>
                        </div>

                        <!-- Subject Field -->
                        <div>
                            <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                                Subject
                            </label>
                            <input
                                type="text"
                                id="subject"
                                x-model="form.subject"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Test Email Subject"
                                required
                            >
                            <p x-show="errors.subject" x-text="errors.subject" class="mt-1 text-sm text-red-600"></p>
                        </div>

                        <!-- Message Field -->
                        <div>
                            <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                                Message
                            </label>
                            <textarea
                                id="message"
                                x-model="form.message"
                                rows="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your test message here..."
                                required
                            ></textarea>
                            <p x-show="errors.message" x-text="errors.message" class="mt-1 text-sm text-red-600"></p>
                        </div>

                        <!-- Submit Button -->
                        <div>
                            <button
                                type="submit"
                                :disabled="loading"
                                class="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg x-show="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span x-text="loading ? 'Sending...' : 'Send Test Email'"></span>
                            </button>
                        </div>
                    </div>
                </form>

                <!-- Success Message -->
                <div x-show="success" x-transition class="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-green-800">Email Sent Successfully!</h3>
                            <div class="mt-2 text-sm text-green-700">
                                <p>Check the recipient's inbox to verify the email was delivered.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Error Message -->
                <div x-show="error" x-transition class="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Failed to Send Email</h3>
                            <div class="mt-2 text-sm text-red-700">
                                <p x-text="errorMessage"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Configuration Info -->
            <div class="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Current Email Configuration</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="font-medium text-gray-700">Mailer:</span>
                        <code class="ml-2 bg-gray-100 px-2 py-1 rounded">{{ config('mail.default') }}</code>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">Host:</span>
                        <code class="ml-2 bg-gray-100 px-2 py-1 rounded">{{ config('mail.mailers.smtp.host') }}</code>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">Port:</span>
                        <code class="ml-2 bg-gray-100 px-2 py-1 rounded">{{ config('mail.mailers.smtp.port') }}</code>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">Encryption:</span>
                        <code class="ml-2 bg-gray-100 px-2 py-1 rounded">{{ config('mail.mailers.smtp.encryption') ?: 'none' }}</code>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">From Address:</span>
                        <code class="ml-2 bg-gray-100 px-2 py-1 rounded">{{ config('mail.from.address') }}</code>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">From Name:</span>
                        <code class="ml-2 bg-gray-100 px-2 py-1 rounded">{{ config('mail.from.name') }}</code>
                    </div>
                </div>

                <div class="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 class="text-sm font-medium text-blue-900 mb-2">Setup Instructions for Gmail:</h3>
                    <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Enable 2-Factor Authentication on your Google account</li>
                        <li>Generate an App Password from Google Account settings</li>
                        <li>Update your .env file with your Gmail address and app password</li>
                        <li>Test the configuration using this form</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>

    <script>
        function emailTest() {
            return {
                form: {
                    email: '',
                    subject: 'Test Email from {{ config("app.name") }}',
                    message: 'This is a test email to verify that the email configuration is working correctly.\n\nIf you received this email, the SMTP configuration is properly set up!\n\nBest regards,\n{{ config("app.name") }}'
                },
                errors: {},
                loading: false,
                success: false,
                error: false,
                errorMessage: '',

                sendEmail() {
                    this.loading = true;
                    this.success = false;
                    this.error = false;
                    this.errors = {};
                    this.errorMessage = '';

                    fetch('/email-test/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                        },
                        body: JSON.stringify(this.form)
                    })
                    .then(response => {
                        return response.json().then(data => ({
                            status: response.status,
                            ok: response.ok,
                            data: data
                        }));
                    })
                    .then(({ status, ok, data }) => {
                        this.loading = false;

                        // Handle success response (200)
                        if (ok && status === 200) {
                            this.success = true;
                            this.error = false;
                            console.log('Success:', data.message);
                        }
                        // Handle validation errors (422)
                        else if (status === 422) {
                            this.error = true;
                            this.success = false;
                            this.errorMessage = data.message || 'Please check the form fields';
                            this.errors = data.errors || {};
                            console.warn('Validation Error:', data);
                        }
                        // Handle forbidden/production error (403)
                        else if (status === 403) {
                            this.error = true;
                            this.success = false;
                            this.errorMessage = data.message || 'Email testing is not available in this environment';
                            console.warn('Forbidden:', data);
                        }
                        // Handle server errors (500)
                        else if (status === 500) {
                            this.error = true;
                            this.success = false;
                            this.errorMessage = data.message || 'Server error occurred while sending email';
                            console.error('Server Error:', data);
                        }
                        // Handle other error responses
                        else if (!ok) {
                            this.error = true;
                            this.success = false;
                            this.errorMessage = data.message || `Error: ${status}`;
                            console.error('HTTP Error:', status, data);
                        }
                    })
                    .catch(error => {
                        this.loading = false;
                        this.error = true;
                        this.success = false;
                        this.errorMessage = 'Network error: Unable to reach the server. Please check your connection.';
                        console.error('Network Error:', error);
                    });
                }
            }
        }
    </script>
</body>
</html>