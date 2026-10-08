<?php

namespace App\Providers;

use App\Models\Transaction\Contract;
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

        // Auto-populate blame columns (created_by and updated_by) from authenticated user with in-memory column cache
        static $tableColumnsCache = [];
        $hasColumn = function (string $table, string $column) use (&$tableColumnsCache): bool {
            if (! isset($tableColumnsCache[$table])) {
                $tableColumnsCache[$table] = array_flip(Schema::getColumnListing($table));
            }

            return isset($tableColumnsCache[$table][$column]);
        };

        Model::creating(function (Model $model) use ($hasColumn) {
            if (Auth::check()) {
                $userId = Auth::id();
                $table = $model->getTable();

                if ($hasColumn($table, 'created_by') && is_null($model->created_by)) {
                    $model->created_by = $userId;
                }
                if ($hasColumn($table, 'updated_by') && is_null($model->updated_by)) {
                    $model->updated_by = $userId;
                }
            }
        });

        Model::updating(function (Model $model) use ($hasColumn) {
            if (Auth::check()) {
                $userId = Auth::id();
                $table = $model->getTable();

                if ($hasColumn($table, 'updated_by')) {
                    $model->updated_by = $userId;
                }
            }
        });
    }
}
