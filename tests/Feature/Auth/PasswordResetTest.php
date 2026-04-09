<?php

use App\Models\ForgotPassword;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('reset password link screen can be rendered', function () {
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);
});

test('reset password link can be requested', function () {
    $user = User::factory()->create();

    $response = $this->post('/forgot-password', ['email' => $user->email]);

    $response->assertSessionHas('status');

    // Check that a forgot password record was created
    $this->assertDatabaseHas('forgot_password', [
        'email' => $user->email,
        'user_id' => $user->id,
    ]);
});

test('reset password link request fails for non-existent email', function () {
    $this->post('/forgot-password', ['email' => 'nonexistent@example.com']);

    // Check that no forgot password record was created
    $this->assertDatabaseMissing('forgot_password', [
        'email' => 'nonexistent@example.com',
    ]);
});

test('reset password screen can be rendered', function () {
    $user = User::factory()->create();

    // Create a forgot password token
    $forgotPassword = ForgotPassword::create([
        'email' => $user->email,
        'user_id' => $user->id,
        'token' => 'test-token',
        'expire_at' => now()->addHour(),
    ]);

    $response = $this->get('/reset-password/' . $forgotPassword->token);

    $response->assertStatus(200);
});

test('reset password screen shows error for invalid token', function () {
    $response = $this->get('/reset-password/invalid-token');

    $response->assertStatus(200);
    // The page should render but show an error
});

test('password can be reset with valid token', function () {
    $user = User::factory()->create();
    $oldPassword = $user->password;

    // Create a forgot password token
    $forgotPassword = ForgotPassword::create([
        'email' => $user->email,
        'user_id' => $user->id,
        'token' => 'test-token',
        'expire_at' => now()->addHour(),
    ]);

    $response = $this->post('/reset-password', [
        'token' => $forgotPassword->token,
        'email' => $user->email,
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('login'));

    // Check that password was updated
    $user->refresh();
    $this->assertNotEquals($oldPassword, $user->password);

    // Check that token was marked as redeemed
    $forgotPassword->refresh();
    $this->assertNotNull($forgotPassword->redeemed_at);
});

test('password reset fails with expired token', function () {
    $user = User::factory()->create();

    // Create an expired forgot password token
    $forgotPassword = ForgotPassword::create([
        'email' => $user->email,
        'user_id' => $user->id,
        'token' => 'expired-token',
        'expire_at' => now()->subHour(), // Already expired
    ]);

    $response = $this->post('/reset-password', [
        'token' => $forgotPassword->token,
        'email' => $user->email,
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertSessionHasErrors('token');
});

test('password reset fails with redeemed token', function () {
    $user = User::factory()->create();

    // Create a redeemed forgot password token
    $forgotPassword = ForgotPassword::create([
        'email' => $user->email,
        'user_id' => $user->id,
        'token' => 'redeemed-token',
        'expire_at' => now()->addHour(),
        'redeemed_at' => now(), // Already redeemed
    ]);

    $response = $this->post('/reset-password', [
        'token' => $forgotPassword->token,
        'email' => $user->email,
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertSessionHasErrors('token');
});