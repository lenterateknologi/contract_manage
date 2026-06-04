<?php

namespace App\Providers;

use App\Models\Contract;
use App\Policies\ContractPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        Gate::policy(Contract::class, ContractPolicy::class);

        // Force HTTPS
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // Strict Eloquent
        Model::shouldBeStrict(! $this->app->isProduction());
    }
}
