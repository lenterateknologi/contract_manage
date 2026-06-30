<?php

namespace App\Providers;

use App\Models\Contract;
use App\Policies\ContractPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
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

        // Auto-populate blame columns (created_by and updated_by) from authenticated user
        Model::creating(function (Model $model) {
            if (Auth::check()) {
                $userId = Auth::id();
                $table = $model->getTable();

                if (Schema::hasColumn($table, 'created_by') && is_null($model->created_by)) {
                    $model->created_by = $userId;
                }
                if (Schema::hasColumn($table, 'updated_by') && is_null($model->updated_by)) {
                    $model->updated_by = $userId;
                }
            }
        });

        Model::updating(function (Model $model) {
            if (Auth::check()) {
                $userId = Auth::id();
                $table = $model->getTable();

                if (Schema::hasColumn($table, 'updated_by')) {
                    $model->updated_by = $userId;
                }
            }
        });
    }
}
